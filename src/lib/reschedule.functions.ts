import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { isValidDeviceId } from "./device";
import { rateLimit, clientKey } from "./rate-limit";

const DEVICE_MONTHLY_LIMIT = 3;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function monthWindowStart(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// Stable hash of the caller's IP — used as a fallback recognizer when the
// device localStorage id has been cleared or the user is on another browser.
// Updated to be async to safely isolate node:crypto from the browser bundle.
export async function ipHashFromRequest(req: Request | undefined): Promise<string | null> {
  if (!req) return null;
  const h = req.headers;
  const ip =
    (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    "";
  if (!ip) return null;

  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(`siba::${ip}`).digest("hex").slice(0, 40);
}

const listInput = z.object({ deviceId: z.string().min(0).max(64).optional() });

export const listMyBookings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data }) => {
    let req: Request | undefined;
    try {
      req = getRequest();
      const rl = rateLimit(clientKey(req, "list"), 30, 60);
      if (!rl.ok) throw new Error("Too many requests. Please slow down.");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Too many")) throw e;
    }

    const sb = await admin();
    const ipHash = await ipHashFromRequest(req);
    const deviceId = isValidDeviceId(data.deviceId) ? data.deviceId : null;

    // Match on device OR ip hash so returning visitors are still recognized
    // after clearing storage, or when switching browsers on the same network.
    const orParts: string[] = [];
    if (deviceId) orParts.push(`device_id.eq.${deviceId}`);
    if (ipHash) orParts.push(`ip_hash.eq.${ipHash}`);
    if (orParts.length === 0) {
      return { bookings: [], monthlyUsed: 0, monthlyLimit: DEVICE_MONTHLY_LIMIT };
    }

    const { data: rows, error } = await sb
      .from("appointments")
      .select(
        "id, service, preferred_date, status, reschedule_count, created_at, patient_name, device_id",
      )
      .or(orParts.join(","))
      .order("preferred_date", { ascending: true })
      .limit(20);
    if (error) {
      console.error("[reschedule.list] failed", error);
      throw new Error("Could not load your appointments.");
    }

    // If we found bookings by IP but the row has no device_id, adopt this device
    // going forward so future visits from this browser are instant.
    if (deviceId && rows) {
      const toAdopt = rows.filter((r) => !r.device_id).map((r) => r.id);
      if (toAdopt.length > 0) {
        await sb.from("appointments").update({ device_id: deviceId }).in("id", toAdopt);
      }
    }

    const { count } = await sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .or(orParts.join(","))
      .gte("created_at", monthWindowStart());

    return {
      bookings: rows ?? [],
      monthlyUsed: count ?? 0,
      monthlyLimit: DEVICE_MONTHLY_LIMIT,
    };
  });

const rescheduleInput = z.object({
  deviceId: z.string().min(0).max(64).optional(),
  appointmentId: z.string().uuid(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  newService: z.string().trim().min(1).max(80).optional(),
});

export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => rescheduleInput.parse(d))
  .handler(async ({ data }) => {
    let req: Request | undefined;
    try {
      req = getRequest();
      const rl = rateLimit(clientKey(req, "resched"), 8, 60);
      if (!rl.ok) throw new Error("Too many attempts. Please wait a minute.");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Too many")) throw e;
    }

    const picked = new Date(data.newDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (picked.getTime() < today.getTime()) {
      throw new Error("Please pick a future date.");
    }

    const sb = await admin();
    const ipHash = await ipHashFromRequest(req);
    const deviceId = isValidDeviceId(data.deviceId) ? data.deviceId : null;

    const { data: appt, error: fetchErr } = await sb
      .from("appointments")
      .select("id, device_id, ip_hash, status, reschedule_count")
      .eq("id", data.appointmentId)
      .maybeSingle();
    if (fetchErr || !appt) throw new Error("Appointment not found.");

    const ownsByDevice = deviceId && appt.device_id === deviceId;
    const ownsByIp = ipHash && appt.ip_hash === ipHash;
    if (!ownsByDevice && !ownsByIp) {
      throw new Error("This appointment is not linked to your device.");
    }

    const orParts: string[] = [];
    if (deviceId) orParts.push(`device_id.eq.${deviceId}`);
    if (ipHash) orParts.push(`ip_hash.eq.${ipHash}`);
    const { count } = await sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .or(orParts.join(","))
      .gte("created_at", monthWindowStart());
    if ((count ?? 0) + 1 > DEVICE_MONTHLY_LIMIT) {
      throw new Error(
        `You've reached the monthly limit of ${DEVICE_MONTHLY_LIMIT} booking or reschedule attempts.`,
      );
    }

    const update: {
      preferred_date: string;
      reschedule_count: number;
      status: string;
      service?: string;
      device_id?: string;
      ip_hash?: string;
    } = {
      preferred_date: data.newDate,
      reschedule_count: (appt.reschedule_count ?? 0) + 1,
      status: "pending",
    };
    if (data.newService) update.service = data.newService;
    if (deviceId && !appt.device_id) update.device_id = deviceId;
    if (ipHash && !appt.ip_hash) update.ip_hash = ipHash;

    const { error: updErr } = await sb
      .from("appointments")
      .update(update)
      .eq("id", data.appointmentId);
    if (updErr) {
      console.error("[reschedule.update] failed", updErr);
      throw new Error("Could not reschedule. Please try again.");
    }

    return { ok: true as const };
  });
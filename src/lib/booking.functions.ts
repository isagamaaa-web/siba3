import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { bookingSchema } from "./booking-schema";
import { isValidDeviceId } from "./device";
import { rateLimit, clientKey } from "./rate-limit";
import { ipHashFromRequest } from "./reschedule.functions";

// Monthly booking quota per device.
const DEVICE_MONTHLY_LIMIT = 3;

const submitSchema = bookingSchema.extend({
  deviceId: z.string().min(10).max(64),
});

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

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    if (!isValidDeviceId(data.deviceId)) {
      throw new Error("Invalid device.");
    }

    // Per-IP burst limit — prevents rapid-fire booking spam / DDoS on the DB.
    let ipHash: string | null = null;
    try {
      const req = getRequest();
      const rl = rateLimit(clientKey(req, "book"), 5, 60);
      if (!rl.ok) throw new Error("Too many attempts. Please wait a minute.");
      ipHash = await ipHashFromRequest(req);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Too many")) throw e;
    }

    const sb = await admin();

    // Monthly per-device quota: booking + reschedule combined.
    const { count, error: countErr } = await sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("device_id", data.deviceId)
      .gte("created_at", monthWindowStart());
    if (countErr) {
      console.error("[booking] count failed", countErr);
      throw new Error("Could not verify booking quota. Please try again.");
    }
    if ((count ?? 0) >= DEVICE_MONTHLY_LIMIT) {
      throw new Error(
        `You have reached the monthly limit of ${DEVICE_MONTHLY_LIMIT} bookings for this device. Please call +251 94 322 3030.`,
      );
    }

    const { error } = await sb.from("appointments").insert({
      patient_name: data.name,
      patient_phone: data.phone,
      patient_email: data.email ?? null,
      service: data.service,
      preferred_date: data.date,
      preferred_time: "any",
      notes: data.notes ?? null,
      status: "pending",
      device_id: data.deviceId,
      ip_hash: ipHash,
    });

    if (error) {
      console.error("[booking] insert failed", error);
      throw new Error("Could not save your appointment. Please try again.");
    }

    return { ok: true as const };
  });

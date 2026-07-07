import { createServerFn } from "@tanstack/react-start";

export type AdminAppointment = {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  service: string;
  preferred_date: string;
  notes: string | null;
  status: string;
  created_at: string;
};

const EXPECTED_PASS = "siba::cosmetic::0934509999::admin::2002-09-22";

export const listAppointments = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as { pass?: unknown }).pass !== "string"
    ) {
      throw new Error("Bad request");
    }
    return { pass: (data as { pass: string }).pass };
  })
  .handler(async ({ data }) => {
    if (data.pass !== EXPECTED_PASS) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("appointments")
      .select(
        "id, patient_name, patient_phone, patient_email, service, preferred_date, notes, status, created_at",
      )
      .order("preferred_date", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[admin] list failed", error);
      throw new Error("Could not load appointments");
    }
    return (rows ?? []) as AdminAppointment[];
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { pass?: unknown; id?: unknown; status?: unknown };
    if (
      typeof d?.pass !== "string" ||
      typeof d?.id !== "string" ||
      typeof d?.status !== "string"
    ) {
      throw new Error("Bad request");
    }
    if (d.status !== "pending" && d.status !== "done") {
      throw new Error("Invalid status");
    }
    return { pass: d.pass, id: d.id, status: d.status };
  })
  .handler(async ({ data }) => {
    if (data.pass !== EXPECTED_PASS) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: updated, error } = await supabaseAdmin
      .from("appointments")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id, status");
    if (error) {
      console.error("[admin] update failed", error);
      throw new Error(error.message || "Could not update");
    }
    if (!updated || updated.length === 0) {
      throw new Error("Appointment not found");
    }
    return { ok: true as const, row: updated[0] };
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { pass?: unknown; id?: unknown };
    if (typeof d?.pass !== "string" || typeof d?.id !== "string") {
      throw new Error("Bad request");
    }
    return { pass: d.pass, id: d.id };
  })
  .handler(async ({ data }) => {
    if (data.pass !== EXPECTED_PASS) throw new Error("Unauthorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("appointments").delete().eq("id", data.id);
    if (error) {
      console.error("[admin] delete failed", error);
      throw new Error("Could not delete");
    }
    return { ok: true as const };
  });


import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, RefreshCw, LogOut, Calendar, Phone, Mail, FileText, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { listAppointments, updateAppointmentStatus, deleteAppointment, type AdminAppointment } from "@/lib/admin.functions";
import { Trash2 } from "lucide-react";
import { ADMIN_PASS_KEY } from "@/lib/admin";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Appointments — Siba Dental" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const fetchList = useServerFn(listAppointments);
  const updateStatus = useServerFn(updateAppointmentStatus);
  const removeAppt = useServerFn(deleteAppointment);
  const [rows, setRows] = useState<AdminAppointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);




  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const pass =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(ADMIN_PASS_KEY)
          : null;
      if (!pass) {
        navigate({ to: "/book" });
        return;
      }
      const data = await fetchList({ data: { pass } });
      setRows(data);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.patient_name.toLowerCase().includes(q) ||
        r.patient_phone.toLowerCase().includes(q) ||
        (r.patient_email ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const signOut = () => {
    try {
      sessionStorage.removeItem(ADMIN_PASS_KEY);
    } catch {
      /* ignore */
    }
    navigate({ to: "/" });
  };

  const toggleDone = async (a: AdminAppointment, done: boolean) => {
    const pass =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(ADMIN_PASS_KEY)
        : null;
    if (!pass) return;
    const nextStatus = done ? "done" : "pending";
    const prev = a.status;
    setUpdatingId(a.id);
    // Optimistic
    setRows((rs) =>
      rs ? rs.map((r) => (r.id === a.id ? { ...r, status: nextStatus } : r)) : rs,
    );
    try {
      await updateStatus({ data: { pass, id: a.id, status: nextStatus } });
      toast.success(done ? "Marked as done" : "Marked as pending");
    } catch (e) {
      console.error("[admin] toggle failed", e);
      const msg = e instanceof Error ? e.message : "Could not update status";
      toast.error(msg);
      setRows((rs) =>
        rs ? rs.map((r) => (r.id === a.id ? { ...r, status: prev } : r)) : rs,
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const onDelete = async (a: AdminAppointment) => {
    const pass = typeof window !== "undefined" ? window.sessionStorage.getItem(ADMIN_PASS_KEY) : null;
    if (!pass) return;
    if (!window.confirm(`Delete ${a.patient_name}'s appointment on ${a.preferred_date}? This cannot be undone.`)) return;
    const prev = rows;
    setRows((rs) => (rs ? rs.filter((r) => r.id !== a.id) : rs));
    try {
      await removeAppt({ data: { pass, id: a.id } });
      toast.success("Appointment deleted");
    } catch (e) {
      setRows(prev);
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };


  return (
    <PageShell>
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Internal
              </p>
              <h1 className="mt-2 font-display text-5xl tracking-wide md:text-6xl">
                APPOINTMENTS
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                All booking requests, newest first.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={load} variant="outline" className="rounded-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={signOut} variant="ghost" className="rounded-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          <div className="mt-6 relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone or email…"
              className="h-12 rounded-full border-border bg-background pl-11 text-base shadow-card"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        {loading && (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="mt-3 text-sm">Loading appointments…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive">{error}</p>
            <Button onClick={load} className="mt-4 rounded-full">
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            {rows && rows.length > 0
              ? "No appointments match your search."
              : "No appointments yet."}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="mt-2">
            <p className="mb-4 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              of {rows?.length ?? 0}
            </p>

            <div className="grid gap-4">
              {filtered.map((a) => (
                <article
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl tracking-wide">
                        {a.patient_name}
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                        <Stethoscope className="h-3.5 w-3.5" />
                        {a.service}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                          a.status === "done"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/30 text-accent-foreground"
                        }`}
                      >
                        {a.status === "done" ? "Done" : "Pending"}
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary">
                        <Checkbox
                          checked={a.status === "done"}
                          disabled={updatingId === a.id}
                          onCheckedChange={(v) => toggleDone(a, v === true)}
                          aria-label="Mark as done"
                        />
                        <span>Mark done</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => onDelete(a)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10"
                        aria-label="Delete appointment"
                        title="Delete appointment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>


                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Row icon={Phone} label="Phone" value={a.patient_phone} href={`tel:${a.patient_phone}`} />
                    <Row
                      icon={Mail}
                      label="Email"
                      value={a.patient_email ?? "—"}
                      href={a.patient_email ? `mailto:${a.patient_email}` : undefined}
                    />
                    <Row icon={Calendar} label="Preferred date" value={a.preferred_date} />
                    <Row
                      icon={Calendar}
                      label="Requested"
                      value={new Date(a.created_at).toLocaleString()}
                    />
                  </div>

                  {a.notes && (
                    <div className="mt-4 rounded-xl bg-secondary/40 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                        {a.notes}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block rounded-lg p-1 -m-1 hover:bg-secondary/40">
      {content}
    </a>
  ) : (
    content
  );
}

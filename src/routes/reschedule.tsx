import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, CalendarClock, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES } from "@/lib/services";
import { getDeviceId } from "@/lib/device";
import { listMyBookings, rescheduleBooking } from "@/lib/reschedule.functions";

export const Route = createFileRoute("/reschedule")({
  head: () => ({
    meta: [
      { title: "Reschedule Appointment — Siba Dental Clinic" },
      {
        name: "description",
        content:
          "Change the date or service on your existing dental appointment at Siba Dental Clinic in Addis Ababa.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReschedulePage,
});

type Booking = {
  id: string;
  service: string;
  preferred_date: string;
  status: string;
  reschedule_count: number;
  created_at: string;
  patient_name: string;
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function ReschedulePage() {
  const navigate = useNavigate();
  const load = useServerFn(listMyBookings);
  const reschedule = useServerFn(rescheduleBooking);

  const minDate = useMemo(() => todayISO(), []);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quota, setQuota] = useState({ used: 0, limit: 3 });
  const [selectedId, setSelectedId] = useState("");
  const [newDate, setNewDate] = useState(minDate);
  const [newService, setNewService] = useState("");
  const [saving, setSaving] = useState(false);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    (async () => {
      try {
        // Server also matches by hashed IP, so a missing/blank device id
        // still finds bookings from this network.
        const res = await load({ data: { deviceId } });
        if (!res.bookings || res.bookings.length === 0) {
          setEmpty(true);
          return;
        }
        setBookings(res.bookings as Booking[]);
        setQuota({ used: res.monthlyUsed, limit: res.monthlyLimit });
        const upcoming = (res.bookings as Booking[]).find(
          (b) => b.preferred_date >= minDate && b.status !== "cancelled",
        );
        const pick = upcoming ?? (res.bookings as Booking[])[0]!;
        setSelectedId(pick.id);
        setNewService(pick.service);
        setNewDate(pick.preferred_date >= minDate ? pick.preferred_date : minDate);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load your bookings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load, minDate]);

  const selected = bookings.find((b) => b.id === selectedId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || saving) return;
    if (!newDate || newDate < minDate) {
      toast.error("Please choose a future date.");
      return;
    }
    setSaving(true);
    try {
      await reschedule({
        data: {
          deviceId: getDeviceId(),
          appointmentId: selected.id,
          newDate,
          newService: newService && newService !== selected.service ? newService : undefined,
        },
      });
      toast.success("Appointment updated — we'll confirm by phone.");
      navigate({ to: "/booking-success" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reschedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            Change your appointment
          </span>
          <h1 className="mt-5 font-display text-5xl tracking-wide md:text-6xl">RESCHEDULE</h1>
          <p className="mt-3 text-muted-foreground">
            Change your date or service. We'll confirm by phone.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 pb-24 md:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your bookings…
          </div>
        ) : empty ? (
          <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-card">
            <p className="text-lg font-medium">We couldn't find an appointment for you.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              If this is your first visit, please book one first.
            </p>
            <Button asChild className="mt-6 rounded-full bg-gradient-primary">
              <Link to="/book">Book an appointment</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-[2rem] border border-border bg-card p-7 shadow-card md:p-10"
          >
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
              Monthly attempts used: <span className="font-semibold text-foreground">{quota.used} / {quota.limit}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Your booking</Label>
              <div className="grid gap-2">
                {bookings.map((b) => {
                  const active = b.id === selectedId;
                  const canSelect = b.status !== "cancelled" && b.status !== "done" && b.status !== "completed";
                  return (
                    <button
                      type="button"
                      key={b.id}
                      disabled={!canSelect}
                      onClick={() => {
                        setSelectedId(b.id);
                        setNewService(b.service);
                        setNewDate(b.preferred_date >= minDate ? b.preferred_date : minDate);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"} ${!canSelect ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{b.service}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.preferred_date}
                            {b.reschedule_count > 0 && ` · rescheduled ${b.reschedule_count}×`}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{b.status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Service</Label>
                <Select value={newService} onValueChange={setNewService}>
                  <SelectTrigger><SelectValue placeholder="Choose a service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">New preferred date</Label>
                <Input type="date" min={minDate} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/book" className="text-sm text-muted-foreground hover:text-foreground">
                ← Need a new booking instead?
              </Link>
              <Button
                type="submit"
                size="lg"
                disabled={saving || !selected}
                className="rounded-full bg-gradient-primary px-7 shadow-soft hover:opacity-95"
              >
                {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>) : (<>Save changes <ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
            </div>
          </form>
        )}
      </section>
    </PageShell>
  );
}

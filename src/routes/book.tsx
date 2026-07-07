import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES, formatBirr } from "@/lib/services";
import { bookingSchema } from "@/lib/booking-schema";
import { submitBooking } from "@/lib/booking.functions";
import { matchesAdminTrigger, ADMIN_PASS, ADMIN_PASS_KEY } from "@/lib/admin";
import { getDeviceId } from "@/lib/device";


export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment — Siba Dental Clinic" },
      {
        name: "description",
        content:
          "Book your dental appointment at Siba Dental Clinic in Addis Ababa in under a minute.",
      },
      { property: "og:title", content: "Book Appointment — Siba Dental Clinic" },
      {
        property: "og:description",
        content: "Online booking for cleaning, whitening, implants, braces and more.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    service: typeof s.service === "string" ? s.service : undefined,
  }),
  component: BookPage,
});

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function BookPage() {
  const navigate = useNavigate();
  const { service: preselected } = Route.useSearch();
  const submit = useServerFn(submitBooking);

  const minDate = useMemo(() => todayISO(), []);
  const [mountedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service:
      preselected && SERVICES.find((s) => s.id === preselected)
        ? (SERVICES.find((s) => s.id === preselected)!.name as string)
        : "",
    date: minDate,
    notes: "",
    website: "", // honeypot
  });

  useEffect(() => {
    if (preselected) {
      const match = SERVICES.find((s) => s.id === preselected);
      if (match) setForm((f) => ({ ...f, service: match.name }));
    }
  }, [preselected]);

  const update = (key: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => {
      const { [key]: _removed, ...rest } = e;
      return rest;
    });
  };

  // Step 1: required-field guard with clear field-by-field errors.
  const validateRequired = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Please enter your full name.";
    if (!form.phone.trim()) next.phone = "Please enter your phone number.";
    if (!form.service.trim()) next.service = "Please choose a service.";
    if (!form.date.trim()) next.date = "Please pick a preferred date.";
    return next;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Hidden admin entry — checked BEFORE validation so it can use any date.
    if (matchesAdminTrigger(form)) {
      try {
        sessionStorage.setItem(ADMIN_PASS_KEY, ADMIN_PASS);
      } catch {
        /* ignore */
      }
      toast.success("Admin panel unlocked");
      navigate({ to: "/admin" });
      return;
    }

    // Required-field check first — most useful errors up front.
    const reqErrors = validateRequired();
    if (Object.keys(reqErrors).length > 0) {
      setErrors(reqErrors);
      const first = Object.values(reqErrors)[0];
      toast.error(first ?? "Please fill in the required fields.");
      const firstKey = Object.keys(reqErrors)[0];
      if (firstKey) {
        const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Honeypot + minimum dwell time (bots fill instantly)
    if (form.website.length > 0 || Date.now() - mountedAt < 1500) {
      toast.error("Submission blocked. Please try again.");
      return;
    }

    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errMap[key] = issue.message;
      }
      setErrors(errMap);
      const first = Object.values(errMap)[0];
      toast.error(first ?? "Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const deviceId = getDeviceId();
      await submit({ data: { ...parsed.data, deviceId } });

      toast.success("Appointment requested! We'll be in touch shortly.");
      navigate({ to: "/booking-success" });
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please call +251 94 322 3030.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-20">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Online booking
          </span>
          <h1 className="mt-5 font-display text-5xl tracking-wide md:text-6xl">
            BOOK YOUR APPOINTMENT
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tell us a little about you. We'll confirm your slot by phone within
            business hours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] border border-border bg-card p-7 shadow-card md:p-10"
          noValidate
        >
          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => update("website")(e.target.value)}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full name" error={errors.name} required name="name">
              <Input
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => update("name")(e.target.value)}
                placeholder="Abebe Bekele"
                aria-invalid={!!errors.name}
              />
            </Field>

            <Field label="Phone" error={errors.phone} required name="phone">
              <Input
                required
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(e) => update("phone")(e.target.value)}
                placeholder="+251 9 ..."
                aria-invalid={!!errors.phone}
              />
            </Field>

            <Field label="Email (optional)" error={errors.email} name="email">
              <Input
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => update("email")(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
            </Field>

            <Field label="Service" error={errors.service} required name="service">
              <Select
                value={form.service}
                onValueChange={(v) => update("service")(v)}
              >
                <SelectTrigger aria-invalid={!!errors.service}>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      <span className="flex w-full items-center justify-between gap-3">
                        <span>{s.name}</span>
                        <span className="text-xs font-medium text-primary">
                          from {formatBirr(s.priceFrom)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.service &&
                (() => {
                  const picked = SERVICES.find((s) => s.name === form.service);
                  if (!picked) return null;
                  return (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Starting price:{" "}
                      <span className="font-semibold text-foreground">
                        {formatBirr(picked.priceFrom)}
                      </span>{" "}
                      · Final price confirmed after a check-up.
                    </p>
                  );
                })()}
            </Field>

            <Field label="Preferred date" error={errors.date} required name="date">
              <Input
                required
                type="date"
                value={form.date}
                onChange={(e) => update("date")(e.target.value)}
                aria-invalid={!!errors.date}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Notes (optional)" error={errors.notes} name="notes">
              <Textarea
                maxLength={1000}
                value={form.notes}
                onChange={(e) => update("notes")(e.target.value)}
                placeholder="Anything we should know? (sensitivities, allergies, concerns)"
                rows={4}
              />
            </Field>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to home
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="rounded-full bg-gradient-primary px-7 shadow-soft hover:opacity-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm booking
                </>
              )}
            </Button>
          </div>
        </motion.form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By submitting, you agree to be contacted about your appointment.
        </p>
      </section>
    </PageShell>
  );
}

function Field({
  label,
  error,
  children,
  required,
  name,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  name?: string;
}) {
  return (
    <div data-field={name} className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X } from "lucide-react";
import { getDeviceId } from "@/lib/device";
import { listMyBookings } from "@/lib/reschedule.functions";

// Shows a small banner + browser notification when the user has a booking
// exactly 1 day away. Notifications are best-effort — permission is only
// requested silently after the user shows they have a real upcoming booking.

const DISMISS_KEY = "siba_reminder_dismissed_v1";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function AppointmentReminder() {
  const load = useServerFn(listMyBookings);
  const [reminder, setReminder] = useState<{
    id: string;
    service: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const deviceId = getDeviceId();
    if (!deviceId) return;

    (async () => {
      try {
        const res = await load({ data: { deviceId } });
        if (cancelled || !res.bookings) return;
        const soon = (res.bookings as { id: string; service: string; preferred_date: string; status: string }[])
          .filter(
            (b) =>
              b.status !== "cancelled" &&
              b.status !== "done" &&
              b.status !== "completed",
          )
          .find((b) => daysUntil(b.preferred_date) === 1);
        if (!soon) return;

        // Respect a per-appointment dismissal.
        const dismissKey = `${DISMISS_KEY}:${soon.id}`;
        try {
          if (window.localStorage.getItem(dismissKey) === "1") return;
        } catch {
          /* ignore */
        }

        setReminder({
          id: soon.id,
          service: soon.service,
          date: soon.preferred_date,
        });

        // Silent, best-effort browser notification — fires once per appointment.
        try {
          const firedKey = `siba_reminder_fired_v1:${soon.id}`;
          const alreadyFired = window.localStorage.getItem(firedKey) === "1";
          if (!alreadyFired && "Notification" in window) {
            if (Notification.permission === "default") {
              await Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
              new Notification("Siba Dental — appointment tomorrow", {
                body: `Reminder: your ${soon.service} appointment is on ${soon.preferred_date}.`,
                tag: `siba-appt-${soon.id}`,
              });
              window.localStorage.setItem(firedKey, "1");
            }
          }
        } catch {
          /* notifications are optional */
        }
      } catch {
        /* silent */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const dismiss = () => {
    if (!reminder) return;
    try {
      window.localStorage.setItem(`${DISMISS_KEY}:${reminder.id}`, "1");
    } catch {
      /* ignore */
    }
    setReminder(null);
  };

  return (
    <AnimatePresence>
      {reminder && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed left-1/2 top-3 z-[60] w-[min(94vw,520px)] -translate-x-1/2 rounded-2xl border border-primary/30 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur"
          role="status"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
              <BellRing className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                1 day left to your appointment
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {reminder.service} · {reminder.date}
              </p>
            </div>
            <Link
              to="/reschedule"
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-secondary"
            >
              Manage
            </Link>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

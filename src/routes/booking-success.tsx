import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Phone } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/booking-success")({
  head: () => ({
    meta: [
      { title: "Appointment received — Siba Dental Clinic" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  return (
    <PageShell>
      <section className="grid min-h-[70vh] place-items-center bg-gradient-hero px-5 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-card md:p-14"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl tracking-tight">
            We've got your request!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Thank you for choosing Siba Dental Clinic. Our team will call you to
            confirm your appointment shortly. For urgent matters, please reach
            us directly.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full bg-gradient-primary shadow-soft">
              <a href="tel:+251943223030">
                <Phone className="mr-2 h-4 w-4" />
                Call the clinic
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </PageShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { SERVICES, formatBirr } from "@/lib/services";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Siba Dental Clinic" },
      {
        name: "description",
        content:
          "Cleaning, whitening, implants, braces, root canal, pediatric, cosmetic and emergency dental care in Addis Ababa.",
      },
      { property: "og:title", content: "Services — Siba Dental Clinic" },
      {
        property: "og:description",
        content: "Full-spectrum dental services delivered with modern, gentle care.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28">
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Our services
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl tracking-tight text-balance md:text-6xl">
            Every treatment, delivered with the same care.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            From a quick polish to a full smile makeover — our specialists use
            modern, evidence-based techniques to keep your visit comfortable.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="group rounded-3xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <s.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-display text-2xl">{s.name}</h2>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
              <p className="mt-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                from {formatBirr(s.priceFrom)}
              </p>
              <Button asChild variant="ghost" className="mt-5 rounded-full px-3">
                <Link to="/book" search={{ service: s.id } as never}>
                  Book this service
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

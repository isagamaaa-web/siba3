import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ShieldCheck,
  Smile,
  Star,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { SERVICES } from "@/lib/services";

const TeethHero = lazy(() => import("@/components/TeethHero"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Siba Dental Clinic — Premium Dental Care in Addis Ababa" },
      {
        name: "description",
        content:
          "World-class dental care in Addis Ababa. Cleaning, whitening, implants, braces and more. Book your appointment online today.",
      },
      { property: "og:title", content: "Siba Dental Clinic — Premium Dental Care" },
      {
        property: "og:description",
        content: "Premium dental care in Addis Ababa. Book your visit online.",
      },
    ],
  }),
  component: HomePage,
});

const stats: Array<{
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}> = [
  { to: 12, suffix: "+", label: "Years of care" },
  { to: 5000, suffix: "+", label: "Happy smiles" },
  { to: 24, suffix: "/7", label: "Emergency support" },
  { to: 4.9, suffix: "★", decimals: 1, label: "Patient rating" },
];

function HomePage() {
  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-16 md:grid-cols-2 md:items-center md:px-8 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Open today · Closes 8 PM
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-balance md:text-7xl">
              A brighter smile,{" "}
              <span className="text-primary italic">crafted with care</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Siba Dental Clinic blends modern technology with gentle,
              personalised care. From routine cleaning to full smile makeovers —
              right here in the heart of Addis Ababa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gradient-primary px-7 shadow-soft hover:opacity-95"
              >
                <Link to="/book">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border bg-background/70 px-7 backdrop-blur"
              >
                <a href="tel:+251943223030">
                  <Phone className="mr-2 h-4 w-4" />
                  +251 94 322 3030
                </a>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-3xl text-foreground">
                    <CountUp
                      to={s.to}
                      suffix={s.suffix}
                      prefix={s.prefix}
                      decimals={s.decimals}
                    />
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative h-[300px] sm:h-[420px] md:h-[520px] lg:h-[600px]"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/15 shadow-glow" />
            <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Loading…</div>}>
              <TeethHero />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-border bg-secondary/30 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-6 px-5 text-sm text-muted-foreground md:px-8">
          {[
            { Icon: ShieldCheck, text: "Sterilised & safe" },
            { Icon: Smile, text: "Pain-free techniques" },
            { Icon: Star, text: "Top-rated in Addis" },
            { Icon: Clock, text: "Same-day appointments" },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            What we do
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
            Complete dental care under one roof.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every service is delivered with the same standard of warmth,
            precision, and modern technology you deserve.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10">
          <Button asChild variant="ghost" className="group rounded-full">
            <Link to="/services">
              Explore all services
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-gradient-to-b from-secondary/30 to-background py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Why Siba
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
              Dentistry that feels different.
            </h2>
            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "Modern equipment",
                  body: "Digital X-rays, intra-oral cameras and sterilisation you can trust.",
                },
                {
                  title: "Caring specialists",
                  body: "Our team listens first — every plan is personal.",
                },
                {
                  title: "Transparent pricing",
                  body: "Clear quotes upfront. No surprises after treatment.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-card"
          >
            <p className="font-display text-2xl italic leading-snug">
              “The team at Siba made my whole family comfortable. Truly the best
              dental experience I've had in Addis.”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary font-display text-primary-foreground">
                M
              </div>
              <div>
                <p className="text-sm font-medium">Meron T.</p>
                <p className="text-xs text-muted-foreground">Patient · 2024</p>
              </div>
              <div className="ml-auto flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-primary p-10 text-primary-foreground shadow-soft md:p-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <h2 className="font-display text-4xl tracking-tight md:text-5xl">
                Ready for your brightest smile?
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85">
                Book online in under a minute. Our team will confirm your slot
                shortly after.
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm text-primary-foreground/80">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Sheger, Anfo 105 roundabout
                </span>
              </div>
            </div>
            <div className="md:text-right">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link to="/book">
                  Book your visit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}


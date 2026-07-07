import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Award, Users, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Siba Dental Clinic" },
      {
        name: "description",
        content:
          "Siba Dental Clinic is a modern dental practice in Addis Ababa, dedicated to gentle, personalised care for every patient.",
      },
      { property: "og:title", content: "About Siba Dental Clinic" },
      {
        property: "og:description",
        content: "A modern dental practice in Addis Ababa, dedicated to gentle care.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  { Icon: Heart, title: "Patient-first", body: "We listen, we explain, we never rush." },
  { Icon: Award, title: "Excellence", body: "Modern protocols and evidence-based care." },
  { Icon: Users, title: "Family-friendly", body: "Welcoming care for every age." },
  { Icon: Sparkles, title: "Modern tech", body: "Digital imaging and gentle techniques." },
];

function AboutPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 text-center md:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            About us
          </p>
          <h1 className="mt-3 font-display text-5xl tracking-tight text-balance md:text-6xl">
            We care for your smile, <em>come visit us</em>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Siba Dental Clinic was founded on a simple idea: dentistry should
            feel calm, modern and human. Whether it's your first visit or your
            fiftieth, you'll meet a team that treats you like family.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="rounded-3xl border border-border bg-card p-6 shadow-card"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <v.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
        <div className="rounded-[2rem] border border-border bg-card p-10 shadow-card md:p-14">
          <h2 className="font-display text-3xl md:text-4xl">Our story</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Located at the heart of Sheger near the Anfo 105 roundabout, Siba
              Dental Clinic combines world-class clinical standards with the
              warmth of a neighbourhood practice. Our space is designed to feel
              calming — because we know visiting the dentist is about more than
              just teeth.
            </p>
            <p>
              We invest in the latest sterilisation, imaging and minimally
              invasive techniques so your treatment is precise, safe and as
              comfortable as possible. From routine hygiene to full smile
              makeovers, we walk you through every step.
            </p>
          </div>
          <div className="mt-8">
            <Button asChild className="rounded-full bg-gradient-primary shadow-soft">
              <Link to="/book">Book your first visit</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Siba Dental Clinic" },
      {
        name: "description",
        content:
          "Visit Siba Dental Clinic at Sheger, Anfo 105 roundabout, Addis Ababa. Call +251 94 322 3030 or book online.",
      },
      { property: "og:title", content: "Contact Siba Dental Clinic" },
      {
        property: "og:description",
        content: "Find us in Addis Ababa or call +251 94 322 3030.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Get in touch
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl tracking-tight text-balance md:text-6xl">
            We'd love to welcome you in.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Reach out for any question or simply stop by the clinic. Our team is
            here for you.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-2 md:px-8">
        <div className="space-y-5">
          {[
            {
              Icon: MapPin,
              title: "Address",
              body: (
                <>
                  Sheger, Anfo 105 roundabout
                  <br />
                  Addis Ababa, Ethiopia
                </>
              ),
            },
            {
              Icon: Phone,
              title: "Phone",
              body: (
                <a className="hover:text-primary" href="tel:+251943223030">
                  +251 94 322 3030
                </a>
              ),
            },
            {
              Icon: Clock,
              title: "Opening hours",
              body: (
                <>
                  Daily · Closes 8:00 PM
                  <br />
                  Emergency line available 24/7
                </>
              ),
            },
            {
              Icon: Mail,
              title: "Book online",
              body: (
                <Link to="/book" className="text-primary hover:underline">
                  Request an appointment →
                </Link>
              ),
            },
          ].map((c) => (
            <div
              key={c.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <c.Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}

          <Button asChild size="lg" className="mt-4 rounded-full bg-gradient-primary shadow-soft">
            <Link to="/book">Book Appointment</Link>
          </Button>
        </div>

        <OfflineMap />
      </section>
    </PageShell>
  );
}

function OfflineMap() {
  const [load, setLoad] = useState(false);
  const mapsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent("Anfo 105 roundabout, Addis Ababa, Ethiopia");
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border shadow-card min-h-[420px] bg-gradient-hero">
      {load ? (
        <iframe
          title="Siba Dental Clinic location"
          src="https://www.google.com/maps?q=Anfo+105+roundabout,+Addis+Ababa&output=embed"
          className="h-full min-h-[420px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      ) : (
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 p-6 text-center">
          <MapPin className="h-10 w-10 text-primary" />
          <div>
            <p className="font-display text-2xl">Siba Dental Clinic</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sheger, Anfo 105 roundabout · Addis Ababa
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setLoad(true)}
              className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft"
            >
              Load interactive map
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-input bg-background px-5 py-2 text-sm font-medium hover:bg-secondary"
            >
              Get directions
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Works offline — directions open in your maps app.
          </p>
        </div>
      )}
    </div>
  );
}

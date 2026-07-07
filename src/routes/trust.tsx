import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ShieldCheck, Lock, FileText, Mail, Database, UserCheck } from "lucide-react";

export const Route = createFileRoute("/trust")({
  component: TrustPage,
  head: () => ({
    meta: [
      { title: "Trust, Privacy & Security · Siba Dental Clinic" },
      {
        name: "description",
        content:
          "How Siba Dental Clinic handles your information, protects appointment data, and respects your privacy.",
      },
    ],
  }),
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TrustPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Trust Center</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Your privacy, our priority</h1>
        <p className="mt-4 text-base text-muted-foreground">
          This page is maintained by Siba Dental Clinic to answer common questions about how we
          handle the information you share with us through this website. It is editable site
          content, not an independent certification.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Section icon={Database} title="What we collect">
            <p>
              When you request an appointment we collect your name, phone number, optional email,
              chosen service, preferred date/time and any notes you provide.
            </p>
            <p>We do not run third-party advertising trackers on this website.</p>
          </Section>

          <Section icon={UserCheck} title="How we use it">
            <p>
              Your information is used only to schedule, confirm and deliver your dental care, and
              to contact you about your visit.
            </p>
            <p>We do not sell or share your information with advertisers.</p>
          </Section>

          <Section icon={Lock} title="How it is protected">
            <p>
              Appointment requests are transmitted over HTTPS and stored in a managed database with
              row-level access controls. Only authorized clinic staff can view appointment details.
            </p>
            <p>
              The public website cannot read appointment records back — submissions are write-only
              from the booking form.
            </p>
          </Section>

          <Section icon={ShieldCheck} title="Access & retention">
            <p>
              Records are retained for as long as needed to provide care and to meet legal or
              medical record-keeping obligations.
            </p>
            <p>
              You may request a copy of your information or ask us to delete it by contacting the
              clinic directly.
            </p>
          </Section>

          <Section icon={FileText} title="Shared responsibility">
            <p>
              The website is hosted on managed cloud infrastructure that provides platform-level
              security controls. Siba Dental Clinic is responsible for clinic-side data handling,
              staff access and your in-clinic records.
            </p>
          </Section>

          <Section icon={Mail} title="Contact us">
            <p>
              Questions about this page, your data, or to report a security concern:
              <br />
              <a href="tel:+251943223030" className="text-foreground hover:text-primary">
                +251 94 322 3030
              </a>
            </p>
            <p>Sheger, Anfo 105 roundabout · Addis Ababa, Ethiopia</p>
          </Section>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Last updated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}.
        </p>
      </div>
    </PageShell>
  );
}

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl text-primary">404</p>
        <h1 className="mt-4 font-display text-3xl">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for has moved or never existed.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const attempts = useRef(0);
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    if (attempts.current >= 2) return;
    attempts.current += 1;
    const timer = window.setTimeout(() => {
      void router.invalidate().finally(reset);
    }, attempts.current * 900);
    return () => window.clearTimeout(timer);
  }, [error, reset, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't load this page. Please try again — if the issue persists,
          call us at{" "}
          <a className="text-primary" href="tel:+251943223030">
            +251 94 322 3030
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-input bg-background px-5 py-2 text-sm font-medium hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Siba Dental Clinic — Premium Dental Care in Addis Ababa" },
      {
        name: "description",
        content:
          "Siba Dental Clinic in Addis Ababa offers premium dental care: cleaning, whitening, implants, braces, root canal and emergency care. Book your appointment online.",
      },
      { name: "author", content: "Siba Dental Clinic" },
      { name: "theme-color", content: "#0f766e" },
      { property: "og:title", content: "Siba Dental Clinic" },
      {
        property: "og:description",
        content:
          "Premium dental care in Addis Ababa. Book online or call +251 94 322 3030.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { name: "keywords", content: "dental clinic Addis Ababa, dentist Ethiopia, teeth whitening, braces, dental implants, root canal, pediatric dentistry, emergency dentist, Siba Dental" },
      { property: "og:site_name", content: "Siba Dental Clinic" },
      { property: "og:locale", content: "en_ET" },
      { name: "twitter:title", content: "Siba Dental Clinic" },
      { name: "twitter:description", content: "Premium dental care in Addis Ababa. Book online or call +251 94 322 3030." },
      { name: "geo.region", content: "ET-AA" },
      { name: "geo.placename", content: "Addis Ababa" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      { rel: "preconnect", href: "https://translate.google.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://translate.googleapis.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://translate.google.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Archivo+Black&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dentist",
          name: "Siba Dental Clinic",
          image: "/logo.png",
          telephone: "+251943223030",
          priceRange: "$$",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Addis Ababa",
            addressCountry: "ET",
          },
          areaServed: "Addis Ababa",
          medicalSpecialty: ["Dentistry", "CosmeticDentistry", "Orthodontic"],
          openingHours: "Mo-Sa 09:00-18:00",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}

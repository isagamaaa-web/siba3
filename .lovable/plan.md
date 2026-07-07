## Siba Dental Clinic — Premium 3D Website

A high-end, scroll-animated marketing site with secure online appointment booking. Clean medical aesthetic (white + teal accents with subtle gold), interactive 3D tooth model, smooth scroll-driven animations, fully responsive, accessible, and hardened against common attacks.

### Pages (separate routes for SEO)
- `/` — Hero with rotating 3D tooth, value props, services preview, testimonials, CTA
- `/about` — Clinic story, doctors, mission, location/hours
- `/services` — Full service list with icons (Cleaning, Whitening, Braces, Implants, Root Canal, Pediatric, Cosmetic, Emergency)
- `/contact` — Phone, address, embedded Google Map (Sheger, Anfo 105 roundabout), hours
- `/book` — Multi-step appointment booking form
- `/booking-success` — Confirmation page
- 404 + error boundaries on every route

### 3D & animation
- **Three.js + React Three Fiber + Drei** for an interactive 3D tooth that rotates and scales on scroll
- **Framer Motion (Motion for React)** for section reveals, parallax, hover micro-interactions
- **Lenis** for buttery smooth scrolling
- Floating particles / soft glow background in hero
- Reduced-motion respected via `prefers-reduced-motion`

### Booking flow (powered by Lovable Cloud)
1. Patient picks service → date → time slot → enters name, phone, email, notes
2. Client-side Zod validation (length caps, email/phone format, no HTML)
3. Server function re-validates with Zod, checks slot availability, inserts row
4. Success page shows confirmation + clinic phone for changes
5. Loading spinner while submitting; toast error if submission fails; full-page loading skeleton during route transitions

### Security hardening
- **Lovable Cloud (Supabase)** for storage; RLS enabled
- `appointments` table: anyone (anon) can `INSERT` only, no `SELECT`/`UPDATE`/`DELETE` from client — bookings are write-only from public
- Admin role via `user_roles` + `has_role()` security-definer function (separate table, never on profile) for future admin dashboard
- Server-side Zod validation on every server function input (length limits, regex for phone/email, strip control chars)
- Rate-limit booking submissions per IP (simple in-memory token bucket in server function; documented as best-effort)
- All user input rendered as text (no `dangerouslySetInnerHTML`)
- Security headers via root route: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy
- HTTPS only (platform), no secrets in client code
- Google Maps embedded via iframe (no API key needed for basic embed)
- Honeypot field + minimum-time-on-page check to deter bots

### UX safety nets
- Global loading screen with animated logo on first paint
- Per-route Suspense fallbacks
- `errorComponent` + `notFoundComponent` on every route with friendly messaging and retry
- Toast notifications (sonner) for all async actions
- Form errors shown inline with clear messages

### Design system
- Tokens in `src/styles.css`: `--background` (warm white), `--primary` (medical teal), `--accent` (soft gold), `--foreground` (deep slate)
- Typography: Instrument Serif (headings) + Inter (body) via `<link>` in root head
- Generous whitespace, large rounded cards, subtle shadows using teal tint
- Dark mode token set included

### Tech notes
- TanStack Start routes under `src/routes/`
- 3D components dynamically rendered client-side only (guard against SSR `window` access)
- `bun add three @react-three/fiber @react-three/drei framer-motion lenis zod sonner`
- Lovable Cloud enabled; migration creates `appointments` table with proper GRANTs and RLS
- All copy in English (clinic is in Addis Ababa, English is standard for medical signage); easy to add Amharic later

### Out of scope (can add later if you want)
- Email/SMS confirmation to patient (needs Resend/Twilio connector)
- Admin dashboard to view bookings (needs auth + admin role assignment)
- Payment integration
- Amharic translation

Approve and I'll build it end to end.
import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock } from "lucide-react";
import logo from "@/assets/siba-logo.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Siba Dental Clinic"
              className="h-10 w-10 rounded-xl object-contain"
            />
            <span className="font-display text-xl tracking-tight">
              Siba <span className="text-primary">Dental</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A modern dental clinic in Addis Ababa delivering gentle, world-class
            care with a personal touch.
          </p>
        </div>

        <div>
          <h4 className="font-display text-lg">Visit</h4>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Sheger, Anfo 105 roundabout
            <br />
            Addis Ababa, Ethiopia
          </p>
        </div>

        <div>
          <h4 className="font-display text-lg">Contact</h4>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 text-primary" />
            <a href="tel:+251943223030" className="hover:text-foreground">
              +251 94 322 3030
            </a>
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Daily · until 8:00 PM
          </p>
        </div>

        <div>
          <h4 className="font-display text-lg">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { to: "/services", label: "Services" },
              { to: "/about", label: "About" },
              { to: "/contact", label: "Contact" },
              { to: "/book", label: "Book Appointment" },
              { to: "/trust", label: "Trust & Privacy" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Siba Dental Clinic. All rights reserved.</p>
          <p>Crafted with care · Addis Ababa</p>
        </div>
      </div>
    </footer>
  );
}

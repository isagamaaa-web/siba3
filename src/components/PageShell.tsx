import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ChatBot } from "./ChatBot";
import { AppointmentReminder } from "./AppointmentReminder";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <AppointmentReminder />
      <main className="flex-1 pt-20">{children}</main>
      <SiteFooter />
      <ChatBot />
    </div>
  );
}


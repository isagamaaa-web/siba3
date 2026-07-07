import { createFileRoute } from "@tanstack/react-router";

const MAX_REPORT_BYTES = 12_000;

export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const length = Number(request.headers.get("content-length") ?? "0");
        if (length > MAX_REPORT_BYTES) return new Response(null, { status: 413 });

        const raw = await request.text().catch(() => "");
        if (!raw || raw.length > MAX_REPORT_BYTES) return new Response(null, { status: 204 });

        try {
          const payload = JSON.parse(raw) as Record<string, unknown>;
          const report = (payload["csp-report"] ?? payload.body ?? payload) as Record<string, unknown>;
          console.warn("[csp-report-only]", {
            blocked: safeText(report["blocked-uri"] ?? report.blockedURL),
            directive: safeText(report["violated-directive"] ?? report.effectiveDirective),
            source: safeText(report["source-file"] ?? report.sourceFile),
            disposition: safeText(report.disposition),
          });
        } catch {
          console.warn("[csp-report-only] unreadable report");
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});

function safeText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 220)
    : undefined;
}
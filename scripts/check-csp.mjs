import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/security-policy.ts", import.meta.url), "utf8");
const required = [
  "https://translate.google.com",
  "https://translate.googleapis.com",
  "https://translate-pa.googleapis.com",
  "https://www.gstatic.com",
  "https://www.google.com",
  "http://translate.google.com",
];

const missing = required.filter((origin) => !source.includes(`"${origin}"`));
const hasReportOnly = source.includes("/api/csp-report") && source.includes("report-to");

if (missing.length || !hasReportOnly) {
  console.error("CSP check failed", { missing, hasReportOnly });
  process.exit(1);
}

console.log("CSP check passed");
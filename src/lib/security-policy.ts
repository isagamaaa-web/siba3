export const REQUIRED_TRANSLATE_ORIGINS = [
  "https://translate.google.com",
  "https://translate.googleapis.com",
  "https://translate-pa.googleapis.com",
  "https://www.gstatic.com",
  "https://www.google.com",
] as const;

const TRANSLATE_IMAGE_ORIGINS = ["http://translate.google.com"] as const;

const GOOGLE_MAP_ORIGINS = ["https://www.google.com", "https://maps.google.com"] as const;

const DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://cdn.gpteng.co",
    ...REQUIRED_TRANSLATE_ORIGINS,
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://translate.google.com",
    "https://translate.googleapis.com",
    "https://www.gstatic.com",
  ],
  "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://www.gstatic.com"],
  "img-src": ["'self'", "data:", "blob:", "https:", ...TRANSLATE_IMAGE_ORIGINS],
  "media-src": ["'self'", "blob:"],
  "connect-src": ["'self'", "https:", "wss:"],
  "frame-src": ["'self'", ...REQUIRED_TRANSLATE_ORIGINS, ...GOOGLE_MAP_ORIGINS],
  "child-src": ["'self'", ...REQUIRED_TRANSLATE_ORIGINS, ...GOOGLE_MAP_ORIGINS],
  "worker-src": ["'self'", "blob:"],
  "frame-ancestors": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
};

function serialize(extra: Record<string, string[]> = {}) {
  return Object.entries({ ...DIRECTIVES, ...extra })
    .map(([name, values]) => `${name} ${Array.from(new Set(values)).join(" ")}`)
    .join("; ");
}

export function buildContentSecurityPolicy() {
  return serialize();
}

export function buildReportOnlyContentSecurityPolicy() {
  return serialize({
    "report-uri": ["/api/csp-report"],
    "report-to": ["csp-endpoint"],
  });
}

export function assertTranslateCspCoverage(policy = buildContentSecurityPolicy()) {
  const missing = REQUIRED_TRANSLATE_ORIGINS.filter((origin) => !policy.includes(origin));
  if (missing.length) {
    throw new Error(`CSP is missing required Google Translate origins: ${missing.join(", ")}`);
  }
}

assertTranslateCspCoverage();
import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown, Loader2 } from "lucide-react";

const LANGS: { code: string; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Oromo", native: "Afaan Oromoo" },
  { code: "ti", label: "Tigrinya", native: "ትግርኛ" },
  { code: "so", label: "Somali", native: "Soomaali" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "fr", label: "French", native: "Français" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "zh-CN", label: "Chinese", native: "中文" },
  { code: "sw", label: "Swahili (Kenya)", native: "Kiswahili" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

const STORAGE_KEY = "siba.lang";
const ALL_CODES = LANGS.map((l) => l.code).filter((c) => c !== "en").join(",");

// Hide every Google Translate UI surface (banner, tooltip, highlight, frame).
const HIDE_CSS = `
  .goog-te-banner-frame, .goog-te-banner-frame.skiptranslate,
  .skiptranslate iframe, iframe.goog-te-banner-frame,
  #goog-gt-tt, .goog-te-balloon-frame, .goog-tooltip, .goog-tooltip:hover,
  .goog-te-gadget-icon, .goog-te-gadget, .VIpgJd-ZVi9od-l4eHX-hSRGPd { display: none !important; visibility: hidden !important; }
  body { top: 0 !important; position: static !important; }
  .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
  #google_translate_element { position: fixed !important; left: -9999px !important; top: -9999px !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
`;

function injectHideStyle() {
  if (document.getElementById("gt-hide-style")) return;
  const style = document.createElement("style");
  style.id = "gt-hide-style";
  style.textContent = HIDE_CSS;
  document.head.appendChild(style);
}

function setGoogTransCookie(target: string) {
  const value = target === "en" ? "" : `/en/${target}`;
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = ["", host];
  if (parts.length > 1) domains.push("." + parts.slice(-2).join("."));
  for (const d of domains) {
    document.cookie =
      "googtrans=" +
      encodeURIComponent(value) +
      "; path=/" +
      (d ? "; domain=" + d : "") +
      "; max-age=" +
      (value ? 60 * 60 * 24 * 365 : 0);
  }
}

type Loader = { promise: Promise<void> | null };
const widgetLoader: Loader = { promise: null };

function clearTranslateWidget() {
  document.getElementById("google_translate_script")?.remove();
  document.getElementById("google_translate_element")?.remove();
  delete (window as unknown as { googleTranslateElementInit?: () => void }).googleTranslateElementInit;
}

function reloadForLanguage(code: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tl", code);
  window.location.replace(url.toString());
}

function loadWidget(): Promise<void> {
  if (widgetLoader.promise) return widgetLoader.promise;
  const p = new Promise<void>((resolve, reject) => {
    injectHideStyle();
    if (!document.getElementById("google_translate_element")) {
      const el = document.createElement("div");
      el.id = "google_translate_element";
      document.body.appendChild(el);
    }
    (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit = () => {
      const G = (window as unknown as {
        google?: { translate?: { TranslateElement: new (opts: object, el: string) => void } };
      }).google;
      if (!G?.translate) {
        reject(new Error("translate-api-missing"));
        return;
      }
      new G.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: ALL_CODES, autoDisplay: false },
        "google_translate_element",
      );
      const start = Date.now();
      const tick = () => {
        if (document.querySelector("select.goog-te-combo")) return resolve();
        if (Date.now() - start > 30000) return reject(new Error("translate-timeout"));
        setTimeout(tick, 100);
      };
      tick();
    };
    let attempts = 0;
    const inject = () => {
      attempts += 1;
      const existing = document.getElementById("google_translate_script");
      if (existing) existing.remove();
      const s = document.createElement("script");
      s.id = "google_translate_script";
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      s.onerror = () => {
        if (attempts < 3) setTimeout(inject, 800 * attempts);
        else reject(new Error("translate-script-failed"));
      };
      document.body.appendChild(s);
    };
    inject();
  }).catch((err) => {
    widgetLoader.promise = null;
    throw err;
  });
  widgetLoader.promise = p;
  return p;
}

async function applyLanguage(code: string) {
  injectHideStyle();
  setGoogTransCookie(code);
  if (code === "en") {
    // Return to source language without a network hop.
    clearTranslateWidget();
    window.location.reload();
    return;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline");
  }
  await loadWidget();
  const sel = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (!sel) {
    reloadForLanguage(code);
    return;
  }
  sel.value = code;
  sel.dispatchEvent(new Event("change"));
  window.setTimeout(() => {
    const cookie = decodeURIComponent(document.cookie.split("; ").find((c) => c.startsWith("googtrans="))?.split("=")[1] ?? "");
    if (!cookie.includes(`/${code}`)) reloadForLanguage(code);
  }, 1200);
}


export function LanguageSwitcher() {
  const [current, setCurrent] = useState<string>("en");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tl") : null;
    const saved = requested || (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "en";
    setCurrent(saved);
    injectHideStyle();
    if (saved !== "en") {
      // Re-apply on every page load without showing the Google banner.
      setGoogTransCookie(saved);
      if (requested) {
        try {
          localStorage.setItem(STORAGE_KEY, requested);
        } catch {
          /* ignore */
        }
      }
      void loadWidget().then(() => {
        const sel = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
        if (sel && sel.value !== saved) {
          sel.value = saved;
          sel.dispatchEvent(new Event("change"));
        }
        if (requested) {
          const clean = new URL(window.location.href);
          clean.searchParams.delete("tl");
          window.history.replaceState({}, "", clean.toString());
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-lang-switcher]")) setOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const select = async (code: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    setCurrent(code);
    setOpen(false);
    setBusy(true);
    try {
      await applyLanguage(code);
    } catch (err) {
      const { toast } = await import("sonner");
      const offline =
        (err as Error)?.message === "offline" ||
        (typeof navigator !== "undefined" && !navigator.onLine);
      if (offline) {
        toast.message("You're offline", {
          description: "Translation needs a small internet connection. Your choice is saved and will apply automatically once you're back online.",
        });
        // Retry once when connectivity returns.
        const retry = () => {
          window.removeEventListener("online", retry);
          void applyLanguage(code).catch(() => {});
        };
        window.addEventListener("online", retry);
      } else {
        toast.message("Applying language", {
          description: "Refreshing once so the translation engine can finish loading securely.",
        });
        reloadForLanguage(code);
      }
    } finally {
      setBusy(false);
    }
  };


  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <div data-lang-switcher className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="notranslate inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur transition hover:bg-secondary"
        aria-label="Change language"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
        <span>{active.native}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="notranslate absolute right-0 z-[60] mt-2 max-h-[60vh] w-56 overflow-auto rounded-2xl border border-border bg-background/95 p-1.5 shadow-card backdrop-blur-xl">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => void select(l.code)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              <span>
                <span className="font-medium">{l.native}</span>
                <span className="ml-2 text-xs text-muted-foreground">{l.label}</span>
              </span>
              {current === l.code && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

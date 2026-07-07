import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles, WifiOff } from "lucide-react";
import { offlineAnswer } from "@/lib/offline-faq";

type Msg = { role: "user" | "assistant"; content: string };


const GREETING: Msg = {
  role: "assistant",
  content:
    "👋 Hello! I'm Siba's AI. Ask me anything about Siba Dental Clinic — services, prices, hours, or how to book. I understand English, Amharic, Oromo and more.",
};

const TEASER_DISMISSED_KEY = "siba_chat_teaser_dismissed_v1";


// Defensive client-side sanitiser: we render text only, never HTML.
// Also strips markdown emphasis tokens (**bold**, *italic*, _x_, `code`, ###)
// so the assistant always reads as clean conversational text.
function clean(s: string) {
  return s.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 1000);
}

function stripMarkdown(s: string) {
  return s
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/(^|\s)_(?!\s)([^_\n]+?)_(?!\w)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setTeaser(false);
    }
  }, [open]);

  // Attention-grabbing teaser bubble beside the chat button.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(TEASER_DISMISSED_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const show = setTimeout(() => setTeaser(true), 2500);
    const hide = setTimeout(() => setTeaser(false), 18000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  const dismissTeaser = () => {
    setTeaser(false);
    try {
      window.localStorage.setItem(TEASER_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };


  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, open]);

  const [offline, setOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const replyOffline = (text: string) => {
    const answer = offlineAnswer(text);
    setMsgs((m) => [
      ...m,
      { role: "assistant", content: `${answer} (Offline mode — full AI resumes when you're back online.)` },
    ]);
  };

  const send = async () => {
    const text = clean(input.trim());
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    // Skip the network hop entirely if we know we're offline.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      replyOffline(text);
      setBusy(false);
      return;
    }
    try {
      // Short timeout so weak wifi fails fast into offline mode.
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (data.reply) {
        setMsgs((m) => [...m, { role: "assistant", content: stripMarkdown(data.reply!) }]);
      } else {
        // Server unreachable or errored → offline knowledge fallback.
        replyOffline(text);
      }
    } catch {
      replyOffline(text);
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="fixed bottom-4 right-4 z-[70] notranslate">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 flex h-[70vh] max-h-[560px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-base">Siba Assistant</p>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    {offline ? (<><WifiOff className="h-3 w-3" /> Offline mode · quick answers</>) : "Online · answers in your language"}
                  </p>

                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
            >
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "mr-auto max-w-[90%] rounded-2xl rounded-bl-md bg-secondary px-3 py-2 text-sm text-foreground"
                  }
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <div className="mr-auto inline-flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-center gap-2 border-t border-border bg-background px-3 py-2.5"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 800))}
                placeholder="Ask about services, prices, hours…"
                className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm outline-none focus:border-primary"
                maxLength={800}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && teaser && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-[min(78vw,260px)] rounded-2xl rounded-br-sm border border-border bg-background/95 p-3 pr-8 text-sm shadow-2xl backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="block w-full text-left"
            >
              <p className="font-medium text-foreground">
                👋 Hello! I'm Siba's AI
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ask me anything about Siba Dental Clinic.
              </p>
            </button>
            <button
              onClick={dismissTeaser}
              aria-label="Dismiss"
              className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-border bg-background" />
          </motion.div>
        )}
      </AnimatePresence>



      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-2xl ring-4 ring-primary/15"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}

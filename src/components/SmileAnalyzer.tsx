import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, X, CheckCircle2, AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUEUE_KEY = "siba_pending_smile_v1";


type Result = {
  serviceId: string | null;
  serviceName: string | null;
  priceLabel: string | null;
  confidence: string;
  observations: string;
  advice: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPickService?: (serviceName: string) => void;
};

const MAX_BYTES = 4 * 1024 * 1024;

type Mode = "idle" | "permission" | "camera" | "preview";

export function SmileAnalyzer({ open, onClose, onPickService }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const reset = () => {
    stopCamera();
    setPreview(null);
    setResult(null);
    setError(null);
    setBusy(false);
    setMode("idle");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) reset();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser doesn't support camera access. Please upload a photo instead.");
      return;
    }
    setMode("permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");
      // attach in next tick once <video> is mounted
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      const name = (err as DOMException)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Camera permission was denied. Please allow camera access or upload a photo.");
      } else if (name === "NotFoundError") {
        setError("No camera found on this device. Please upload a photo instead.");
      } else {
        setError("Couldn't open the camera. Please upload a photo instead.");
      }
      setMode("idle");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    setPreview(dataUrl);
    setMode("preview");
    await analyze(dataUrl);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large. Please use a smaller photo (under 4 MB).");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    setPreview(dataUrl);
    setMode("preview");
    await analyze(dataUrl);
  };

  const analyze = async (dataUrl: string) => {
    setBusy(true);
    // Fully offline: queue the photo and inform the user honestly.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try { localStorage.setItem(QUEUE_KEY, dataUrl); } catch { /* ignore */ }
      setError("You're offline. We've saved this photo — it will be analyzed automatically as soon as you're back online.");
      setBusy(false);
      return;
    }
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const data = (await res.json().catch(() => ({}))) as
        | (Result & { error?: undefined })
        | { error: string };
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "Couldn't analyze the photo.");
      } else {
        try { localStorage.removeItem(QUEUE_KEY); } catch { /* ignore */ }
        setResult(data);
      }
    } catch {
      try { localStorage.setItem(QUEUE_KEY, dataUrl); } catch { /* ignore */ }
      setError("Connection too weak to analyze right now. Photo saved — we'll retry the moment your signal returns.");
    } finally {
      setBusy(false);
    }
  };

  // Auto-retry any queued photo when connection comes back.
  useEffect(() => {
    if (!open) return;
    const retry = () => {
      try {
        const saved = localStorage.getItem(QUEUE_KEY);
        if (saved && navigator.onLine) {
          setPreview(saved);
          setMode("preview");
          void analyze(saved);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("online", retry);
    retry();
    return () => window.removeEventListener("online", retry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-primary px-5 py-4 text-primary-foreground">
              <div>
                <p className="font-display text-lg">AI Smile Analyzer</p>
                <p className="text-xs opacity-85 flex items-center gap-1">
                  {typeof navigator !== "undefined" && !navigator.onLine ? (
                    <><WifiOff className="h-3 w-3" /> Offline — photo will be queued</>
                  ) : "Snap or upload a photo — get an honest service suggestion"}
                </p>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close analyzer"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {mode === "idle" && !result && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Your photo is sent securely for analysis only and is not stored.
                    For best results, smile clearly in good light.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 transition hover:border-primary hover:bg-primary/10"
                    >
                      <Camera className="h-7 w-7 text-primary" />
                      <span className="text-sm font-medium">Open camera</span>
                      <span className="text-[11px] text-muted-foreground">Asks for permission</span>
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 transition hover:border-primary hover:bg-secondary/40"
                    >
                      <Upload className="h-7 w-7 text-primary" />
                      <span className="text-sm font-medium">Upload from device</span>
                      <span className="text-[11px] text-muted-foreground">Gallery or files</span>
                    </button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void onFile(e.target.files?.[0])}
                  />
                </div>
              )}

              {mode === "permission" && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm font-medium">Waiting for camera permission…</p>
                  <p className="text-xs text-muted-foreground">
                    Please tap <strong>Allow</strong> in your browser prompt.
                  </p>
                </div>
              )}

              {mode === "camera" && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="rounded-full bg-gradient-primary"
                      onClick={capture}
                    >
                      <Camera className="mr-1.5 h-4 w-4" /> Capture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        stopCamera();
                        setMode("idle");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {mode === "preview" && preview && (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/40">
                  <img src={preview} alt="Your smile" className="max-h-64 w-full object-cover" />
                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Analyzing your smile…
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {result.serviceName ? (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-display text-lg">
                          Recommended: {result.serviceName}
                        </p>
                      </div>
                      {result.priceLabel && (
                        <p className="mt-1 text-sm">
                          Starting from{" "}
                          <span className="font-semibold text-foreground">
                            {result.priceLabel}
                          </span>{" "}
                          · Final price confirmed after a check-up.
                        </p>
                      )}
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Confidence: {result.confidence}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
                      We couldn't clearly identify a treatment from this photo.
                      Please try a clearer close-up of your teeth, or book a
                      check-up so we can take a proper look.
                    </div>
                  )}

                  {result.observations && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        What we see
                      </p>
                      <p className="text-sm">{result.observations}</p>
                    </div>
                  )}
                  {result.advice && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Our advice
                      </p>
                      <p className="text-sm">{result.advice}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.serviceName && onPickService && (
                      <Button
                        type="button"
                        className="rounded-full bg-gradient-primary"
                        onClick={() => {
                          onPickService(result.serviceName!);
                          handleClose();
                        }}
                      >
                        Use this service
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={reset}
                    >
                      <RefreshCw className="mr-1.5 h-4 w-4" /> Try another photo
                    </Button>
                  </div>

                  <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                    This is a helpful estimate, not a medical diagnosis. A
                    dentist confirms your treatment plan during a check-up.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

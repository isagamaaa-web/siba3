import { createFileRoute } from "@tanstack/react-router";
import { SERVICES, formatBirr } from "@/lib/services";
import { rateLimit, clientKey, tooManyResponse } from "@/lib/rate-limit";

// AI Smile Analyzer endpoint.
// - Accepts a single image (data URL or raw base64) from the client.
// - Sends it directly to Gemini via OpenAI-compatible endpoints with a STRICT JSON schema prompt.
// - Returns a service recommendation that maps to the clinic's price list.
// - Hardened: size cap, type check, no echoing of arbitrary HTML, locked output.

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

const SERVICE_LIST = SERVICES.map(
  (s) => `${s.id} — ${s.name} (from ${formatBirr(s.priceFrom)}): ${s.desc}`,
).join("\n");

const SYSTEM = `You are Siba Dental Clinic's AI smile analyzer.
You receive ONE photo of a person's mouth, teeth or smile.

Your job: estimate which of the clinic's services would most likely help, honestly.

Allowed services (use the id exactly):
${SERVICE_LIST}

Rules:
- Be honest. If teeth look healthy, recommend "cleaning" as routine maintenance and say so.
- If the image is not a mouth / teeth / face, set service_id to null and explain politely.
- Never diagnose disease. Use phrases like "looks like", "may benefit from", "we recommend a check-up".
- Output PLAIN text fields. No markdown, no asterisks, no HTML.
- Keep observations under 240 characters. Keep advice under 240 characters.
- Always remind the user that a final treatment plan needs an in-clinic check-up.

Return ONLY a JSON object with this exact shape, no prose around it:
{
  "service_id": "<one of the ids above, or null>",
  "confidence": "low" | "medium" | "high",
  "observations": "<what you can see>",
  "advice": "<what we recommend>"
}`;

type AnalyzeBody = { image?: unknown };

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Rate limit — image analysis is the most expensive AI call.
          const rl = rateLimit(clientKey(request, "analyze"), 6, 60);
          if (!rl.ok) return tooManyResponse(rl.resetInSec);

          const body = (await request.json().catch(() => ({}))) as AnalyzeBody;
          const raw = typeof body.image === "string" ? body.image : "";
          if (!raw) {
            return json({ error: "No image provided." }, 400);
          }

          // Accept data URL or raw base64.
          let mime = "image/jpeg";
          let b64 = raw;
          const m = raw.match(/^data:(image\/(?:jpeg|png|webp|heic|heif));base64,(.+)$/i);
          if (m) {
            mime = m[1].toLowerCase();
            b64 = m[2];
          } else if (raw.startsWith("data:")) {
            return json({ error: "Unsupported image format." }, 400);
          }

          // Rough size check (base64 expands by ~4/3).
          const approxBytes = Math.floor((b64.length * 3) / 4);
          if (approxBytes > MAX_IMAGE_BYTES) {
            return json({ error: "Image is too large. Please use a smaller photo." }, 413);
          }
          if (b64.length < 200) {
            return json({ error: "Image looks empty. Please try again." }, 400);
          }

          // Pull direct key across standard server environments and Vite dev servers
          const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
          if (!key) return json({ error: "AI is not configured." }, 500);

          const dataUrl = `data:${mime};base64,${b64}`;

          // Post directly to Google AI Studio compatibility gateway
          const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`,
              },
              body: JSON.stringify({
                model: "gemini-2.5-flash",
                temperature: 0.2,
                max_tokens: 400,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: SYSTEM },
                  {
                    role: "user",
                    content: [
                      { type: "text", text: "Please analyze this smile and recommend the best service." },
                      { type: "image_url", image_url: { url: dataUrl } },
                    ],
                  },
                ],
              }),
            },
          );

          if (res.status === 429) return json({ error: "The analyzer is busy. Try again in a moment." }, 429);
          if (res.status === 402) return json({ error: "Analyzer temporarily unavailable. Please call +251 94 322 3030." }, 402);
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            console.error("[analyze] gateway error", res.status, t);
            return json({ error: "Couldn't analyze the photo. Please try again." }, 500);
          }

          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const content = data.choices?.[0]?.message?.content ?? "";

          let parsed: {
            service_id?: string | null;
            confidence?: string;
            observations?: string;
            advice?: string;
          } = {};
          try {
            parsed = JSON.parse(content);
          } catch {
            // Try to salvage a JSON object inside text.
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                parsed = JSON.parse(match[0]);
              } catch {
                /* ignore */
              }
            }
          }

          const allowed = new Set<string>(SERVICES.map((s) => s.id));
          const serviceId =
            typeof parsed.service_id === "string" && allowed.has(parsed.service_id)
              ? parsed.service_id
              : null;
          const service = serviceId
            ? SERVICES.find((s) => s.id === serviceId) ?? null
            : null;

          const cleanText = (s: unknown) =>
            (typeof s === "string" ? s : "")
              .replace(/[\u0000-\u001F\u007F]/g, " ")
              .replace(/\*\*?|`+|#+/g, "")
              .slice(0, 400)
              .trim();

          return json(
            {
              serviceId,
              serviceName: service?.name ?? null,
              priceFrom: service?.priceFrom ?? null,
              priceLabel: service ? formatBirr(service.priceFrom) : null,
              confidence: ["low", "medium", "high"].includes(String(parsed.confidence))
                ? parsed.confidence
                : "medium",
              observations: cleanText(parsed.observations),
              advice: cleanText(parsed.advice),
            },
            200,
          );
        } catch (err) {
          console.error("[analyze] crashed", err);
          return json({ error: "Unexpected error. Please try again." }, 500);
        }
      },
    },
  },
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
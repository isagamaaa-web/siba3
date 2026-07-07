// Tiny offline knowledge base used when the AI gateway can't be reached.
// Keyword-matched so it works with just HTML/JS, no network.

export type FAQMatch = { answer: string; score: number };

const CLINIC = {
  name: "Siba Dental Clinic",
  phone: "+251 94 322 3030",
  address: "Sheger, Anfo 105 roundabout, Addis Ababa, Ethiopia",
  hours: "Open daily, closes 8:00 PM. Emergency line available 24/7.",
};

const ENTRIES: { keys: string[]; answer: string }[] = [
  {
    keys: ["hour", "open", "close", "time", "when"],
    answer: `We're ${CLINIC.hours} You can book online any time on the Book Appointment page.`,
  },
  {
    keys: ["address", "location", "where", "map", "direction"],
    answer: `We're at ${CLINIC.address}. The Contact page has directions that work offline.`,
  },
  {
    keys: ["phone", "call", "contact", "number"],
    answer: `Call us any time at ${CLINIC.phone}. The emergency line is 24/7.`,
  },
  {
    keys: ["book", "appointment", "reserve", "schedule"],
    answer: "Tap Book Appointment in the top menu. You'll pick a service and a preferred date — takes under a minute.",
  },
  {
    keys: ["reschedule", "change", "move"],
    answer: "Use the Reschedule button in the header. Your device is recognized automatically, no login needed.",
  },
  {
    keys: ["price", "cost", "how much", "fee"],
    answer:
      "Starting prices (ETB): Cleaning 1,500 · Whitening 6,000 · Braces from 30,000 · Implants from 35,000 · Root canal from 4,500 · Veneers from 9,000 · Pediatric visit from 1,200 · Emergency visit from 1,000. Final price is confirmed after a check-up.",
  },
  { keys: ["clean", "hygiene", "scale"], answer: "Cleaning & Hygiene starts at 1,500 ETB and takes about 40 minutes." },
  { keys: ["whiten", "white", "bleach"], answer: "Teeth Whitening starts at 6,000 ETB. Safe, in-clinic session." },
  { keys: ["brace", "align", "invisalign", "crooked"], answer: "Braces start at 30,000 ETB (metal). Ceramic 38,000. Clear aligners 55,000." },
  { keys: ["implant", "missing tooth"], answer: "Dental implants start at 35,000 ETB per implant." },
  { keys: ["root canal", "rct", "nerve"], answer: "Root canal from 4,500 ETB (single canal). Molars from 7,500 ETB." },
  { keys: ["kid", "child", "pediatric"], answer: "Pediatric visits start at 1,200 ETB. Gentle, kid-friendly team." },
  { keys: ["veneer", "cosmetic", "smile makeover"], answer: "Cosmetic veneers start at 9,000 ETB per tooth." },
  { keys: ["pain", "hurt", "swelling", "bleed", "broken", "emergency", "urgent"], answer: `For pain, swelling or trauma please call ${CLINIC.phone} right now — our emergency line is 24/7.` },
  { keys: ["language", "translate", "amharic", "oromo", "arabic"], answer: "The globe icon at the top switches between 13 languages including Amharic, Oromo, Tigrinya, Somali and Arabic." },
  { keys: ["insurance", "pay", "cash", "card"], answer: "We accept cash and major cards. Bring any insurance details to your visit and we'll help you check coverage." },
  { keys: ["park", "parking"], answer: "Free parking is available right by the clinic entrance." },
  { keys: ["covid", "safe", "sterile", "clean tools"], answer: "All instruments are fully sterilized between patients and rooms are sanitized after every visit." },
  { keys: ["hello", "hi", "hey", "salam", "selam"], answer: `Hello! I'm Siba's assistant. Ask me about services, prices, hours or how to book at ${CLINIC.name}.` },
  { keys: ["thank", "thanks"], answer: "You're very welcome! Anything else I can help with?" },
];

const FALLBACK = `I'm offline right now so my full AI isn't available, but here's what I can tell you: ${CLINIC.name}, ${CLINIC.address}. Phone ${CLINIC.phone}. ${CLINIC.hours} Ask about hours, prices, services or booking and I can answer from memory.`;

export function offlineAnswer(input: string): string {
  const q = input.toLowerCase();
  let best: FAQMatch = { answer: FALLBACK, score: 0 };
  for (const e of ENTRIES) {
    let score = 0;
    for (const k of e.keys) if (q.includes(k)) score += k.length;
    if (score > best.score) best = { answer: e.answer, score };
  }
  return best.answer;
}

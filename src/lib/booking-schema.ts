import { z } from "zod";

// Shared validation used by both client and server
export const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(120, "Name is too long")
    .regex(/^[\p{L}\s.'-]+$/u, "Name contains invalid characters"),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(30, "Phone is too long")
    .regex(/^[+0-9\s()-]+$/, "Phone contains invalid characters"),
  email: z
    .string()
    .trim()
    .max(255)
    .email("Please enter a valid email address")
    .regex(
      /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
      "Please enter a valid email address",
    )
    .optional()
    .or(z.literal("").transform(() => undefined)),
  service: z.string().trim().min(1, "Please choose a service").max(80),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .refine((d) => {
      const picked = new Date(d + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return picked.getTime() >= today.getTime();
    }, "Date must be today or later"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long")
    .refine(
      (s) => !/[<>]|&(lt|gt|#|amp);|javascript:|on\w+\s*=|<\s*\/?\s*script/i.test(s),
      "Notes can't contain code or HTML — please write in plain language.",
    )
    .refine(
      (s) => !/\b(function|=>|console\.|document\.|window\.|eval|alert\s*\()\b/i.test(s),
      "Notes can't contain code — please write in plain language.",
    )
    .refine((s) => {
      // At least 60% of characters must be letters/spaces/normal punctuation — blocks code-like input.
      if (s.length < 3) return true;
      const letters = (s.match(/[\p{L}\s.,!?'-]/gu) ?? []).length;
      return letters / s.length >= 0.6;
    }, "Please write notes in real language, not code.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // Honeypot — must remain empty
  website: z.string().max(0).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;


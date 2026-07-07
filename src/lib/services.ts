import {
  Smile,
  Sparkles,
  Shield,
  Activity,
  Baby,
  Crown,
  Stethoscope,
  Syringe,
} from "lucide-react";

// Prices are starting prices in Ethiopian Birr (ETB).
export const SERVICES = [
  {
    id: "cleaning",
    name: "Cleaning & Hygiene",
    icon: Sparkles,
    desc: "Professional scaling, polish and personalised hygiene coaching.",
    priceFrom: 1500,
  },
  {
    id: "whitening",
    name: "Teeth Whitening",
    icon: Smile,
    desc: "Safe in-clinic whitening for a brighter, confident smile.",
    priceFrom: 6000,
  },
  {
    id: "braces",
    name: "Braces & Aligners",
    icon: Activity,
    desc: "Modern orthodontics — metal, ceramic and clear aligners.",
    priceFrom: 30000,
  },
  {
    id: "implants",
    name: "Dental Implants",
    icon: Crown,
    desc: "Permanent, natural-looking tooth replacements.",
    priceFrom: 35000,
  },
  {
    id: "root-canal",
    name: "Root Canal Therapy",
    icon: Syringe,
    desc: "Painless endodontic treatment to save your natural teeth.",
    priceFrom: 4500,
  },
  {
    id: "pediatric",
    name: "Pediatric Dentistry",
    icon: Baby,
    desc: "Gentle care for your little ones in a friendly setting.",
    priceFrom: 1200,
  },
  {
    id: "cosmetic",
    name: "Cosmetic Dentistry",
    icon: Shield,
    desc: "Veneers, bonding and smile makeovers tailored to you.",
    priceFrom: 9000,
  },
  {
    id: "emergency",
    name: "Emergency Care",
    icon: Stethoscope,
    desc: "Same-day relief when you need it most.",
    priceFrom: 1000,
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const formatBirr = (n: number) =>
  `${n.toLocaleString("en-US")} ETB`;

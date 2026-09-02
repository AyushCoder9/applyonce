import type { Section, Label } from "./types";

export interface SectionMeta { id: Section; label: Label; icon: string; order: number; blurb: Label; optIn?: boolean }

export const SECTION_META: readonly SectionMeta[] = [
  { id: "identity", order: 1, icon: "id-card", label: { en: "Identity", hi: "पहचान" }, blurb: { en: "Name, DOB, Aadhaar, PAN, passport", hi: "नाम, जन्म तिथि, आधार, पैन, पासपोर्ट" } },
  { id: "contact", order: 2, icon: "phone", label: { en: "Contact", hi: "संपर्क" }, blurb: { en: "Mobile and email", hi: "मोबाइल और ईमेल" } },
  { id: "address", order: 3, icon: "map-pin", label: { en: "Addresses", hi: "पते" }, blurb: { en: "Permanent, current, correspondence", hi: "स्थायी, वर्तमान, पत्राचार" } },
  { id: "family", order: 4, icon: "users", label: { en: "Family", hi: "परिवार" }, blurb: { en: "Parents, guardian, income", hi: "माता-पिता, अभिभावक, आय" } },
  { id: "category", order: 5, icon: "badge-check", label: { en: "Category & eligibility", hi: "श्रेणी व पात्रता" }, blurb: { en: "Category, PwD, domicile, certificates", hi: "श्रेणी, दिव्यांगता, अधिवास, प्रमाण पत्र" } },
  { id: "education", order: 6, icon: "graduation-cap", label: { en: "Education", hi: "शिक्षा" }, blurb: { en: "Class 10, 12, degrees, exam scores", hi: "कक्षा 10, 12, डिग्री, परीक्षा स्कोर" } },
  { id: "employment", order: 7, icon: "briefcase", label: { en: "Employment", hi: "रोज़गार" }, blurb: { en: "Current job and history", hi: "वर्तमान नौकरी और इतिहास" } },
  { id: "health", order: 8, icon: "heart-pulse", label: { en: "Health", hi: "स्वास्थ्य" }, blurb: { en: "Emergency card, insurance (opt-in)", hi: "आपातकालीन कार्ड, बीमा (वैकल्पिक)" }, optIn: true },
  { id: "bank", order: 9, icon: "landmark", label: { en: "Bank", hi: "बैंक" }, blurb: { en: "Account for scholarships & payouts", hi: "छात्रवृत्ति व भुगतान हेतु खाता" } },
  { id: "prefs", order: 10, icon: "sliders-horizontal", label: { en: "Preferences", hi: "प्राथमिकताएँ" }, blurb: { en: "Language, exam cities", hi: "भाषा, परीक्षा शहर" } },
];
export const sectionMeta = (id: Section) => SECTION_META.find((s) => s.id === id)!;

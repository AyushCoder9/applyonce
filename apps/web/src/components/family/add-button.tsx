"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
export function AddButton({ locale }: { locale: "en" | "hi" }) {
  return <Link href="/app/family?add=1" className="cta inline-flex items-center gap-2 px-4 py-2.5 text-sm" data-testid="family-add"><Plus className="size-4" />{locale === "hi" ? "सदस्य जोड़ें" : "Add member"}</Link>;
}

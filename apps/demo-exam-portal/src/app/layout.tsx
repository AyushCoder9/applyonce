import type { Metadata } from "next";
import { GovHeader } from "@/components/GovHeader";
import { GovFooter } from "@/components/GovFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bharat Test Agency — BTA-JEE 2026 Registration",
  description: "Demo exam portal for the ApplyOnce project — deliberately painful manual form vs. one-click Apply with ApplyOnce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GovHeader />
        <main style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 16px", minHeight: "60vh" }}>{children}</main>
        <GovFooter />
      </body>
    </html>
  );
}

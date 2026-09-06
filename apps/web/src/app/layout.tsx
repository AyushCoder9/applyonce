import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque, Noto_Sans_Devanagari, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], display: "swap", variable: "--font-devanagari", weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono-jb" });

export const metadata: Metadata = {
  title: { default: "ApplyOnce — Verify once. Apply anywhere.", template: "%s · ApplyOnce" },
  description: "Enter your details once, verify them against the issuer, and apply to any exam, college, scholarship, job or KYC with one consent tap.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#4f46e5", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${bricolage.variable} ${devanagari.variable} ${mono.variable}`}>
      <body className="min-h-dvh"><Providers>{children}</Providers></body>
    </html>
  );
}

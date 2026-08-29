import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Sora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "@heroui/styles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://applyonce-silk.vercel.app"),
  title: {
    default: "ApplyOnce | Your details. Once. Anywhere.",
    template: "%s | ApplyOnce",
  },
  description:
    "A citizen-controlled profile that turns repetitive applications into one clear, consented step.",
  applicationName: "ApplyOnce",
  keywords: ["applications", "admissions", "scholarships", "student profile", "consent"],
  icons: {
    icon: [
      { url: "/applyonce-mark.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/applyonce-mark.svg",
  },
  openGraph: {
    title: "ApplyOnce | Your details. Once. Anywhere.",
    description: "A citizen-controlled application wallet for admissions, exams, and scholarships.",
    type: "website",
    url: "https://applyonce-silk.vercel.app",
    siteName: "ApplyOnce",
    images: [{ url: "/applyonce-og.svg", width: 1200, height: 630, alt: "ApplyOnce application wallet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyOnce | Your details. Once. Anywhere.",
    description: "Apply once with a verified, consent-controlled profile.",
    images: ["/applyonce-og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${plexMono.variable}`}>
      <body>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

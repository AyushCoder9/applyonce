"use client";

import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="ao-system-page"><ApplyOnceLogo size="md" /><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Something needs another try</span><h1>The application packet could not be opened.</h1><p>Your data is safe. Refresh the page or return to a known starting point.</p><div><button className="ao-button ao-button--primary" onClick={() => reset()}><RefreshCcw /> Try again</button><Link className="ao-button ao-button--quiet" href="/"><ArrowRight /> Back to home</Link></div></main>;
}

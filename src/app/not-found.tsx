import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

export default function NotFound() {
  return <main className="ao-system-page"><ApplyOnceLogo size="md" /><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> 404</span><h1>That page did not make it into the packet.</h1><p>Try the public product, your workspace, or the synthetic demo.</p><div><Link className="ao-button ao-button--primary" href="/">Back to home <ArrowRight /></Link><Link className="ao-button ao-button--quiet" href="/demo"><ArrowLeft /> Open demo</Link></div></main>;
}

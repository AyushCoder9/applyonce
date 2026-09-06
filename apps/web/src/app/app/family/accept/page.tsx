import { db, t, eq } from "@applyonce/db";
import { requireUser } from "@/lib/session";
import { verifyFamilyToken } from "@/app/api/v1/family/_tokens";
import { AcceptClient } from "@/components/family/accept-client";
import { EmptyState } from "@applyonce/ui";
import Link from "next/link";

export const metadata = { title: "Accept access" };
export default async function AcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  await requireUser(`/app/family/accept?token=${encodeURIComponent(token)}`);
  const tk = await verifyFamilyToken(token).catch(() => null);
  if (!tk) return <EmptyState title="This link has expired" blurb="Ask your family member to send a new invite." action={<Link href="/app" className="cta px-4 py-2">Go to Home</Link>} />;
  const rel = await db.query.relations.findFirst({ where: eq(t.relations.id, tk.relationId) });
  const guardian = rel && (await db.query.profiles.findFirst({ where: eq(t.profiles.id, rel.guardianProfileId) }));
  const ward = rel && (await db.query.profiles.findFirst({ where: eq(t.profiles.id, rel.wardProfileId) }));
  if (!rel || !guardian || !ward) return <EmptyState title="Invite withdrawn" blurb="The person who invited you removed this request." action={<Link href="/app" className="cta px-4 py-2">Go to Home</Link>} />;
  return <div className="mx-auto max-w-xl"><AcceptClient token={token} kind={tk.kind} guardianName={guardian.displayName} wardName={ward.displayName} scope={tk.scope ?? rel.scope} phoneLast4={tk.phone.slice(-4)} until={tk.validUntil ?? null} /></div>;
}

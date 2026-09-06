import Link from "next/link";
import { exchangeShareToken, loadPramanConfig } from "@/lib/praman";
import { getDraft } from "@/lib/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mapPayloadToRows } from "@/lib/payload-map";
import { ReturnForm } from "./ReturnForm";

export const metadata = { title: "Apply with Praman — BTA-JEE 2026" };

function ErrorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gov-card" style={{ padding: 20, borderColor: "var(--color-gov-error)" }}>
      <h1 style={{ fontSize: 18, color: "var(--color-gov-error)" }}>{title}</h1>
      <p style={{ color: "var(--color-gov-ink-2)" }}>{children}</p>
      <Link href="/" className="btn btn-secondary">
        Back to home
      </Link>
    </div>
  );
}

export default async function ApplyReturnPage({ searchParams }: { searchParams: Promise<{ draft?: string; error?: string }> }) {
  const { draft: token, error } = await searchParams;
  const jar = await cookies();
  const draft = token && jar.get("bta_draft")?.value === token ? getDraft(token) : undefined;
  if (!draft) return <ErrorCard title="Start a new application">{error === "denied" ? "You declined the share. No profile was shared with BTA." : "Your review session has expired or is unavailable. Start again from the portal."}</ErrorCard>;
  if (draft.submittedRef) redirect(`/status/${draft.submittedRef}`);
  const { payload, verified, offline } = draft;
  return <div><h1 style={{fontSize:20,marginBottom:4}}>Confirm your BTA-JEE 2026 application</h1><p style={{color:"var(--color-gov-ink-2)",fontSize:13}}>Review every answer before submitting. This review survives a page refresh for 30 minutes.</p><ReturnForm draftToken={token!} payload={payload} mapped={mapPayloadToRows(payload)} verified={verified} offline={offline}/></div>;
}

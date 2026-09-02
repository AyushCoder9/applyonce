import Link from "next/link";
import { exchangeShareToken, loadPramanConfig } from "@/lib/praman";
import { consumeState } from "@/lib/store";
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

export default async function ApplyReturnPage({ searchParams }: { searchParams: Promise<{ share_token?: string; state?: string }> }) {
  const { share_token, state } = await searchParams;

  if (!share_token) {
    return <ErrorCard title="Missing share token">This page must be reached via the "Apply with Praman" button.</ErrorCard>;
  }

  const cfg = loadPramanConfig();
  const consumedSessionId = consumeState(state);
  const isOfflineToken = share_token.startsWith("offline:");
  const sessionId = consumedSessionId ?? (isOfflineToken ? share_token.slice("offline:".length) : null);

  if (!sessionId && !cfg.offline) {
    return (
      <ErrorCard title="This link has expired or was already used">
        Share links are single-use and expire after 10 minutes. Please go back and click "Apply with Praman" again.
      </ErrorCard>
    );
  }

  try {
    const { payload, verified, offline } = await exchangeShareToken(cfg, sessionId ?? "sess_offline", share_token);
    const mapped = mapPayloadToRows(payload);
    return (
      <div>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Confirm your BTA-JEE 2026 application</h1>
        <p style={{ marginTop: 0, marginBottom: 18, color: "var(--color-gov-ink-2)", fontSize: 13 }}>
          Review what Praman shared. Fields you didn&apos;t verify yourself are still shown with their source — every value BTA receives is
          traceable back to where it came from.
        </p>
        <ReturnForm payload={payload} mapped={mapped} verified={verified} offline={offline} />
      </div>
    );
  } catch (err) {
    return <ErrorCard title="Could not verify this application">{(err as Error).message}</ErrorCard>;
  }
}

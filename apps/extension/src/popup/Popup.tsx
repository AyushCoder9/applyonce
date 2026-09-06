import { useEffect, useState, useCallback } from "react";
import { sendToBackground, sendToTab, type AuthState, type PageStatus, type FillValue, type FillSummary } from "../lib/messages";

const DEFAULT_CONNECT_URL = "http://localhost:3300/app/extension/connect";

type Doc = { id: string; title: string; docType: string; mime: string };
type FillResult = { state: "idle" | "loading" | "need-otp" | "done" | "error"; summary?: FillSummary; message?: string };

export function Popup() {
  const [auth, setAuth] = useState<AuthState>({ connected: false });
  const [tabId, setTabId] = useState<number | null>(null);
  const [status, setStatus] = useState<PageStatus | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [otp, setOtp] = useState("");
  const [fill, setFill] = useState<FillResult>({ state: "idle" });
  const [loading, setLoading] = useState(true);
  const [pasteCode, setPasteCode] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    const res = await sendToBackground<{ ok: boolean; data?: AuthState }>({ type: "APPLYONCE_AUTH_STATUS" });
    setAuth(res.data ?? { connected: false });
  }, []);

  useEffect(() => {
    (async () => {
      await refreshAuth();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null) {
        setTabId(tab.id);
        try {
          const s = await sendToTab<PageStatus>(tab.id, { type: "APPLYONCE_GET_STATUS" });
          setStatus(s);
        } catch { /* no content script on this page (e.g. chrome://) */ }
      }
      setLoading(false);
    })();
    const onMsg = (msg: { type: string; state?: AuthState }) => { if (msg.type === "APPLYONCE_AUTH_CHANGED" && msg.state) setAuth(msg.state); };
    chrome.runtime.onMessage.addListener(onMsg);
    return () => chrome.runtime.onMessage.removeListener(onMsg);
  }, [refreshAuth]);

  async function loadDocuments() {
    if (!auth.activeProfileId) return;
    const res = await sendToBackground<{ ok: boolean; data?: Doc[] }>({ type: "APPLYONCE_DOCUMENTS", profileId: auth.activeProfileId });
    setDocs(res.data ?? []);
  }

  async function openDocument(id: string) {
    const res = await sendToBackground<{ ok: boolean; data?: { url: string } }>({ type: "APPLYONCE_DOCUMENT_URL", documentId: id });
    if (res.ok && res.data) chrome.tabs.create({ url: res.data.url });
  }

  /** Fallback path when the postMessage handshake didn't fire: paste the connect page's connection code. */
  async function connectWithPastedCode() {
    setPasteError(null);
    try {
      const decoded = JSON.parse(atob(pasteCode.trim())) as { token?: string; expiresAt?: string; apiBase?: string; user?: { name: string }; profiles?: { id: string; displayName: string; kind: string }[] };
      if (!decoded.token || !decoded.expiresAt || !decoded.apiBase || !decoded.user || !decoded.profiles) throw new Error("That doesn't look like a ApplyOnce connection code.");
      const res = await sendToBackground<{ ok: boolean; data?: AuthState }>({
        type: "APPLYONCE_SET_TOKEN", token: decoded.token, expiresAt: decoded.expiresAt, apiBase: decoded.apiBase, user: decoded.user, profiles: decoded.profiles,
      });
      if (!res.ok || !res.data) throw new Error("Could not connect");
      setAuth(res.data);
      setPasteCode("");
    } catch {
      setPasteError("Couldn't read that code. Copy it again from the connect page.");
    }
  }

  async function disconnect() {
    await sendToBackground({ type: "APPLYONCE_DISCONNECT" });
    setAuth({ connected: false });
    setDocs(null);
  }

  async function switchProfile(profileId: string) {
    await sendToBackground({ type: "APPLYONCE_SET_ACTIVE_PROFILE", profileId });
    setAuth((a) => ({ ...a, activeProfileId: profileId }));
    setDocs(null);
  }

  async function runFill(stepUp?: string) {
    if (!status?.recipeId || !auth.activeProfileId || tabId == null) return;
    setFill({ state: "loading" });
    const plan = await sendToBackground<{ ok: boolean; data?: { values: Record<string, FillValue>; labels: Record<string, string>; missing: string[] }; error?: { message: string } }>({
      type: "APPLYONCE_FILL_PLAN", recipe: status.recipeId, profileId: auth.activeProfileId, keys: status.keys, stepUp,
    });
    if (!plan.ok || !plan.data) { setFill({ state: "error", message: plan.error?.message ?? "Could not reach ApplyOnce" }); return; }
    // if there are still-missing keys and we haven't tried a step-up yet, offer it (mock OTP flow)
    if (plan.data.missing.length && !stepUp) {
      setFill({ state: "need-otp", message: `${plan.data.missing.length} field${plan.data.missing.length === 1 ? "" : "s"} need a quick verification` });
      return;
    }
    const summary = await sendToTab<FillSummary>(tabId, { type: "APPLYONCE_APPLY_FILL", values: plan.data.values, labels: plan.data.labels });
    setFill({ state: "done", summary });
  }

  if (loading) return <div className="p-4 text-ink-3">Loading…</div>;

  if (!auth.connected) {
    return (
      <div className="p-4 space-y-3">
        <Header />
        <p className="text-ink-2">Not connected yet. Open the ApplyOnce app and connect this browser.</p>
        <button className="applyonce-cta w-full py-2" onClick={() => chrome.tabs.create({ url: DEFAULT_CONNECT_URL })}>
          Open applyonce.in/app/extension/connect
        </button>
        <div className="applyonce-card p-3 space-y-2">
          <p className="text-ink-2">Already have a connection code from that page?</p>
          <textarea
            className="w-full rounded-sm border border-line px-2 py-1.5 text-xs"
            rows={2}
            placeholder="Paste connection code"
            value={pasteCode}
            onChange={(e) => setPasteCode(e.target.value)}
          />
          {pasteError && <p className="text-danger-500">{pasteError}</p>}
          <button className="applyonce-cta w-full py-1.5" disabled={!pasteCode.trim()} onClick={connectWithPastedCode}>Connect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Header />

      <div className="applyonce-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-ink-2">Signed in as</span>
          <span className="font-semibold">{auth.user?.name}</span>
        </div>
        {auth.profiles && auth.profiles.length > 1 ? (
          <select
            className="w-full rounded-sm border border-line px-2 py-1.5 text-sm"
            value={auth.activeProfileId ?? ""}
            onChange={(e) => switchProfile(e.target.value)}
          >
            {auth.profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}{p.kind === "dependent" ? " (dependent)" : ""}</option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="applyonce-card p-3 space-y-2">
        {status?.recipeId ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">{status.recipeName}</span>
              {status.status === "community" && <span className="text-[11px] text-pending-700 bg-pending-50 rounded-full px-2 py-0.5">community</span>}
            </div>
            <p className="text-ink-2">ApplyOnce can fill {status.fieldCount} field{status.fieldCount === 1 ? "" : "s"} on this page.</p>
            {fill.state === "need-otp" && (
              <div className="space-y-2">
                <p className="text-pending-700">{fill.message}. Enter the OTP sent to your phone (demo: 123456).</p>
                <div className="flex gap-2">
                  <input className="flex-1 rounded-sm border border-line px-2 py-1.5" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                  <button className="applyonce-cta px-3" onClick={() => runFill(otp)}>Verify</button>
                </div>
              </div>
            )}
            {fill.state === "done" && fill.summary && (
              <p className="text-verified-700">{fill.summary.filled} filled{fill.summary.missing.length ? ` · ${fill.summary.missing.length} missing` : ""}.</p>
            )}
            {fill.state === "error" && <p className="text-danger-500">{fill.message}</p>}
            {fill.state !== "need-otp" && (
              <button className="applyonce-cta w-full py-2" disabled={status.fieldCount === 0 || fill.state === "loading"} onClick={() => runFill()}>
                {fill.state === "loading" ? "Filling…" : "Fill this page"}
              </button>
            )}
          </>
        ) : (
          <p className="text-ink-2">No known form on this page. Try the generic fill, or add a recipe (see README).</p>
        )}
      </div>

      <div className="applyonce-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Attach from ApplyOnce</span>
          {!docs && <button className="text-brand-600 underline" onClick={loadDocuments}>Load documents</button>}
        </div>
        {docs && (
          <ul className="space-y-1">
            {docs.length === 0 && <li className="text-ink-3">No documents yet.</li>}
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{d.title}</span>
                <button className="text-brand-600 underline shrink-0" onClick={() => openDocument(d.id)}>Download</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="text-ink-3 underline text-[12px]" onClick={disconnect}>Disconnect</button>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2">
      <div className="size-6 rounded-md bg-brand-500" aria-hidden />
      <span className="font-bold">ApplyOnce Autofill</span>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { Check, Copy, Puzzle, Loader2 } from "lucide-react";

type Status = "idle" | "minting" | "waiting" | "connected" | "error";

/**
 * Mints a 30-day extension token and hands it to the extension via `postMessage` —
 * the content script's handshake listener (matched to this origin) picks it up,
 * forwards it to the background service worker, and replies PRAMAN_EXT_CONNECTED.
 * The token is also shown with a copy button as a fallback for pasting into the popup.
 */
export function ConnectExtension() {
  const [status, setStatus] = useState<Status>("idle");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== window || e.origin !== window.location.origin) return;
      if (e.data?.type === "PRAMAN_EXT_CONNECTED") {
        setStatus("connected");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function connect() {
    setStatus("minting");
    setError(null);
    try {
      const res = await fetch("/api/v1/extension/token", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Could not create a connection token");
      const { token, expiresAt: exp, user, profiles } = json.data;
      setExpiresAt(exp);
      // Everything the popup's paste-fallback needs (including which origin to call) is
      // packed into one opaque code — the popup never has to guess the app's URL.
      setConnectionCode(btoa(JSON.stringify({ token, expiresAt: exp, apiBase: window.location.origin, user, profiles })));
      setStatus("waiting");
      window.postMessage({ type: "PRAMAN_EXT_TOKEN", token, expiresAt: exp, user, profiles }, window.location.origin);
      timeoutRef.current = setTimeout(() => setStatus((s) => (s === "waiting" ? "idle" : s)), 15000);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function copyCode() {
    if (!connectionCode) return;
    await navigator.clipboard.writeText(connectionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card max-w-lg p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600"><Puzzle className="size-6" /></div>
        <div>
          <h1 className="font-display text-xl font-bold">Connect this browser&apos;s extension</h1>
          <p className="mt-1 text-sm text-ink-2">Praman Autofill fills exam and scholarship forms for you. One click here connects the extension installed in this browser.</p>
        </div>
      </div>

      {status === "connected" ? (
        <div className="flex items-center gap-2 rounded-md bg-verified-50 px-4 py-3 text-verified-700">
          <Check className="size-5" /><span className="text-sm font-medium">Extension connected. You can close this tab.</span>
        </div>
      ) : (
        <Button className="cta w-full justify-center py-3" onPress={connect} isDisabled={status === "minting"}>
          {status === "minting" ? <Loader2 className="size-4 animate-spin" /> : <Puzzle className="size-4" />}
          {status === "minting" ? "Creating connection…" : status === "waiting" ? "Waiting for the extension…" : "Connect this browser's extension"}
        </Button>
      )}

      {error && <p className="text-sm text-danger-500">{error}</p>}

      {connectionCode && status !== "connected" && (
        <div className="space-y-2 rounded-md border border-line bg-surface-2 p-4">
          <p className="text-sm text-ink-2">If the extension didn&apos;t pick this up automatically, copy this connection code and paste it into the extension popup&apos;s &quot;Paste connection code&quot; box. Valid until {expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-sm bg-surface px-3 py-2 text-xs">{connectionCode}</code>
            <Button variant="secondary" onPress={copyCode} aria-label="Copy connection code">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</Button>
          </div>
        </div>
      )}

      <p className="text-xs text-ink-3">Don&apos;t have the extension yet? Load it unpacked from <code>apps/extension/dist</code> (see its README) — the Chrome Web Store listing comes after WP7.</p>
    </div>
  );
}

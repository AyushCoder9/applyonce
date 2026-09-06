/**
 * Runs only on the ApplyOnce app origin (see manifest content_scripts matches).
 * Listens for `window.postMessage({type:"APPLYONCE_EXT_TOKEN", ...})` from the
 * `/app/extension/connect` page, hands the token to the background service worker
 * (the only place it's stored), then replies `APPLYONCE_EXT_CONNECTED` so the page can
 * show a confirmation state.
 */
interface ExtTokenMessage {
  type: "APPLYONCE_EXT_TOKEN";
  token: string;
  expiresAt: string;
  user: { name: string };
  profiles: { id: string; displayName: string; kind: string }[];
}

function isExtTokenMessage(data: unknown): data is ExtTokenMessage {
  const d = data as Partial<ExtTokenMessage> | null;
  return !!d && d.type === "APPLYONCE_EXT_TOKEN" && typeof d.token === "string" && typeof d.expiresAt === "string" && !!d.user && Array.isArray(d.profiles);
}

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (!isExtTokenMessage(event.data)) return;
  const { token, expiresAt, user, profiles } = event.data;

  chrome.runtime.sendMessage(
    { type: "APPLYONCE_SET_TOKEN", token, expiresAt, apiBase: window.location.origin, user, profiles },
    () => {
      if (chrome.runtime.lastError) return; // background not ready; user can use the copy/paste fallback
      window.postMessage({ type: "APPLYONCE_EXT_CONNECTED" }, window.location.origin);
    },
  );
});

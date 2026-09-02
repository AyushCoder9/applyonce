/**
 * Background service worker: the ONLY place the extension token lives, and the only
 * place that ever calls the Praman API. Content scripts and the popup ask for data
 * through messages; the token never crosses into a page context.
 */
import type { AuthState, BackgroundRequest, ApiEnvelope } from "./lib/messages";

const STORAGE_KEY = "praman";

interface StoredAuth {
  token: string; expiresAt: string; apiBase: string;
  user: { name: string }; profiles: { id: string; displayName: string; kind: string }[];
  activeProfileId: string | null;
}

async function getStoredAuth(): Promise<StoredAuth | null> {
  const got = await chrome.storage.local.get(STORAGE_KEY);
  return (got[STORAGE_KEY] as StoredAuth | undefined) ?? null;
}

async function setStoredAuth(auth: StoredAuth | null): Promise<void> {
  if (auth) await chrome.storage.local.set({ [STORAGE_KEY]: auth });
  else await chrome.storage.local.remove(STORAGE_KEY);
}

function toAuthState(a: StoredAuth | null): AuthState {
  if (!a) return { connected: false };
  return { connected: true, apiBase: a.apiBase, user: a.user, profiles: a.profiles, activeProfileId: a.activeProfileId, expiresAt: a.expiresAt };
}

async function broadcastAuthChanged(state: AuthState) {
  try { await chrome.runtime.sendMessage({ type: "PRAMAN_AUTH_CHANGED", state }); } catch { /* no listeners open, fine */ }
}

/** Every authenticated call to the Praman API goes through here. */
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const auth = await getStoredAuth();
  if (!auth) return { ok: false, error: { code: "NOT_CONNECTED", message: "Connect the extension from the Praman app first." } };
  if (new Date(auth.expiresAt).getTime() < Date.now()) {
    await setStoredAuth(null);
    await broadcastAuthChanged({ connected: false });
    return { ok: false, error: { code: "EXTENSION_TOKEN_EXPIRED", message: "Your connection expired. Reconnect from the Praman app." } };
  }
  const res = await fetch(`${auth.apiBase}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${auth.token}` },
  });
  const json = (await res.json().catch(() => ({ ok: false, error: { code: "BAD_RESPONSE", message: "Unexpected response from Praman" } }))) as ApiEnvelope<T>;
  return json;
}

async function handle(msg: BackgroundRequest): Promise<unknown> {
  switch (msg.type) {
    case "PRAMAN_SET_TOKEN": {
      const auth: StoredAuth = { token: msg.token, expiresAt: msg.expiresAt, apiBase: msg.apiBase, user: msg.user, profiles: msg.profiles, activeProfileId: msg.profiles[0]?.id ?? null };
      await setStoredAuth(auth);
      const state = toAuthState(auth);
      await broadcastAuthChanged(state);
      return { ok: true, data: state };
    }
    case "PRAMAN_DISCONNECT": {
      await setStoredAuth(null);
      await broadcastAuthChanged({ connected: false });
      return { ok: true, data: { connected: false } };
    }
    case "PRAMAN_AUTH_STATUS":
      return { ok: true, data: toAuthState(await getStoredAuth()) };
    case "PRAMAN_SET_ACTIVE_PROFILE": {
      const auth = await getStoredAuth();
      if (!auth) return { ok: false, error: { code: "NOT_CONNECTED", message: "Not connected" } };
      auth.activeProfileId = msg.profileId;
      await setStoredAuth(auth);
      return { ok: true, data: toAuthState(auth) };
    }
    case "PRAMAN_FILL_PLAN": {
      const q = new URLSearchParams({ recipe: msg.recipe, profile: msg.profileId, keys: msg.keys.join(",") });
      if (msg.stepUp) q.set("stepUp", msg.stepUp);
      return apiFetch(`/api/v1/extension/fill-plan?${q.toString()}`);
    }
    case "PRAMAN_DOCUMENTS":
      return apiFetch(`/api/v1/extension/documents?profile=${encodeURIComponent(msg.profileId)}`);
    case "PRAMAN_DOCUMENT_URL":
      return apiFetch(`/api/v1/extension/documents/${encodeURIComponent(msg.documentId)}/url`);
    case "PRAMAN_CREATE_APPLICATION":
      return apiFetch(`/api/v1/extension/applications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipe: msg.recipe, externalRef: msg.externalRef, portalUrl: msg.portalUrl, title: msg.title, orgName: msg.orgName, kind: msg.kind }),
      });
    default:
      return { ok: false, error: { code: "UNKNOWN_MESSAGE", message: `Unhandled message type` } };
  }
}

chrome.runtime.onMessage.addListener((msg: BackgroundRequest, _sender, sendResponse) => {
  handle(msg).then(sendResponse);
  return true; // keep the message channel open for the async response
});

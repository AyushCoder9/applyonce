/** Message protocol shared by background / content scripts / popup. Plain runtime.sendMessage, no framework. */

export interface FillValue { value: unknown; source: string; verifiedBy: string | null }

export interface AuthState {
  connected: boolean;
  apiBase?: string;
  user?: { name: string };
  profiles?: { id: string; displayName: string; kind: string }[];
  activeProfileId?: string | null;
  expiresAt?: string;
}

/** content script (handshake.ts) -> background, after receiving PRAMAN_EXT_TOKEN from the app page. */
export interface SetTokenMsg {
  type: "PRAMAN_SET_TOKEN";
  token: string;
  expiresAt: string;
  apiBase: string;
  user: { name: string };
  profiles: { id: string; displayName: string; kind: string }[];
}

export interface DisconnectMsg { type: "PRAMAN_DISCONNECT" }
export interface AuthStatusMsg { type: "PRAMAN_AUTH_STATUS" }
export interface SetActiveProfileMsg { type: "PRAMAN_SET_ACTIVE_PROFILE"; profileId: string }

export interface FillPlanMsg {
  type: "PRAMAN_FILL_PLAN";
  recipe: string;
  profileId: string;
  keys: string[];
  stepUp?: string;
}
export interface FillPlanResult { ok: true; data: { profile: { id: string; displayName: string; kind: string }; values: Record<string, FillValue>; labels: Record<string, string>; missing: string[] } }

export interface DocumentsMsg { type: "PRAMAN_DOCUMENTS"; profileId: string }
export interface DocumentUrlMsg { type: "PRAMAN_DOCUMENT_URL"; documentId: string }
export interface CreateApplicationMsg {
  type: "PRAMAN_CREATE_APPLICATION";
  recipe: string; externalRef?: string; portalUrl?: string; title: string; orgName: string; kind?: string;
}

/** background -> any listener, broadcast whenever auth state changes (connect/disconnect/profile switch). */
export interface AuthChangedMsg { type: "PRAMAN_AUTH_CHANGED"; state: AuthState }

export type BackgroundRequest =
  | SetTokenMsg | DisconnectMsg | AuthStatusMsg | SetActiveProfileMsg
  | FillPlanMsg | DocumentsMsg | DocumentUrlMsg | CreateApplicationMsg;

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };

/** content script (fill.ts) -> popup/background: what this page looks like right now. */
export interface PageStatus {
  recipeId: string | null;
  recipeName?: string;
  status?: "verified" | "community";
  fieldCount: number;
  /** fact keys this page's fields resolve to, for the popup to request a fill-plan with. */
  keys: string[];
}
export interface GetStatusMsg { type: "PRAMAN_GET_STATUS" }
export interface ApplyFillMsg {
  type: "PRAMAN_APPLY_FILL";
  values: Record<string, FillValue>;
  labels: Record<string, string>;
}
export interface FillSummary { filled: number; missing: string[]; refCaptured?: { title: string; orgName: string; externalRef: string } | null }

/** Promise wrapper around chrome.runtime.sendMessage — background always replies with `sendResponse(...)`. */
export function sendToBackground<T>(msg: BackgroundRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: T) => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      resolve(response);
    });
  });
}

export function sendToTab<T>(tabId: number, msg: GetStatusMsg | ApplyFillMsg): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, msg, (response: T) => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      resolve(response);
    });
  });
}

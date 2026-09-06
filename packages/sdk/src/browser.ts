/**
 * @applyonce/sdk/browser — the "Apply with ApplyOnce" button enhancer. No API key here: the button POSTs to YOUR
 * server endpoint, which calls `applyonce.createShareSession()` and returns `{ share_url }`.
 *
 *   <button data-applyonce-form="bta-jee-2026">Apply with ApplyOnce</button>
 *   <script>ApplyOnce.init({ createSession: "/api/applyonce/session" })</script>
 */
export interface ApplyOnceInit {
  /** Your endpoint: receives POST `{ form, state }`, returns JSON `{ share_url }` (or `{ ok, data: { share_url } }`) */
  createSession: string | ((p: { form: string; state?: string }) => Promise<{ share_url: string }>);
  /** `redirect` (default) leaves the page; `popup` opens a 480×720 window and calls `onComplete` with the return-URL query when it navigates back */
  mode?: "redirect" | "popup";
  /** Opaque value echoed back on the return URL and in webhooks */
  state?: string | (() => string);
  onError?: (e: Error) => void;
  /** popup mode only: called with `{ share_token, state }` when the popup lands on your return URL */
  onComplete?: (q: Record<string, string>) => void;
}

const q = (s: string) => Object.fromEntries(new URLSearchParams(s).entries());

export async function start(form: string, cfg: ApplyOnceInit): Promise<void> {
  const state = typeof cfg.state === "function" ? cfg.state() : cfg.state;
  const create = typeof cfg.createSession === "function" ? cfg.createSession : async (p: { form: string; state?: string }) => {
    const r = await fetch(cfg.createSession as string, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p), credentials: "same-origin" });
    const j = await r.json();
    const url = j?.share_url ?? j?.data?.share_url;
    if (!r.ok || !url) throw new Error(j?.error?.message ?? `Could not start ApplyOnce (${r.status})`);
    return { share_url: url as string };
  };
  const { share_url } = await create({ form, state });
  if (cfg.mode === "popup") {
    const w = window.open(share_url, "applyonce", "width=480,height=720,menubar=no,toolbar=no");
    if (!w) { location.assign(share_url); return; }
    const timer = setInterval(() => {
      try {
        if (w.closed) { clearInterval(timer); return; }
        if (w.location.origin === location.origin && w.location.search.includes("share_token=")) { clearInterval(timer); const params = q(w.location.search); w.close(); cfg.onComplete?.(params); }
      } catch { /* cross-origin while on ApplyOnce — keep polling */ }
    }, 400);
    return;
  }
  location.assign(share_url);
}

/** Enhance every `[data-applyonce-form]` element (present now or added later). */
export function init(cfg: ApplyOnceInit) {
  const bind = (el: Element) => {
    if ((el as HTMLElement).dataset.applyonceBound) return;
    (el as HTMLElement).dataset.applyonceBound = "1";
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      const btn = el as HTMLButtonElement;
      const form = btn.dataset.applyonceForm!;
      btn.disabled = true; btn.setAttribute("aria-busy", "true");
      start(form, cfg).catch((e) => cfg.onError?.(e instanceof Error ? e : new Error(String(e)))).finally(() => { btn.disabled = false; btn.removeAttribute("aria-busy"); });
    });
  };
  document.querySelectorAll("[data-applyonce-form]").forEach(bind);
  new MutationObserver(() => document.querySelectorAll("[data-applyonce-form]").forEach(bind)).observe(document.documentElement, { childList: true, subtree: true });
  return { start: (form: string) => start(form, cfg) };
}

export const ApplyOnce = { init, start };
if (typeof window !== "undefined") (window as unknown as { ApplyOnce: typeof ApplyOnce }).ApplyOnce = ApplyOnce;
export default ApplyOnce;

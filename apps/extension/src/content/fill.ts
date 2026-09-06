/**
 * Content script: detects a matching recipe on the current page, shows a small banner
 * ("ApplyOnce can fill N fields"), and on click fills the page sequentially with a
 * highlight sweep (docs/04 §4 — 40ms stagger, 900ms fade) plus a 2s "from <issuer>"
 * ghost label under verified fields. Also watches for a recipe's `capture` selector
 * (application/confirmation number) after submit and reports it back to ApplyOnce.
 *
 * DOM-heavy and not unit-tested (per WP6 scope) — the pure matching/transform/select
 * logic it calls all lives in `../lib` and `../recipes` and IS unit-tested.
 */
import { matchRecipe, resolveFields, matchGenericLabel, RECIPES, type Recipe, type RecipeField } from "../recipes";
import { applyTransform, pickArrayIndex, isIsoDate } from "../lib/transforms";
import { matchOption, matchBoolOption, type SelectOption } from "../lib/select-match";
import { sendToBackground, type FillValue, type PageStatus, type GetStatusMsg, type ApplyFillMsg, type FillSummary } from "../lib/messages";

const VERIFIER_NAMES: Record<string, string> = {
  uidai: "Aadhaar", digilocker: "DigiLocker", cbse: "CBSE", cisce: "CISCE", state_board: "State Board",
  nsdl_pan: "PAN", abdm: "ABHA", otp: "OTP", edistrict: "e-District", account_aggregator: "your bank",
  penny_drop: "your bank", udid: "UDID", apaar: "APAAR", nad: "NAD", self: "you",
};
const niceIssuer = (v?: string | null) => (v ? VERIFIER_NAMES[v] ?? v : "you");

const CAPTCHA_HINT = /captcha|recaptcha|hcaptcha/i;

interface ResolvedGenericField extends RecipeField { }

let activeRecipe: Recipe | null = null;
let activeFields: RecipeField[] = [];
let captureObserver: MutationObserver | null = null;
let captured = false;

// ---------- page detection ----------

function doc() {
  return { url: location.href, has: (selector: string) => { try { return document.querySelectorAll(selector).length > 0; } catch { return false; } } };
}

/** Scan every labeled input/select/textarea on the page for the generic recipe's keyword table. */
function scanGeneric(): ResolvedGenericField[] {
  const found: ResolvedGenericField[] = [];
  const seenKeys = new Set<string>();
  const controls = Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea"));
  for (const el of controls) {
    if (el instanceof HTMLInputElement && (el.type === "file" || el.type === "hidden" || el.type === "submit" || el.type === "button")) continue;
    const text = labelTextFor(el);
    if (!text || CAPTCHA_HINT.test(text) || CAPTCHA_HINT.test(el.id) || CAPTCHA_HINT.test(el.className)) continue;
    const key = matchGenericLabel(text);
    if (!key || seenKeys.has(key)) continue;
    const selector = selectorFor(el);
    if (!selector) continue;
    seenKeys.add(key);
    found.push({ selector, key });
  }
  return found;
}

function labelTextFor(el: HTMLElement): string {
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl?.textContent) return lbl.textContent;
  }
  const wrapping = el.closest("label");
  if (wrapping?.textContent) return wrapping.textContent;
  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder) return placeholder;
  // fall back to the nearest preceding text (common in table/div-based forms without <label>)
  const prev = el.previousElementSibling;
  if (prev?.textContent && prev.textContent.trim().length < 60) return prev.textContent;
  return "";
}

function selectorFor(el: HTMLElement): string | null {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const name = el.getAttribute("name");
  if (name) return `[name="${CSS.escape(name)}"]`;
  // last resort: tag a data attribute we control so we can find it again
  if (!el.dataset.applyonceRef) el.dataset.applyonceRef = `f${Math.random().toString(36).slice(2, 9)}`;
  return `[data-applyonce-ref="${el.dataset.applyonceRef}"]`;
}

function detect(): PageStatus {
  const d = doc();
  const recipe = matchRecipe(d.url, d, RECIPES);
  if (!recipe) { activeRecipe = null; activeFields = []; return { recipeId: null, fieldCount: 0, keys: [] }; }
  activeRecipe = recipe;
  activeFields = recipe.id === "generic" ? scanGeneric() : resolveFields(recipe, d);
  return { recipeId: recipe.id, recipeName: recipe.name, status: recipe.status, fieldCount: activeFields.length, keys: Array.from(new Set(activeFields.map((f) => f.key))) };
}

// ---------- filling ----------

function injectStyles() {
  if (document.getElementById("applyonce-fill-styles")) return;
  const style = document.createElement("style");
  style.id = "applyonce-fill-styles";
  style.textContent = `
    .applyonce-sweep { outline: 2px solid #ff6b2c !important; background-color: rgba(255,138,76,.22) !important; border-radius: 4px; transition: background-color 900ms ease, outline-color 900ms ease; }
    .applyonce-sweep.applyonce-fade { outline-color: rgba(255,138,76,0) !important; background-color: rgba(255,138,76,0) !important; }
    .applyonce-ghost { position: absolute; z-index: 2147483647; font: 500 11px/1.4 system-ui, sans-serif; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 2px 7px; pointer-events: none; opacity: 0; transition: opacity 160ms ease; box-shadow: 0 2px 6px rgba(0,0,0,.08); }
    .applyonce-ghost.show { opacity: 1; }
    #applyonce-banner { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; background: #14141f; color: #fff; border-radius: 12px; padding: 12px 14px; font: 500 13px/1.4 system-ui, sans-serif; box-shadow: 0 12px 32px rgba(0,0,0,.28); display: flex; align-items: center; gap: 10px; max-width: 280px; }
    #applyonce-banner button { background: #ff6b2c; color: #fff; border: none; border-radius: 999px; padding: 7px 14px; font: 600 12px/1 system-ui, sans-serif; cursor: pointer; }
    #applyonce-banner button.secondary { background: transparent; color: #cbd5e1; padding: 4px 6px; }
    #applyonce-banner .applyonce-dismiss { position: absolute; top: -6px; right: -6px; background: #fff; color: #14141f; border-radius: 999px; width: 18px; height: 18px; font-size: 12px; line-height: 18px; text-align: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
  `;
  document.head.appendChild(style);
}

function ghostLabel(el: Element, text: string) {
  const rect = el.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "applyonce-ghost";
  ghost.textContent = text;
  ghost.style.left = `${rect.left + window.scrollX}px`;
  ghost.style.top = `${rect.bottom + window.scrollY + 4}px`;
  document.body.appendChild(ghost);
  requestAnimationFrame(() => ghost.classList.add("show"));
  setTimeout(() => { ghost.classList.remove("show"); setTimeout(() => ghost.remove(), 200); }, 2000);
}

function sweep(el: Element) {
  el.classList.add("applyonce-sweep");
  requestAnimationFrame(() => el.classList.add("applyonce-fade"));
  setTimeout(() => el.classList.remove("applyonce-sweep", "applyonce-fade"), 1000);
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value); else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function optionsFor(els: Element[]): SelectOption[] {
  return els
    .filter((e): e is HTMLInputElement => e instanceof HTMLInputElement)
    .map((e) => {
      let label = e.value;
      if (e.id) label = document.querySelector(`label[for="${CSS.escape(e.id)}"]`)?.textContent?.trim() || label;
      else label = e.closest("label")?.textContent?.trim() || label;
      return { value: e.value, label };
    });
}

/** Fills one field. Returns true if a value was actually written. */
function fillField(field: RecipeField, resolved: FillValue, label: string | undefined): boolean {
  let els: Element[];
  try { els = Array.from(document.querySelectorAll(field.selector)); } catch { return false; }
  els = els.filter((e) => !(e instanceof HTMLInputElement && e.type === "file"));
  if (!els.length) return false;
  if (CAPTCHA_HINT.test(field.selector)) return false;

  const raw = pickArrayIndex(resolved.value, field.arrayIndex);
  if (raw == null || raw === "") return false;

  const first = els[0]!;

  if (first instanceof HTMLSelectElement) {
    const options: SelectOption[] = Array.from(first.options).map((o) => ({ value: o.value, label: o.label || o.textContent || o.value }));
    const chosen = typeof raw === "boolean" ? matchBoolOption(options, raw) : matchOption(options, { value: String(raw), label });
    if (!chosen) return false;
    first.value = chosen;
    first.dispatchEvent(new Event("change", { bubbles: true }));
    sweep(first);
    return true;
  }

  if (els.length > 1 || (first instanceof HTMLInputElement && (first.type === "radio"))) {
    // radio group sharing the selector (e.g. `input[name=pwd]`)
    const options = optionsFor(els);
    const chosen = typeof raw === "boolean" ? matchBoolOption(options, raw) : matchOption(options, { value: String(raw), label });
    const target = els.find((e) => e instanceof HTMLInputElement && e.value === chosen) as HTMLInputElement | undefined;
    if (!target) return false;
    target.checked = true;
    target.dispatchEvent(new Event("change", { bubbles: true }));
    sweep(target);
    return true;
  }

  if (first instanceof HTMLInputElement && first.type === "checkbox") {
    const checked = typeof raw === "boolean" ? raw : /^(true|yes|y|1)$/i.test(String(raw));
    first.checked = checked;
    first.dispatchEvent(new Event("change", { bubbles: true }));
    sweep(first);
    return true;
  }

  if (first instanceof HTMLInputElement && first.type === "date") {
    const iso = String(raw);
    if (!isIsoDate(iso)) return false; // native date input needs yyyy-mm-dd; nothing sane to fall back to
    setNativeValue(first, iso);
    sweep(first);
    return true;
  }

  if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement) {
    const value = applyTransform(raw, field.transform);
    if (!value) return false;
    setNativeValue(first, value);
    sweep(first);
    return true;
  }

  return false;
}

async function runFill(values: Record<string, FillValue>, labels: Record<string, string>): Promise<FillSummary> {
  injectStyles();
  const fields = activeRecipe?.id === "generic" ? scanGeneric() : activeFields;
  const missing: string[] = [];
  let filled = 0;

  await new Promise<void>((resolve) => {
    fields.forEach((field, i) => {
      setTimeout(() => {
        const resolved = values[field.key];
        if (!resolved) { missing.push(labels[field.key] ?? field.key); }
        else {
          const ok = fillField(field, resolved, labels[field.key]);
          if (ok) {
            filled++;
            const target = document.querySelector(field.selector);
            if (target && resolved.source !== "self_declared") ghostLabel(target, `from ${niceIssuer(resolved.verifiedBy)}`);
          } else missing.push(labels[field.key] ?? field.key);
        }
        if (i === fields.length - 1) setTimeout(resolve, 950);
      }, i * 40);
    });
    if (!fields.length) resolve();
  });

  startCaptureWatch();
  return { filled, missing };
}

// ---------- banner ----------

function showBanner(status: PageStatus) {
  document.getElementById("applyonce-banner")?.remove();
  if (status.fieldCount === 0 || !status.recipeId) return;
  injectStyles();
  const banner = document.createElement("div");
  banner.id = "applyonce-banner";
  banner.innerHTML = `
    <span class="applyonce-dismiss" title="Dismiss">&times;</span>
    <span>ApplyOnce can fill ${status.fieldCount} field${status.fieldCount === 1 ? "" : "s"}</span>
    <button type="button">Fill</button>
  `;
  banner.querySelector(".applyonce-dismiss")!.addEventListener("click", () => banner.remove());
  banner.querySelector("button")!.addEventListener("click", async () => {
    banner.querySelector("button")!.textContent = "Filling…";
    try {
      const auth = await sendToBackground<{ ok: boolean; data?: { connected: boolean; activeProfileId?: string | null } }>({ type: "APPLYONCE_AUTH_STATUS" });
      if (!auth.ok || !auth.data?.connected || !auth.data.activeProfileId) {
        banner.innerHTML = `<span>Connect ApplyOnce first — open the extension icon.</span>`;
        return;
      }
      const keys = Array.from(new Set(activeFields.map((f) => f.key)));
      const plan = await sendToBackground<{ ok: boolean; data?: { values: Record<string, FillValue>; labels: Record<string, string>; missing: string[] }; error?: { message: string } }>({
        type: "APPLYONCE_FILL_PLAN", recipe: activeRecipe!.id, profileId: auth.data.activeProfileId, keys,
      });
      if (!plan.ok || !plan.data) { banner.innerHTML = `<span>${plan.error?.message ?? "Could not load your data"}</span>`; return; }
      const summary = await runFill(plan.data.values, plan.data.labels);
      const secureNote = plan.data.missing.length ? ` · open the icon to unlock ${plan.data.missing.length} secure field${plan.data.missing.length === 1 ? "" : "s"}` : "";
      banner.innerHTML = `<span>${summary.filled} filled${summary.missing.length ? ` · ${summary.missing.length} missing` : ""}${secureNote}</span>`;
      setTimeout(() => banner.remove(), 6000);
    } catch {
      banner.innerHTML = `<span>Something went wrong. Try the extension popup instead.</span>`;
    }
  });
  document.body.appendChild(banner);
}

// ---------- application-ref capture ----------

function startCaptureWatch() {
  const cap = activeRecipe?.capture;
  if (!cap || captured || captureObserver) return;
  const re = new RegExp(cap.regex);
  const check = () => {
    if (captured) return;
    const el = document.querySelector(cap.selector);
    const text = el?.textContent ?? "";
    const m = re.exec(text);
    if (m) {
      captured = true;
      captureObserver?.disconnect();
      captureObserver = null;
      sendToBackground({
        type: "APPLYONCE_CREATE_APPLICATION",
        recipe: activeRecipe!.id,
        externalRef: m[0],
        portalUrl: location.href,
        title: activeRecipe!.name,
        orgName: activeRecipe!.name.split(" — ")[0] ?? activeRecipe!.name,
        kind: "exam",
      }).catch(() => {});
    }
  };
  check();
  if (captured) return;
  captureObserver = new MutationObserver(() => check());
  captureObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

// ---------- wiring ----------

chrome.runtime.onMessage.addListener((msg: GetStatusMsg | ApplyFillMsg, _sender, sendResponse) => {
  if (msg.type === "APPLYONCE_GET_STATUS") { sendResponse(detect()); return; }
  if (msg.type === "APPLYONCE_APPLY_FILL") { runFill(msg.values, msg.labels).then(sendResponse); return true; }
  return false;
});

function boot() {
  const status = detect();
  showBanner(status);
}

if (document.readyState === "complete" || document.readyState === "interactive") boot();
else document.addEventListener("DOMContentLoaded", boot);

# ApplyOnce Autofill (Chrome MV3)

Fills exam/scholarship/KYC forms from your verified ApplyOnce vault. Built with
`@crxjs/vite-plugin` + React + Tailwind. See `docs/05-API-AND-FLOWS.md` §F3 and
`docs/04-DESIGN-SYSTEM.md` §4 for the product spec this implements.

## Load unpacked

```
pnpm --filter @applyonce/extension build   # writes apps/extension/dist
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked**
→ select `apps/extension/dist`. Reload the extension after every rebuild
(`pnpm --filter @applyonce/extension dev` watches and rebuilds `dist/` on change —
reload the unpacked extension in `chrome://extensions` to pick up the new build).

## Connect flow

1. Log into the ApplyOnce app (`http://localhost:3300`) and open **`/app/extension/connect`**.
2. Click **Connect this browser's extension**. The page mints a 30-day token
   (`POST /api/v1/extension/token`) and posts it to the page via
   `window.postMessage({type:"APPLYONCE_EXT_TOKEN", ...}, location.origin)`.
3. `src/content/handshake.ts` — a content script that only runs on the ApplyOnce app
   origin — picks up that message, forwards it to the background service worker
   (`APPLYONCE_SET_TOKEN`), then replies `APPLYONCE_EXT_CONNECTED` so the page shows a
   confirmation. The token is stored in `chrome.storage.local` **in the background
   worker only** — content scripts and the popup never hold it directly; they ask
   the background to make API calls on their behalf.
4. If the handshake doesn't fire (extension not installed yet, content script not
   injected, etc.), the connect page shows a copyable **connection code** — a
   base64 blob of `{token, expiresAt, apiBase, user, profiles}` — with a copy
   button. Paste it into the popup's "Paste connection code" box (shown when not
   connected) and it calls the same `APPLYONCE_SET_TOKEN` message directly.

## How a page gets filled

1. `src/content/fill.ts` runs on every page (`<all_urls>`) at `document_idle`.
2. It calls `matchRecipe(url, doc)` (`src/recipes/index.ts`) — tries each recipe's
   URL glob + optional DOM "fingerprint" selector, in order (`bta-demo` → `nta-jee`
   → `nsp` → `generic`). `generic` has no fingerprint and matches `*`, so it's
   always the fallback: it scans every labeled `<input>/<select>/<textarea>` and
   matches the visible label/placeholder text against a keyword table
   (`src/recipes/generic.json`) — e.g. "Father's Name" → `family.father.name`.
3. If any fields resolve, a small banner appears ("ApplyOnce can fill N fields") with
   a **Fill** button. The extension popup offers the same action plus a profile
   switcher, an OTP prompt for sensitive fields, and an "Attach from ApplyOnce"
   document list.
4. On Fill: the content script (or popup) asks the background for a fill-plan
   (`GET /api/v1/extension/fill-plan`), then writes each value into its field
   **sequentially, 40ms apart**, with a CSS highlight sweep that fades over 900ms
   and a 2s "from &lt;issuer&gt;" ghost label under verified fields (docs/04 §4).
   `<select>`/radio values are matched by raw value → label text → fuzzy
   startsWith (`src/lib/select-match.ts`); dates go to native `<input type=date>`
   as `yyyy-mm-dd` or to text inputs via the `dd/mm/yyyy` transform
   (`src/lib/transforms.ts`); file inputs and anything that looks like a captcha
   are always skipped.
5. If a recipe defines `capture` (a selector + regex for the confirmation/
   application number), a `MutationObserver` watches for it after fill and, once
   found, posts `POST /api/v1/extension/applications` with the captured reference.

Sensitive facts (PAN, income, etc. — anything with `sensitive: true` in the
registry) are only returned by `fill-plan` when a valid step-up is supplied
(`?stepUp=123456` in mock mode); otherwise they're omitted and listed under
`missing`, and the popup prompts for the OTP inline.

## Adding a recipe

Recipes are plain JSON in `src/recipes/*.json`, typed by `src/recipes/types.ts`.
Copy an existing one (`bta-demo.json` is the "verified" reference; `nta-jee.json`/
`nsp.json` are "community" best-effort — real form field ids for those change
often, since they're maintained by outside orgs) and:

1. `match`: array of URL glob patterns (`*` wildcard) for the portal.
2. `fingerprint` (optional): a CSS selector that must exist on the page — avoids
   matching the wrong step of a multi-step form. Omit only for a recipe meant to
   match everywhere (like `generic`).
3. `fields`: `{ selector, key, transform?, arrayIndex? }[]`. `key` must be a real
   `@applyonce/schema` fact key (unit-tested — `test/recipes.test.ts` asserts every
   recipe's keys resolve via `isFactKey`). `transform` is one of `upper`, `lower`,
   `dd/mm/yyyy`, `yyyy`, `first_word`, `last_word`, `digits`, or an inline
   `map:{"raw":"option label"}`. `arrayIndex` picks one entry out of an
   array-valued fact (e.g. `prefs.exam_city_choices[0]`).
4. `capture` (optional): `{ selector, regex }` for the post-submit reference number.
5. Register the file in `src/recipes/index.ts` (`RECIPES` array — keep `generic`
   last) and add the portal's origin to `host_permissions` in `manifest.config.ts`.
6. Add a test in `test/recipes.test.ts` (fake `{url, has(selector)}`, no real DOM
   needed) and run `pnpm --filter @applyonce/extension test`.

## What's verified vs. not

- `pnpm --filter @applyonce/extension test` — 41 unit tests over pure functions
  (`transforms`, `select-match`, `matchRecipe`/`resolveFields`/`matchGenericLabel`,
  and a check that every recipe's fact keys are real registry keys). No DOM in the
  test run (no jsdom/linkedom installed) — fill.ts/handshake.ts/background.ts are
  DOM/`chrome.*`-only and are exercised by manual build/inspection, not vitest.
- `pnpm --filter @applyonce/extension typecheck` and `build` are green; `dist/manifest.json`
  is a valid MV3 manifest (verified by loading it and inspecting crxjs's generated
  `content_scripts`/`web_accessible_resources`).
- The web endpoints under `apps/web/src/app/api/v1/extension/**` were exercised
  end-to-end against the real dev server and seed data (Aarav, 9876543210/123456):
  token mint, fill-plan (with and without step-up), documents list,
  `documents/:id/url` → `mock.pdf` (a real, `pdftotext`-verified PDF), and
  application creation — plus the `/app/extension/connect` page rendering.
- **Not verified**: an actual `chrome://extensions` "load unpacked" run, the
  live handshake postMessage round-trip in a real tab, and the DOM fill against
  a real BTA demo portal page (WP3's `apps/demo-exam-portal` form wasn't up yet
  at the time this was built — recipes were written against the field ids given
  in the WP6 brief and should be re-checked against `apps/demo-exam-portal/FIELDS.md`
  once it exists). Playwright with `--load-extension` was intentionally left out
  per WP6 scope (optional, not required in CI).

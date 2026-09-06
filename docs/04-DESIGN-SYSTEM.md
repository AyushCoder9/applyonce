# 04 — Design system ("ApplyOnce Bright")

Save this as `apps/web/DESIGN.md` too — agents read it before touching UI.

## 1. Personality
Confident, warm, government-grade trustworthy but *not* government-looking. Bright surfaces, one loud accent, generous whitespace, big readable type, verified states that feel like a stamp. Think "the app that finally treats a citizen like a customer." No dark-mode-first, no glassmorphism, no gradients on text, no 12 px grey text.

## 2. Tokens (Tailwind v4 `@theme` + HeroUI theme)
```css
@theme {
  /* brand */
  --color-brand-50:#EEF2FF; --color-brand-100:#E0E7FF; --color-brand-500:#4F46E5; --color-brand-600:#4338CA; --color-brand-700:#3730A3;
  /* accent = saffron-coral, used for CTAs + progress only */
  --color-accent-400:#FF8A4C; --color-accent-500:#FF6B2C; --color-accent-600:#E85A1F;
  /* semantic */
  --color-verified-500:#059669; --color-verified-50:#ECFDF5;   /* issuer-verified stamp */
  --color-pending-500:#D97706;  --color-pending-50:#FFFBEB;    /* self-declared / awaiting */
  --color-danger-500:#DC2626;   --color-danger-50:#FEF2F2;
  --color-info-500:#0284C7;     --color-info-50:#F0F9FF;
  /* surfaces (light, warm) */
  --color-bg:#FBFAF7; --color-surface:#FFFFFF; --color-surface-2:#F4F2EC; --color-line:#E7E4DC;
  --color-ink:#14141F; --color-ink-2:#4B4B5C; --color-ink-3:#7A7A8C;   /* never lighter than ink-3 for text */
  /* type */
  --font-display:"Bricolage Grotesque", "Noto Sans Devanagari", sans-serif;
  --font-sans:"Inter", "Noto Sans Devanagari", system-ui, sans-serif;
  --font-mono:"JetBrains Mono", monospace;
  /* radius, shadow, motion */
  --radius-sm:10px; --radius-md:14px; --radius-lg:20px; --radius-pill:999px;
  --shadow-card:0 1px 2px rgb(20 20 31/.04), 0 8px 24px -12px rgb(20 20 31/.12);
  --shadow-pop:0 12px 40px -12px rgb(79 70 229/.25);
  --ease-out:cubic-bezier(.2,.8,.2,1); --dur-fast:140ms; --dur-base:220ms; --dur-slow:380ms;
}
```
Hindi text uses Noto Sans Devanagari at +1 px size for parity. Minimum body size 16 px on mobile, 15 px desktop. Line-height 1.55 body, 1.1 display.

Type scale (display / body): `h1 40/48 · h2 30/36 · h3 22/28 · h4 18/24 · body 16/25 · small 14/20 · label 13/16 uppercase tracking .04em`.

Spacing: 4-pt grid; page gutters 16 (mobile) / 32 (tablet) / 48 (desktop); card padding 20/24; section gap 32/48. Max content width 1200; forms max 640.

## 3. Colour usage rules
- Brand indigo = navigation, links, focus rings, selected states.
- Accent coral = **one** primary CTA per view + progress bars. Never for text.
- Verified green appears only on issuer/provider-verified facts; self-declared shows amber "Unverified" chip; never green for "saved".
- Backgrounds warm off-white; cards pure white with 1 px `line` border + `shadow-card`. No stacked shadows.
- Contrast: all text ≥ 4.5:1; chips ≥ 3:1 with text.

## 4. Motion
- Page transitions: fade + 8 px rise, 220 ms ease-out. Lists stagger 30 ms (max 8 items).
- Verified stamp: scale 0.9→1 with 380 ms spring + subtle green pulse once. Autofill: fields fill sequentially 40 ms apart with a light highlight sweep — this is the signature moment; it must feel fast (< 2 s for 40 fields).
- Respect `prefers-reduced-motion`.

## 5. Components (HeroUI v3 base → composed in `packages/ui`)
| Composite | Built from | Rules |
|---|---|---|
| `FactRow` | Card row | label · value · `SourceChip` (Verified/Extracted/Self-declared) · evidence link · overflow menu (edit, re-verify, history). Sensitive facts masked with reveal-on-passkey |
| `SourceChip` | Chip | icon + text; verified=green, extracted=blue, self=amber, expired=red |
| `SectionCard` | Card + header | title, completion ring (e.g., 7/9), "Add missing" CTA |
| `WizardShell` | Stepper + progress | sticky footer with Back / Continue; autosave; step count; est. time left |
| `ConsentSheet` | Modal (mobile: bottom sheet) | partner identity block (logo, verified org badge), purpose, field list grouped by section with per-field source, retention, expiry, "Share" (accent) requires step-up |
| `FieldDiff` | Table | requested vs have vs missing; missing opens inline mini-form |
| `ApplicationTimeline` | Timeline | events with actor icon; deadline countdown chip |
| `DocCard` | Card | thumbnail, issuer badge, validity, hash-verified tick, actions |
| `ProfileSwitcher` | Dropdown | self + dependents with role chips (Guardian) |
| `EmptyState` | | illustration (simple line, brand+accent), one sentence, one CTA |
| `StatTile` | Card | number in display font, label, delta |
| `Callout` | Alert | info/warning/danger; never more than one per view |
| `CommandBar` | Cmd-K | jump to section/application/partner |
| `DataTable` | TanStack + HeroUI Table | sticky header, row density toggle, column filters, CSV export |

Forms: labels above inputs, helper text below, errors inline in danger with icon, never placeholder-as-label. Indian-specific inputs: `PincodeInput` (auto-fills district/state), `AadhaarLast4`, `PanInput` (uppercase mask, checksum), `MobileInput` (+91 fixed), `MarksInput` (obtained/max → % auto), `BoardSelect`, `StateDistrictSelect`, `CategorySelect` with certificate prompt.

Accessibility: keyboard-complete, visible focus (2 px brand ring, 2 px offset), ARIA from React Aria, 44 px touch targets, form errors announced.

## 6. Layouts
- **Citizen shell**: left rail (desktop 240 px; icons + labels) / bottom tab bar (mobile: Home · Vault · Apply · Track · More). Top bar: profile switcher, search (Cmd-K), notifications bell, avatar.
- **Partner shell**: left sidebar with org switcher; top breadcrumb; content max 1280.
- **Public/marketing**: centered, 1120 max, big display type, accent CTA.
- **Wizard**: single column 640, sticky footer, progress at top.

## 7. Complete page list
### Public (`/`)
1. `/` Landing — hero ("Verify once. Apply anywhere."), live demo of autofill (animated), how it works (3 steps), trust section (DPDP, encryption, consent ledger), for institutions CTA, footer.
2. `/for-institutions` — partner value prop, SDK snippet, pricing (free for public bodies), "Get sandbox keys".
3. `/security`, `/privacy`, `/terms`, `/dpo` (data-principal rights form), `/status`.
4. `/demo` — links to Bharat Test Agency demo portal + seeded logins.

### Auth (`/auth`)
5. `/auth/login` — phone → OTP → passkey prompt (if registered) · `/auth/register` · `/auth/recover` · `/auth/passkey/new`.

### Onboarding (`/welcome`, wizard)
6. Step 1 Name & language · 2 Connect DigiLocker (or "skip, upload later") · 3 Review auto-filled identity · 4 Review education pulled · 5 Add family & category (optional) · 6 Create passkey · Done screen with completion % and "Try the demo exam form" CTA.

### Citizen app (`/app`)
7. `/app` **Home** — greeting, profile completion ring, "Needs attention" (expiring certificate, mismatch, deadline in 3 days), upcoming deadlines, recent applications, quick actions (Apply, Add document, Verify).
8. `/app/vault` — section grid with completion; `/app/vault/[section]` (identity, contact, addresses, family, category, education, employment, health, bank, preferences) — list of `FactRow`s, add/edit sheet, history drawer.
9. `/app/documents` — grid/list, filters (issuer, type, validity), upload (drag-drop → OCR → "We found 6 facts, review?") ; `/app/documents/[id]` — viewer, metadata, linked facts, hash-verified badge, share/download (step-up).
10. `/app/verify` — Verifications hub: provider cards (DigiLocker, PAN, ABHA, Account Aggregator, e-Sign) with status; mismatch list with "fix" flows; expiry calendar.
11. `/app/apply` — "Apply with ApplyOnce" catalog: partner forms available (search by exam/college), plus "Open a portal with the extension" guide; `/app/apply/[formSlug]` starts the share flow (see 05).
12. `/app/applications` — tracker table/cards; filters by status/kind; `/app/applications/[id]` — timeline, documents, deadline, partner messages, withdraw.
13. `/app/connections` — consent ledger: partners, scopes, dates, revoke; `/app/connections/[consentId]` — exact payload shared (decrypted view after step-up).
14. `/app/family` — dependents & delegates; add minor (creates ward profile), add elder (invite + consent), scopes, handover at 18 banner.
15. `/app/notifications` · `/app/settings` (profile, security: passkeys/devices/sessions, notifications, language, privacy & data: export/erase, audit log viewer) · `/app/extension` (install + connected portals + recipes status).

### Share flow (`/share/[token]`, embeddable)
16. Partner identity → purpose → profile select → field diff → missing fields → step-up → success (return to partner).

### Partner console (`/partner`)
17. `/partner` overview (applicants today, verification rate, webhook health) · `/partner/onboarding` (org verification wizard) · `/partner/forms` (list) · `/partner/forms/new` (form builder: purpose, pick fields from schema tree, custom fields, retention, redirect, webhook, preview) · `/partner/forms/[id]` (embed snippet, versions, test) · `/partner/applicants` (DataTable with per-field verified badges, drawer with payload, request re-verification, push status) · `/partner/developers` (API keys sandbox/live, webhooks, logs, JWKS) · `/partner/team` · `/partner/settings`.

### Admin (`/admin`, internal)
18. Partner approvals, provider health, job queues, flags, abuse reports, audit search, data-principal requests queue.

### Demo exam portal (`apps/demo-exam-portal`, `bta.demo`)
19. `/` "Bharat Test Agency — BTA-JEE 2026 Registration" (deliberately looks like a real government exam form: 6 steps, 48 fields) with two buttons: **Fill manually** (the pain) and **Apply with ApplyOnce** (the magic). `/status/[ref]` shows application status and lets the demo admin push "Admit card released" which appears in ApplyOnce's tracker.

## 8. Copy voice
Short, direct, Hindi-friendly English ("Your Class 12 marks are verified by CBSE." not "Educational credentials have been validated"). Every empty state tells the user the *next* action. Error messages say what to do.

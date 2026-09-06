# UI Component Libraries & Design Direction — ApplyOnce (Sept 2026)

Research date: 2026-09-02. ApplyOnce is a Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript civic-tech app. This doc answers: which component library beats "basic shadcn," exactly how to wire it up, what to borrow visually, and how to handle India-specific consent/verification/accessibility patterns.

---

## Part A — Library comparison (2026 state)

### Context: the ground shifted twice in 2026

Two events matter more than any single library's feature list:

1. **Base UI went stable (v1.0, Dec 11 2025; now `@base-ui/react` v1.7.0)** — built by the *same engineers who built Radix*, at MUI. It fixed Radix's gaps (native multi-select, combobox) ([GitHub releases](https://github.com/mui/base-ui/releases), [InfoQ](https://infoq.com/news/2026/02/baseui-v1-accessible/)).
2. **shadcn/ui made Base UI the default primitive in July 2026**, because "projects created on shadcn/create now pick Base UI over Radix 2 to 1" ([shadcn changelog](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)). Radix isn't dead — `shadcn init -b radix` still works — but this is where the ecosystem's center of gravity moved.

This matters for the user's framing ("shadcn is very basic"): shadcn was never really a *library*, it's a copy-paste generator over a primitives layer (Radix or now Base UI) plus your own Tailwind classes. What devs mean when they say a library feels "less basic" is usually **pre-designed, animated, opinionated components you don't have to style yourself** — which is exactly the gap HeroUI v3, Untitled UI React, Mantine, and Chakra v3 fill, each in different ways.

### Live data snapshot (pulled 2026-09-02, npm + GitHub APIs)

| Library | npm pkg | Latest | Last publish/push | GitHub ★ | Open issues | Weekly downloads |
|---|---|---|---|---|---|---|
| **HeroUI v3** | `@heroui/react` | 3.2.4 | 2026-08-07 / repo pushed 09-01 | 30,532 | 32 | 536,003 |
| Base UI | `@base-ui/react` | 1.7.0 | 2026-08-04 | 10,793 | 427 | 11,233,874* |
| Radix Themes | `@radix-ui/themes` | 3.3.0 | 2026-01-31 (quiet) | 8,660 | 162 | 1,013,893 |
| Ark UI | `@ark-ui/react` | current | pushed 09-01 | 5,369 | 8 | 1,053,374 |
| Mantine | `@mantine/core` | 9.6.0 | 2026-08-31 | 31,652 | 51 | 2,550,863 |
| Chakra UI v3 | `@chakra-ui/react` | 3.37.0 | 2026-08-28 | 40,613 | 14 | 1,802,333 |
| shadcn CLI | `shadcn` | — | pushed 09-02 | 122,771 | 2,056 | 8,747,025 |
| MUI (Material) | `@mui/material` | 9.4.0 | 2026-08-27 | 98,989 | 1,483 | 10,362,734 |
| Ant Design | `antd` | 6.6.2 | 2026-08-28 | 99,352 | 1,097 | 3,750,223 |
| Tremor | `@tremor/react` | 3.18.7 | **2025-01-13 (stale, 19mo)** | — | — | 387,918 |
| NextUI (legacy) | `@nextui-org/react` | frozen | superseded by HeroUI | — | — | 73,914 (declining) |
| Nuxt UI (Vue, context only) | `@nuxt/ui` | 4.11.0 | 2026-08-21 | 6,871 | — | — |
| Sailboat UI | `sailboatui` | — | 2026-02-24 (7mo quiet) | 1,348 | — | — |
| Untitled UI React | `untitleduico/react` (OSS repo) | — | pushed 08-31 | 1,896 | — | — |
| Once UI | `@once-ui-system/core` | 1.8.4 | 2026-08-28 | — | — | — |
| Magic UI (registry) | copy-paste, no single pkg | — | pushed 08-11 | 22,134 | — | — |
| Cult UI (registry) | copy-paste | — | pushed 07-22 | 6,087 | — | — |

\* Base UI's download count is inflated by being pulled transitively as the new shadcn default primitive — star count (10.8k) is a better read on organic adoption than the download figure.

### Per-library notes

- **HeroUI v3** (`@heroui/react`, formerly NextUI) — ground-up rewrite on **React Aria Components** + Tailwind v4, OKLCH color tokens, ~85 component sub-exports (accordion → typography), zero required Provider. It went from `3.0.0-beta.x` (breaking changes as late as beta.4→beta.5, per [release notes](https://heroui.com/en/docs/react/releases)) to GA at `3.0.0` and is now on `3.2.4`, a normal patch cadence (ComboBox multi-select, RTL, Table/Spinner fixes). **It is stable/GA today**, not beta — the "always use `@beta`" advice floating around dates from Q1 2026. Open issues are low (32) for its size, though a few real rough edges exist: dropdown/modal z-index stacking, ComboBox + `ListBox.Section` filtering, and a reported rendering-performance complaint (see [issue #6519](https://github.com/heroui-inc/heroui/issues/6519)). Verdict: young but the most actively iterated, best-designed-by-default library in the list — see recommendation below.
- **Base UI** (`@base-ui/react`) — unstyled/headless only, no default visual design. You get correctness (React Aria-grade a11y, native combobox/multi-select) but you draw every pixel yourself — this is what shadcn now sits on top of, not a competitor to HeroUI's "pre-styled" value prop.
- **Radix Themes** — the pre-styled layer on top of Radix Primitives; solid, but publish cadence has slowed (last real push Jan 2026) as the team's attention shifted to Base UI.
- **Ark UI / Park UI** — Ark (headless, state-machine driven, from the Chakra/Panda team) plus Park UI (the styled layer). Excellent a11y, smaller ecosystem, best if you already buy into Panda CSS; less natural fit for a Tailwind v4-first stack.
- **Mantine 9** — huge component surface (100+), best-in-class DataTable/DatePicker/RTE add-ons, but its own CSS-in-JS-esque styling system fights Tailwind v4 rather than composing with it (community Tailwind preset exists but it's a bolt-on, [GitHub discussion #7459](https://github.com/orgs/mantinedev/discussions/7459)). Great if Tailwind weren't a requirement.
- **Chakra UI v3** — rebuilt on Ark UI + a Panda-CSS-derived "recipes" engine; genuinely excellent, but again a parallel styling system, not Tailwind-native, and the migration from v2's `sx`-prop mental model is significant.
- **shadcn/ui + registries** — the baseline the user already called "basic." Origin UI (44 components, closest to shadcn's own look), Magic UI (150+ animated marketing components), Aceternity (3D/particle marketing effects), Kibo UI (Kanban/Gantt/AI-chat/code-editor blocks), Cult UI (35 playful, interaction-led components) — all are **copy-paste registries**, not maintained dependencies. Good for occasional flourishes, bad as your only design system because there's no shared token contract across registries.
- **Untitled UI React** — new in 2026, built on Tailwind v4 + React Aria, sourced from the industry's most-used Figma kit, so design and code stay in sync; base tier is MIT and huge (thousands of composed blocks), Pro unlocks dashboards/settings-page templates. Very strong option, but it is "components as source you own" (Figma-kit-driven), closer to a block library than an installed dependency with upgrade paths.
- **Catalyst (Tailwind Labs)** — official, paid, Headless-UI-powered kit from the Tailwind team; polished but static (no CLI codegen, you copy the source), and cost fits agency/enterprise builds more than a fast-moving startup.
- **Once UI** — small, opinionated, Once-UI-system driven design tokens; niche, not RSC/App-Router-first.
- **Tremor** — the best charts-as-components library for admin dashboards, but functionally abandoned (last publish Jan 2025) after Vercel acquired the team; do not build core UI on it, fine for one-off internal analytics screens only, and prefer plain Recharts/visx for anything load-bearing.
- **Ant Design 6** — mature, huge component set, excellent DataGrid, but its default visual language (dense, blue-corporate, non-Tailwind) actively fights a "vibrant, warm, consumer" brief and requires heavy overrides.
- **MUI v9** (Material UI moved v7→v9 in April 2026, skipping v8 to realign with MUI X, see [MUI blog](https://mui.com/blog/introducing-mui-v9/)) — best-in-class enterprise DataGrid/Charts/Date-Pickers (MUI X), but Material Design's visual identity is the opposite of "bright, friendly, Indian consumer app" and emotion/sx styling doesn't compose with Tailwind v4.
- **Nuxt UI 4.11** — Vue-only; useful only as a cross-reference for how a Tailwind v4-native design system organizes its theme layer (it's built by the Tailwind Labs-adjacent Nuxt team, same DNA as Catalyst/HeroUI's approach).
- **Sailboat UI** — free Tailwind (Flowbite-style) component snippets; healthy small project but 7 months without a push and only ~1.3k stars — not a serious long-term bet.
- **Kokonut UI** — visually polished, startup-friendly, shadcn-CLI-installable blocks; good supplemental source for landing-page flourish, not a system.

### Scored matrix (0–5, 5 = best)

| | Maint. health | A11y base | Tailwind v4 | RSC-friendly | Theming (CSS vars) | Component breadth | Forms | Table | Date picker | Combobox | Drawer | Cmd palette | Toast | Stepper |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **HeroUI v3** | 4 | 5 (React Aria) | 5 (built for it) | 4 | 5 (OKLCH, `data-theme`) | 4 (85 exports) | 5 | 3 (basic, sortable) | 4 | 4 | 5 | 2 (no native) | 5 | 2 (no native, compose w/ Progress) |
| Base UI (headless) | 4 | 5 | 4 (bring your own CSS) | 4 | N/A (unstyled) | 4 | 4 | 2 (primitives only) | 2 | 4 | 3 | 0 | 0 | 0 |
| shadcn/ui (+Base UI) | 5 (ecosystem) | 5 | 5 | 4 | 4 (you own it) | 5 (+ registries) | 4 | 3 | 3 | 4 | 4 | 5 (`cmdk`) | 4 | 2 |
| Untitled UI React | 4 (new) | 4 (React Aria) | 5 | 4 | 4 | 5 (blocks) | 4 | 3 | 3 | 3 | 4 | 2 | 3 | 3 |
| Mantine 9 | 5 | 4 (custom) | 2 (fights it) | 3 | 3 (own system) | 5 | 5 | 5 | 5 | 4 | 4 | 2 | 4 | 3 |
| Chakra v3 | 5 | 4 (Ark) | 2 (Panda-based) | 3 | 4 | 5 | 4 | 3 | 3 | 4 | 4 | 2 | 4 | 2 |
| Ant Design 6 | 5 | 3 | 1 | 3 | 3 | 5 | 5 | 5 | 5 | 4 | 4 | 2 | 4 | 4 |
| MUI v9 | 5 | 4 | 1 | 3 | 3 | 5 | 4 | 5 (MUI X) | 5 (MUI X) | 4 | 4 | 2 | 4 | 4 |
| Tremor | 1 (stale) | 3 | 3 | 3 | 3 | 2 | 2 | 3 | 2 | 1 | 1 | 0 | 2 | 0 |

### Recommendation for ApplyOnce: **HeroUI v3** (`@heroui/react` + `@heroui/styles`)

Justification, weighed against the project's actual constraints (bright/warm/friendly, App Router + React 19, Tailwind v4, "trustworthy but not corporate," Hindi-friendly, ponytail/simplest-solution rule):

1. **It's the only option that is Tailwind-v4-native *and* pre-designed.** Everything else forces a choice between "fights Tailwind" (Mantine/Chakra/AntD/MUI) and "gives you nothing but structure" (Base UI/Radix/shadcn-raw). HeroUI ships both the primitives and finished visual design in the same package your Tailwind config already speaks.
2. **Accessibility is inherited, not reinvented** — React Aria Components underneath means keyboard nav, focus management, and screen-reader semantics for free, which matters directly for the "older users / WCAG 2.2 AA" requirement in Part D.
3. **Token model matches the "verified vs self-declared" and consent-screen needs out of the box**: real CSS variables (`--accent`, `--success`, `--warning`, `--danger`, `--surface`, `--field-*`) map cleanly onto trust badges (verified=success token, self-declared=warning/muted token) without inventing a new palette.
4. **It is GA, not beta**, contra the stale advice about `@beta` tags — 3.2.4 is a normal patch release with an active, low-noise issue tracker.
5. **Honest caveat**: it's younger than Mantine/AntD/MUI, has no native DataGrid, command palette, or stepper — for ApplyOnce's admin/partner surfaces (Domain: partners, applications) plan to pair it with `cmdk` for a command palette and build a Stepper by composing `Progress`/`Tabs`, and if a genuinely complex data grid is ever needed, drop to TanStack Table headless + HeroUI's `Table` primitives for the chrome. This is a one-line justification for the only "new dependency": `cmdk` for command palette (HeroUI has no equivalent).

---

## Part B — HeroUI v3 integration notes (verified against the published npm packages, 2026-09-02)

### Packages & install

```bash
npm i @heroui/styles @heroui/react
# pnpm add @heroui/styles @heroui/react
# yarn add @heroui/styles @heroui/react
# bun add @heroui/styles @heroui/react
```

Requirements: **React 19+, Tailwind CSS v4, Node ≥22.x**. `react-aria-components` and `@react-aria/*` are peer dependencies as of 3.2.x (installed automatically by npm/pnpm's peer resolution).

Optional CLI (`heroui-cli@3.0.4` on npm) mirrors the shadcn workflow for scaffolding/adding components if you want copy-in-source instead of the npm package.

### Tailwind v4 CSS setup

In your global stylesheet (e.g. `app/globals.css`):

```css
@import "tailwindcss";
@import "@heroui/styles";
```

Import order matters — `tailwindcss` first. No `@plugin` or `tailwind.config.js` step is required; `@heroui/styles` is itself Tailwind v4 CSS (`@theme inline` blocks + `@layer theme, base, components, utilities`), so it composes natively with `@source` globs you already have for your own app code — add one only if HeroUI class names live outside your default content scan (rare, since you import components from `node_modules` which Tailwind v4 already scans via package exports).

### Provider

**No provider is required.** HeroUI v3 explicitly dropped the old NextUI-style context provider — components work standalone. (An optional `HeroUIProvider` still exists for advanced cases like custom client-side routing integration; skip it unless you need router-aware `Link`/navigation behavior.)

### Theming — real CSS variable names (pulled from the published `@heroui/styles@3.2.4` package source)

Base tokens (defined once, referenced everywhere):
```css
:root, .light, [data-theme="light"] {
  --background: oklch(0.9702 0 0);
  --foreground: var(--eclipse);
  --surface: var(--white);              --surface-foreground: var(--foreground);
  --accent: oklch(0.6204 0.195 253.83); --accent-foreground: var(--snow);
  --success: oklch(0.7329 0.1935 150.81);
  --warning: oklch(0.7819 0.1585 72.33);
  --danger:  oklch(0.6532 0.2328 25.74);
  --default: oklch(94% 0.001 286.375);  --default-foreground: var(--eclipse);
  --field-background: var(--white);     --field-border: transparent;
  --border: oklch(90% 0.004 286.32);    --radius: 0.5rem;
}
```

These map into Tailwind's `@theme inline` layer as `--color-accent`, `--color-success`, `--color-surface`, `--radius-field`, etc. — i.e. `bg-accent`, `text-accent-foreground`, `bg-success-soft`, `rounded-field` all work as ordinary Tailwind utility classes.

**Dark mode**: toggle by adding the `.dark` class or `[data-theme="dark"]` attribute to `<html>`/`<body>` — every token above gets redefined under that selector (e.g. `--background: oklch(12% 0.005 285.823)`, `--surface: oklch(0.2103 0.0059 285.89)`). Standard Next.js pattern:
```tsx
<html lang="en" data-theme={theme /* "light" | "dark" */}>
```
There's also an opt-in `[data-vibrant-palette="true"]` attribute that boosts saturation on "soft" foreground tones (`--accent-soft-foreground`, etc.) — worth turning on given ApplyOnce's "vibrant, bright" brief.

**To customize brand colors**: override the CSS variables in your own stylesheet after the `@heroui/styles` import (e.g. redefine `--accent` to your orange/saffron brand token) — no theme-object/JS config needed, it's just CSS custom properties.

### Component inventory (85 importable modules in `@heroui/react@3.2.4`)

Forms/fields: `accordion, alert, alert-dialog, autocomplete, avatar, badge, breadcrumbs, button, button-group, calendar, calendar-year-picker, card, checkbox, checkbox-group, chip, close-button, color-area, color-field, color-input-group, color-picker, color-slider, color-swatch, color-swatch-picker, combo-box, date-field, date-input-group, date-picker, date-range-picker, description, disclosure, disclosure-group, drawer, dropdown, empty-state, error-message, field-error, fieldset, form, header, input, input-group, input-otp, kbd, label, link, list-box, list-box-item, list-box-section, menu, menu-item, menu-section, meter, modal, number-field, pagination, popover, progress-bar, progress-circle, radio, radio-group, range-calendar, scroll-shadow, search-field, select, separator, skeleton, slider, spinner, surface, switch, switch-group, table, tabs, tag, tag-group, textarea, textfield, time-field, toast, toggle-button, toggle-button-group, toolbar, tooltip, typography`, plus a raw `rac` (React Aria Components) escape hatch for anything not yet wrapped.

Gaps to plan around: **no native command palette, stepper, or bottom-sheet-specific component** (use `Drawer` with `placement` for sheets — see snippet below); no built-in advanced DataGrid (sorting/selection/resize exist per docs, virtualization/infinite scroll needs `Table` + TanStack Table headless underneath for large lists).

### Code snippets (verbatim from official docs, [heroui.com/docs/react/components](https://heroui.com/docs/react/components/button))

**1. Button (variants/sizes)**
```tsx
import {Button} from "@heroui/react";

<div className="flex gap-3">
  <Button>Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="danger">Danger</Button>
</div>
<div className="flex items-center gap-3">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</div>
```

**2. TextField (label + description + error)**
```tsx
import {TextField, Label, Input, Description, FieldError} from "@heroui/react";

<TextField isInvalid className="w-full max-w-64" name="email" type="email">
  <Label>Email</Label>
  <Input placeholder="user@example.com" />
  <Description>We'll send your OTP here.</Description>
  <FieldError>Please enter a valid email address</FieldError>
</TextField>
```
(`Description` auto-hides when `isInvalid` is true, so `FieldError` takes over the slot.)

**3. Select / ComboBox**
```tsx
import {Label, ListBox, Select, ComboBox, Input} from "@heroui/react";

// Select — closed set of options
<Select className="w-64" placeholder="Select one">
  <Label>State</Label>
  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
  <Select.Popover>
    <ListBox>
      <ListBox.Item id="mh" textValue="Maharashtra">Maharashtra<ListBox.ItemIndicator /></ListBox.Item>
    </ListBox>
  </Select.Popover>
</Select>

// ComboBox — filterable/searchable
<ComboBox className="w-64">
  <Label>Bank</Label>
  <ComboBox.InputGroup><Input placeholder="Search bank..." /><ComboBox.Trigger /></ComboBox.InputGroup>
  <ComboBox.Popover>
    <ListBox><ListBox.Item id="hdfc" textValue="HDFC Bank">HDFC Bank<ListBox.ItemIndicator /></ListBox.Item></ListBox>
  </ComboBox.Popover>
</ComboBox>
```

**4. Modal / Drawer (bottom sheet via `placement`)**
```tsx
import {Button, Modal, Drawer} from "@heroui/react";

<Modal>
  <Button variant="secondary">Open Modal</Button>
  <Modal.Backdrop>
    <Modal.Container>
      <Modal.Dialog className="sm:max-w-[360px]">
        <Modal.CloseTrigger />
        <Modal.Header><Modal.Heading>Confirm consent</Modal.Heading></Modal.Header>
        <Modal.Body><p>Share your PAN-verified name with this employer?</p></Modal.Body>
        <Modal.Footer><Button className="w-full" slot="close">Continue</Button></Modal.Footer>
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>

// Drawer with placement="bottom" = PWA bottom sheet
<Drawer>
  <Button variant="secondary">Open Drawer</Button>
  <Drawer.Backdrop>
    <Drawer.Content placement="bottom">
      <Drawer.Dialog>
        <Drawer.Header><Drawer.Heading>Choose profile</Drawer.Heading></Drawer.Header>
        <Drawer.Body>…</Drawer.Body>
      </Drawer.Dialog>
    </Drawer.Content>
  </Drawer.Backdrop>
</Drawer>
```

**5. Tabs**
```tsx
import {Tabs} from "@heroui/react";

<Tabs className="w-full max-w-md">
  <Tabs.ListContainer>
    <Tabs.List aria-label="Profile sections">
      <Tabs.Tab id="documents">Documents<Tabs.Indicator /></Tabs.Tab>
      <Tabs.Tab id="applications">Applications<Tabs.Indicator /></Tabs.Tab>
    </Tabs.List>
  </Tabs.ListContainer>
  <Tabs.Panel id="documents">…</Tabs.Panel>
</Tabs>
```

**6. Chip / Badge**
```tsx
import {Chip} from "@heroui/react";

<div className="flex flex-wrap gap-3">
  <Chip color="success">Verified</Chip>
  <Chip color="warning">Self-declared</Chip>
  <Chip color="danger">Expired</Chip>
</div>
```

**7. Table**
```tsx
import {Table} from "@heroui/react";

<Table>
  <Table.ScrollContainer>
    <Table.Content aria-label="Documents" className="min-w-[600px]">
      <Table.Header>
        <Table.Column isRowHeader>Document</Table.Column>
        <Table.Column>Status</Table.Column>
      </Table.Header>
      <Table.Body>
        <Table.Row><Table.Cell>Aadhaar</Table.Cell><Table.Cell>Verified</Table.Cell></Table.Row>
      </Table.Body>
    </Table.Content>
  </Table.ScrollContainer>
</Table>
```

**8. Toast**
```tsx
import {Button, toast} from "@heroui/react";

<Button onPress={() => toast("Consent recorded", {
  description: "This share is logged with a consent_id.",
  variant: "success",
})}>
  Confirm
</Button>
```

---

## Part C — Design references (12 best-in-class, bright-but-trustworthy)

1. **Linear** — near-perfect type/spacing rhythm at small sizes, near-monochrome UI with a single saturated accent used sparingly, sub-150ms motion on everything. Borrow: restraint — one accent color doing all the "vibrant" work, not five.
2. **Stripe Dashboard** — dense financial data stays legible via strict 8px grid, tabular figures (`font-variant-numeric: tabular-nums`), and color used only for state (green=success, never decoration). Borrow: numeric tables that don't jitter, muted neutrals + one alert color.
3. **Notion** — best-in-class empty states (one-line description + one primary action, never a wall of text) and friendly line-art illustrations that don't infantilize. Borrow: empty-state formula for ApplyOnce's "no documents yet" / "no applications yet" screens.
4. **CRED** — proof that "vibrant Indian fintech" doesn't have to feel cheap: dark-canvas-plus-neon-accent, big confident typography, reward-forward micro-copy. Borrow: confidence in typographic scale and generous whitespace even in a "serious" (credit-score) product.
5. **Zerodha Kite/Coin** — data-dense, zero-frills, and *still* feels trustworthy because information hierarchy is airtight (numbers right-aligned, labels muted, no gradients near real money). Borrow: for ApplyOnce's document/application list, prioritize scan-ability over decoration.
6. **Groww** — soft pastel palette, rounded cards, big friendly illustrations for onboarding, yet KYC/consent screens go flat and serious the moment money/identity is involved. Borrow: the palette *shift* rule — playful for discovery, sober for anything touching consent or verification.
7. **Jupiter** — onboarding as a single continuous scroll with progress always visible at the top, plain-language copy ("Add money" not "Initiate fund transfer"). Borrow: progress-visible onboarding, Hindi-friendly plain copy tone.
8. **Fi Money** — illustrated verified-badge system (little colored dots/icons next to synced accounts) that reads instantly without needing a legend. Borrow: iconography for verified vs pending vs failed sync states.
9. **Singpass / MyInfo (Singapore)** — the closest real-world analog to ApplyOnce's core flow: a single consent screen listing *exactly* which fields (name, NRIC, address) an app is requesting, each with a "why" tooltip, and a hard Allow/Deny with no dark patterns. Borrow directly: field-by-field consent listing + purpose string per field.
10. **EU Digital Identity Wallet (EUDI)** — pioneering the "verifiable credential card" visual metaphor: each credential (ID, diploma, license) renders as a physical-card-like component with an issuer logo, a tamper-evident visual seal, and expiry countdown. Borrow: the credential-as-card metaphor for ApplyOnce's document vault.
11. **GOV.UK Design System** — the accessibility gold standard: one typeface (GDS Transport-alike, but Google-Fonts-safe equivalents work fine), an error-summary pattern at the top of every form linking down to each field, and a strict black/white/one-accent palette so error red (`#d4351c`) always reads as urgent. Borrow: the error-summary-at-top pattern for every multi-field ApplyOnce form ([design-system.service.gov.uk](https://design-system.service.gov.uk/)).
12. **DigiLocker (new UI)** — India's own precedent: document tiles show an issuer badge + "e-signed" trust mark directly on the thumbnail, and a persistent "Issued documents" vs "Uploaded documents" split so self-declared never visually mixes with government-verified. Borrow this split directly for ApplyOnce's `documents` domain.

**Honorable mentions** (borrow narrowly, don't clone): **Cal.com** — for booking-flow-style step transitions and dark-mode parity; **Raycast** — for command-palette (`⌘K`) interaction quality and keyboard-first micro-copy; **Vercel dashboard** — for monochrome-plus-one-accent restraint at scale; **Arc browser** — for playful onboarding motion that never blocks usage; **Australia myGov** and **ID.me** — both good "what not to do" references (dense, low-contrast, jargon-heavy) that justify keeping ApplyOnce's copy short and its layout airy.

### Font pairings (EN + Devanagari)

| Latin (headings/UI) | Google Fonts? | Devanagari partner | Google Fonts? | Notes |
|---|---|---|---|---|
| **Geist** | Yes (also via Vercel's own font package) | **Noto Sans Devanagari** | Yes | Safest, most neutral pairing; both variable fonts. |
| **Inter** | Yes | **Hind** | Yes | Hind was designed as an Inter-era Devanagari companion — excellent x-height match. |
| **Manrope** | Yes | **Mukta** | Yes | Both geometric-humanist, similar warmth; Mukta reads well at small sizes on mobile. |
| **Plus Jakarta Sans** | Yes | **Baloo 2** | Yes | Baloo 2 is rounder/friendlier — good for a "warm, consumer" brand voice; pair for display/headline sizes only, not body. |
| **Bricolage Grotesque** | Yes | **Tiro Devanagari Hindi** | Yes | More editorial/characterful; use sparingly (marketing/landing only), not form UI. |

Important correction: **Poppins does not natively support Devanagari** on Google Fonts (Latin/Latin-ext/Vietnamese only) — a common mistaken assumption; don't rely on Poppins for any Hindi string. Recommended default for ApplyOnce: **Geist + Noto Sans Devanagari**, loaded via `next/font/google`:

```tsx
import { Geist } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari" });
```
Then in CSS: `font-family: var(--font-sans), var(--font-devanagari), system-ui, sans-serif;` — the browser will fall through to the Devanagari face automatically for Hindi glyphs in mixed-script strings.

---

## Part D — Product-specific patterns (concrete rules)

**Verified vs self-declared trust badges**
- Two-state system only, never a third "maybe": `success` token (green/teal) = verified by a source-of-truth provider with a `SourceChip`; `warning`/muted token (amber or gray) = self-declared, no chip beyond "as entered by user."
- Every verified value gets a small locked-padlock or checkmark icon *inline next to the value*, not just in a legend — Fi Money and DigiLocker both prove inline icons outperform color-only signaling for accessibility (color-blind users, low-vision users).
- Self-declared fields always carry visible edit affordance; verified fields are read-only with a "why can't I edit this" tooltip explaining it came from a verified source.
- Never let a self-declared value visually outrank (larger/bolder) a verified one — verified data should read as *more* authoritative, not less.

**Consent screens**
- List fields being shared **one row per field**, not a paragraph — Singpass/MyInfo pattern. Each row: field name, current value (or masked value), a one-line "why" (purpose string), and its own could-be-excluded toggle if the field is optional.
- State the requesting party's verified identity prominently at the top (logo + verified badge), matching Google/Apple OAuth consent conventions — never bury who's asking.
- Show validity/duration explicitly ("This access is valid for 24 hours" or "until you revoke it") — required in India's Account Aggregator consent-artefact spec (FIU, purpose, data types, frequency, consent life) and good practice generally.
- Every consent action must produce and display a `consent_id` reference the user can look up later — this is already a stated ApplyOnce invariant; surface it in the confirmation toast/receipt, not just the database.
- Two buttons only: primary "Allow"/"Share" and a clearly-visible secondary "Deny"/"Cancel" — never gray out or visually de-emphasize the deny path (Plaid Link and Apple Sign-In both keep decline fully legible, avoiding the dark-pattern of a ghost/disabled-looking cancel button).

**Autofill animations**
- Sequential field highlight (not all-at-once): a soft accent-colored glow sweeps field-by-field in reading order as data populates from a verified document, ~80–120ms stagger between fields, using the `--accent-soft` token as the highlight background, fading over ~400ms per field. See Part E for exact Motion implementation.
- Never autofill and immediately hide the source — flash a tiny "from Aadhaar" ghost label under each autofilled field for ~2s so users trust *why* it populated.

**Document upload / OCR review UI**
- Three-state upload card: uploading (progress ring) → processing/OCR (pulsing skeleton over extracted-field placeholders) → review (extracted fields shown editable, each with a confidence-flagged border: default border = high confidence, warning-token border = low confidence/please verify).
- Always show the source image thumbnail alongside extracted fields during review, side-by-side on desktop / stacked with a swipe-to-compare on mobile, so users can verify OCR against the original without leaving the screen.
- Low-confidence OCR fields should be pre-focused (auto-scrolled to, cursor placed) so the user's first action is confirming/correcting the riskiest field, not the easiest one.

**Progress / completion rings**
- Use `Progress` (circular) for profile-completion and document-checklist completion — pair the ring with a plain-language count ("6 of 8 documents ready") never a bare percentage alone; percentages without context are the #1 complaint in usability studies with older/less tech-literate users.
- Ring color should track semantic state: `default`/muted while <50%, `accent` 50–99%, `success` at 100% — celebratory micro-animation (brief scale+color pulse) on reaching 100%.

**Multi-profile switcher (family)**
- Persistent avatar-stack switcher in the header (not buried in a menu) — tapping opens a bottom `Drawer` (mobile) or `Popover` (desktop) listing each family member with their own completion ring and a "+ Add family member" action pinned at the bottom.
- Switching profiles must be an explicit, confirmed action with a full-screen transition (never silent) since a wrong-profile submission (e.g., filing someone else's application) is high-stakes — briefly show a "Now viewing: <name>" banner for 2–3s after switch.

**Bottom tab bars for PWAs**
- 4–5 items max, each ≥ the WCAG 2.2 **24×24 CSS px minimum target size** (§2.5.8, AA) — in practice use 48×48px tap targets with 24×24 visual icon inside, generous enough for older users and gloved/shaky-hand use ([W3C WCAG 2.2 Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- Respect `env(safe-area-inset-bottom)` for iOS home-indicator clearance; keep the active tab's icon+label both accent-colored (never icon-only color change) since color-only state changes fail for color-blind users.

**Accessibility for older users (WCAG 2.2 AA)**
- Body text minimum 16px (never below), line-height ≥1.5, and support OS-level text-scaling up to 200% without horizontal scroll or clipped content.
- All interactive targets ≥24×24 CSS px per 2.5.8; prefer 44×44px as the practical default for primary actions.
- Never rely on placeholder text as the only label (fails when a field is filled or for screen readers) — every HeroUI `TextField` should always pair `Input` with a visible `Label`, not just `placeholder`.
- Hindi/Devanagari text needs slightly larger line-height (Devanagari glyphs have taller ascenders/descenders than Latin) — bump `line-height` to 1.6–1.7 for any mixed-script or Devanagari-only paragraph.
- Error messages must be specific and instructive ("Aadhaar number must be 12 digits" not "Invalid input"), announced via `aria-live` (HeroUI's `FieldError` handles this), and listed in a GOV.UK-style error summary at the top of long forms.

---

## Part E — Motion (the `motion` package, v13, React 19)

Install:
```bash
npm install motion
```
Import (note the sub-path, not a bare package import):
```tsx
import { motion, AnimatePresence, useReducedMotion, stagger } from "motion/react";
```

Key APIs:
- **`motion.div` / `motion.button` / any tag** — drop-in animatable version of any HTML/SVG element: `<motion.div initial={{opacity:0}} animate={{opacity:1}} />`.
- **`AnimatePresence`** — enables *exit* animations for components leaving the tree (essential for toasts, modal close, list-item removal):
  ```tsx
  <AnimatePresence>
    {show && <motion.div key="card" exit={{ opacity: 0, y: -8 }} />}
  </AnimatePresence>
  ```
- **`layout` prop** — automatic FLIP-style transitions when an element's size/position changes (great for the completion-ring or accordion expand in ApplyOnce's document checklist): `<motion.div layout />`.
- **`useReducedMotion()`** — returns `true` when the OS has "reduce motion" set; gate every non-essential animation (the autofill sweep, drawer slide distance, etc.) behind it — required for the WCAG 2.2/older-user accessibility rules in Part D. It's a ~1kb standalone import, so it's cheap even if you use nothing else from the library.
- **`stagger()`** — used inside a variants `transition` to space out children:
  ```tsx
  const list = {
    visible: { opacity: 1, transition: { when: "beforeChildren", delayChildren: stagger(0.08) } },
    hidden:  { opacity: 0, transition: { when: "afterChildren" } },
  };
  ```

### Sequential field-autofill highlight — concrete implementation

Goal (from Part D): as a document's extracted fields populate a form, each field should highlight in reading order with a soft accent glow, respecting reduced-motion.

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

const fieldVariants = {
  idle: { backgroundColor: "var(--surface)" },
  fill: (i: number) => ({
    backgroundColor: ["var(--accent-soft)", "var(--surface)"],
    transition: { delay: i * 0.09, duration: 0.5, ease: "easeOut" },
  }),
};

function AutofillField({ index, label, value }: { index: number; label: string; value: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="rounded-field p-3"
      custom={index}
      initial="idle"
      animate="fill"
      variants={reduce ? undefined : fieldVariants} // skip the sweep entirely if reduced motion is on
    >
      <label className="text-sm text-foreground/70">{label}</label>
      <p className="font-medium">{value}</p>
    </motion.div>
  );
}
```
Render fields in an array and pass their array `index` as `custom` — each field's highlight fires `index * 90ms` after the previous one, self-orchestrating the "sweep" without a manual `setTimeout` chain. When `useReducedMotion()` is true, `variants` is omitted entirely so fields simply populate with no animation, satisfying the accessibility rule from Part D without a separate code path for the visual result (labels/values still render immediately either way).

---

### Sources consulted
[HeroUI releases](https://heroui.com/en/docs/react/releases) · [HeroUI v3 rewrite (InfoQ)](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/) · [heroui-inc/heroui GitHub](https://github.com/heroui-inc/heroui) · [shadcn Base UI default changelog](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default) · [mui/base-ui GitHub](https://github.com/mui/base-ui) · [Base UI v1 stable (InfoQ)](https://infoq.com/news/2026/02/baseui-v1-accessible/) · [Mantine + Tailwind v4 discussion](https://github.com/orgs/mantinedev/discussions/7459) · [Chakra UI v3 announcement](https://chakra-ui.com/blog/announcing-v3) · [Ark UI / Panda / Chakra plan](https://www.adebayosegun.com/blog/chakra-panda-and-ark-whats-the-plan) · [Untitled UI React](https://www.untitledui.com/react) · [Untitled UI React comparison post](https://www.untitledui.com/blog/react-component-libraries) · [MUI v9 announcement](https://mui.com/blog/introducing-mui-v9/) · [npm registry API](https://registry.npmjs.org/) and [npm downloads API](https://api.npmjs.org/downloads/) (live pulls) · [GitHub REST API](https://api.github.com/) (live pulls for stars/issues/push dates) · [Motion for React docs](https://motion.dev/docs/react-quick-start) · [WCAG 2.2 SC 2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [GOV.UK Design System](https://design-system.service.gov.uk/) · [Plaid Link docs](https://plaid.com/docs/link/) · [Google Fonts](https://fonts.google.com/).

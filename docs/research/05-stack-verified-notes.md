# Stack Verified Notes (2026-09-02)

Verified against official docs/GitHub as of today via ~220 live fetches (Next.js, Tailwind, HeroUI, Drizzle, better-auth, SimpleWebAuthn, BullMQ, jose, zod, turbo/pnpm, motion, TanStack Query, vitest/Playwright, Chrome MV3, RHF, pino, Sentry). Where a doc page could not be verified verbatim (rare — flagged inline), treat as needs-recheck, not fact.

---

## 1. Next.js 16.3.x (App Router, React 19.2, Node 22)

**Install:** `npx create-next-app@latest --typescript --eslint --app` (min Node 20.9.0; Node 22 fully supported).

**`middleware.ts` is dead — renamed to `proxy.ts`.** Deprecated in 16, codemod: `npx @next/codemod@canary middleware-to-proxy .`. Proxy runs on the **Node.js runtime by default** (not Edge), and rejecting a `runtime` export in that file throws.

```ts
// proxy.ts (root or src/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}
export const config = { matcher: '/about/:path*' }
```

**Everything async now:** `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are all Promise-based; sync access is removed (not just deprecated).

```ts
// route handler
export async function GET(request: Request, { params }: { params: Promise<{ team: string }> }) {
  const { team } = await params
}
```

**`next.config.ts`:** Turbopack is the default bundler for dev and build (`next dev --webpack` to opt out). `experimental.turbopack` moved to top-level `turbopack`. `serverExternalPackages` (stable, renamed from `serverComponentsExternalPackages`) opts a dep out of RSC bundling to use native `require`. `transpilePackages` compiles raw TS/JSX from a dep — but Turbopack **auto-transpiles monorepo workspace packages**, so you usually only need `transpilePackages` for `node_modules` deps shipping untranspiled syntax.

```ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  serverExternalPackages: ['@acme/heavy-native-dep'],
  transpilePackages: ['some-raw-ts-npm-pkg'],
  turbopack: { resolveAlias: { underscore: 'lodash' } },
}
export default nextConfig
```

**Cache Components / `use cache`:** opt-in via `cacheComponents: true` (renamed from `experimental.dynamicIO`; `experimental.ppr` was removed entirely — Cache Components subsumes PPR).

```ts
// next.config.ts
const nextConfig: NextConfig = { cacheComponents: true }
```
```tsx
import { cacheLife, cacheTag, updateTag } from 'next/cache'

async function getOrderSummary(id: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(`order-${id}`)
  return (await fetch(`https://api/orders/${id}`)).json()
}
// in a Server Action, after a write:
'use server'
export async function updateOrder(id: string) { /* ...write... */ ; updateTag(`order-${id}`) }
```

**Fonts** (underscore replaces spaces in multi-word names):
```tsx
import { Inter, Bricolage_Grotesque, Noto_Sans_Devanagari, JetBrains_Mono } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', variable: '--font-bricolage' })
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], display: 'swap', variable: '--font-noto-devanagari' })
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' })
```
Apply in `<html className={`${inter.variable} ${bricolage.variable} ${devanagari.variable} ${mono.variable}`}>`, then map with `@theme inline { --font-sans: var(--font-inter); }` in CSS.

**Server Actions:**
```tsx
'use server'
export async function createPost(formData: FormData) { /* mutate + revalidate */ }
```
```tsx
'use client'
import { useActionState, startTransition } from 'react'
const [state, action, pending] = useActionState(createPost, false)
<button onClick={() => startTransition(action)}>{pending ? 'Saving…' : 'Create'}</button>
```

**SSE from a route handler:**
```ts
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ hello: true })}\n\n`))
      await new Promise((r) => setTimeout(r, 1000))
      controller.enqueue(encoder.encode('data: {"done":true}\n\n'))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
```

**`instrumentation.ts`:**
```ts
export function register() { /* runs once per server instance, can be async */ }
export const onRequestError: import('next').Instrumentation.onRequestError = async (err, request, context) => {
  await fetch('https://errors.internal/report', { method: 'POST', body: JSON.stringify({ err, request, context }) })
}
```

**Breaking vs 15:** sync `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` removed; `middleware.ts`→`proxy.ts`; `experimental.ppr`/`dynamicIO` renamed to `cacheComponents`; `next lint` removed (use ESLint/Biome directly); min Node 20.9, min TS 5.1.

---

## 2. Tailwind CSS 4.3

**Install (Next.js):**
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```
```js
// postcss.config.mjs
const config = { plugins: { "@tailwindcss/postcss": {} } }
export default config
```
```css
/* app/globals.css */
@import "tailwindcss";
```

**CSS-first config** — `@theme` defines design tokens as real custom properties:
```css
@import "tailwindcss";
@theme {
  --color-mint-500: oklch(0.72 0.11 178);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
}
@theme inline { --font-sans: var(--font-inter); } /* bridge next/font vars */
```

**`@source`** controls the class scanner (critical for monorepos):
```css
@import "tailwindcss" source("../src");
@source "../../../packages/ui/src";
@source not "../src/legacy";
```

**`@plugin`** loads a JS plugin from CSS: `@plugin "@tailwindcss/typography";`
**`@custom-variant`** defines a variant: `@custom-variant theme-midnight (&:where([data-theme="midnight"] *));`

**Shared preset from a monorepo package** (no official single example — composed from documented directives):
```css
/* apps/web/app/globals.css */
@import "tailwindcss";
@import "../../../packages/ui/tailwind-preset.css"; /* holds @theme block */
@source "../../../packages/ui/src";
```

**v4.3.0 additions:** `@container-size`, `scrollbar-{auto,thin,none}` + `scrollbar-thumb-*`/`scrollbar-track-*`, stacked/compound `@variant` (`@variant hover:focus`, `@variant hover, focus`), `zoom-*`, `tab-*`, `scrollbar-gutter-*`. v4.3.x line spans 2026-05-08 (4.3.0) to 2026-07-16 (4.3.3).

**Breaking vs v3:** min browsers Safari 16.4+/Chrome 111+/Firefox 128+; `bg-opacity-*`/`flex-shrink-*` removed; `shadow-sm`→`shadow-xs`, `ring`→`ring-3`; default border color `currentColor` (was `gray-200`); important modifier `flex!` (was `!flex`); `corePlugins` removed; JS config no longer auto-loaded (`@config "../tailwind.config.js";` if still needed). Migrate: `npx @tailwindcss/upgrade`.

---

## 3. HeroUI 3.2.x

Docs root is **`heroui.com/docs/react/...`** (no `www`, no `/guide/` — those 404). v3 is a ground-up rewrite (React Aria Components, not v2/NextUI's plugin-based system).

**Install:** `pnpm add @heroui/styles @heroui/react` (requires React 19+, Tailwind v4). Tree-shakeable per-component packages (`@heroui/button`) also exist.

```css
@import "tailwindcss";
@import "@heroui/styles"; /* order matters: tailwindcss first */
```

**No provider needed** — v3 explicitly removes `HeroUIProvider`. Theming is plain CSS variables in OKLCH, overridden under `:root` (no JS theme config); if only using HeroUI, `tailwind.config.js` can be deleted entirely.

```css
:root { --accent: oklch(0.6204 0.195 253.83); --accent-foreground: oklch(0.9911 0 0); }
```

**Components** (all from `@heroui/react`): Button, Input (primitive) + `TextField` (the Label/Input/Description/FieldError compound pattern you want), Modal, Drawer (not "Sheet"), Select, `ComboBox` (slug `combo-box`), Table, Tabs, Toast, Tooltip, Chip, Avatar, `ProgressBar`/`ProgressCircle`, Skeleton, Breadcrumbs, Card. Removed vs v2: Code, Image, Navbar, Ripple, Snippet, Spacer, User.

```tsx
import { TextField, Label, Input, Description, FieldError } from '@heroui/react'
<TextField name="email" type="email">
  <Label>Email</Label>
  <Input placeholder="Enter your email" />
  <Description>We'll never share this</Description>
  <FieldError>Please enter a valid email</FieldError>
</TextField>
```

**Button** `variant`: `primary|secondary|tertiary|outline|ghost|danger|danger-soft` (default `primary`); `size`: `sm|md|lg`. **Select** `variant`: `primary|secondary` (no documented `size`); `selectionMode: single|multiple`. **Modal** is compound: `Modal`, `Modal.Backdrop` (`variant: opaque|blur|transparent`), `Modal.Container` (`placement`, `size: xs|sm|md|lg|cover|full`), `Modal.Dialog`, `Modal.Header/Heading/Body/Footer/CloseTrigger`.

```tsx
"use client"
import { Button, Modal } from "@heroui/react"
<Modal>
  <Button variant="secondary">Open</Button>
  <Modal.Backdrop><Modal.Container><Modal.Dialog>
    <Modal.Header><Modal.Heading>Welcome</Modal.Heading></Modal.Header>
    <Modal.Body><p>Hello</p></Modal.Body>
    <Modal.Footer><Button slot="close">Continue</Button></Modal.Footer>
  </Modal.Dialog></Modal.Container></Modal.Backdrop>
</Modal>
```

**RSC:** no official statement; static examples omit `"use client"`, every stateful example includes it — treat as normal React 19 client-boundary rules, not a blanket client-only mandate.

**Breaking vs v2/NextUI:** Framer Motion removed (native CSS transitions); `heroui()` Tailwind plugin + `hero.ts` gone; per-component hooks (`useSwitch`, `useInput`…) removed for compound components; `useDisclosure`→`useOverlayState` (`onOpen`→`open`, `onClose`→`close`); `useDraggable`/`useClipboard`/`usePagination`/`useToast` removed with no direct replacement; collection items now need explicit `id`/`textValue`, not just React `key`.

---

## 4. Drizzle ORM 0.45 + drizzle-kit 0.31

**Install:** `npm i drizzle-orm postgres && npm i -D drizzle-kit`

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit"
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true, verbose: true,
})
```

**Schema — uuid, jsonb, enum, custom bytea, composite unique/index/check:**
```ts
import { sql } from "drizzle-orm"
import { pgTable, uuid, jsonb, timestamp, pgEnum, text, integer, serial, customType, unique, index, check } from "drizzle-orm/pg-core"

export const moodEnum = pgEnum('mood', ['sad', 'ok', 'happy'])
const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() { return 'bytea' },
  toDriver: (v: Buffer) => '\\x' + v.toString('hex'),
  fromDriver: (v: string) => Buffer.from(v.slice(2), 'hex'),
})

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  name: text(), email: text(), age: integer(),
  mood: moodEnum(),
  profile: jsonb().$type<{ bio: string }>(),
  avatar: bytea('avatar'),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).defaultNow(),
}, (t) => [
  unique('users_id_name').on(t.id, t.name),
  index('users_name_idx').on(t.name),
  check('age_check', sql`${t.age} > 21`),
])
```

**Relations v2** (`defineRelations`, replaces per-table `relations()`; needed for correct nested/self-referential SQL):
```ts
import { defineRelations } from 'drizzle-orm'
export const dbRelations = defineRelations({ users, posts }, (r) => ({
  posts: { author: r.one.users({ from: r.posts.authorId, to: r.users.id }) },
  users: { posts: r.many.posts() },
}))
```

**CLI:** `generate` (diff schema → versioned SQL files, use in CI/team workflows) vs `push` (diff schema → apply directly, use for local prototyping) vs `migrate` (apply generated files, tracks history table). Also `pull` (introspect), `studio`, `check`.

**Connection + transaction:**
```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
const db = drizzle({ client: postgres(process.env.DATABASE_URL!) })

await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(accounts.id, a))
  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100` }).where(eq(accounts.id, b))
})
```

**`sql` tagged template:** `sql`select * from ${usersTable} where ${usersTable.id} = ${id}`` (parameterized); `.mapWith(Number)` for typed aggregates.

**Seeding:** `npm i drizzle-seed` → `await seed(db, { users }, { count: 1000, seed: 12345 })`.

---

## 5. better-auth 1.7

**Install + server:**
```bash
npm install better-auth @better-auth/drizzle-adapter
```
```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "./database"
import * as schema from "./schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  session: { additionalFields: { steppedUpAt: { type: "date", required: false, input: false } } },
  plugins: [/* phoneNumber(), organization() — see below */],
})
```
Tables needed: **user, session, account, verification** (core) + **passkey** (passkey plugin). Exact column lists render via a client component on the docs site and could not be scraped verbatim — generate them instead: `npx auth@latest generate` (also seen as `npx @better-auth/cli@latest generate` — docs are inconsistent; either works).

**`phoneNumber` plugin:**
```ts
import { phoneNumber } from "better-auth/plugins"
phoneNumber({
  sendOTP: ({ phoneNumber, code }) => sendSms(phoneNumber, code),
  otpLength: 6, expiresIn: 300, allowedAttempts: 3,
  signUpOnVerification: { getTempEmail: (p) => `${p}@my-site.com` },
})
```
Client: `phoneNumberClient()`, then `authClient.phoneNumber.sendOtp({ phoneNumber })`, `authClient.phoneNumber.verify({ phoneNumber, code })`, `authClient.signIn.phoneNumber({ phoneNumber, password })`.

**`passkey` plugin** is its own package (not `better-auth/plugins`):
```bash
npm install @better-auth/passkey
```
```ts
import { passkey } from "@better-auth/passkey" // server plugin
```
```ts
import { passkeyClient } from "@better-auth/passkey/client"
await authClient.passkey.addPasskey({ name: "MacBook" })
await authClient.signIn.passkey()
authClient.passkey.listUserPasskeys()
```

**`organization` plugin** (for partner orgs):
```ts
import { organization } from "better-auth/plugins"
// client
await authClient.organization.create({ name: "Acme", slug: "acme" })
await authClient.organization.inviteMember({ email: "a@b.com", role: "member" })
```

**Next.js handler:**
```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { POST, GET } = toNextJsHandler(auth)
```

**Client:**
```ts
import { createAuthClient } from "better-auth/react"
import { phoneNumberClient, organizationClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
export const authClient = createAuthClient({ plugins: [phoneNumberClient(), organizationClient(), passkeyClient()] })
```

**RSC session:**
```ts
import { headers } from "next/headers"
const session = await auth.api.getSession({ headers: await headers() })
```

**Hooks:**
```ts
import { createAuthMiddleware, APIError } from "better-auth/api"
hooks: { before: createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-up/email" && !ctx.body?.email.endsWith("@acme.com")) throw new APIError("BAD_REQUEST")
}) },
databaseHooks: { user: { create: { after: async (user) => { /* welcome email */ } } } },
```

---

## 6. @simplewebauthn/server & browser v14

```ts
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server'

const options = await generateRegistrationOptions({
  rpName: 'Praman', rpID: 'praman.app', userName: user.email, attestationType: 'none',
  authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
})
const verification = await verifyRegistrationResponse({
  response, expectedChallenge, expectedOrigin: 'https://praman.app', expectedRPID: 'praman.app',
})
// { verified, registrationInfo: { credential, credentialDeviceType, credentialBackedUp } }

const authOpts = await generateAuthenticationOptions({ rpID: 'praman.app', allowCredentials: [{ id, transports }] })
const authVerification = await verifyAuthenticationResponse({
  response, expectedChallenge, expectedOrigin, expectedRPID,
  credential: { id, publicKey, counter, transports },
})
```
Browser:
```ts
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
const attResp = await startRegistration({ optionsJSON: options })
const asseResp = await startAuthentication({ optionsJSON: authOpts })
```
**Correction:** the `{optionsJSON}` single-object argument has been stable since **v11**, not new in v14. **v14's only breaking change** is a runtime bump — min Node 22.x LTS / Deno v2.4.x. New (non-breaking) in v14: post-quantum sig algos (ML-DSA), `sendSignal()`, `browserSupportsPasskeys()`/`getBrowserCapabilities()`, `expectedTopOrigin` for cross-origin auth.

---

## 7. BullMQ 6 + ioredis 6

**Install:** `npm i bullmq ioredis` (ioredis is now an **optional peer dep** in BullMQ 6 — must install explicitly).

```ts
import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis({ maxRetriesPerRequest: null }) // required: Workers use blocking commands that must retry forever

const queue = new Queue('emails', { connection })
await queue.add('welcome', { userId: 1 }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: { age: 3600, count: 1000 }, removeOnFail: { age: 86400 } })

const worker = new Worker('emails', async (job) => { await sendEmail(job.data) }, { connection, concurrency: 5 })
worker.on('completed', (job) => console.log(job.id, 'done'))

const events = new QueueEvents('emails', { connection })
events.on('failed', ({ jobId }) => console.error('failed', jobId))
```

**Repeatable jobs → Job Schedulers** (old `repeat` option **removed** in v6, not just deprecated):
```ts
await queue.upsertJobScheduler('daily-digest', { pattern: '0 15 3 * * *' }, {
  name: 'digest', data: { foo: 'bar' }, opts: { attempts: 5, removeOnFail: 1000 },
})
```

**Graceful shutdown:**
```ts
const shutdown = async () => { await worker.close(); process.exit(0) }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown)
```

**Breaking vs v5:** repeatable-jobs API removed (→ Job Schedulers); `Worker#resume()` now async (must `await`); `debounce`→`deduplication`; `Queue#client`/`Worker#blockingClient` removed (use `getBackend()`); `paused` removed from `JobType`; ioredis now optional peer dep; min Node 14.17.

---

## 8. jose 6

```ts
import { SignJWT, jwtVerify, exportJWK, createLocalJWKSet, createRemoteJWKSet, generateKeyPair } from 'jose'

const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true })

const jwt = await new SignJWT({ sub: userId })
  .setProtectedHeader({ alg: 'ES256' })
  .setIssuedAt()
  .setExpirationTime('2h')
  .sign(privateKey)

const { payload } = await jwtVerify(jwt, publicKey)

const jwk = await exportJWK(publicKey)
const JWKS_local = createLocalJWKSet({ keys: [jwk] })
const JWKS_remote = createRemoteJWKSet(new URL('https://auth.example.com/.well-known/jwks.json'))
await jwtVerify(jwt, JWKS_remote, { issuer: 'urn:praman', audience: 'urn:praman:api' })
```
Raw JWS (not a JWT claims set): `await new CompactSign(new TextEncoder().encode(payload)).setProtectedHeader({ alg: 'ES256' }).sign(privateKey)`.

**Breaking vs v5:** drops Node <19 (CJS `require()` of ESM needs Node ^20.19/^22.12/23+); universal-ESM only, runtime-specific packages (`jose-node-cjs-runtime` etc.) discontinued; Ed448/X448/secp256k1-JWS/RSA1_5-JWE dropped; private `KeyObject` can no longer verify/encrypt; key-gen returns `CryptoKey` not `KeyObject` by default; zero runtime deps maintained.

---

## 9. zod 4.5

Import unchanged: `import { z } from "zod"` (targets Zod 4 directly; `zod/v4` subpath exists mainly for library-authors dual-supporting v3+v4, not general app code).

```ts
const schema = z.object({ email: z.email(), age: z.number().int() }) // z.email() etc are now TOP-LEVEL, not z.string().email()
const result = schema.safeParse(input)
if (result.success) result.data; else result.error

const Shape = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("failed"), error: z.string() }),
])

const Fish = z.enum(["Salmon", "Tuna", "Trout"]) // now also accepts native TS enums directly

const jsonSchema = z.toJSONSchema(schema, { target: "draft-2020-12" })
```
**Breaking vs v3:** `.email()`/`.url()`/`.uuid()` etc. moved to top-level `z.email()`/`z.url()`/`z.uuid()`; `message`/`invalid_type_error`/`required_error` collapsed into a single `error` param; `.format()`/`.flatten()` deprecated for `z.treeifyError()`; `.default()` now applies to output type (use new `.prefault()` for old input-side behavior); `.strict()`/`.passthrough()`/`.merge()` deprecated for `z.strictObject()`/`z.looseObject()`/`.extend()`; `z.record()` needs two type args; `z.function()` is now a factory (`.implement()`), not a schema.

**RHF compatibility:** `@hookform/resolvers` needs **≥5.1.0** for Zod 4 (peer dep `"zod": "^3.25.0 || ^4.0.0"`); import path is unchanged: `@hookform/resolvers/zod`.

---

## 10. turbo 2.10 + pnpm workspaces

```json
// turbo.json — key is "tasks", NOT "pipeline"
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "lint": { "dependsOn": ["^lint"] },
    "test": { "dependsOn": ["build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```
`^build` = wait for deps' `build` first; `utils#build` = a specific package's task.

```yaml
# pnpm-workspace.yaml
packages: ["apps/*", "packages/*"]
catalog:
  react: ^19.2.0
  zod: ^4.5.0
```
```json
// any package.json
{ "dependencies": { "react": "catalog:", "ui": "workspace:*" } }
```

**Monorepo package consumption:** prefer **`transpilePackages`** (or rely on Turbopack's automatic workspace-package transpilation) over a prebuilt `dist/` — simplest, no stale-build bugs, no extra Turbo `build` task for internal-only packages. Use a real build step only when the package is also consumed outside Next.js (a worker, a CLI, published externally).

**TypeScript:** pin exactly — **as of today `npm install typescript` with no version installs 7.0.x** (the native Go compiler is now GA and is `latest`). This stack targets 5.9, so pin explicitly: `"typescript": "5.9.3"`, never `"latest"`.

```json
// tsconfig.base.json
{ "compilerOptions": {
  "target": "ES2022", "module": "esnext", "moduleResolution": "bundler",
  "strict": true, "isolatedModules": true, "verbatimModuleSyntax": true,
  "esModuleInterop": true, "skipLibCheck": true, "noUncheckedIndexedAccess": true
} }
```

---

## 11. motion 13

```tsx
"use client" // required — motion/react is not RSC-compatible
import { motion, AnimatePresence, useReducedMotion } from "motion/react" // NOT "framer-motion"

const shouldReduceMotion = useReducedMotion()
<motion.div layout layoutId="card" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
<AnimatePresence>{isOpen && <motion.div layoutId="modal" exit={{ opacity: 0 }} />}</AnimatePresence>
```
Spring props: `stiffness` (100), `damping` (10), `mass` (1), or duration-based `duration`+`bounce`. `useReducedMotion()` returns boolean — swap transform animations for opacity-only when true. Bundle-size opt-in: `LazyMotion` + `m` component instead of `motion` (saves ~15-25kb, `domAnimation`/`domMax` feature bundles).

**Breaking:** v13 drops `@emotion/is-prop-valid` as an optional dep (styled-components/Emotion users may see previously-filtered props hit the DOM). v11 moved render scheduling to a microtask (async) — tests must await a frame.

---

## 12. @tanstack/react-query 5 (Next.js App Router)

```tsx
// app/providers.tsx — client component
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```
```tsx
// app/posts/page.tsx — RSC prefetch + hydration
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import Posts from './posts'

export default async function PostsPage() {
  const queryClient = new QueryClient()
  await queryClient.query({ queryKey: ['posts'], queryFn: getPosts }).catch(() => {}) // v5-current API; older prefetchQuery is deprecated
  return <HydrationBoundary state={dehydrate(queryClient)}><Posts /></HydrationBoundary>
}
```
Note: current docs show `prefetchQuery`/`ensureQueryData` as deprecated in favor of `queryClient.query({...})` — verify against your exact installed minor since this symbol is newer than most existing tutorials.

---

## 13. vitest 4 + Playwright 1.62

`workspace` config is **deprecated since 3.2** — use `projects`:
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }, // top-level, not under `test`
  test: { environment: 'node', projects: ['packages/*'] },
})
```
```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
  ],
})
```
```ts
// tests/auth.setup.ts
import { test as setup } from '@playwright/test'
setup('authenticate', async ({ page }) => {
  await page.goto('/login'); await page.getByLabel('Email').fill('a@b.com'); await page.getByRole('button', { name: 'Sign in' }).click()
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
})
```

---

## 14. Chrome MV3 extension (Vite 6/7 + React)

**`@crxjs/vite-plugin` is alive and current** (v2.7.1, peer dep covers Vite `^3||^4||^5||^6||^7||^8` — no manual multi-entry fallback needed).
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'
export default defineConfig({ plugins: [react(), crx({ manifest })] })
```
```json
// manifest.json keys
{
  "manifest_version": 3,
  "background": { "service_worker": "service-worker.js", "type": "module" },
  "action": { "default_popup": "popup.html" },
  "permissions": ["storage", "scripting"],
  "host_permissions": ["https://praman.app/*"],
  "content_scripts": [{ "matches": ["https://*.example.com/*"], "js": ["content-script.js"], "run_at": "document_idle" }],
  "externally_connectable": { "matches": ["https://praman.app/*"] }
}
```
Web↔extension handshake: a page on an `externally_connectable`-matched origin can call `chrome.runtime.sendMessage(extensionId, msg)` directly, no content-script relay. `chrome.storage.session` is in-memory-only (cleared on restart/reload), **not exposed to content scripts by default** (needs `setAccessLevel({accessLevel:'TRUSTED_AND_UNTRUSTED_CONTEXTS'})`), unlike `chrome.storage.local`.

---

## 15. Node crypto (AES-256-GCM, HKDF, argon2, HMAC)

```ts
import { createCipheriv, createDecipheriv, hkdfSync, createHmac, randomBytes } from 'node:crypto'

// Envelope encryption
const iv = randomBytes(12) // GCM-recommended size
const cipher = createCipheriv('aes-256-gcm', key, iv)
let ciphertext = cipher.update(plaintext, 'utf8', 'hex'); ciphertext += cipher.final('hex')
const authTag = cipher.getAuthTag()

const decipher = createDecipheriv('aes-256-gcm', key, iv)
decipher.setAuthTag(authTag) // must be set before final()
let plain = decipher.update(ciphertext, 'hex', 'utf8'); plain += decipher.final('utf8')

// HKDF: digest, ikm, salt, info, keylen
const derivedKey = hkdfSync('sha256', ikm, salt, info, 32)

// HMAC blind index (deterministic, for equality search on encrypted columns)
const blindIndex = createHmac('sha256', hmacKey).update(plaintextValue).digest('hex')
```
`crypto.subtle` (Web Crypto, aliased `crypto.webcrypto`) is portable to browsers/edge and interops with `jose`'s `CryptoKey`; classic `node:crypto` is Node-only but offers streaming ciphers and sync HKDF — pick per context.

```ts
import { hash, verify } from '@node-rs/argon2' // npm i @node-rs/argon2
const hashed = await hash(password) // Argon2id by default
const ok = await verify(hashed, password)
```

---

## 16. react-hook-form 7.87 + zod resolver

```tsx
import { useForm, Controller, type Control, type UseFormRegister, type RegisterOptions } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1), age: z.number() })
const { register, handleSubmit, control } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

Dynamic form from a field registry:
```tsx
type FieldDef = { name: string; type: 'text' | 'number' | 'date'; label: string; validation?: RegisterOptions }

function DynamicForm({ fields, control, register }: { fields: FieldDef[]; control: Control<any>; register: UseFormRegister<any> }) {
  return <>{fields.map((f) => f.type === 'date'
    ? <Controller key={f.name} name={f.name} control={control} rules={f.validation}
        render={({ field }) => <DatePicker selected={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
    : <input key={f.name} type={f.type} placeholder={f.label}
        {...register(f.name, { ...f.validation, ...(f.type === 'number' ? { valueAsNumber: true } : {}) })} />
  )}</>
}
```
`Controller` props: `name`, `control`, `render({ field, fieldState })`, `rules`, `defaultValue`. `@hookform/resolvers` v5.1.0+ required for Zod 4.

---

## 17. pino 10 + Sentry (@sentry/nextjs)

```ts
import pino from 'pino'
const logger = pino({
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { destination: 1 } } : undefined,
})
```
Pino uses worker threads for transports — cannot be bundled as-is by Next.js's server bundler without extra config; keep it server-only (Node runtime, not Edge) and add it to `serverExternalPackages` in `next.config.ts` rather than letting the bundler try to inline it.

**Sentry — client init moved out of `sentry.client.config.ts`:**
```ts
// instrumentation-client.ts (replaces sentry.client.config.ts)
import * as Sentry from "@sentry/nextjs"
Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 })
```
```ts
// instrumentation.ts
import * as Sentry from "@sentry/nextjs"
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config")
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config")
}
export const onRequestError = Sentry.captureRequestError
```
```ts
// next.config.ts
import { withSentryConfig } from "@sentry/nextjs"
export default withSentryConfig(nextConfig, { org: "acme", project: "praman", authToken: process.env.SENTRY_AUTH_TOKEN })
```

---

## Version pin table

| Package | Pin |
|---|---|
| next | 16.3.4 |
| react / react-dom | 19.2.x |
| typescript | **5.9.3** (do not use `latest` — resolves to TS 7 now) |
| tailwindcss | 4.3.3 |
| @tailwindcss/postcss | matches tailwindcss |
| @heroui/react, @heroui/styles | 3.2.4 |
| drizzle-orm | 0.45.x |
| drizzle-kit | 0.31.x |
| postgres | 3.4.x |
| better-auth | 1.7.x |
| @better-auth/drizzle-adapter | latest compatible with better-auth 1.7 |
| @better-auth/passkey | latest |
| @simplewebauthn/server, @simplewebauthn/browser | 14.x (Node 22+/Deno 2.4+ required) |
| bullmq | 6.x |
| ioredis | 6.x (install explicitly — optional peer dep) |
| jose | 6.x (Node ≥19; ^20.19/^22.12/23+ for CJS `require(esm)`) |
| zod | 4.5.x |
| @hookform/resolvers | ≥5.1.0 (Zod 4 support) |
| react-hook-form | 7.87.x |
| turbo | 2.10.x |
| pnpm | 9.x or 10.x |
| motion | 13.x |
| @tanstack/react-query | 5.x |
| vitest | 4.1.x |
| @playwright/test | 1.62.x |
| @crxjs/vite-plugin | 2.7.1 (Vite 6/7/8 compatible) |
| vite (extension) | 6.x or 7.x |
| @node-rs/argon2 | latest |
| pino | 10.3.x |
| pino-pretty | matches pino major |
| @sentry/nextjs | latest current major |

---

## Gotchas checklist

- [ ] Rename any `middleware.ts` to `proxy.ts` / `middleware` export to `proxy` — sync file convention no longer resolves.
- [ ] Audit every RSC/route handler for sync `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` access — all must be `await`ed.
- [ ] Do not pin `typescript` to `"latest"` anywhere (root, catalog, CI) — it now resolves to TS 7 (Go-native). Pin `5.9.3` explicitly.
- [ ] `ioredis` must be installed explicitly for BullMQ 6 (no longer a transitive dep); Worker connections need `maxRetriesPerRequest: null`.
- [ ] Any code still calling `queue.add(..., { repeat })` or `getRepeatableJobs` will break on BullMQ 6 — migrate to `upsertJobScheduler`.
- [ ] `zod`'s `.string().email()`/`.url()`/`.uuid()` chains must move to top-level `z.email()`/`z.url()`/`z.uuid()`; `.format()`/`.flatten()` → `z.treeifyError()`.
- [ ] `@hookform/resolvers` must be ≥5.1.0 for Zod 4 compatibility — pin explicitly, don't assume an older lockfile entry works.
- [ ] HeroUI v3 needs **no** `HeroUIProvider` — do not carry over v2 boilerplate; also drop `tailwind.config.js`/`heroui()` plugin entirely if migrating.
- [ ] `motion/react` (not `framer-motion`) requires `"use client"` in every importing file under App Router.
- [ ] Vitest: replace any `vitest.workspace.ts` with a `projects` array in `vitest.config.ts` (workspace deprecated since 3.2).
- [ ] TanStack Query: `prefetchQuery`/`ensureQueryData` are being superseded by `queryClient.query()` — check your installed 5.x minor before copying newer examples verbatim.
- [ ] pino must stay server-only (Node runtime) and be added to `serverExternalPackages`; it will not bundle cleanly under Turbopack/webpack by default due to worker-thread transports.
- [ ] Sentry: client SDK init belongs in `instrumentation-client.ts`, not `sentry.client.config.ts` — old scaffolds are stale.
- [ ] `@simplewebauthn` v14 raises the runtime floor to Node 22 LTS / Deno 2.4 — verify CI/deploy runtime before upgrading.
- [ ] `better-auth`'s exact user/session/account/verification/passkey column names should be confirmed via `npx auth@latest generate` output or the installed package's types, not assumed from docs prose (the docs site renders that table client-side and doesn't export it to static markdown).
- [ ] Chrome extension: `chrome.storage.session` is not visible to content scripts unless `setAccessLevel` is called — don't assume parity with `storage.local`.
- [ ] AES-256-GCM: always use a fresh random 12-byte IV per encryption and store `authTag` alongside ciphertext+IV; `setAuthTag()` must be called before `decipher.final()`.

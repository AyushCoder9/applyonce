/**
 * Ponytail persistence: a single JSON file under `.data/`, read/written synchronously.
 * No DB, no ORM — just enough to survive `next dev` reloads for the demo.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type AppSource = "manual" | "praman";

export interface DocumentRef {
  title: string;
  sha256: string;
  mime?: string;
  sizeKb?: number;
}

export interface StatusEvent {
  status: string;
  note?: string;
  at: string;
  actor: "citizen" | "bta" | "praman" | "system";
}

export interface ApplicationRecord {
  ref: string; // BTA26-XXXXXXX — our primary key
  source: AppSource;
  status: string;
  createdAt: string;
  submittedAt: string;
  applicantName: string;
  /** flattened field id -> value, for the status/review views */
  fields: Record<string, unknown>;
  documents: DocumentRef[];
  pramanApplicationId?: string;
  pramanConsentId?: string;
  pramanFormId?: string;
  consentRevoked?: boolean;
  history: StatusEvent[];
}

export interface WebhookEventRecord {
  id: string;
  type: string;
  receivedAt: string;
  verified: boolean;
  payload: unknown;
  note?: string;
}

interface PendingSession {
  sessionId: string;
  createdAt: number;
}

interface StoreShape {
  applications: Record<string, ApplicationRecord>;
  webhookEvents: WebhookEventRecord[];
  /** pending share-session `state` nonces, keyed by state -> {sessionId, createdAt} */
  pendingStates: Record<string, PendingSession>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const EMPTY: StoreShape = { applications: {}, webhookEvents: [], pendingStates: {} };

function ensureFile(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) writeFileSync(STORE_PATH, JSON.stringify(EMPTY, null, 2));
}

function readStore(): StoreShape {
  ensureFile();
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return { applications: parsed.applications ?? {}, webhookEvents: parsed.webhookEvents ?? [], pendingStates: parsed.pendingStates ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function writeStore(store: StoreShape): void {
  ensureFile();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// ---------- applications ----------

export function saveApplication(record: ApplicationRecord): void {
  const store = readStore();
  store.applications[record.ref] = record;
  writeStore(store);
}

export function getApplication(ref: string): ApplicationRecord | undefined {
  return readStore().applications[ref];
}

export function applicationExists(ref: string): boolean {
  return ref in readStore().applications;
}

export function findApplicationByPramanId(pramanApplicationId: string): ApplicationRecord | undefined {
  const store = readStore();
  return Object.values(store.applications).find((a) => a.pramanApplicationId === pramanApplicationId);
}

export function findApplicationByConsentId(consentId: string): ApplicationRecord | undefined {
  const store = readStore();
  return Object.values(store.applications).find((a) => a.pramanConsentId === consentId);
}

export function appendHistory(ref: string, event: StatusEvent): ApplicationRecord | undefined {
  const store = readStore();
  const app = store.applications[ref];
  if (!app) return undefined;
  app.history.push(event);
  app.status = event.status;
  writeStore(store);
  return app;
}

export function markConsentRevoked(predicate: (a: ApplicationRecord) => boolean): ApplicationRecord[] {
  const store = readStore();
  const touched: ApplicationRecord[] = [];
  for (const app of Object.values(store.applications)) {
    if (predicate(app)) {
      app.consentRevoked = true;
      app.history.push({ status: app.status, note: "Consent revoked by citizen on Praman", at: new Date().toISOString(), actor: "praman" });
      touched.push(app);
    }
  }
  if (touched.length) writeStore(store);
  return touched;
}

// ---------- webhook log ----------

export function appendWebhookEvent(event: WebhookEventRecord): void {
  const store = readStore();
  store.webhookEvents.unshift(event); // newest first
  store.webhookEvents = store.webhookEvents.slice(0, 20);
  writeStore(store);
}

export function listWebhookEvents(): WebhookEventRecord[] {
  return readStore().webhookEvents;
}

// ---------- share-session state nonces (light CSRF guard + session_id lookup for /apply/return) ----------

export function rememberState(state: string, sessionId: string): void {
  const store = readStore();
  store.pendingStates[state] = { sessionId, createdAt: Date.now() };
  // prune anything older than 30 min so this never grows unbounded
  for (const [k, v] of Object.entries(store.pendingStates)) if (Date.now() - v.createdAt > 30 * 60 * 1000) delete store.pendingStates[k];
  writeStore(store);
}

/** Returns and removes the session_id that was pending under this `state`, or null if unknown/expired/reused. */
export function consumeState(state: string | null | undefined): string | null {
  if (!state) return null;
  const store = readStore();
  const pending = store.pendingStates[state];
  delete store.pendingStates[state];
  writeStore(store);
  return pending?.sessionId ?? null;
}

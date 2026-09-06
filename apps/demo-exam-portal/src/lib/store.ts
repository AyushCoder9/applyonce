import type { ApplyOncePayload } from "@applyonce/schema";
/**
 * Ponytail persistence: a single JSON file under `.data/`, read/written synchronously.
 * No DB, no ORM — just enough to survive `next dev` reloads for the demo.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";

export type AppSource = "manual" | "applyonce";

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
  actor: "citizen" | "bta" | "applyonce" | "system";
}

export interface ApplicationRecord {
  accessToken?: string;
  ref: string; // BTA26-XXXXXXX — our primary key
  source: AppSource;
  status: string;
  createdAt: string;
  submittedAt: string;
  applicantName: string;
  /** flattened field id -> value, for the status/review views */
  fields: Record<string, unknown>;
  documents: DocumentRef[];
  applyonceApplicationId?: string;
  applyonceConsentId?: string;
  applyonceFormId?: string;
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

export interface Draft {payload:ApplyOncePayload;verified:boolean;offline:boolean;createdAt:number;submittedRef?:string}

interface StoreShape {
  drafts: Record<string,Draft>;
  applications: Record<string, ApplicationRecord>;
  webhookEvents: WebhookEventRecord[];
  /** pending share-session `state` nonces, keyed by state -> {sessionId, createdAt} */
  pendingStates: Record<string, PendingSession>;
}

const DATA_DIR = process.env.DEMO_DATA_DIR ?? path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const EMPTY: StoreShape = { drafts: {}, applications: {}, webhookEvents: [], pendingStates: {} };

function ensureFile(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) writeFileSync(STORE_PATH, JSON.stringify(EMPTY, null, 2));
}

function readStore(): StoreShape {
  ensureFile();
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return { drafts: parsed.drafts ?? {}, applications: parsed.applications ?? {}, webhookEvents: parsed.webhookEvents ?? [], pendingStates: parsed.pendingStates ?? {} };
  } catch {
    throw new Error("The demo data file could not be read. Restore it from backup; no data was overwritten.");
  }
}

function writeStore(store: StoreShape): void {
  ensureFile();
  writeFileSync(STORE_PATH + ".tmp", JSON.stringify(store, null, 2));
  renameSync(STORE_PATH + ".tmp", STORE_PATH);
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

export function findApplicationByApplyOnceId(applyonceApplicationId: string): ApplicationRecord | undefined {
  const store = readStore();
  return Object.values(store.applications).find((a) => a.applyonceApplicationId === applyonceApplicationId);
}

export function findApplicationByConsentId(consentId: string): ApplicationRecord | undefined {
  const store = readStore();
  return Object.values(store.applications).find((a) => a.applyonceConsentId === consentId);
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
    if (predicate(app) && !app.consentRevoked) {
      app.consentRevoked = true;
      app.history.push({ status: app.status, note: "Consent revoked by citizen on ApplyOnce", at: new Date().toISOString(), actor: "applyonce" });
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
  return pending && Date.now() - pending.createdAt < 15 * 60 * 1000 ? pending.sessionId : null;
}

export function saveDraft(token:string,draft:Draft) {const store=readStore();store.drafts[token]=draft;for(const [key,value] of Object.entries(store.drafts)) if(Date.now()-value.createdAt>30*60*1000) delete store.drafts[key];writeStore(store);}
export function getDraft(token:string):Draft|undefined {const draft=readStore().drafts[token];return draft && Date.now()-draft.createdAt<30*60*1000 ? draft : undefined;}
export function completeDraft(token:string,ref:string) {const store=readStore();if(store.drafts[token]) store.drafts[token].submittedRef=ref;writeStore(store);}

import IORedis from "ioredis";
import type { ApplyOncePayload } from "@applyonce/schema";

/**
 * Durable state for the independently deployed synthetic BTA portal.
 *
 * Redis is already provisioned for ApplyOnce. A process-level multiplexed
 * client keeps serverless connection overhead bounded, and every temporary
 * record has an explicit TTL. No real citizen data belongs in this demo store.
 */

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
  ref: string;
  source: AppSource;
  status: string;
  createdAt: string;
  submittedAt: string;
  applicantName: string;
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

export interface Draft {
  payload: ApplyOncePayload;
  verified: boolean;
  offline: boolean;
  createdAt: number;
  submittedRef?: string;
}

const PREFIX = "applyonce:demo-portal";
const APPLICATION_TTL_SECONDS = 90 * 24 * 60 * 60;
const DRAFT_TTL_SECONDS = 30 * 60;
const STATE_TTL_SECONDS = 15 * 60;
const WEBHOOK_TTL_SECONDS = 30 * 24 * 60 * 60;

const globalRedis = globalThis as unknown as { __applyonceDemoPortalRedis?: IORedis };

function client(): IORedis {
  const url = process.env.REDIS_URL?.trim();
  if (!url) throw new Error("REDIS_URL is required for the deployed BTA demo portal");
  return globalRedis.__applyonceDemoPortalRedis ??= new IORedis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    connectTimeout: 2_000,
    commandTimeout: 5_000,
    enableReadyCheck: true,
  });
}

export async function storeHealth(): Promise<{ ok: true; ms: number }> {
  const started = performance.now();
  const response = await client().ping();
  if (response !== "PONG") throw new Error("Redis did not acknowledge the health probe");
  return { ok: true, ms: Math.round(performance.now() - started) };
}

const key = (kind: string, id: string) => `${PREFIX}:${kind}:${id}`;
const applicationIndex = key("index", "applications");
const webhookIndex = key("index", "webhooks");

async function getJson<T>(redisKey: string): Promise<T | undefined> {
  const raw = await client().get(redisKey);
  return raw ? JSON.parse(raw) as T : undefined;
}

export async function saveApplication(record: ApplicationRecord): Promise<void> {
  await client().multi()
    .set(key("application", record.ref), JSON.stringify(record), "EX", APPLICATION_TTL_SECONDS)
    .sadd(applicationIndex, record.ref)
    .expire(applicationIndex, APPLICATION_TTL_SECONDS)
    .exec();
}

export function getApplication(ref: string): Promise<ApplicationRecord | undefined> {
  return getJson<ApplicationRecord>(key("application", ref));
}

export async function applicationExists(ref: string): Promise<boolean> {
  return Boolean(await client().exists(key("application", ref)));
}

async function listApplications(): Promise<ApplicationRecord[]> {
  const refs = await client().smembers(applicationIndex);
  if (!refs.length) return [];
  const records = await client().mget(refs.map((ref) => key("application", ref)));
  return records.flatMap((raw) => raw ? [JSON.parse(raw) as ApplicationRecord] : []);
}

export async function findApplicationByApplyOnceId(applyonceApplicationId: string): Promise<ApplicationRecord | undefined> {
  return (await listApplications()).find((app) => app.applyonceApplicationId === applyonceApplicationId);
}

export async function findApplicationByConsentId(consentId: string): Promise<ApplicationRecord | undefined> {
  return (await listApplications()).find((app) => app.applyonceConsentId === consentId);
}

export async function appendHistory(ref: string, event: StatusEvent): Promise<ApplicationRecord | undefined> {
  const app = await getApplication(ref);
  if (!app) return undefined;
  app.history.push(event);
  app.status = event.status;
  await saveApplication(app);
  return app;
}

export async function markConsentRevoked(predicate: (app: ApplicationRecord) => boolean): Promise<ApplicationRecord[]> {
  const touched: ApplicationRecord[] = [];
  for (const app of await listApplications()) {
    if (!predicate(app) || app.consentRevoked) continue;
    app.consentRevoked = true;
    app.history.push({ status: app.status, note: "Consent revoked by citizen on ApplyOnce", at: new Date().toISOString(), actor: "applyonce" });
    await saveApplication(app);
    touched.push(app);
  }
  return touched;
}

export async function appendWebhookEvent(event: WebhookEventRecord): Promise<void> {
  const eventKey = key("webhook", event.id);
  const oldIds = await client().zrange(webhookIndex, "0", "-21");
  const transaction = client().multi()
    .set(eventKey, JSON.stringify(event), "EX", WEBHOOK_TTL_SECONDS)
    .zadd(webhookIndex, String(Date.parse(event.receivedAt)), event.id)
    .expire(webhookIndex, WEBHOOK_TTL_SECONDS);
  if (oldIds.length) {
    transaction.zrem(webhookIndex, ...oldIds);
    for (const id of oldIds) transaction.del(key("webhook", id));
  }
  await transaction.exec();
}

export async function listWebhookEvents(): Promise<WebhookEventRecord[]> {
  const ids = await client().zrevrange(webhookIndex, "0", "19");
  if (!ids.length) return [];
  const records = await client().mget(ids.map((id) => key("webhook", id)));
  return records.flatMap((raw) => raw ? [JSON.parse(raw) as WebhookEventRecord] : []);
}

export async function rememberState(state: string, sessionId: string): Promise<void> {
  const pending: PendingSession = { sessionId, createdAt: Date.now() };
  await client().set(key("state", state), JSON.stringify(pending), "EX", STATE_TTL_SECONDS);
}

export async function consumeState(state: string | null | undefined): Promise<string | null> {
  if (!state) return null;
  const raw = await client().getdel(key("state", state));
  if (!raw) return null;
  const pending = JSON.parse(raw) as PendingSession;
  return Date.now() - pending.createdAt < STATE_TTL_SECONDS * 1_000 ? pending.sessionId : null;
}

export async function saveDraft(token: string, draft: Draft): Promise<void> {
  const remainingSeconds = Math.floor((draft.createdAt + DRAFT_TTL_SECONDS * 1_000 - Date.now()) / 1_000);
  if (remainingSeconds <= 0) return;
  await client().set(key("draft", token), JSON.stringify(draft), "EX", remainingSeconds);
}

export function getDraft(token: string): Promise<Draft | undefined> {
  return getJson<Draft>(key("draft", token));
}

export async function completeDraft(token: string, ref: string): Promise<void> {
  const draft = await getDraft(token);
  if (!draft) return;
  draft.submittedRef = ref;
  await saveDraft(token, draft);
}

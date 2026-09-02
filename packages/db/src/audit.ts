import { desc } from "drizzle-orm";
import { sha256 } from "@praman/crypto";
import { db, type Db, type Tx } from "./client";
import { auditLog } from "./schema";

export interface AuditInput { actorUserId?: string | null; actorPartnerId?: string | null; action: string; targetType: string; targetId?: string | null; meta?: Record<string, unknown> }

/** Append-only, hash-chained. ponytail: reads last row without a lock; chain gaps under heavy concurrency are detectable, not corrupting. */
export async function audit(a: AuditInput, tx: Db | Tx = db) {
  const [last] = await tx.select({ hash: auditLog.hash }).from(auditLog).orderBy(desc(auditLog.id)).limit(1);
  const prevHash = last?.hash ?? "genesis";
  const at = new Date();
  const hash = sha256(JSON.stringify({ prevHash, at: at.toISOString(), ...a }));
  await tx.insert(auditLog).values({ at, actorUserId: a.actorUserId ?? null, actorPartnerId: a.actorPartnerId ?? null, action: a.action, targetType: a.targetType, targetId: a.targetId ?? null, meta: a.meta ?? {}, prevHash, hash });
}

"use server";
import { db, t } from "@applyonce/db";
import { getSession } from "@/lib/session";
import { log } from "@/lib/api";
export type DpoState = { ok: boolean; id?: string; error?: string };
/** Public rights form → data_requests row (ops fulfil in /admin/requests). In-app export/erase (Settings) goes through step-up + the worker. */
export async function submitDpoRequest(_: DpoState, fd: FormData): Promise<DpoState> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Please log in first." };
  const kind = String(fd.get("kind"));
  if (!["export", "erase", "correct"].includes(kind)) return { ok: false, error: "Pick a request type." };
  const notes = String(fd.get("notes") ?? "").slice(0, 1000) || null;
  const [r] = await db.insert(t.dataRequests).values({ userId: s.user.id, kind: kind as "export" | "erase" | "correct", notes: `via /dpo${notes ? ` · ${notes}` : ""}` }).returning({ id: t.dataRequests.id });
  await log(s, `dpo.request.${kind}`, "data_request", r!.id);
  return { ok: true, id: r!.id };
}

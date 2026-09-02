"use server";
import { revalidatePath } from "next/cache";
import { db, t, eq } from "@praman/db";
import { requireAdmin } from "@/lib/session";
import { log } from "@/lib/api";
/** Fulfil / annotate a data-principal request (admin only). Server action keeps the §3 API surface exact. */
export async function updateRequest(fd: FormData) {
  const s = await requireAdmin();
  const id = String(fd.get("id")); const status = String(fd.get("status")); const notes = String(fd.get("notes") ?? "").slice(0, 1000);
  if (!["pending", "processing", "done", "failed", "cancelled"].includes(status)) return;
  await db.update(t.dataRequests).set({ status, notes: notes || null, fulfilledAt: status === "done" ? new Date() : null }).where(eq(t.dataRequests.id, id));
  await log(s, "admin.data_request.update", "data_request", id, { status });
  revalidatePath("/admin/requests");
}

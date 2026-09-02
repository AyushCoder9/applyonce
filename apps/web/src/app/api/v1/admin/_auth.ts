import "server-only";
import { getSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
/** Admin auth for API routes (layout does the page-side redirect). */
export async function adminApi() {
  const s = await getSession();
  if (!s) throw new ApiError(401, "UNAUTHENTICATED");
  if ((s.user as { role?: string }).role !== "admin") throw new ApiError(403, "ADMIN_ONLY");
  return s;
}

import { handler, ok } from "@/lib/api";
import { adminApi } from "../_auth";
import { queueCounts } from "@/components/admin/data";
export const GET = handler(async () => { await adminApi(); return ok(await queueCounts()); });

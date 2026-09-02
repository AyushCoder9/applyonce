import { handler, ok } from "@/lib/api";
import { adminApi } from "../_auth";
import { overviewStats } from "@/components/admin/data";
export const GET = handler(async () => { await adminApi(); return ok(await overviewStats()); });

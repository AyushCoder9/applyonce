import { handler, citizen, ok } from "@/lib/api";
import { familyList } from "@/components/family/data";
export const GET = handler(async (req) => { const { user } = await citizen(req); return ok(await familyList(user.id)); });

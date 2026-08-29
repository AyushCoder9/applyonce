import { sql } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db";

export async function GET() {
  const checks = {
    database: false,
    authentication: Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    documentStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
  if (isDatabaseConfigured()) {
    try {
      await getDatabase().execute(sql`select 1 as ok`);
      checks.database = true;
    } catch {
      checks.database = false;
    }
  }
  const ready = checks.database && checks.authentication;
  return Response.json({ ok: ready, service: "applyonce", checks }, { status: ready ? 200 : 503 });
}

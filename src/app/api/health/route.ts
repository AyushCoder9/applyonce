import { sql } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { ok: false, database: "not_configured", service: "applyonce" },
      { status: 503 },
    );
  }

  try {
    await getDatabase().execute(sql`select 1 as ok`);
    return Response.json({ ok: true, database: "connected", service: "applyonce" });
  } catch {
    return Response.json(
      { ok: false, database: "unreachable", service: "applyonce" },
      { status: 503 },
    );
  }
}

import { sql } from "drizzle-orm";
import { getDatabase } from "@/db";

export default async function OperationsHealthPage() {
  const checkedAt = new Date();
  let database = "connected";
  try {
    await getDatabase().execute(sql`select 1`);
  } catch {
    database = "unavailable";
  }
  return <section className="ao-ops-page"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Readiness</span><h1>System health</h1><p>Live checks for the application runtime and primary database.</p></div></div><div className="ao-partner-metric-grid"><div className="ao-partner-metric ao-partner-metric--mint"><span>Application runtime</span><strong>Ready</strong><small>{checkedAt.toLocaleString("en-IN")}</small></div><div className={`ao-partner-metric ${database === "connected" ? "ao-partner-metric--blue" : "ao-partner-metric--sun"}`}><span>Database</span><strong>{database}</strong><small>Direct query check</small></div></div></section>;
}

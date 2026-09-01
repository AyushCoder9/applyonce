import { desc } from "drizzle-orm";
import { getDatabase } from "@/db";
import { organizations } from "@/db/schema";
import PartnerApprovalActions from "./PartnerApprovalActions";

export default async function PartnerOperationsPage() {
  const partners = await getDatabase().select().from(organizations).orderBy(desc(organizations.createdAt));
  return <section className="ao-ops-page"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Organization trust</span><h1>Partner approvals</h1><p>Public forms remain blocked until an operator verifies the organization.</p></div></div><div className="ao-ops-list">{partners.map((partner) => <article className="ao-product-card" key={partner.id}><div><span className={`ao-status-pill ao-status-pill--${partner.status === "approved" ? "positive" : partner.status === "rejected" || partner.status === "suspended" ? "negative" : "attention"}`}><span />{partner.status.replaceAll("_", " ")}</span><h2>{partner.name}</h2><p>{partner.kind.replaceAll("_", " ")} · {partner.contactEmail ?? "No contact email"} · {partner.verifiedDomain ?? "No domain supplied"}</p><small>Created {partner.createdAt.toLocaleString("en-IN")}</small></div><PartnerApprovalActions organizationId={partner.id} currentStatus={partner.status} /></article>)}</div>{partners.length === 0 ? <div className="ao-loading-card">No partner organizations have applied.</div> : null}</section>;
}

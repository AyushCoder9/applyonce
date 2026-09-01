"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerApprovalActions({ organizationId, currentStatus }: { organizationId: string; currentStatus: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function update(status: "approved" | "suspended" | "rejected") {
    if (reason.trim().length < 8) {
      setMessage("Add a review reason of at least eight characters.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/ops/partners", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId, status, reason }) });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "The review could not be saved.");
      setMessage(`Organization marked ${status}.`);
      setReason("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="ao-ops-actions"><label>Review reason<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Domain and organization details verified" /></label><div><button type="button" onClick={() => void update("approved")} disabled={saving || currentStatus === "approved"}>Approve</button><button type="button" onClick={() => void update("suspended")} disabled={saving || currentStatus === "suspended"}>Suspend</button><button type="button" onClick={() => void update("rejected")} disabled={saving || currentStatus === "rejected"}>Reject</button></div>{message ? <span role="status">{message}</span> : null}</div>;
}

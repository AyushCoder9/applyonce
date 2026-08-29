"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Sparkles } from "lucide-react";

type Snapshot = {
  profile: { fullName: string; email: string; city: string | null; state: string | null };
  connections: Array<{ displayName: string; status: string }>;
  applications: Array<{
    application: {
      id: string;
      status: string;
      readinessScore: number;
      readyFieldCount: number;
      totalFieldCount: number;
      receiptCode: string | null;
    };
    template: { name: string; category: string };
  }>;
};

export default function AuthenticatedWorkspace() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { snapshot: Snapshot };
      setSnapshot(data.snapshot);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!active) {
        return;
      }
      if (response.ok) {
        const data = (await response.json()) as { snapshot: Snapshot };
        setSnapshot(data.snapshot);
      }
      setLoading(false);
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function createPacket() {
    setCreating(true);
    setMessage("");
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateSlug: "national-stem-entrance-2026" }),
    });
    setMessage(response.ok ? "Packet created. Review it before sharing." : "We could not create the packet yet.");
    setCreating(false);
    await refresh();
  }

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
      await upload(`documents/${crypto.randomUUID()}.${extension}`, file, {
        access: "private",
        handleUploadUrl: "/api/documents/upload",
        clientPayload: JSON.stringify({
          title: file.name,
          documentType: "citizen_document",
          provider: "manual",
        }),
      });
      setMessage("Private document uploaded and linked to your profile.");
      await refresh();
    } catch {
      setMessage("The document could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="workspace-content">
      <div className="workspace-hero">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> Private citizen workspace</span>
          <h1>One profile. Many doors.</h1>
          <p>Your connected profile is ready to assemble purpose-bound application packets.</p>
        </div>
        <div className="workspace-shield"><LockKeyhole /><span>Consent-first by default</span></div>
      </div>

      {loading ? <div className="workspace-loading">Loading your profile…</div> : snapshot ? <>
        <div className="workspace-grid">
          <section className="workspace-card workspace-card-dark">
            <span className="card-kicker">Profile wallet</span>
            <h2>{snapshot.profile.fullName}</h2>
            <p>{snapshot.profile.email}{snapshot.profile.city ? ` · ${snapshot.profile.city}` : ""}</p>
            <div className="workspace-stat"><strong>{snapshot.connections.length}</strong><span>trusted sources connected</span></div>
          </section>
          <section className="workspace-card">
            <span className="card-kicker">Next best action</span>
            <h2>Prepare an exam application packet</h2>
            <p>Map your profile to a receiving portal and resolve only the fields that need your decision.</p>
            <button className="primary-action" onClick={() => void createPacket()} disabled={creating}>
              {creating ? "Preparing…" : "Prepare packet"}<ArrowRight className="inline-arrow" />
            </button>
          </section>
        </div>

          <section className="workspace-card workspace-applications">
          <div className="card-heading"><div><span className="card-kicker">Applications</span><h2>Your packets and receipts</h2></div><Sparkles className="workspace-spark" /></div>
          {message ? <div className="workspace-message"><CheckCircle2 />{message}</div> : null}
          {snapshot.applications.length === 0 ? <div className="workspace-empty"><FileCheck2 /><span>No packets yet. Prepare your first one above.</span></div> : snapshot.applications.map(({ application, template }) => <div className="workspace-application" key={application.id}><div><strong>{template.name}</strong><span>{template.category} · {application.status.replaceAll("_", " ")}</span></div><span className="workspace-readiness">{application.readinessScore}% ready</span></div>)}
          <label className="secondary-action workspace-upload"><span>{uploading ? "Uploading…" : "Add a private document"}</span><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => void uploadDocument(event)} disabled={uploading} /></label>
        </section>
      </> : <div className="workspace-loading">Your profile could not be loaded. Please refresh.</div>}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  CloudUpload,
  Copy,
  Download,
  FileText,
  Fingerprint,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Menu,
  Network,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";
import { SourceMark, type SourceProvider } from "@/components/brand/SourceMark";

export type CitizenView =
  | "overview"
  | "people"
  | "profile"
  | "sources"
  | "documents"
  | "programs"
  | "applications"
  | "consents"
  | "activity"
  | "notifications"
  | "help"
  | "settings";

type Snapshot = {
  profile: {
    id?: string;
    fullName: string;
    email: string;
    phone?: string | null;
    dateOfBirth?: string | null;
    city: string | null;
    state: string | null;
    category?: string | null;
    annualIncomePaise?: number | null;
    metadata?: Record<string, unknown> | null;
    updatedAt?: string | null;
  };
  connections: Array<{ id?: string; provider: string; displayName: string; status: string; lastVerifiedAt?: string | null }>;
  claims: Array<{ claim: { key: string; label: string; valueText: string; confidence: number; verifiedAt?: string | null; expiresAt?: string | null }; sourceLabel?: string | null }>;
  documents: Array<{ id: string; title: string; documentType: string; provider: string; status: string; updatedAt: string; expiresAt?: string | null }>;
  applications: Array<{
    application: { id: string; status: string; readinessScore: number; readyFieldCount: number; totalFieldCount: number; receiptCode: string | null; updatedAt: string };
    template: { name: string; category: string; description?: string; deadline?: string | null };
  }>;
  partnerApplications: PartnerApplication[];
  events: Array<{ id: string; title: string; description: string; occurredAt: string; metadata?: Record<string, unknown> | null }>;
  notifications: Array<{ id: string; subject: string; body: string; status: string; createdAt: string }>;
};

type PartnerApplication = {
  submission: {
    id: string;
    profileId: string | null;
    applicantName: string;
    applicantEmail: string;
    status: string;
    receiptCode: string;
    data: Record<string, string>;
    documentIds: string[];
    partnerConsentId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  form: {
    id: string;
    slug: string;
    name: string;
    description: string;
    purpose: string;
    version: number;
    formSchema: { fields: Array<{ key: string; label: string; type: string; required: boolean; profileKey?: string; helpText?: string }>; documents: Array<{ key: string; label: string; required: boolean }> };
  };
  organization: { name: string; slug: string };
};

type ApplicationDetail = {
  application: { id: string; status: string; readinessScore: number; readyFieldCount: number; totalFieldCount: number; receiptCode: string | null; submittedAt?: string | null };
  template: { name: string; category: string; externalPortalName: string; description: string };
  fields: Array<{ id: string; requirementKey: string; label: string; valueText: string | null; sourceLabel: string | null; state: string; confidence: number | null }>;
  events: Array<{ id: string; title: string; description: string; occurredAt: string }>;
};

type Consent = { id: string; applicationId?: string | null; formId?: string | null; submissionId?: string | null; purpose: string; scope: string[]; method: string; approvedAt: string; revokedAt: string | null };

const navItems: Array<{ id: CitizenView; label: string; icon: typeof LayoutDashboard; href: string }> = [
  { id: "overview", label: "Today", icon: LayoutDashboard, href: "/app/today" },
  { id: "people", label: "People", icon: UsersRound, href: "/app/people" },
  { id: "profile", label: "My profile", icon: UserRound, href: "/app/profile" },
  { id: "sources", label: "Sources", icon: Network, href: "/app/sources" },
  { id: "documents", label: "Documents", icon: FileText, href: "/app/documents" },
  { id: "programs", label: "Find programs", icon: GraduationCap, href: "/app/programs" },
  { id: "applications", label: "Applications", icon: ClipboardList, href: "/app/applications" },
  { id: "consents", label: "Consent history", icon: ShieldCheck, href: "/app/consents" },
  { id: "activity", label: "Activity", icon: Sparkles, href: "/app/activity" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/app/notifications" },
  { id: "help", label: "Help", icon: CircleAlert, href: "/app/help" },
  { id: "settings", label: "Settings", icon: Settings2, href: "/app/settings" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Not added";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatIncome(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not added";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

type ProfileForm = {
  phone: string;
  dateOfBirth: string;
  city: string;
  state: string;
  category: string;
  annualIncome: string;
  currentAddress: string;
  permanentAddress: string;
  postalCode: string;
  parentName: string;
  parentPhone: string;
  guardianName: string;
  highestQualification: string;
  currentInstitution: string;
  class10Board: string;
  class10Year: string;
  class12Board: string;
  class12Year: string;
  employmentStatus: string;
  employer: string;
  disabilityStatus: string;
  identifierReference: string;
};

function metadataString(profile: Snapshot["profile"], key: keyof Omit<ProfileForm, "phone" | "dateOfBirth" | "city" | "state" | "category" | "annualIncome">) {
  const value = profile.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function profileFormFromSnapshot(profile: Snapshot["profile"]): ProfileForm {
  return {
    phone: profile.phone ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    category: profile.category ?? "",
    annualIncome: profile.annualIncomePaise === null || profile.annualIncomePaise === undefined ? "" : String(profile.annualIncomePaise / 100),
    currentAddress: metadataString(profile, "currentAddress"),
    permanentAddress: metadataString(profile, "permanentAddress"),
    postalCode: metadataString(profile, "postalCode"),
    parentName: metadataString(profile, "parentName"),
    parentPhone: metadataString(profile, "parentPhone"),
    guardianName: metadataString(profile, "guardianName"),
    highestQualification: metadataString(profile, "highestQualification"),
    currentInstitution: metadataString(profile, "currentInstitution"),
    class10Board: metadataString(profile, "class10Board"),
    class10Year: metadataString(profile, "class10Year"),
    class12Board: metadataString(profile, "class12Board"),
    class12Year: metadataString(profile, "class12Year"),
    employmentStatus: metadataString(profile, "employmentStatus"),
    employer: metadataString(profile, "employer"),
    disabilityStatus: metadataString(profile, "disabilityStatus"),
    identifierReference: metadataString(profile, "identifierReference"),
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(value: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

function AnimatedPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof FileText; title: string; body: string; action?: React.ReactNode }) {
  return <div className="ao-empty"><span className="ao-empty-icon"><Icon /></span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

function StatusPill({ status }: { status: string }) {
  const tone = ["submitted", "accepted", "completed", "verified", "connected", "ready"].includes(status) ? "positive" : ["rejected", "expired", "revoked"].includes(status) ? "negative" : "attention";
  const resolvedTone = ["rejected", "expired", "revoked", "disconnected"].includes(status) ? "negative" : tone;
  return <span className={`ao-status-pill ao-status-pill--${resolvedTone}`}><span />{formatStatus(status)}</span>;
}

function Overview({ snapshot, onNavigate, onCreate, creating }: { snapshot: Snapshot; onNavigate: (view: CitizenView) => void; onCreate: () => void; creating: boolean }) {
  const openApplication = snapshot.applications.find(({ application }) => application.status !== "submitted" && application.status !== "accepted");
  const profileReady = Math.min(100, Math.max(0, snapshot.claims.length ? Math.round((snapshot.claims.filter(({ claim }) => claim.confidence >= 90).length / Math.max(snapshot.claims.length, 1)) * 100) : 0));
  const hasApplications = snapshot.applications.length > 0 || snapshot.partnerApplications.length > 0;
  return <AnimatedPanel className="ao-view-stack">
    <div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Citizen workspace</span><h1>Good to see you, {snapshot.profile.fullName.split(" ")[0]}.</h1><p>Your application profile is ready to move with you.</p></div><div className="ao-privacy-badge"><LockKeyhole /><span>Consent-first by default</span></div></div>
    <div className="ao-citizen-hero-grid">
      <section className="ao-citizen-focus">
        <div className="ao-card-kicker">Next best action</div>
        <h2>{openApplication ? "Finish your application packet" : "Prepare your first application packet"}</h2>
        <p>{openApplication ? `Your ${openApplication.template.name} packet is ${openApplication.application.readinessScore}% ready. Review the last details before sharing.` : "Start with an education application. ApplyOnce will show what can be reused and what you still need to decide."}</p>
        <div className="ao-inline-actions"><button className="ao-button ao-button--primary" type="button" onClick={openApplication ? () => onNavigate("applications") : onCreate} disabled={creating}>{creating ? "Preparing packet..." : openApplication ? "Review application" : "Prepare an application"}<ArrowRight /></button><button className="ao-button ao-button--quiet" type="button" onClick={() => onNavigate("profile")}>View my profile</button></div>
        <div className="ao-hero-caption"><LockKeyhole /> Nothing is shared until you approve it.</div>
      </section>
      <section className="ao-readiness-card"><div className="ao-card-kicker">Profile readiness</div><div className="ao-readiness-main"><div className="ao-readiness-ring" style={{ "--ao-progress": `${profileReady}%` } as React.CSSProperties}><strong>{profileReady}%</strong></div><div><h3>Ready to reuse</h3><p>{snapshot.connections.length} connected sources and {snapshot.documents.length} documents are available to you.</p></div></div><button className="ao-text-link" type="button" onClick={() => onNavigate("sources")}>Manage sources <ChevronRight /></button></section>
    </div>
    <div className="ao-section-grid ao-section-grid--two">
      <section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Applications</div><h2>Keep every outcome in one place</h2></div><button className="ao-text-link" type="button" onClick={() => onNavigate("applications")}>View all <ChevronRight /></button></div>{!hasApplications ? <EmptyState icon={ClipboardList} title="No applications yet" body="Your first packet will appear here with its status and receipt." action={<button className="ao-button ao-button--outline" type="button" onClick={onCreate}>Create an application <Plus /></button>} /> : <div className="ao-list">{snapshot.applications.slice(0, 2).map(({ application, template }) => <button className="ao-list-row ao-list-row--button" type="button" key={application.id} onClick={() => onNavigate("applications")}><span className="ao-list-icon ao-list-icon--indigo"><GraduationCap /></span><span className="ao-list-copy"><strong>{template.name}</strong><small>{template.category} · updated {formatDate(application.updatedAt)}</small></span><StatusPill status={application.status} /><ChevronRight className="ao-list-chevron" /></button>)}{snapshot.partnerApplications.slice(0, 2).map(({ submission, form, organization }) => <button className="ao-list-row ao-list-row--button" type="button" key={submission.id} onClick={() => onNavigate("applications")}><span className="ao-list-icon ao-list-icon--mint"><Link2 /></span><span className="ao-list-copy"><strong>{form.name}</strong><small>{organization.name} · updated {formatDate(submission.updatedAt)}</small></span><StatusPill status={submission.status} /><ChevronRight className="ao-list-chevron" /></button>)}</div>}</section>
      <section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Connected sources</div><h2>Trusted by you</h2></div><button className="ao-text-link" type="button" onClick={() => onNavigate("sources")}>Manage <ChevronRight /></button></div><div className="ao-list">{snapshot.connections.slice(0, 4).map((connection) => <button className="ao-list-row ao-list-row--button" type="button" key={connection.id ?? connection.provider} onClick={() => onNavigate("sources")}><span className="ao-list-icon ao-list-icon--mint"><Link2 /></span><span className="ao-list-copy"><strong>{connection.displayName}</strong><small>Verified {formatDate(connection.lastVerifiedAt)}</small></span><StatusPill status={connection.status} /></button>)}</div></section>
    </div>
    <section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Recent activity</div><h2>Nothing gets lost after you apply</h2></div><button className="ao-text-link" type="button" onClick={() => onNavigate("consents")}>See consent history <ChevronRight /></button></div><div className="ao-timeline">{snapshot.events.slice(0, 4).map((event) => <div className="ao-timeline-row" key={event.id}><span className="ao-timeline-dot"><Check /></span><div><strong>{event.title}</strong><span>{event.description}</span></div><time>{formatDate(event.occurredAt)}</time></div>)}{snapshot.events.length === 0 ? <EmptyState icon={Sparkles} title="Your timeline is quiet" body="Application and privacy events will appear here." /> : null}</div></section>
  </AnimatedPanel>;
}

function ProfileView({ snapshot, onSaved }: { snapshot: Snapshot; onSaved: (message: string) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(() => profileFormFromSnapshot(snapshot.profile));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function updateField<Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSaveError("");
  }

  async function persist(closeAfterSave: boolean) {
    if (!dirty || saving) {
      if (closeAfterSave && !saving) setEditing(false);
      return;
    }
    const annualIncome = form.annualIncome.trim() ? Number(form.annualIncome.replaceAll(",", "")) : null;
    if (annualIncome !== null && (!Number.isFinite(annualIncome) || annualIncome < 0)) {
      setSaveError("Enter a valid non-negative annual income.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: form.phone.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          category: form.category.trim() || null,
          annualIncomePaise: annualIncome === null ? null : Math.round(annualIncome * 100),
          metadata: {
            currentAddress: form.currentAddress.trim() || null,
            permanentAddress: form.permanentAddress.trim() || null,
            postalCode: form.postalCode.trim() || null,
            parentName: form.parentName.trim() || null,
            parentPhone: form.parentPhone.trim() || null,
            guardianName: form.guardianName.trim() || null,
            highestQualification: form.highestQualification.trim() || null,
            currentInstitution: form.currentInstitution.trim() || null,
            class10Board: form.class10Board.trim() || null,
            class10Year: form.class10Year.trim() || null,
            class12Board: form.class12Board.trim() || null,
            class12Year: form.class12Year.trim() || null,
            employmentStatus: form.employmentStatus.trim() || null,
            employer: form.employer.trim() || null,
            disabilityStatus: form.disabilityStatus.trim() || null,
            identifierReference: form.identifierReference.trim() || null,
          },
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "We could not save your profile yet.");
      setDirty(false);
      if (closeAfterSave) setEditing(false);
      setSavedAt(new Date().toISOString());
      await onSaved(closeAfterSave ? "Profile details saved securely." : "Profile changes autosaved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "We could not save your profile yet.");
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    await persist(true);
  }

  const autosave = () => {
    if (dirty && !saving) void persist(false);
  };
  const claimRows = snapshot.claims;
  return (
    <AnimatedPanel className="ao-view-stack">
      <div className="ao-view-heading">
        <div>
          <span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Personal information</span>
          <h1>Your reusable profile.</h1>
          <p>Review the information you can carry into your next application.</p>
        </div>
        <button
          className="ao-button ao-button--outline"
          type="button"
          onClick={() => {
            if (editing) {
              setForm(profileFormFromSnapshot(snapshot.profile));
              setDirty(false);
              setSaveError("");
            }
            setEditing((value) => !value);
          }}
        >
          {editing ? "Cancel editing" : "Edit details"}{editing ? <X /> : <Pencil />}
        </button>
      </div>

      {savedAt && !editing ? <div className="ao-inline-success" role="status"><CheckCircle2 /> Saved {formatDate(savedAt)}. Your profile is ready to reuse.</div> : null}

      {editing ? (
        <form className="ao-product-card ao-form-card" onSubmit={(event) => void save(event)} noValidate>
          <div className="ao-card-heading"><div><div className="ao-card-kicker">Edit profile details</div><h2>Keep your reusable packet current.</h2></div><span className="ao-verified-label"><LockKeyhole /> Private to you</span></div>
          <p className="ao-form-intro">Changes autosave when you leave a field. Nothing is shared until you approve a specific application.</p>
          <fieldset className="ao-profile-fieldset">
            <legend>Identity and contact</legend>
            <div className="ao-form-grid">
              <label>Mobile number<input value={form.phone} onBlur={autosave} onChange={(event) => updateField("phone", event.target.value)} placeholder="Add a mobile number" autoComplete="tel" /></label>
              <label>Date of birth<input type="date" value={form.dateOfBirth} onBlur={autosave} onChange={(event) => updateField("dateOfBirth", event.target.value)} /></label>
              <label>Category<input value={form.category} onBlur={autosave} onChange={(event) => updateField("category", event.target.value)} placeholder="General" /></label>
              <label>Disability or accommodation details<input value={form.disabilityStatus} onBlur={autosave} onChange={(event) => updateField("disabilityStatus", event.target.value)} placeholder="Not applicable" /></label>
              <label className="ao-span-full">Masked identifier reference<input value={form.identifierReference} onBlur={autosave} onChange={(event) => updateField("identifierReference", event.target.value)} placeholder="Example: PAN ending 1234" /><small>Store a masked reference only. Do not enter a full Aadhaar number.</small></label>
            </div>
          </fieldset>
          <fieldset className="ao-profile-fieldset">
            <legend>Address</legend>
            <div className="ao-form-grid">
              <label className="ao-span-full">Current address<textarea value={form.currentAddress} onBlur={autosave} onChange={(event) => updateField("currentAddress", event.target.value)} placeholder="House, street and locality" /></label>
              <label>City<input value={form.city} onBlur={autosave} onChange={(event) => updateField("city", event.target.value)} placeholder="Pune" autoComplete="address-level2" /></label>
              <label>State<input value={form.state} onBlur={autosave} onChange={(event) => updateField("state", event.target.value)} placeholder="Maharashtra" autoComplete="address-level1" /></label>
              <label>Postal code<input value={form.postalCode} onBlur={autosave} onChange={(event) => updateField("postalCode", event.target.value)} placeholder="411001" inputMode="numeric" /></label>
              <label className="ao-span-full">Permanent address<textarea value={form.permanentAddress} onBlur={autosave} onChange={(event) => updateField("permanentAddress", event.target.value)} placeholder="Leave blank if the same as current address" /></label>
            </div>
          </fieldset>
          <fieldset className="ao-profile-fieldset">
            <legend>Family and household</legend>
            <div className="ao-form-grid">
              <label>Parent name<input value={form.parentName} onBlur={autosave} onChange={(event) => updateField("parentName", event.target.value)} /></label>
              <label>Parent mobile<input value={form.parentPhone} onBlur={autosave} onChange={(event) => updateField("parentPhone", event.target.value)} autoComplete="tel" /></label>
              <label>Guardian name<input value={form.guardianName} onBlur={autosave} onChange={(event) => updateField("guardianName", event.target.value)} /></label>
              <label>Annual family income (₹)<input inputMode="decimal" value={form.annualIncome} onBlur={autosave} onChange={(event) => updateField("annualIncome", event.target.value)} placeholder="480000" /></label>
            </div>
          </fieldset>
          <fieldset className="ao-profile-fieldset">
            <legend>Education</legend>
            <div className="ao-form-grid">
              <label>Highest qualification<input value={form.highestQualification} onBlur={autosave} onChange={(event) => updateField("highestQualification", event.target.value)} placeholder="Class 12" /></label>
              <label>Current institution<input value={form.currentInstitution} onBlur={autosave} onChange={(event) => updateField("currentInstitution", event.target.value)} /></label>
              <label>Class 10 board<input value={form.class10Board} onBlur={autosave} onChange={(event) => updateField("class10Board", event.target.value)} /></label>
              <label>Class 10 passing year<input value={form.class10Year} onBlur={autosave} onChange={(event) => updateField("class10Year", event.target.value)} inputMode="numeric" /></label>
              <label>Class 12 board<input value={form.class12Board} onBlur={autosave} onChange={(event) => updateField("class12Board", event.target.value)} /></label>
              <label>Class 12 passing year<input value={form.class12Year} onBlur={autosave} onChange={(event) => updateField("class12Year", event.target.value)} inputMode="numeric" /></label>
            </div>
          </fieldset>
          <fieldset className="ao-profile-fieldset">
            <legend>Employment</legend>
            <div className="ao-form-grid">
              <label>Employment status<input value={form.employmentStatus} onBlur={autosave} onChange={(event) => updateField("employmentStatus", event.target.value)} placeholder="Student" /></label>
              <label>Employer<input value={form.employer} onBlur={autosave} onChange={(event) => updateField("employer", event.target.value)} /></label>
            </div>
          </fieldset>
          {saveError ? <div className="ao-inline-form-error" role="alert"><CircleAlert /> {saveError}</div> : null}
          <div className="ao-form-actions">
            <span className="ao-form-help"><LockKeyhole /> Only you can change these details.</span>
            <div className="ao-inline-actions">
              <button className="ao-button ao-button--quiet" type="button" onClick={() => { setForm(profileFormFromSnapshot(snapshot.profile)); setDirty(false); setSaveError(""); setEditing(false); }}>Discard</button>
              <button className="ao-button ao-button--primary" type="submit" disabled={saving}>{saving ? "Saving..." : dirty ? "Save changes" : "Done"}<Check /></button>
            </div>
          </div>
        </form>
      ) : null}

      <section className="ao-product-card ao-profile-wallet-card">
        <div className="ao-card-heading">
          <div><div className="ao-card-kicker">Profile wallet</div><h2>{snapshot.profile.fullName}</h2></div>
          <span className="ao-verified-label"><BadgeCheck /> Identity boundary active</span>
        </div>
        <p className="ao-profile-lede">Your identity stays anchored to your signed-in account. Reusable details remain visible, editable, and source-aware.</p>
        <div className="ao-detail-grid">
          <div><span>Email address</span><strong>{snapshot.profile.email}</strong></div>
          <div><span>Mobile number</span><strong>{snapshot.profile.phone ?? "Not added"}</strong></div>
          <div><span>Date of birth</span><strong>{formatDate(snapshot.profile.dateOfBirth)}</strong></div>
          <div><span>Location</span><strong>{[snapshot.profile.city, snapshot.profile.state].filter(Boolean).join(", ") || "Not added"}</strong></div>
          <div><span>Category</span><strong>{snapshot.profile.category ?? "Not added"}</strong></div>
          <div><span>Annual family income</span><strong>{formatIncome(snapshot.profile.annualIncomePaise)}</strong></div>
          <div><span>Current institution</span><strong>{metadataString(snapshot.profile, "currentInstitution") || "Not added"}</strong></div>
          <div><span>Highest qualification</span><strong>{metadataString(snapshot.profile, "highestQualification") || "Not added"}</strong></div>
          <div><span>Parent or guardian</span><strong>{metadataString(snapshot.profile, "parentName") || metadataString(snapshot.profile, "guardianName") || "Not added"}</strong></div>
          <div><span>Current address</span><strong>{metadataString(snapshot.profile, "currentAddress") || "Not added"}</strong></div>
          <div><span>Employment status</span><strong>{metadataString(snapshot.profile, "employmentStatus") || "Not added"}</strong></div>
          <div><span>Masked identifier</span><strong>{metadataString(snapshot.profile, "identifierReference") || "Not added"}</strong></div>
        </div>
        <div className="ao-profile-updated"><CheckCircle2 /> Last saved {formatDate(snapshot.profile.updatedAt)} · Edit any non-verified detail before your next application.</div>
      </section>

      <section className="ao-product-card">
        <div className="ao-card-heading"><div><div className="ao-card-kicker">Verified claims</div><h2>Every value has a source</h2></div><span className="ao-card-meta">{claimRows.length} available</span></div>
        <div className="ao-claims-grid">{claimRows.map(({ claim, sourceLabel }) => <div className="ao-claim" key={claim.key}><div><span>{claim.label}</span><strong>{claim.valueText}</strong></div><div className="ao-claim-meta"><BadgeCheck /> {sourceLabel ?? "Profile details"}<small>{claim.confidence}% match</small></div></div>)}</div>
        {claimRows.length === 0 ? <EmptyState icon={Fingerprint} title="No claims yet" body="Connect a source to begin building your reusable profile." /> : null}
      </section>
    </AnimatedPanel>
  );
}

function SourcesView({ snapshot, onRefresh, onSaved }: { snapshot: Snapshot; onRefresh: () => Promise<boolean>; onSaved: (message: string) => void }) {
  const providers: Array<{ id: Exclude<SourceProvider, "profile">; name: string; detail: string; state: string; disclosure: string }> = [
    { id: "digilocker", name: "DigiLocker", detail: "Certificates and official documents", state: "Approval pending", disclosure: "Requester onboarding, agreement, credentials, and production approval are not complete." },
    { id: "meripehchaan", name: "MeriPehchaan", detail: "Approved authentication and identity claims", state: "Approval pending", disclosure: "This will be an authentication adapter after official partner approval, not a universal document source." },
    { id: "apaar", name: "APAAR", detail: "Academic record and achievements", state: "Unavailable", disclosure: "Documented third-party production access is not currently approved." },
  ];
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  async function disconnect(provider: string, name: string) {
    setDisconnecting(provider);
    try {
      const response = await fetch(`/api/sources/${provider}/disconnect`, { method: "DELETE" });
      if (response.ok) { const refreshed = await onRefresh(); onSaved(refreshed ? `${name} was disconnected. Existing consent records remain visible.` : "The source was disconnected, but the workspace could not refresh. Reload to see it."); } else onSaved(`${name} could not be disconnected yet.`);
    } catch {
      onSaved(`${name} could not be disconnected. Check your connection and try again.`);
    } finally {
      setDisconnecting(null);
    }
  }
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Connected sources</span><h1>Your information, on your terms.</h1><p>Connect sources only when an application needs them. You can disconnect at any time.</p></div><button className="ao-button ao-button--outline" type="button" onClick={async () => { setRefreshing(true); try { await onRefresh(); onSaved("Source status refreshed."); } catch { onSaved("Source status could not be refreshed."); } finally { setRefreshing(false); } }} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh status"} <Sparkles /></button></div><div className="ao-info-banner"><ShieldCheck /><div><strong>ApplyOnce never shares a source by default.</strong><span>Every application asks for a separate, purpose-bound consent before a value moves.</span></div></div><div className="ao-source-grid">{providers.map(({ id, name, detail, state, disclosure }) => { const existing = snapshot.connections.find((connection) => connection.provider === id); return <section className="ao-source-card" key={id}><div className="ao-source-card-head"><SourceMark provider={id} size="md" /><StatusPill status={existing?.status ?? state} /></div><h2>{name}</h2><p>{detail}</p><div className="ao-source-card-footer"><span>{existing?.lastVerifiedAt ? `Last checked ${formatDate(existing.lastVerifiedAt)}` : state}</span>{existing && existing.status !== "disconnected" ? <button className="ao-button ao-button--quiet" type="button" onClick={() => void disconnect(id, name)} disabled={disconnecting === id}>{disconnecting === id ? "Disconnecting..." : "Disconnect source"}<X /></button> : <button className="ao-button ao-button--primary" type="button" disabled aria-describedby={`${id}-connector-status`}>{state}<LockKeyhole /></button>}</div><small className="ao-source-disclosure" id={`${id}-connector-status`}>{disclosure}</small></section>; })}</div></AnimatedPanel>;
}

function DocumentsView({ snapshot, onUpload, onDownload, onDelete, uploading }: { snapshot: Snapshot; onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>; onDownload: (document: Snapshot["documents"][number]) => Promise<void>; onDelete: (document: Snapshot["documents"][number]) => Promise<void>; uploading: boolean }) {
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [busyDocument, setBusyDocument] = useState<string | null>(null);

  async function download(document: Snapshot["documents"][number]) {
    setBusyDocument(document.id);
    try { await onDownload(document); } catch { /* The parent reports the actionable error. */ } finally { setBusyDocument(null); }
  }

  async function remove(document: Snapshot["documents"][number]) {
    setBusyDocument(document.id);
    try { await onDelete(document); setDeleteCandidate(null); } catch { /* The parent reports the actionable error. */ } finally { setBusyDocument(null); }
  }

  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Private documents</span><h1>Keep your proof close.</h1><p>Files are stored privately and only shared with an application you approve.</p></div><label className="ao-button ao-button--primary"><CloudUpload /> {uploading ? "Uploading..." : "Add document"}<input className="ao-hidden-input" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => void onUpload(event)} disabled={uploading} /></label></div><div className="ao-info-banner ao-info-banner--mint"><LockKeyhole /><div><strong>Private storage is active.</strong><span>PDF, JPG, and PNG files up to 10 MB are accepted. Your files do not appear in public demos.</span></div></div><section className="ao-product-card">{snapshot.documents.length === 0 ? <EmptyState icon={FileText} title="No documents yet" body="Add a marksheet, certificate, or identity document when you are ready." action={<label className="ao-button ao-button--outline">Upload a document <input className="ao-hidden-input" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => void onUpload(event)} disabled={uploading} /></label>} /> : <div className="ao-document-list">{snapshot.documents.map((document) => <div className="ao-document-row" key={document.id}><span className="ao-list-icon ao-list-icon--mint"><FileText /></span><div className="ao-list-copy"><strong>{document.title}</strong><small>{document.documentType.replaceAll("_", " ")} · updated {formatDate(document.updatedAt)}</small></div><StatusPill status={document.status} /><span className="ao-document-provider">{document.provider}</span><div className="ao-document-actions">{deleteCandidate === document.id ? <><button className="ao-button ao-button--danger" type="button" onClick={() => void remove(document)} disabled={busyDocument === document.id}>{busyDocument === document.id ? "Removing..." : "Delete document"}</button><button className="ao-button ao-button--quiet" type="button" onClick={() => setDeleteCandidate(null)} disabled={busyDocument === document.id}>Keep it</button></> : <><button className="ao-button ao-button--quiet" type="button" onClick={() => void download(document)} disabled={busyDocument === document.id}>{busyDocument === document.id ? "Opening..." : "Download"}<Download /></button><button className="ao-button ao-button--quiet ao-document-delete" type="button" onClick={() => setDeleteCandidate(document.id)} disabled={busyDocument === document.id}>Delete</button></>}</div></div>)}</div>}</section></AnimatedPanel>;
}

function ApplicationsView({ snapshot, onCreate, creating, onOpen, onOpenPartner }: { snapshot: Snapshot; onCreate: () => void; creating: boolean; onOpen: (id: string) => void; onOpenPartner: (application: PartnerApplication) => void }) {
  const hasApplications = snapshot.applications.length > 0 || snapshot.partnerApplications.length > 0;
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Your applications</span><h1>Every application, accounted for.</h1><p>Government, private, and partner applications stay together with their status, consent, and receipt.</p></div><button className="ao-button ao-button--primary" onClick={onCreate} disabled={creating}>{creating ? "Preparing..." : "New application"}<Plus /></button></div>{!hasApplications ? <section className="ao-product-card"><EmptyState icon={ClipboardList} title="Your application shelf is empty" body="Create a packet from your reusable profile or open a partner form to start your first application." action={<button className="ao-button ao-button--primary" onClick={onCreate}>Prepare first packet <ArrowRight /></button>} /></section> : <><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">ApplyOnce packets</div><h2>Reusable profile applications</h2></div><span className="ao-card-meta">{snapshot.applications.length} total</span></div><div className="ao-application-grid">{snapshot.applications.length === 0 ? <div className="ao-application-empty-note">No ApplyOnce packet yet. Start one when you want to reuse your profile.</div> : snapshot.applications.map(({ application, template }) => <button className="ao-application-card" key={application.id} onClick={() => onOpen(application.id)}><div className="ao-application-card-top"><span className="ao-list-icon ao-list-icon--indigo"><GraduationCap /></span><StatusPill status={application.status} /></div><h2>{template.name}</h2><p>{template.description ?? `${template.category} application packet`}</p><div className="ao-application-progress"><span><strong>{application.readinessScore}%</strong> ready</span><span>{application.readyFieldCount}/{application.totalFieldCount} fields</span></div><div className="ao-progress-track"><span style={{ width: `${application.readinessScore}%` }} /></div><div className="ao-application-card-footer"><span>{application.receiptCode ? `Receipt ${application.receiptCode}` : `Updated ${formatDate(application.updatedAt)}`}</span><ChevronRight /></div></button>)}</div></section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Partner applications</div><h2>Forms you completed elsewhere</h2></div><span className="ao-card-meta">{snapshot.partnerApplications.length} total</span></div><div className="ao-application-grid">{snapshot.partnerApplications.length === 0 ? <div className="ao-application-empty-note">Partner applications will appear here after you submit an ApplyOnce hosted form.</div> : snapshot.partnerApplications.map((item) => <button className="ao-application-card ao-application-card--partner" key={item.submission.id} onClick={() => onOpenPartner(item)}><div className="ao-application-card-top"><span className="ao-list-icon ao-list-icon--mint"><Link2 /></span><StatusPill status={item.submission.status} /></div><h2>{item.form.name}</h2><p>{item.organization.name} · {item.form.description}</p><div className="ao-application-progress"><span><strong>{Object.keys(item.submission.data).length}</strong> fields shared</span><span>{item.submission.documentIds.length} documents</span></div><div className="ao-progress-track"><span style={{ width: item.submission.status === "completed" || item.submission.status === "accepted" ? "100%" : item.submission.status === "needs_documents" ? "55%" : "78%" }} /></div><div className="ao-application-card-footer"><span>Receipt {item.submission.receiptCode}</span><ChevronRight /></div></button>)}</div></section></>}</AnimatedPanel>;
}

function PartnerApplicationDetail({ application, snapshot, onBack, onNavigate }: { application: PartnerApplication; snapshot: Snapshot; onBack: () => void; onNavigate: (view: CitizenView) => void }) {
  const { submission, form, organization } = application;
  const events = snapshot.events.filter((event) => event.metadata?.submissionId === submission.id);
  const fieldLabels = new Map(form.formSchema.fields.map((field) => [field.key, field.label]));
  const sharedDocuments = snapshot.documents.filter((document) => submission.documentIds.includes(document.id));
  function downloadReceipt() {
    const receipt = { receiptCode: submission.receiptCode, application: form.name, organization: organization.name, applicant: submission.applicantName, submittedAt: submission.createdAt, status: submission.status, sharedFields: submission.data, sharedDocuments: sharedDocuments.map((document) => document.title), consentId: submission.partnerConsentId };
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${submission.receiptCode.toLowerCase()}-receipt.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <AnimatedPanel className="ao-view-stack"><button className="ao-back-link" onClick={onBack}>← Back to applications</button><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Partner application</span><h1>{form.name}</h1><p>{organization.name} · submitted {formatDate(submission.createdAt)}</p></div><StatusPill status={submission.status} /></div><div className="ao-application-detail-grid"><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Application receipt</div><h2>{submission.receiptCode}</h2></div><span className="ao-verified-label"><BadgeCheck /> Consent recorded</span></div><div className="ao-detail-grid"><div><span>Applicant</span><strong>{submission.applicantName}</strong></div><div><span>Organization</span><strong>{organization.name}</strong></div><div><span>Submitted</span><strong>{formatDate(submission.createdAt)}</strong></div><div><span>Form version</span><strong>v{form.version}</strong></div></div><div className="ao-form-actions"><button className="ao-button ao-button--outline" onClick={downloadReceipt}><CloudUpload /> Download receipt</button><button className="ao-button ao-button--quiet" onClick={() => onNavigate("consents")}>Review consent <ShieldCheck /></button></div></section><aside className="ao-product-card ao-consent-card"><div className="ao-card-kicker">Purpose-bound sharing</div><h2>Here is what moved.</h2><p>{organization.name} requested this information to {form.purpose.toLowerCase().replace(/\.$/, "")}.</p><div className="ao-consent-summary"><div><span>Fields</span><strong>{Object.keys(submission.data).length}</strong></div><div><span>Documents</span><strong>{submission.documentIds.length}</strong></div><div><span>Control</span><strong>Yours</strong></div></div><button className="ao-button ao-button--primary ao-button--full" onClick={() => onNavigate("consents")}>Open consent history <ShieldCheck /></button><p className="ao-card-footnote"><LockKeyhole /> Revoking consent blocks future sharing attempts.</p></aside></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Shared information</div><h2>Review the submitted values</h2></div><span className="ao-card-meta">Read only</span></div><div className="ao-field-list">{Object.entries(submission.data).map(([key, value]) => <div className="ao-field-row ao-field-row--confirmed" key={key}><div className="ao-field-main"><span className="ao-field-label">{fieldLabels.get(key) ?? key}</span><strong>{value || "Not provided"}</strong><span className="ao-field-source"><BadgeCheck /> Approved for this form</span></div><span className="ao-field-confirmed"><CheckCircle2 /> Shared</span></div>)}</div>{Object.keys(submission.data).length === 0 ? <EmptyState icon={FileText} title="No field values were submitted" body="This receipt does not contain any reusable field values." /> : null}</section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Documents shared</div><h2>Private proof attached to this application</h2></div><span className="ao-card-meta">{sharedDocuments.length} attached</span></div>{sharedDocuments.length === 0 ? <div className="ao-application-empty-note">No private documents were attached. The partner may request one later.</div> : <div className="ao-document-list">{sharedDocuments.map((document) => <div className="ao-document-row" key={document.id}><span className="ao-list-icon ao-list-icon--mint"><FileText /></span><div className="ao-list-copy"><strong>{document.title}</strong><small>{document.documentType.replaceAll("_", " ")} · private source</small></div><StatusPill status={document.status} /></div>)}</div>}</section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Status timeline</div><h2>What happens next</h2></div><span className="ao-mono-label">{submission.receiptCode}</span></div><div className="ao-timeline">{events.map((event) => <div className="ao-timeline-row" key={event.id}><span className="ao-timeline-dot"><Check /></span><div><strong>{event.title}</strong><span>{event.description}</span></div><time>{formatDate(event.occurredAt)}</time></div>)}{events.length === 0 ? <div className="ao-application-empty-note">Status updates will appear here as the partner reviews your application.</div> : null}</div></section></AnimatedPanel>;
}

function ApplicationDetail({ detail, onBack, onRefresh, onSaved }: { detail: ApplicationDetail; onBack: () => void; onRefresh: () => Promise<void>; onSaved: (message: string) => void }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [affirmationOpen, setAffirmationOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [receiptCode, setReceiptCode] = useState<string | null>(detail.application.receiptCode);
  const [submittedAt, setSubmittedAt] = useState<string | null>(detail.application.submittedAt ?? null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptCopied, setReceiptCopied] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const unresolved = detail.fields.filter((field) => field.state === "missing" || field.state === "needs_confirmation");

  async function confirmField(field: ApplicationDetail["fields"][number]) {
    if (!field.valueText) return;
    setConfirming(field.requirementKey);
    try {
      const response = await fetch(`/api/applications/${detail.application.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requirementKey: field.requirementKey, valueText: field.valueText }),
      });
      if (!response.ok) throw new Error("This field could not be confirmed.");
      await onRefresh();
      onSaved(`${field.label} confirmed for this application.`);
    } catch (error) {
      onSaved(error instanceof Error ? error.message : "This field could not be confirmed. Check your connection and try again.");
    } finally {
      setConfirming(null);
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/applications/${detail.application.id}/submit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          purpose: `${detail.template.name} application`,
          scope: detail.fields.map((field) => field.requirementKey),
          method: "manual",
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; application?: { application?: { receiptCode?: string | null; submittedAt?: string | null } } } | null;
      if (!response.ok || !body?.application?.application) throw new Error(body?.error ?? "The application could not be submitted.");
      setReceiptCode(body.application.application.receiptCode ?? null);
      setSubmittedAt(body.application.application.submittedAt ?? new Date().toISOString());
      setAffirmationOpen(false);
      onSaved("ApplyOnce submission confirmed. Your receipt is ready.");
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The application could not be submitted.";
      setSubmitError(`${message} Your reviewed draft is still saved.`);
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadReceipt() {
    setReceiptBusy(true);
    try {
      const response = await fetch(`/api/applications/${detail.application.id}/receipt`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as { receipt?: Record<string, unknown>; error?: string } | null;
      if (!response.ok || !body?.receipt) throw new Error(body?.error ?? "The receipt could not be prepared.");
      triggerDownload(new Blob([JSON.stringify(body.receipt, null, 2)], { type: "application/json" }), `${(body.receipt.receiptCode as string | undefined)?.toLowerCase() ?? "applyonce"}-receipt.json`);
      onSaved("Receipt downloaded.");
    } catch (error) {
      onSaved(error instanceof Error ? error.message : "The receipt could not be downloaded.");
    } finally {
      setReceiptBusy(false);
    }
  }

  async function copyReceipt() {
    if (!receiptCode) return;
    try {
      if (!await copyText(receiptCode)) throw new Error("Copy is unavailable in this browser.");
      setReceiptCopied(true);
      onSaved("Receipt ID copied.");
      window.setTimeout(() => setReceiptCopied(false), 2200);
    } catch (error) {
      onSaved(error instanceof Error ? error.message : "Receipt ID could not be copied.");
    }
  }

  const submitted = detail.application.status === "submitted" || detail.application.status === "accepted" || Boolean(receiptCode);

  return (
    <AnimatedPanel className="ao-view-stack">
      <button className="ao-back-link" type="button" onClick={onBack}>← Back to applications</button>
      <div className="ao-view-heading">
        <div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Application review</span><h1>{detail.template.name}</h1><p>{detail.template.description}</p></div>
        <StatusPill status={submitted ? "submitted" : detail.application.status} />
      </div>
      <div className="ao-application-detail-grid">
        <section className="ao-product-card">
          <div className="ao-card-heading"><div><div className="ao-card-kicker">Review before sharing</div><h2>{submitted ? "Your packet is complete." : `${detail.application.readinessScore}% ready to go`}</h2></div><span className="ao-verified-label"><BadgeCheck /> Source-aware</span></div>
          <div className="ao-progress-track ao-progress-track--large"><span style={{ width: `${submitted ? 100 : detail.application.readinessScore}%` }} /></div>
          <div className="ao-field-list">
            {detail.fields.map((field) => <div className={`ao-field-row ao-field-row--${field.state}`} key={field.id}><div className="ao-field-main"><span className="ao-field-label">{field.label}</span><strong>{field.valueText ?? "Needs your input"}</strong><span className="ao-field-source">{field.sourceLabel ? <><BadgeCheck /> {field.sourceLabel}</> : <><CircleAlert /> Citizen input required</>}</span></div>{!submitted && field.state === "needs_confirmation" ? <button className="ao-button ao-button--outline" type="button" onClick={() => void confirmField(field)} disabled={confirming === field.requirementKey}>{confirming === field.requirementKey ? "Saving..." : "Confirm"}<Check /></button> : field.state === "confirmed" || field.state === "prefilled" ? <span className="ao-field-confirmed"><CheckCircle2 /> Ready</span> : null}</div>)}
          </div>
        </section>
        <aside className="ao-product-card ao-consent-card">
          <div className="ao-card-kicker">{submitted ? "Submission confirmed" : "Purpose-bound consent"}</div>
          {submitted ? (
            <div className="ao-submission-confirmation" role="status" aria-live="polite">
              <span className="ao-submission-confirmation-mark"><Check /></span>
              <h2>ApplyOnce submission confirmed.</h2>
              <p>Your approved packet is safely recorded in ApplyOnce. This receipt does not claim that {detail.template.externalPortalName} has received it.</p>
              <div className="ao-receipt-id-card"><span>Receipt ID</span><strong>{receiptCode ?? "Preparing receipt"}</strong><small>{submittedAt ? `Submitted ${formatDate(submittedAt)}` : "Submitted just now"}</small></div>
              <div className="ao-inline-actions ao-receipt-actions"><button className="ao-button ao-button--outline" type="button" onClick={() => void downloadReceipt()} disabled={receiptBusy}>{receiptBusy ? "Preparing..." : "Download receipt"}<Download /></button><button className="ao-button ao-button--quiet" type="button" onClick={() => void copyReceipt()} disabled={!receiptCode}>{receiptCopied ? "Copied" : "Copy ID"}<Copy /></button><button className="ao-button ao-button--quiet" type="button" onClick={() => window.print()}>Print</button></div>
            </div>
          ) : (
            <>
              <h2>Only share what this application needs.</h2>
              <p>Review the exact scope before ApplyOnce records the packet for {detail.template.externalPortalName}.</p>
              <div className="ao-consent-summary"><div><span>Fields</span><strong>{detail.fields.length}</strong></div><div><span>Documents</span><strong>0</strong></div><div><span>Unresolved</span><strong>{unresolved.length}</strong></div></div>
              <label className="ao-consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I reviewed the fields and want to open the final sharing affirmation.</span></label>
              {unresolved.length > 0 ? <div className="ao-consent-blocker"><CircleAlert /> Confirm {unresolved.length} remaining {unresolved.length === 1 ? "field" : "fields"} before submission.</div> : null}
              <button className="ao-button ao-button--primary ao-button--full" type="button" disabled={!consent || unresolved.length > 0} title={unresolved.length > 0 ? "Confirm every required field first" : !consent ? "Review and select the affirmation checkbox first" : undefined} onClick={() => setAffirmationOpen(true)}>Review sharing scope<ArrowRight /></button>
            </>
          )}
          <p className="ao-card-footnote"><LockKeyhole /> Revocation blocks future ApplyOnce access; it does not erase an already submitted copy.</p>
        </aside>
      </div>
      <section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Application timeline</div><h2>What happened</h2></div>{receiptCode ? <span className="ao-mono-label">{receiptCode}</span> : null}</div><div className="ao-timeline">{detail.events.map((event) => <div className="ao-timeline-row" key={event.id}><span className="ao-timeline-dot"><Check /></span><div><strong>{event.title}</strong><span>{event.description}</span></div><time>{formatDate(event.occurredAt)}</time></div>)}{detail.events.length === 0 ? <EmptyState icon={ClipboardList} title="No timeline events yet" body="The application timeline will appear here after your first review action." /> : null}</div></section>
      {affirmationOpen ? (
        <div className="ao-modal-backdrop" role="presentation">
          <section className="ao-modal ao-affirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="application-affirmation-title">
            <div className="ao-dialog-head"><div><div className="ao-card-kicker">Final affirmation</div><h2 id="application-affirmation-title">Share {detail.fields.length} fields with this application?</h2></div><button className="ao-icon-danger" type="button" onClick={() => setAffirmationOpen(false)} disabled={submitting} aria-label="Close affirmation"><X /></button></div>
            <p className="ao-modal-lede">ApplyOnce will create an immutable submission snapshot, consent record, timeline event, and receipt. No external portal receipt is claimed.</p>
            <div className="ao-affirmation-scope">
              <div><span>Intended destination</span><strong>{detail.template.externalPortalName}</strong></div>
              <div><span>Purpose</span><strong>{detail.template.name} application</strong></div>
              <div><span>Shared now</span><strong>{detail.fields.length} fields · 0 documents</strong></div>
              <div><span>Future access</span><strong>Blocked if you revoke consent</strong></div>
            </div>
            {submitError ? <div className="ao-inline-form-error" role="alert"><CircleAlert /> {submitError}</div> : null}
            <div className="ao-modal-actions"><button className="ao-button ao-button--quiet" type="button" onClick={() => setAffirmationOpen(false)} disabled={submitting}>Go back and review</button><button className="ao-button ao-button--primary" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? "Recording securely..." : "Confirm, share and submit"}<ShieldCheck /></button></div>
          </section>
        </div>
      ) : null}
    </AnimatedPanel>
  );
}

function ConsentsView({ onSaved }: { onSaved: (message: string) => void }) {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  async function load() { setLoading(true); const response = await fetch("/api/consents", { cache: "no-store" }); if (response.ok) { const body = (await response.json()) as { consents: Consent[]; partnerConsents?: Consent[] }; setConsents([...body.consents, ...(body.partnerConsents ?? []).map((consent) => ({ ...consent, formId: consent.formId ?? null }))]); } setLoading(false); }
  useEffect(() => {
    let active = true;
    fetch("/api/consents", { cache: "no-store" }).then(async (response) => {
      if (!active) return;
      if (response.ok) { const body = (await response.json()) as { consents: Consent[]; partnerConsents?: Consent[] }; setConsents([...body.consents, ...(body.partnerConsents ?? []).map((consent) => ({ ...consent, formId: consent.formId ?? null }))]); }
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  async function revoke(id: string) {
    const consent = consents.find((item) => item.id === id);
    if (!consent || consent.revokedAt) return;
    setRevoking(id);
    try {
      const response = await fetch(`/api/consents/${id}/revoke`, { method: "POST" });
      if (response.ok) { await load(); onSaved("Future access for this application was revoked."); } else onSaved("We could not revoke this consent yet.");
    } catch {
      onSaved("We could not revoke this consent. Check your connection and try again.");
    } finally {
      setRevoking(null);
    }
  }
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Consent history</span><h1>Know what moved.</h1><p>A human-readable record of the information you approved for each application.</p></div><ShieldCheck className="ao-heading-icon" /></div><section className="ao-product-card">{loading ? <div className="ao-loading-line">Loading your consent history...</div> : consents.length === 0 ? <EmptyState icon={ShieldCheck} title="No consent records yet" body="When you submit an application, its sharing scope will appear here." /> : <div className="ao-consent-list">{consents.map((consent) => <div className="ao-consent-row" key={consent.id}><span className={`ao-consent-icon ${consent.revokedAt ? "ao-consent-icon--revoked" : ""}`}>{consent.revokedAt ? <X /> : <Check />}</span><div className="ao-list-copy"><strong>{consent.purpose}</strong><small>{consent.scope.length} fields · approved {formatDate(consent.approvedAt)} · {consent.method} verification</small></div>{consent.revokedAt ? <span className="ao-revoked-label">Revoked {formatDate(consent.revokedAt)}</span> : <button className="ao-button ao-button--outline" type="button" onClick={() => void revoke(consent.id)} disabled={revoking === consent.id}>{revoking === consent.id ? "Revoking..." : "Revoke access"} <LockKeyhole /></button>}</div>)}</div>}</section></AnimatedPanel>;
}

function NotificationsView({ snapshot }: { snapshot: Snapshot }) {
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Notifications</span><h1>Updates that matter.</h1><p>Application and privacy updates stay together, without chasing inboxes.</p></div><Bell className="ao-heading-icon" /></div><section className="ao-product-card">{snapshot.notifications.length === 0 ? <EmptyState icon={Bell} title="No new updates" body="Application milestones and document requests will appear here." /> : <div className="ao-notification-list">{snapshot.notifications.map((notification) => <div className="ao-notification" key={notification.id}><span className="ao-notification-icon"><Bell /></span><div><strong>{notification.subject}</strong><p>{notification.body}</p><small>{formatDate(notification.createdAt)} · {notification.status}</small></div></div>)}</div>}</section></AnimatedPanel>;
}

function PeopleView({ snapshot, onNavigate }: { snapshot: Snapshot; onNavigate: (view: CitizenView) => void }) {
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> People and relationships</span><h1>Apply for the right person.</h1><p>Your account currently contains your own verified profile. Every application clearly identifies who it represents.</p></div><UsersRound className="ao-heading-icon" /></div><section className="ao-product-card ao-person-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Primary person</div><h2>{snapshot.profile.fullName}</h2></div><span className="ao-verified-label"><BadgeCheck /> Self</span></div><div className="ao-detail-grid"><div><span>Email</span><strong>{snapshot.profile.email}</strong></div><div><span>Mobile</span><strong>{snapshot.profile.phone ?? "Not added"}</strong></div><div><span>Relationship</span><strong>Account owner</strong></div><div><span>Profile updated</span><strong>{formatDate(snapshot.profile.updatedAt)}</strong></div></div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> Applications are always bound to a named person.</span><button className="ao-button ao-button--primary" type="button" onClick={() => onNavigate("profile")}>Open reusable profile<ArrowRight /></button></div></section><section className="ao-product-card"><div className="ao-card-kicker">Guardian safety boundary</div><h2>Dependants require a verified relationship.</h2><p>ApplyOnce will not create a child or delegated profile from an unverified local form. Relationship verification must be completed before another person can be represented.</p><Link className="ao-button ao-button--outline" href="/security">Read the identity boundary<ShieldCheck /></Link></section></AnimatedPanel>;
}

function ProgramsView({ snapshot, onCreate, creating, onNavigate }: { snapshot: Snapshot; onCreate: () => void; creating: boolean; onNavigate: (view: CitizenView) => void }) {
  const existing = snapshot.applications.find(({ template }) => template.name.includes("STEM"));
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Program directory</span><h1>Find once. Apply with context.</h1><p>Every listing shows its requirements and data scope before you begin.</p></div><GraduationCap className="ao-heading-icon" /></div><section className="ao-product-card"><div className="ao-program-card"><span className="ao-list-icon ao-list-icon--indigo"><GraduationCap /></span><div className="ao-program-copy"><div className="ao-card-kicker">Education · Synthetic reviewer journey</div><h2>National STEM Entrance 2026</h2><p>A clearly labelled synthetic application used to demonstrate verified profile reuse, field review, consent, submission and receipts.</p><div className="ao-inline-actions"><span className="ao-status-pill ao-status-pill--attention"><span />Synthetic demo</span><span className="ao-verified-label"><ShieldCheck /> 8 reusable fields</span></div></div><button className="ao-button ao-button--primary" type="button" disabled={creating} onClick={existing ? () => onNavigate("applications") : onCreate}>{creating ? "Preparing..." : existing ? "Open application" : "Start application"}<ArrowRight /></button></div></section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Directory standard</div><h2>No hidden eligibility promises.</h2></div></div><p>Programs remain synthetic or partner-published until their owner, requirements, privacy purpose and operational status are verified.</p><Link className="ao-button ao-button--outline" href="/how-it-works">How program verification works<ChevronRight /></Link></section></AnimatedPanel>;
}

function ActivityView({ snapshot }: { snapshot: Snapshot }) {
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Account activity</span><h1>A trace you can understand.</h1><p>Application, consent and document events are kept together in chronological order.</p></div><Sparkles className="ao-heading-icon" /></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Recent events</div><h2>Your ApplyOnce timeline</h2></div><span className="ao-card-meta">{snapshot.events.length} events</span></div><div className="ao-timeline">{snapshot.events.map((event) => <div className="ao-timeline-row" key={event.id}><span className="ao-timeline-dot"><Check /></span><div><strong>{event.title}</strong><span>{event.description}</span></div><time>{formatDate(event.occurredAt)}</time></div>)}{snapshot.events.length === 0 ? <EmptyState icon={Sparkles} title="No activity yet" body="Your application and privacy events will appear here." /> : null}</div></section></AnimatedPanel>;
}

function HelpView() {
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Help and trust</span><h1>Know what happens next.</h1><p>Use the product guides for applications, consent, privacy and security.</p></div><CircleAlert className="ao-heading-icon" /></div><div className="ao-settings-grid"><section className="ao-product-card"><div className="ao-card-kicker">Product guide</div><h2>Understand the complete journey.</h2><p>See how profile reuse, application review and receipts work.</p><Link className="ao-button ao-button--primary ao-button--full" href="/how-it-works">Open how it works<ArrowRight /></Link></section><section className="ao-product-card"><div className="ao-card-kicker">Security boundaries</div><h2>See what ApplyOnce will not do.</h2><p>Review connector status, data controls and honest external-submission boundaries.</p><Link className="ao-button ao-button--outline ao-button--full" href="/security">Open security guide<ShieldCheck /></Link></section></div><section className="ao-product-card ao-settings-footer"><div><strong>Inspect the implementation</strong><span>ApplyOnce is public and its documented limits are visible.</span></div><a className="ao-button ao-button--outline" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer">View source code<GitBranch /></a></section></AnimatedPanel>;
}

function SettingsView({ snapshot, onSaved }: { snapshot: Snapshot; onSaved: (message: string) => void }) {
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  async function downloadProfile() {
    setBusy("export");
    try {
      const response = await fetch("/api/me/data-export", { method: "POST" });
      const body = (await response.json()) as { export?: Record<string, unknown>; error?: string };
      if (!response.ok || !body.export) throw new Error(body.error ?? "The export could not be prepared.");
      const blob = new Blob([JSON.stringify(body.export, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "applyonce-profile-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      onSaved("A portable copy of your profile was downloaded.");
    } catch (error) {
      onSaved(error instanceof Error ? error.message : "The export could not be prepared.");
    } finally {
      setBusy(null);
    }
  }
  async function requestDeletion() {
    setBusy("delete");
    try {
      const response = await fetch("/api/me/data-deletion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
      const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "The deletion request could not be created.");
      onSaved(body?.message ?? "Your deletion request is queued for review.");
    } catch (error) {
      onSaved(error instanceof Error ? error.message : "The deletion request could not be created.");
    } finally {
      setBusy(null);
    }
  }
  return <AnimatedPanel className="ao-view-stack"><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Account controls</span><h1>Keep your account yours.</h1><p>Manage your data, workspace access, and the way ApplyOnce communicates with you.</p></div><Settings2 className="ao-heading-icon" /></div><div className="ao-settings-grid"><section className="ao-product-card"><div className="ao-card-kicker">Account</div><h2>{snapshot.profile.email}</h2><p>Your account is protected by Clerk authentication. Use the account menu to manage sign-in methods.</p><div className="ao-setting-row"><span><UsersRound /><span><strong>Citizen workspace</strong><small>Personal profile and applications</small></span></span><span className="ao-setting-value">Active</span></div><div className="ao-setting-row"><span><Bell /><span><strong>In-app updates</strong><small>Application and consent events</small></span></span><span className="ao-setting-value ao-setting-value--positive">On</span></div></section><section className="ao-product-card"><div className="ao-card-kicker">Your data</div><h2>Portable and removable.</h2><p>Download a copy of your profile or start a request to remove your account data.</p><button className="ao-button ao-button--outline ao-button--full" onClick={() => void downloadProfile()} disabled={busy !== null}>{busy === "export" ? "Preparing export..." : "Download profile copy"} <CloudUpload /></button><button className="ao-button ao-button--danger ao-button--full" onClick={() => void requestDeletion()} disabled={busy !== null}><Trash2 /> {busy === "delete" ? "Requesting..." : "Request data deletion"}</button></section></div><section className="ao-product-card ao-settings-footer"><div><strong>Open source product</strong><span>Read the implementation and security boundaries on GitHub.</span></div><a className="ao-button ao-button--outline" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer">View source code <GitBranch /></a></section></AnimatedPanel>;
}

export default function AuthenticatedWorkspace({ initialView = "overview", applicationId }: { initialView?: CitizenView; applicationId?: string }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const view = initialView;
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [applicationDetail, setApplicationDetail] = useState<ApplicationDetail | null>(null);
  const [partnerApplicationDetail, setPartnerApplicationDetail] = useState<PartnerApplication | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  async function refresh(): Promise<boolean> {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!response.ok) throw new Error("Your profile could not be refreshed.");
      const data = (await response.json()) as { snapshot: Snapshot };
      setSnapshot(data.snapshot);
      return true;
    } catch {
      notify("Your workspace could not be refreshed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store" }).then(async (response) => {
      if (!active) return;
      if (response.ok) setSnapshot(((await response.json()) as { snapshot: Snapshot }).snapshot);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    fetch(`/api/applications/${applicationId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("That application could not be loaded.");
        const data = (await response.json()) as { application: ApplicationDetail };
        if (active) setApplicationDetail(data.application);
      })
      .catch((error) => {
        if (active) notify(error instanceof Error ? error.message : "That application could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applicationId]);
  function notify(text: string) { setMessage(text); window.setTimeout(() => setMessage(""), 4200); }
  function navigate(nextView: CitizenView) {
    const target = navItems.find((item) => item.id === nextView)?.href ?? "/app/today";
    setMobileNav(false);
    router.push(target);
  }
  async function createPacket() {
    setCreating(true);
    try {
      const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ templateSlug: "national-stem-entrance-2026" }) });
      const body = (await response.json().catch(() => null)) as { application?: { application?: { id?: string } }; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "We could not create the packet yet.");
      notify("Application packet created. Review it before sharing.");
      await refresh();
      const createdId = body?.application?.application?.id;
      router.push(createdId ? `/app/applications/${createdId}/review` : "/app/applications");
    } catch (error) {
      notify(error instanceof Error ? error.message : "We could not create the packet yet.");
    } finally {
      setCreating(false);
    }
  }
  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setUploading(true); try { const extension = file.name.split(".").pop()?.toLowerCase() || "bin"; await upload(`documents/${crypto.randomUUID()}.${extension}`, file, { access: "private", handleUploadUrl: "/api/documents/upload", clientPayload: JSON.stringify({ title: file.name, documentType: "citizen_document", provider: "manual" }) }); notify("Private document uploaded and linked to your profile."); await refresh(); } catch { notify("The document could not be uploaded. Please try again."); } finally { setUploading(false); } }
  async function downloadDocument(document: Snapshot["documents"][number]) {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`, { cache: "no-store" });
      if (!response.ok) throw new Error("That document could not be opened.");
      const filename = document.title.replace(/[^a-z0-9._-]+/gi, "_") || "applyonce-document";
      triggerDownload(await response.blob(), filename);
      notify("Private document downloaded.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "That document could not be opened.");
      throw error;
    }
  }
  async function deleteDocument(document: Snapshot["documents"][number]) {
    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "That document could not be deleted.");
      notify(`${document.title} was removed from your private wallet.`);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "That document could not be deleted.");
      throw error;
    }
  }
  async function openApplication(id: string) {
    router.push(`/app/applications/${id}/review`);
  }

  const pageTitle = navItems.find((item) => item.id === view)?.label ?? "Overview";
  const content = loading && !snapshot ? <div className="ao-loading-card"><div className="ao-loading-spinner" /><span>Loading your private workspace...</span></div> : !snapshot ? <div className="ao-loading-card"><CircleAlert /><span>Your profile could not be loaded. Refresh to try again.</span><button className="ao-button ao-button--outline" type="button" onClick={() => void refresh()}>Refresh</button></div> : partnerApplicationDetail ? <PartnerApplicationDetail application={partnerApplicationDetail} snapshot={snapshot} onBack={() => setPartnerApplicationDetail(null)} onNavigate={navigate} /> : applicationDetail ? <ApplicationDetail detail={applicationDetail} onBack={() => navigate("applications")} onRefresh={async () => { await refresh(); try { const response = await fetch(`/api/applications/${applicationDetail.application.id}`, { cache: "no-store" }); if (response.ok) setApplicationDetail(((await response.json()) as { application: ApplicationDetail }).application); } catch { notify("The application was submitted, but its latest status could not be loaded. Refresh to see it."); } }} onSaved={notify} /> : view === "overview" ? <Overview snapshot={snapshot} onNavigate={navigate} onCreate={() => void createPacket()} creating={creating} /> : view === "people" ? <PeopleView snapshot={snapshot} onNavigate={navigate} /> : view === "profile" ? <ProfileView snapshot={snapshot} onSaved={async (text) => { notify(text); await refresh(); }} /> : view === "sources" ? <SourcesView snapshot={snapshot} onRefresh={refresh} onSaved={notify} /> : view === "documents" ? <DocumentsView snapshot={snapshot} onUpload={uploadDocument} onDownload={downloadDocument} onDelete={deleteDocument} uploading={uploading} /> : view === "programs" ? <ProgramsView snapshot={snapshot} onCreate={() => void createPacket()} creating={creating} onNavigate={navigate} /> : view === "applications" ? <ApplicationsView snapshot={snapshot} onCreate={() => void createPacket()} creating={creating} onOpen={(id) => void openApplication(id)} onOpenPartner={(application) => setPartnerApplicationDetail(application)} /> : view === "consents" ? <ConsentsView onSaved={notify} /> : view === "activity" ? <ActivityView snapshot={snapshot} /> : view === "notifications" ? <NotificationsView snapshot={snapshot} /> : view === "help" ? <HelpView /> : <SettingsView snapshot={snapshot} onSaved={notify} />;

  return <div className="ao-workspace-shell">
    <aside className={`ao-product-sidebar ${mobileNav ? "ao-product-sidebar--open" : ""}`}>
      <div className="ao-sidebar-head"><ApplyOnceLogo size="sm" /><button className="ao-sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button></div>
      <div className="ao-sidebar-context"><span>Personal workspace</span><strong>Citizen account</strong></div>
      <nav className="ao-product-nav" aria-label="Workspace navigation">{navItems.map(({ id, label, icon: Icon, href }) => <Link className={view === id && !applicationDetail && !partnerApplicationDetail ? "is-active" : ""} key={id} href={href} onClick={() => setMobileNav(false)}><Icon /><span>{label}</span>{id === "notifications" && snapshot?.notifications.length ? <em>{snapshot.notifications.length}</em> : null}</Link>)}</nav>
      <div className="ao-sidebar-bottom"><Link href="/partner" className="ao-partner-switch"><span><UsersRound /><span><strong>Are you an organization?</strong><small>Open partner workspace</small></span></span><ArrowRight /></Link><a className="ao-sidebar-source" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><GitBranch /> Open source on GitHub</a><div className="ao-sidebar-security"><LockKeyhole /><span>Private by default</span></div></div>
    </aside>
    {mobileNav ? <button className="ao-nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" /> : null}
    <section className="ao-workspace-main"><header className="ao-product-topbar"><button className="ao-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div><span className="ao-breadcrumb">Workspace <ChevronRight /> {pageTitle}</span></div><div className="ao-topbar-actions"><Link className="ao-topbar-icon" href="/app/notifications" aria-label="View notifications"><Bell />{snapshot?.notifications.length ? <span /> : null}</Link><Link className="ao-topbar-user" href="/app/profile"><span className="ao-topbar-avatar">{snapshot?.profile.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "AO"}</span><span>{snapshot?.profile.fullName.split(" ")[0] ?? "Account"}</span><ChevronRight /></Link></div></header><main className="ao-workspace-content">{message ? <div className="ao-toast" role="status"><CheckCircle2 />{message}<button onClick={() => setMessage("")} aria-label="Dismiss message"><X /></button></div> : null}<AnimatePresence mode="wait"><div key={`${view}-${applicationDetail?.application.id ?? partnerApplicationDetail?.submission.id ?? "none"}`}>{content}</div></AnimatePresence></main></section>
  </div>;
}

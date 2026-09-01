"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplyOnceLogo, ApplyOnceMark } from "@/components/brand/ApplyOnceLogo";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Code2,
  Copy,
  ExternalLink,
  FilePlus2,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Menu,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
  Webhook,
  X,
} from "lucide-react";

type PartnerView = "overview" | "forms" | "submissions" | "developer" | "settings";
type PartnerSection = "overview" | "programs" | "submissions" | "team" | "api-keys" | "webhooks" | "integrations" | "audit" | "settings";
type FormField = { key: string; label: string; type: string; required: boolean; profileKey?: string; helpText?: string };
type PartnerForm = { id: string; slug: string; name: string; description: string; category: string; purpose: string; status: string; version: number; publishedAt: string | null; updatedAt: string; formSchema: { fields: FormField[]; documents: Array<{ key: string; label: string; required: boolean }> }; branding: { accentColor?: string; logoUrl?: string; organizationName?: string } };
type Submission = { submission: { id: string; applicantName: string; applicantEmail: string; status: string; receiptCode: string; data: Record<string, string>; documentIds: string[]; partnerConsentId: string | null; createdAt: string; updatedAt: string }; form: { id: string; name: string; description: string; purpose: string; version: number; formSchema: { fields: FormField[]; documents: Array<{ key: string; label: string; required: boolean }> } } };
type Overview = { organization: { id: string; name: string; slug: string; status: string; verifiedDomain?: string | null }; membership: { role: string }; forms: PartnerForm[]; submissions: Submission[]; metrics: { publishedForms: number; submissions: number; needsReview: number; needsDocuments: number } };
type Webhook = { id: string; url: string; events: string[]; active: boolean; lastDeliveryAt?: string | null; lastError?: string | null; createdAt: string };
type ApiKey = { id: string; name: string; keyPrefix: string; scopes: string[]; lastUsedAt?: string | null; expiresAt?: string | null; revokedAt?: string | null; createdAt: string };
type TeamMember = { id: string; email: string; role: string; createdAt: string; updatedAt: string };
const API_KEY_SCOPES = ["forms:read", "forms:write", "submissions:read", "submissions:write", "webhooks:read", "webhooks:write"];

const navItems: Array<{ id: PartnerSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "programs", label: "Programs", icon: ClipboardList },
  { id: "submissions", label: "Submissions", icon: UsersRound },
  { id: "api-keys", label: "Developer tools", icon: Code2 },
  { id: "team", label: "Team & settings", icon: Settings2 },
];

function viewForSection(section: PartnerSection): PartnerView {
  if (section === "programs") return "forms";
  if (["api-keys", "webhooks", "integrations"].includes(section)) return "developer";
  if (["team", "audit", "settings"].includes(section)) return "settings";
  if (section === "submissions") return "submissions";
  return "overview";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatStatus(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

async function copyText(value: string) {
  if (!navigator.clipboard) return false;
  await navigator.clipboard.writeText(value);
  return true;
}

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

function PartnerPanel({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  return <motion.div className="ao-partner-view-stack" initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22, ease: [0.22, 1, .36, 1] }}>{children}</motion.div>;
}

function Status({ value }: { value: string }) {
  const positive = ["published", "accepted", "completed", "under_review"].includes(value);
  const negative = ["rejected"].includes(value);
  return <span className={`ao-status-pill ao-status-pill--${positive ? "positive" : negative ? "negative" : "attention"}`}><span />{formatStatus(value)}</span>;
}

function OverviewView({ data, onView }: { data: Overview; onView: (view: PartnerView) => void }) {
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Partner workspace</span><h1>Build a better way in.</h1><p>{data.organization.name} can receive complete, consented applications without asking applicants to repeat themselves.</p></div><span className="ao-privacy-badge"><ShieldCheck /> {data.membership.role}</span></div><div className="ao-partner-metric-grid"><div className="ao-partner-metric ao-partner-metric--indigo"><span>Published forms</span><strong>{data.metrics.publishedForms}</strong><small>Live application entry points</small><ClipboardList /></div><div className="ao-partner-metric ao-partner-metric--mint"><span>Submissions</span><strong>{data.metrics.submissions}</strong><small>Applications received</small><UsersRound /></div><div className="ao-partner-metric ao-partner-metric--sun"><span>Needs review</span><strong>{data.metrics.needsReview}</strong><small>Ready for your team</small><Activity /></div><div className="ao-partner-metric ao-partner-metric--blue"><span>Document requests</span><strong>{data.metrics.needsDocuments}</strong><small>Applicants need follow-up</small><Bell /></div></div><div className="ao-section-grid ao-section-grid--two"><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Quick start</div><h2>Launch your next form</h2></div><FilePlus2 className="ao-heading-icon" /></div><p>Create a form, map reusable citizen fields, and share one hosted link with applicants.</p><button className="ao-button ao-button--primary" type="button" onClick={() => onView("forms")}>Open form builder <ArrowRight /></button></section><section className="ao-product-card ao-partner-guide"><div className="ao-card-kicker">The partner promise</div><h2>Ask for the right information, once.</h2><div className="ao-guide-row"><CheckCircle2 /><span>Show applicants exactly what you need</span></div><div className="ao-guide-row"><CheckCircle2 /><span>Receive source-aware, consented values</span></div><div className="ao-guide-row"><CheckCircle2 /><span>Track every status update in one place</span></div></section></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Recent submissions</div><h2>Keep reviews moving</h2></div><button className="ao-text-link" type="button" onClick={() => onView("submissions")}>View all <ChevronRight /></button></div><div className="ao-partner-submission-list">{data.submissions.slice(0, 4).map(({ submission, form }) => <button className="ao-partner-submission" type="button" key={submission.id} onClick={() => onView("submissions")}><span className="ao-topbar-avatar">{submission.applicantName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span><strong>{submission.applicantName}</strong><small>{form.name} · {formatDate(submission.createdAt)}</small></span><Status value={submission.status} /><ChevronRight /></button>)}</div>{data.submissions.length === 0 ? <div className="ao-partner-empty">Your first submission will appear here.</div> : null}</section></PartnerPanel>;
}

function FormsView({ data, onReload, onOpenForm, onNotify }: { data: Overview; onReload: () => Promise<void>; onOpenForm: (form: PartnerForm) => void; onNotify: (message: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", category: "Admissions", purpose: "Evaluate an application for the next intake." });
  async function create() {
    if (!draft.name.trim()) {
      onNotify("Add a name for the form before creating it.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/partner/forms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, name: draft.name.trim(), description: draft.description.trim(), category: draft.category.trim(), purpose: draft.purpose.trim() }) });
      if (!response.ok) throw new Error(await responseError(response, "We could not create that form yet."));
      setCreating(false);
      setDraft({ name: "", description: "", category: "Admissions", purpose: "Evaluate an application for the next intake." });
      await onReload();
      onNotify("Form created. Add fields before publishing.");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "We could not create that form yet.");
    } finally {
      setSaving(false);
    }
  }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Application forms</span><h1>Make the first step lighter.</h1><p>Build reusable application entry points for students and citizens.</p></div><button className="ao-button ao-button--primary" type="button" onClick={() => setCreating(true)}><Plus /> New form</button></div>{creating ? <div className="ao-modal-backdrop"><section className="ao-modal"><div className="ao-card-heading"><div><div className="ao-card-kicker">New application form</div><h2>Start with the purpose</h2></div><button className="ao-topbar-icon" type="button" onClick={() => setCreating(false)} aria-label="Close"><X /></button></div><div className="ao-form-grid"><label>Form name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Undergraduate admission 2026" /></label><label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Admissions" /></label><label className="ao-field-full">Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Tell applicants what this form is for." /></label><label className="ao-field-full">Purpose of data use<input value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} /></label></div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> Applicants will see this purpose before consent.</span><button className="ao-button ao-button--primary" type="button" onClick={() => void create()} disabled={saving}>{saving ? "Creating..." : "Create draft"}<ArrowRight /></button></div></section></div> : null}<div className="ao-form-grid-list">{data.forms.map((form) => <button className="ao-form-card" type="button" key={form.id} onClick={() => onOpenForm(form)}><div className="ao-form-card-head"><span className="ao-list-icon ao-list-icon--indigo"><ClipboardList /></span><Status value={form.status} /></div><h2>{form.name}</h2><p>{form.description}</p><div className="ao-form-card-meta"><span>{form.formSchema.fields.length} fields</span><span>{form.formSchema.documents.length} documents</span><span>v{form.version}</span></div><div className="ao-form-card-footer"><span>{form.status === "published" ? `Published ${formatDate(form.publishedAt)}` : `Updated ${formatDate(form.updatedAt)}`}</span><ChevronRight /></div></button>)}</div>{data.forms.length === 0 ? <section className="ao-product-card"><div className="ao-empty"><span className="ao-empty-icon"><ClipboardList /></span><h3>No forms yet</h3><p>Create a hosted form and give applicants a single, clear place to begin.</p><button className="ao-button ao-button--primary" type="button" onClick={() => setCreating(true)}>Create your first form <Plus /></button></div></section> : null}</PartnerPanel>;
}

function FormEditor({ form, onBack, onReload, onNotify }: { form: PartnerForm; onBack: () => void; onReload: () => Promise<void>; onNotify: (message: string) => void }) {
  const [draft, setDraft] = useState(form);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({ key: "", label: "", type: "text", required: true, profileKey: "" });
  const [newDocument, setNewDocument] = useState({ key: "", label: "", required: true });
  async function save() {
    if (!draft.name.trim() || !draft.purpose.trim()) {
      onNotify("Add a form name and purpose before saving.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/partner/forms/${form.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: draft.name.trim(), description: draft.description.trim(), category: draft.category.trim(), purpose: draft.purpose.trim(), formSchema: draft.formSchema }) });
      if (!response.ok) throw new Error(await responseError(response, "We could not save the form changes."));
      await onReload();
      onNotify("Form changes saved.");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "We could not save the form changes.");
    } finally {
      setSaving(false);
    }
  }
  async function publish() {
    setSaving(true);
    try {
      const response = await fetch(`/api/partner/forms/${form.id}/publish`, { method: "POST" });
      if (!response.ok) throw new Error(await responseError(response, "Add at least one field before publishing."));
      await onReload();
      onNotify("Form published. Applicants can use the hosted link now.");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Add at least one field before publishing.");
    } finally {
      setSaving(false);
    }
  }
  function addField() {
    const key = newField.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    if (!key || !newField.label.trim()) {
      onNotify("Add both a field key and a label.");
      return;
    }
    if (draft.formSchema.fields.some((field) => field.key === key)) {
      onNotify("That field key is already in use.");
      return;
    }
    setDraft({ ...draft, formSchema: { ...draft.formSchema, fields: [...draft.formSchema.fields, { ...newField, key, label: newField.label.trim(), profileKey: newField.profileKey || undefined }] } });
    setNewField({ key: "", label: "", type: "text", required: true, profileKey: "" });
  }
  function removeField(key: string) { setDraft({ ...draft, formSchema: { ...draft.formSchema, fields: draft.formSchema.fields.filter((field) => field.key !== key) } }); }
  function addDocument() {
    const key = newDocument.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    if (!key || !newDocument.label.trim()) {
      onNotify("Add both a document key and a label.");
      return;
    }
    if (draft.formSchema.documents.some((document) => document.key === key)) {
      onNotify("That document key is already in use.");
      return;
    }
    setDraft({ ...draft, formSchema: { ...draft.formSchema, documents: [...draft.formSchema.documents, { ...newDocument, key, label: newDocument.label.trim() }] } });
    setNewDocument({ key: "", label: "", required: true });
  }
  function removeDocument(key: string) { setDraft({ ...draft, formSchema: { ...draft.formSchema, documents: draft.formSchema.documents.filter((document) => document.key !== key) } }); }
  async function copyLink() {
    if (draft.status !== "published") {
      onNotify("Publish this form before sharing its hosted link.");
      return;
    }
    try {
      const copied = await copyText(`${window.location.origin}/portal/${form.slug}`);
      onNotify(copied ? "Hosted form link copied." : "Clipboard access is unavailable. Copy the hosted URL from the browser address bar.");
    } catch {
      onNotify("Clipboard access is unavailable. Copy the hosted URL from the browser address bar.");
    }
  }
  return <PartnerPanel><button className="ao-back-link" type="button" onClick={onBack}><ArrowLeft /> Back to forms</button><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Form builder</span><h1>{draft.name}</h1><p>Map the fields your applicants already trust you to ask for.</p></div><div className="ao-inline-actions"><button className="ao-button ao-button--outline" type="button" onClick={() => void copyLink()}><Copy /> Copy hosted link</button>{draft.status === "published" ? <a className="ao-button ao-button--primary" href={`/portal/${draft.slug}`} target="_blank" rel="noreferrer">Open hosted form <ExternalLink /></a> : <button className="ao-button ao-button--primary" type="button" onClick={() => void publish()} disabled={saving}>Publish form <Send /></button>}</div></div><div className="ao-builder-grid"><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Form details</div><h2>What applicants will see</h2></div><Status value={draft.status} /></div><div className="ao-form-grid ao-form-grid--single"><label>Form name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><label>Purpose<input value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} /></label></div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> This purpose appears before consent.</span><button className="ao-button ao-button--outline" type="button" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save changes"}<Check /></button></div></section><aside className="ao-product-card ao-builder-preview"><div className="ao-card-kicker">Live preview</div><div className="ao-preview-brand"><ApplyOnceMark size="sm" tone="light" /><div><strong>{draft.branding.organizationName ?? "Your organization"}</strong><small>Application form</small></div></div><h2>{draft.name || "Untitled application"}</h2><p>{draft.description || "Your form description will appear here."}</p><div className="ao-preview-fields">{draft.formSchema.fields.slice(0, 4).map((field) => <div key={field.key}><span>{field.label}</span><i /></div>)}</div><span className="ao-preview-consent"><LockIcon /> Consent shown before submission</span></aside></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Field mapping</div><h2>Ask once, reuse where approved</h2></div><span className="ao-card-meta">{draft.formSchema.fields.length} fields</span></div><div className="ao-editor-fields">{draft.formSchema.fields.map((field) => <div className="ao-editor-field" key={field.key}><span className="ao-list-icon ao-list-icon--mint"><Link2 /></span><div><strong>{field.label}</strong><small>{field.key} · {field.profileKey ? `reuses ${field.profileKey}` : "citizen input"}</small></div><span className="ao-editor-type">{field.type}{field.required ? " · required" : ""}</span><button className="ao-icon-danger" type="button" onClick={() => removeField(field.key)} aria-label={`Remove ${field.label}`}><X /></button></div>)}</div><div className="ao-add-field"><input value={newField.key} onChange={(event) => setNewField({ ...newField, key: event.target.value })} placeholder="field_key" aria-label="Field key" /><input value={newField.label} onChange={(event) => setNewField({ ...newField, label: event.target.value })} placeholder="Field label" aria-label="Field label" /><select value={newField.type} onChange={(event) => setNewField({ ...newField, type: event.target.value })} aria-label="Field type"><option value="text">Text</option><option value="email">Email</option><option value="date">Date</option><option value="select">Select</option></select><input value={newField.profileKey} onChange={(event) => setNewField({ ...newField, profileKey: event.target.value })} placeholder="profile key (optional)" aria-label="Profile key" /><button className="ao-button ao-button--primary" type="button" onClick={addField}><Plus /> Add field</button></div></section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Document requirements</div><h2>Collect only the proof you need</h2></div><span className="ao-card-meta">{draft.formSchema.documents.length} documents</span></div><div className="ao-editor-fields">{draft.formSchema.documents.map((document) => <div className="ao-editor-field" key={document.key}><span className="ao-list-icon ao-list-icon--blue"><FilePlus2 /></span><div><strong>{document.label}</strong><small>{document.key} · {document.required ? "required" : "optional"}</small></div><span className="ao-editor-type">Private upload</span><button className="ao-icon-danger" type="button" onClick={() => removeDocument(document.key)} aria-label={`Remove ${document.label}`}><X /></button></div>)}</div><div className="ao-add-field"><input value={newDocument.key} onChange={(event) => setNewDocument({ ...newDocument, key: event.target.value })} placeholder="document_key" aria-label="Document key" /><input value={newDocument.label} onChange={(event) => setNewDocument({ ...newDocument, label: event.target.value })} placeholder="Document label" aria-label="Document label" /><label className="ao-add-toggle"><input type="checkbox" checked={newDocument.required} onChange={(event) => setNewDocument({ ...newDocument, required: event.target.checked })} /> Required</label><button className="ao-button ao-button--primary" type="button" onClick={addDocument}><Plus /> Add document</button></div></section></PartnerPanel>;
}

function LockIcon() { return <LockKeyhole aria-hidden="true" />; }
function Github() { return <GitBranch aria-hidden="true" />; }

function SubmissionsView({ data, onReload, onNotify }: { data: Overview; onReload: () => Promise<void>; onNotify: (message: string) => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Submission | null>(null);
  async function update(id: string, status: string) {
    setUpdating(id);
    try {
      const response = await fetch(`/api/partner/submissions/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error(await responseError(response, "We could not update that submission."));
      await onReload();
      onNotify("Submission status updated.");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "We could not update that submission.");
    } finally {
      setUpdating(null);
    }
  }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Submission inbox</span><h1>Move applications forward.</h1><p>Review what applicants sent, request what is missing, and keep the status visible.</p></div><span className="ao-privacy-badge"><ShieldCheck /> Consent recorded</span></div><section className="ao-product-card"><div className="ao-submission-table-head"><span>Applicant</span><span>Form</span><span>Status</span><span>Receipt</span><span>Last update</span><span>Action</span></div><div className="ao-submission-table">{data.submissions.map((item) => { const { submission, form } = item; return <div className="ao-submission-table-row" key={submission.id}><div className="ao-applicant-cell"><span className="ao-topbar-avatar">{submission.applicantName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span><strong>{submission.applicantName}</strong><small>{submission.applicantEmail}</small></span></div><span className="ao-submission-form">{form.name}</span><select value={submission.status} onChange={(event) => void update(submission.id, event.target.value)} disabled={updating === submission.id} aria-label={`Status for ${submission.applicantName}`}><option value="received">Received</option><option value="under_review">Under review</option><option value="needs_documents">Needs documents</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select><span className="ao-mono-label">{submission.receiptCode}</span><span className="ao-submission-date">{formatDate(submission.updatedAt)}</span><button className="ao-button ao-button--quiet ao-submission-review" type="button" onClick={() => setSelected(item)}>Review <ChevronRight /></button></div>; })}</div>{data.submissions.length === 0 ? <div className="ao-partner-empty">No submissions yet. Publish a form and share its hosted link.</div> : null}</section>{selected ? <div className="ao-modal-backdrop" role="presentation"><section className="ao-modal ao-submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-detail-title"><div className="ao-card-heading"><div><div className="ao-card-kicker">Submission detail</div><h2 id="submission-detail-title">{selected.submission.applicantName}</h2></div><button className="ao-topbar-icon" type="button" onClick={() => setSelected(null)} aria-label="Close submission detail"><X /></button></div><p className="ao-modal-lede">{selected.form.name} · {selected.submission.applicantEmail}</p><div className="ao-detail-grid"><div><span>Receipt</span><strong className="ao-mono-label">{selected.submission.receiptCode}</strong></div><div><span>Submitted</span><strong>{formatDate(selected.submission.createdAt)}</strong></div><div><span>Consent record</span><strong>{selected.submission.partnerConsentId ? "Recorded" : "Unavailable"}</strong></div><div><span>Documents</span><strong>{selected.submission.documentIds.length} attached</strong></div></div><div className="ao-modal-section"><div className="ao-card-kicker">Submitted fields</div><div className="ao-submission-data-grid">{Object.entries(selected.submission.data).map(([key, value]) => <div key={key}><span>{selected.form.formSchema.fields.find((field) => field.key === key)?.label ?? key}</span><strong>{value || "Not provided"}</strong></div>)}</div></div><div className="ao-modal-actions"><label className="ao-modal-status">Status<select value={selected.submission.status} onChange={(event) => { void update(selected.submission.id, event.target.value); setSelected(null); }} disabled={updating === selected.submission.id}><option value="received">Received</option><option value="under_review">Under review</option><option value="needs_documents">Needs documents</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select></label><button className="ao-button ao-button--outline" type="button" onClick={() => setSelected(null)}>Close detail</button></div></section></div> : null}</PartnerPanel>;
}

function DeveloperView({ onNotify }: { onNotify: (message: string) => void }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["forms:read", "submissions:read"]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const [webhookResponse, keyResponse] = await Promise.all([
        fetch("/api/partner/webhooks", { cache: "no-store" }),
        fetch("/api/partner/api-keys", { cache: "no-store" }),
      ]);
      if (!webhookResponse.ok || !keyResponse.ok) throw new Error("The developer settings could not be loaded.");
      setWebhooks(((await webhookResponse.json()) as { webhooks: Webhook[] }).webhooks);
      setApiKeys(((await keyResponse.json()) as { keys: ApiKey[] }).keys);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "The developer settings could not be loaded.");
    }
  }, [onNotify]);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/partner/webhooks", { cache: "no-store" }),
      fetch("/api/partner/api-keys", { cache: "no-store" }),
    ]).then(async ([webhookResponse, keyResponse]) => {
      if (!active) return;
      if (!webhookResponse.ok || !keyResponse.ok) {
        onNotify("The developer settings could not be loaded.");
        return;
      }
      const [webhookBody, keyBody] = await Promise.all([
        webhookResponse.json() as Promise<{ webhooks: Webhook[] }>,
        keyResponse.json() as Promise<{ keys: ApiKey[] }>,
      ]);
      if (!active) return;
      setWebhooks(webhookBody.webhooks);
      setApiKeys(keyBody.keys);
    }).catch(() => {
      if (active) onNotify("The developer settings could not be loaded.");
    });
    return () => { active = false; };
  }, [onNotify]);
  async function addWebhook() {
    if (!url.trim()) {
      onNotify("Enter the HTTPS endpoint that should receive updates.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/partner/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: url.trim(), events: ["application.submitted", "application.status_changed"] }) });
      if (!response.ok) throw new Error(await responseError(response, "Enter a valid HTTPS webhook URL."));
      const body = (await response.json()) as { secret?: string };
      setSecret(body.secret ?? "");
      setUrl("");
      await load();
      onNotify("Webhook added. Copy the signing secret before leaving this page.");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "The webhook could not be added.");
    } finally {
      setSaving(false);
    }
  }
  async function processDeliveries() {
    setProcessing(true);
    try {
      const response = await fetch("/api/partner/webhooks/process", { method: "POST" });
      const body = (await response.json().catch(() => null)) as { result?: { attempted: number; delivered: number; failed: number }; error?: string } | null;
      if (!response.ok || !body?.result) throw new Error(body?.error ?? "Pending webhook deliveries could not be processed.");
      onNotify(`${body.result.delivered} webhook deliveries sent, ${body.result.failed} failed.`);
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Pending webhook deliveries could not be processed.");
    } finally {
      setProcessing(false);
    }
  }
  async function copySecret() {
    try {
      const copied = await copyText(secret);
      onNotify(copied ? "Signing secret copied." : "Clipboard access is unavailable. Copy the secret manually.");
    } catch {
      onNotify("Clipboard access is unavailable. Copy the secret manually.");
    }
  }
  async function createApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!keyName.trim()) {
      onNotify("Give the API key a name before creating it.");
      return;
    }
    if (keyScopes.length === 0) {
      onNotify("Choose at least one permission for this API key.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/partner/api-keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: keyName.trim(), scopes: keyScopes }) });
      const body = (await response.json().catch(() => null)) as { key?: ApiKey; secret?: string; error?: string } | null;
      if (!response.ok || !body?.key || !body.secret) throw new Error(body?.error ?? "The API key could not be created.");
      setApiKeys((current) => [body.key as ApiKey, ...current]);
      setApiSecret(body.secret);
      setKeyName("");
      onNotify("API key created. Copy the secret before leaving this page.");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "The API key could not be created.");
    } finally {
      setSaving(false);
    }
  }
  async function revokeApiKey(id: string, name: string) {
    setRevoking(id);
    try {
      const response = await fetch(`/api/partner/api-keys/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response, "The API key could not be revoked."));
      setApiKeys((current) => current.map((key) => key.id === id ? { ...key, revokedAt: new Date().toISOString() } : key));
      onNotify(`${name} was revoked.`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "The API key could not be revoked.");
    } finally {
      setRevoking(null);
    }
  }
  function toggleScope(scope: string) { setKeyScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]); }
  async function copyApiSecret() {
    try {
      const copied = await copyText(apiSecret);
      onNotify(copied ? "API key copied." : "Clipboard access is unavailable. Copy the key manually.");
    } catch {
      onNotify("Clipboard access is unavailable. Copy the key manually.");
    }
  }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Developer tools</span><h1>Connect your systems cleanly.</h1><p>Use hosted forms for speed or signed webhooks and APIs for a deeper integration.</p></div><Code2 className="ao-heading-icon" /></div><div className="ao-section-grid ao-section-grid--two"><section className="ao-product-card"><div className="ao-card-kicker">REST API</div><h2>One contract for every form.</h2><p>Use scoped API keys, idempotency keys, and versioned payloads to create and track applications.</p><Link className="ao-button ao-button--primary" href="/docs">Read API docs <ArrowRight /></Link></section><section className="ao-product-card"><div className="ao-card-kicker">Hosted form</div><h2>Share a link today.</h2><p>Every published form has a mobile-ready ApplyOnce URL with consent and receipt built in.</p><Link className="ao-button ao-button--outline" href="/docs#hosted-forms">Read hosted form guide <ArrowRight /></Link></section></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">API keys</div><h2>Give each system the least access it needs.</h2></div><KeyRound className="ao-heading-icon" /></div><p className="ao-card-copy">Secrets are shown once, stored as hashes, and scoped to specific form, submission, or webhook operations.</p><form className="ao-api-key-create" onSubmit={(event) => void createApiKey(event)}><label>Key name<input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Admissions CRM" maxLength={80} required /></label><div className="ao-scope-picker" role="group" aria-label="API key scopes"><span>Permissions</span><div>{API_KEY_SCOPES.map((scope) => <label key={scope}><input type="checkbox" checked={keyScopes.includes(scope)} onChange={() => toggleScope(scope)} />{scope}</label>)}</div></div><button className="ao-button ao-button--primary" type="submit" disabled={saving || keyScopes.length === 0}>{saving ? "Creating..." : "Create API key"}<Plus /></button></form>{apiSecret ? <div className="ao-webhook-secret ao-api-key-secret"><div><strong>Save this API key now</strong><span>It cannot be recovered after this page closes.</span></div><code>{apiSecret}</code><div className="ao-inline-actions"><button className="ao-button ao-button--outline" type="button" onClick={() => void copyApiSecret()}><Copy /> Copy key</button><button className="ao-button ao-button--quiet" type="button" onClick={() => setApiSecret("")}><X /> Hide</button></div></div> : null}<div className="ao-api-key-list">{apiKeys.map((key) => <div className={`ao-api-key-row ${key.revokedAt ? "is-revoked" : ""}`} key={key.id}><span className="ao-list-icon ao-list-icon--indigo"><KeyRound /></span><div><strong>{key.name}</strong><small><code>{key.keyPrefix}••••••••</code> · {key.scopes.join(" · ")}</small></div><span className={`ao-setting-value ${key.revokedAt ? "ao-setting-value--negative" : "ao-setting-value--positive"}`}>{key.revokedAt ? "Revoked" : key.lastUsedAt ? `Used ${formatDate(key.lastUsedAt)}` : "Never used"}</span>{!key.revokedAt ? <button className="ao-button ao-button--quiet" type="button" onClick={() => void revokeApiKey(key.id, key.name)} disabled={revoking === key.id}>{revoking === key.id ? "Revoking..." : <><Trash2 /> Revoke</>}</button> : null}</div>)}</div>{apiKeys.length === 0 ? <div className="ao-partner-empty">No API keys yet. Create one when you are ready to connect a partner system.</div> : null}</section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Signed webhooks</div><h2>Deliver updates to your backend</h2></div><Webhook className="ao-heading-icon" /></div><div className="ao-webhook-add"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-domain.com/applyonce/webhook" aria-label="Webhook URL" /><button className="ao-button ao-button--primary" type="button" onClick={() => void addWebhook()} disabled={saving || !url}>{saving ? "Adding..." : "Add endpoint"}<Plus /></button></div>{secret ? <div className="ao-webhook-secret"><div><strong>Copy this signing secret now</strong><span>It is encrypted at rest and shown only once.</span></div><code>{secret}</code><button className="ao-button ao-button--outline" type="button" onClick={() => void copySecret()}><Copy /> Copy secret</button></div> : null}<div className="ao-webhook-list">{webhooks.map((webhook) => <div className="ao-webhook-row" key={webhook.id}><span className="ao-list-icon ao-list-icon--mint"><Webhook /></span><div><strong>{webhook.url}</strong><small>{webhook.events.join(" · ")} {webhook.lastError ? ` · Last error: ${webhook.lastError}` : webhook.lastDeliveryAt ? ` · Delivered ${formatDate(webhook.lastDeliveryAt)}` : " · Waiting for first delivery"}</small></div><span className={`ao-setting-value ${webhook.lastError ? "ao-setting-value--negative" : "ao-setting-value--positive"}`}>{webhook.lastError ? "Needs attention" : "Active"}</span></div>)}</div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> Failed deliveries stay visible for retry.</span><button className="ao-button ao-button--outline" type="button" onClick={() => void processDeliveries()} disabled={processing}>{processing ? "Retrying..." : "Process pending deliveries"}<Webhook /></button></div>{webhooks.length === 0 ? <div className="ao-partner-empty">No webhook endpoints configured yet.</div> : null}</section></PartnerPanel>;
}

function SettingsView({ data, onNotify }: { data: Overview; onNotify: (message: string) => void }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  async function loadTeam() {
    setLoadingTeam(true);
    try {
      const response = await fetch("/api/partner/team", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response, "Team access could not be loaded."));
      setMembers(((await response.json()) as { members: TeamMember[] }).members);
      setTeamLoaded(true);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Team access could not be loaded.");
    } finally {
      setLoadingTeam(false);
    }
  }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Workspace settings</span><h1>{data.organization.name}</h1><p>Manage the organization identity and how your team works with applicants.</p></div><Settings2 className="ao-heading-icon" /></div><div className="ao-settings-grid"><section className="ao-product-card"><div className="ao-card-kicker">Organization</div><h2>Education partner workspace</h2><p>Organization slug: <span className="ao-mono-label">{data.organization.slug}</span></p><div className="ao-setting-row"><span><UsersRound /><span><strong>Team access</strong><small>Owner and reviewer roles</small></span></span><span className="ao-setting-value">{data.membership.role}</span></div><button className="ao-button ao-button--outline ao-button--full" onClick={() => void loadTeam()} disabled={loadingTeam}>{loadingTeam ? "Loading team..." : "View team access"} <UsersRound /></button>{teamLoaded ? <div className="ao-team-list">{members.map((member) => <div className="ao-team-row" key={member.id}><span className="ao-topbar-avatar">{member.email.slice(0, 2).toUpperCase()}</span><span><strong>{member.email}</strong><small>Joined {formatDate(member.createdAt)}</small></span><span className="ao-setting-value">{member.role}</span></div>)}</div> : null}</section><section className="ao-product-card"><div className="ao-card-kicker">Safety boundary</div><h2>Consent stays visible.</h2><p>Applicants review the purpose and requested fields before any form submission reaches your organization.</p><div className="ao-guide-row"><ShieldCheck /><span>Purpose-bound sharing</span></div><div className="ao-guide-row"><BadgeCheck /><span>Source-aware values</span></div><div className="ao-guide-row"><Activity /><span>Auditable status history</span></div></section></div><section className="ao-product-card ao-settings-footer"><div><strong>Open source product</strong><span>Review the code, data boundaries, and implementation notes.</span></div><a className="ao-button ao-button--outline" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><Github /> View source code</a></section></PartnerPanel>;
}

function PartnerOnboarding({ onComplete }: { onComplete: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", kind: "education_partner", contactEmail: "", domain: "", acceptTerms: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/partner/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, domain: form.domain.trim() || null }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Your organization could not be created."));
      await onComplete();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your organization could not be created.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="ao-partner-onboarding"><header><ApplyOnceLogo size="md" /><Link href="/app/today" className="ao-button ao-button--quiet">Return to citizen workspace<ArrowLeft /></Link></header><main><section className="ao-onboarding-copy"><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Verified partner entry</span><h1>Create an organization intentionally.</h1><p>ApplyOnce does not silently create partner workspaces. Tell us who will receive applications and how applicants can verify you.</p><div className="ao-guide-row"><ShieldCheck /><span>Public forms require organization approval</span></div><div className="ao-guide-row"><BadgeCheck /><span>Every submission remains purpose-bound</span></div><div className="ao-guide-row"><Activity /><span>Publication and status changes are audited</span></div></section><form className="ao-product-card ao-onboarding-form" onSubmit={(event) => void submit(event)}><div className="ao-card-kicker">Organization onboarding</div><h2>Start your approval profile</h2><div className="ao-form-grid ao-form-grid--single"><label>Organization name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Northstar Education" required minLength={3} /></label><label>Organization type<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="education_partner">Education institution</option><option value="exam_organizer">Exam organizer</option><option value="scholarship_provider">Scholarship provider</option><option value="public_service">Public-service provider</option><option value="employer">Employer</option><option value="healthcare_administration">Healthcare administration</option></select></label><label>Official contact email<input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="applications@example.org" required /></label><label>Official domain <span>(optional)</span><input value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value.replace(/^https?:\/\//, "") })} placeholder="example.org" /></label></div><label className="ao-terms-check"><input type="checkbox" checked={form.acceptTerms} onChange={(event) => setForm({ ...form, acceptTerms: event.target.checked })} /><span>I confirm I am authorized to represent this organization and accept the partner data-use terms.</span></label>{error ? <div className="ao-inline-form-error" role="alert"><CircleAlert />{error}</div> : null}<button className="ao-button ao-button--primary ao-button--full" type="submit" disabled={saving || !form.acceptTerms}>{saving ? "Creating approval profile..." : "Create partner workspace"}<ArrowRight /></button><p className="ao-form-help"><LockKeyhole /> You can build drafts immediately. Public publication remains blocked until approval.</p></form></main></div>;
}

export default function PartnerWorkspace({ initialSection = "overview", initialFormId }: { initialSection?: PartnerSection; initialFormId?: string }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [section, setSection] = useState<PartnerSection>(initialSection);
  const view = viewForSection(section);
  const [form, setForm] = useState<PartnerForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  async function reload() {
    try {
      const response = await fetch("/api/partner/overview", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as (Overview & { code?: string }) | null;
      if (response.status === 404 && body?.code === "partner_onboarding_required") {
        setOnboardingRequired(true);
        setData(null);
        return;
      }
      if (!response.ok || !body) throw new Error("The partner workspace could not be refreshed.");
      setOnboardingRequired(false);
      setData(body);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { let active = true; fetch("/api/partner/overview", { cache: "no-store" }).then(async (response) => { if (!active) return; const body = (await response.json().catch(() => null)) as (Overview & { code?: string }) | null; if (response.ok && body) { setData(body); if (initialFormId) setForm(body.forms.find((item) => item.id === initialFormId) ?? null); } if (response.status === 404 && body?.code === "partner_onboarding_required") setOnboardingRequired(true); setLoading(false); }).catch(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [initialFormId]);
  const notify = useCallback((text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 4200); }, []);
  function navigate(next: PartnerSection) { setForm(null); setSection(next); setMobileNav(false); router.push(`/partner/${next}`); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function openForm(next: PartnerForm) { setForm(next); router.push(`/partner/programs/${next.id}/builder`); window.scrollTo({ top: 0, behavior: "smooth" }); }
  const currentLabel = navItems.find((item) => item.id === section)?.label ?? "Partner workspace";
  if (!loading && onboardingRequired) return <PartnerOnboarding onComplete={async () => { setOnboardingRequired(false); await reload(); }} />;
  const content = loading && !data ? <div className="ao-loading-card"><div className="ao-loading-spinner" /><span>Loading partner workspace...</span></div> : !data ? <div className="ao-loading-card"><CircleAlert /><span>The partner workspace could not be loaded.</span><button className="ao-button ao-button--outline" type="button" onClick={() => void reload().catch(() => notify("The partner workspace could not be refreshed."))}>Retry</button></div> : form ? <FormEditor form={form} onBack={() => { setForm(null); router.push("/partner/programs"); }} onReload={async () => { await reload(); const response = await fetch(`/api/partner/forms/${form.id}`, { cache: "no-store" }); if (response.ok) setForm(((await response.json()) as { form: PartnerForm }).form); }} onNotify={notify} /> : view === "overview" ? <OverviewView data={data} onView={(next) => navigate(next === "forms" ? "programs" : next === "developer" ? "api-keys" : next === "settings" ? "team" : next)} /> : view === "forms" ? <FormsView data={data} onReload={reload} onOpenForm={openForm} onNotify={notify} /> : view === "submissions" ? <SubmissionsView data={data} onReload={reload} onNotify={notify} /> : view === "developer" ? <DeveloperView onNotify={notify} /> : <SettingsView data={data} onNotify={notify} />;
  return <div className="ao-workspace-shell ao-partner-workspace"><aside className={`ao-product-sidebar ${mobileNav ? "ao-product-sidebar--open" : ""}`}><div className="ao-sidebar-head"><ApplyOnceLogo size="sm" /><button className="ao-sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button></div><div className="ao-sidebar-context"><span>Partner workspace</span><strong>{data?.organization.name ?? "Loading workspace"}</strong></div><nav className="ao-product-nav" aria-label="Partner navigation">{navItems.map(({ id, label, icon: Icon }) => <Link className={section === id && !form ? "is-active" : ""} key={id} href={`/partner/${id}`} onClick={() => { setSection(id); setForm(null); setMobileNav(false); }}><Icon /><span>{label}</span>{id === "submissions" && data?.metrics.needsReview ? <em>{data.metrics.needsReview}</em> : null}</Link>)}</nav><div className="ao-sidebar-bottom"><Link href="/app/today" className="ao-partner-switch"><span><UsersRound /><span><strong>Are you applying?</strong><small>Open citizen workspace</small></span></span><ArrowRight /></Link><a className="ao-sidebar-source" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><Github /> Open source on GitHub</a><div className="ao-sidebar-security"><ShieldCheck /><span>Consent visible by default</span></div></div></aside>{mobileNav ? <button className="ao-nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" /> : null}<section className="ao-workspace-main"><header className="ao-product-topbar"><button className="ao-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><span className="ao-breadcrumb">Partner workspace <ChevronRight /> {currentLabel}</span><div className="ao-topbar-actions"><button className="ao-topbar-icon" onClick={() => notify("You are up to date.")} aria-label="View notifications"><Bell /></button><span className="ao-topbar-user"><span className="ao-topbar-avatar">{data?.organization.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "PW"}</span><span>{data?.membership.role ?? "Owner"}</span></span></div></header><main className="ao-workspace-content">{message ? <div className="ao-toast" role="status"><CheckCircle2 />{message}<button onClick={() => setMessage("")} aria-label="Dismiss message"><X /></button></div> : null}<AnimatePresence mode="wait"><div key={`${view}-${form?.id ?? "none"}`}>{content}</div></AnimatePresence></main></section></div>;
}

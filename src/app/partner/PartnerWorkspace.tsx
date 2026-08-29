"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";
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
  Sparkles,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
  Webhook,
  X,
} from "lucide-react";

type PartnerView = "overview" | "forms" | "submissions" | "developer" | "settings";
type FormField = { key: string; label: string; type: string; required: boolean; profileKey?: string; helpText?: string };
type PartnerForm = { id: string; slug: string; name: string; description: string; category: string; purpose: string; status: string; version: number; publishedAt: string | null; updatedAt: string; formSchema: { fields: FormField[]; documents: Array<{ key: string; label: string; required: boolean }> }; branding: { accentColor?: string; logoUrl?: string; organizationName?: string } };
type Submission = { submission: { id: string; applicantName: string; applicantEmail: string; status: string; receiptCode: string; data: Record<string, string>; documentIds: string[]; partnerConsentId: string | null; createdAt: string; updatedAt: string }; form: { id: string; name: string; description: string; purpose: string; version: number; formSchema: { fields: FormField[]; documents: Array<{ key: string; label: string; required: boolean }> } } };
type Overview = { organization: { id: string; name: string; slug: string }; membership: { role: string }; forms: PartnerForm[]; submissions: Submission[]; metrics: { publishedForms: number; submissions: number; needsReview: number; needsDocuments: number } };
type Webhook = { id: string; url: string; events: string[]; active: boolean; lastDeliveryAt?: string | null; lastError?: string | null; createdAt: string };
type ApiKey = { id: string; name: string; keyPrefix: string; scopes: string[]; lastUsedAt?: string | null; expiresAt?: string | null; revokedAt?: string | null; createdAt: string };
type TeamMember = { id: string; email: string; role: string; createdAt: string; updatedAt: string };
const API_KEY_SCOPES = ["forms:read", "forms:write", "submissions:read", "submissions:write", "webhooks:read", "webhooks:write"];

const navItems: Array<{ id: PartnerView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "forms", label: "Application forms", icon: ClipboardList },
  { id: "submissions", label: "Submissions", icon: UsersRound },
  { id: "developer", label: "Developer tools", icon: Code2 },
  { id: "settings", label: "Workspace settings", icon: Settings2 },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatStatus(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

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
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Partner workspace</span><h1>Build a better way in.</h1><p>{data.organization.name} can receive complete, consented applications without asking applicants to repeat themselves.</p></div><span className="ao-privacy-badge"><ShieldCheck /> {data.membership.role}</span></div><div className="ao-partner-metric-grid"><div className="ao-partner-metric ao-partner-metric--indigo"><span>Published forms</span><strong>{data.metrics.publishedForms}</strong><small>Live application entry points</small><ClipboardList /></div><div className="ao-partner-metric ao-partner-metric--mint"><span>Submissions</span><strong>{data.metrics.submissions}</strong><small>Applications received</small><UsersRound /></div><div className="ao-partner-metric ao-partner-metric--sun"><span>Needs review</span><strong>{data.metrics.needsReview}</strong><small>Ready for your team</small><Activity /></div><div className="ao-partner-metric ao-partner-metric--blue"><span>Document requests</span><strong>{data.metrics.needsDocuments}</strong><small>Applicants need follow-up</small><Bell /></div></div><div className="ao-section-grid ao-section-grid--two"><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Quick start</div><h2>Launch your next form</h2></div><FilePlus2 className="ao-heading-icon" /></div><p>Create a form, map reusable citizen fields, and share one hosted link with applicants.</p><button className="ao-button ao-button--primary" onClick={() => onView("forms")}>Open form builder <ArrowRight /></button></section><section className="ao-product-card ao-partner-guide"><div className="ao-card-kicker">The partner promise</div><h2>Ask for the right information, once.</h2><div className="ao-guide-row"><CheckCircle2 /><span>Show applicants exactly what you need</span></div><div className="ao-guide-row"><CheckCircle2 /><span>Receive source-aware, consented values</span></div><div className="ao-guide-row"><CheckCircle2 /><span>Track every status update in one place</span></div></section></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Recent submissions</div><h2>Keep reviews moving</h2></div><button className="ao-text-link" onClick={() => onView("submissions")}>View all <ChevronRight /></button></div><div className="ao-partner-submission-list">{data.submissions.slice(0, 4).map(({ submission, form }) => <button className="ao-partner-submission" key={submission.id} onClick={() => onView("submissions")}><span className="ao-topbar-avatar">{submission.applicantName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span><strong>{submission.applicantName}</strong><small>{form.name} · {formatDate(submission.createdAt)}</small></span><Status value={submission.status} /><ChevronRight /></button>)}</div>{data.submissions.length === 0 ? <div className="ao-partner-empty">Your first submission will appear here.</div> : null}</section></PartnerPanel>;
}

function FormsView({ data, onReload, onOpenForm, onNotify }: { data: Overview; onReload: () => Promise<void>; onOpenForm: (form: PartnerForm) => void; onNotify: (message: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", category: "Admissions", purpose: "Evaluate an application for the next intake." });
  async function create() { setSaving(true); const response = await fetch("/api/partner/forms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }); if (response.ok) { setCreating(false); setDraft({ name: "", description: "", category: "Admissions", purpose: "Evaluate an application for the next intake." }); await onReload(); onNotify("Form created. Add fields before publishing."); } else onNotify("We could not create that form yet."); setSaving(false); }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Application forms</span><h1>Make the first step lighter.</h1><p>Build reusable application entry points for students and citizens.</p></div><button className="ao-button ao-button--primary" onClick={() => setCreating(true)}><Plus /> New form</button></div>{creating ? <div className="ao-modal-backdrop"><section className="ao-modal"><div className="ao-card-heading"><div><div className="ao-card-kicker">New application form</div><h2>Start with the purpose</h2></div><button className="ao-topbar-icon" onClick={() => setCreating(false)} aria-label="Close"><X /></button></div><div className="ao-form-grid"><label>Form name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Undergraduate admission 2026" /></label><label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Admissions" /></label><label className="ao-field-full">Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Tell applicants what this form is for." /></label><label className="ao-field-full">Purpose of data use<input value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} /></label></div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> Applicants will see this purpose before consent.</span><button className="ao-button ao-button--primary" onClick={() => void create()} disabled={saving}>{saving ? "Creating..." : "Create draft"}<ArrowRight /></button></div></section></div> : null}<div className="ao-form-grid-list">{data.forms.map((form) => <button className="ao-form-card" key={form.id} onClick={() => onOpenForm(form)}><div className="ao-form-card-head"><span className="ao-list-icon ao-list-icon--indigo"><ClipboardList /></span><Status value={form.status} /></div><h2>{form.name}</h2><p>{form.description}</p><div className="ao-form-card-meta"><span>{form.formSchema.fields.length} fields</span><span>{form.formSchema.documents.length} documents</span><span>v{form.version}</span></div><div className="ao-form-card-footer"><span>{form.status === "published" ? `Published ${formatDate(form.publishedAt)}` : `Updated ${formatDate(form.updatedAt)}`}</span><ChevronRight /></div></button>)}</div>{data.forms.length === 0 ? <section className="ao-product-card"><div className="ao-empty"><span className="ao-empty-icon"><ClipboardList /></span><h3>No forms yet</h3><p>Create a hosted form and give applicants a single, clear place to begin.</p><button className="ao-button ao-button--primary" onClick={() => setCreating(true)}>Create your first form <Plus /></button></div></section> : null}</PartnerPanel>;
}

function FormEditor({ form, onBack, onReload, onNotify }: { form: PartnerForm; onBack: () => void; onReload: () => Promise<void>; onNotify: (message: string) => void }) {
  const [draft, setDraft] = useState(form);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({ key: "", label: "", type: "text", required: true, profileKey: "" });
  const [newDocument, setNewDocument] = useState({ key: "", label: "", required: true });
  async function save() { setSaving(true); const response = await fetch(`/api/partner/forms/${form.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: draft.name, description: draft.description, category: draft.category, purpose: draft.purpose, formSchema: draft.formSchema }) }); if (response.ok) { await onReload(); onNotify("Form changes saved."); } else onNotify("We could not save the form changes."); setSaving(false); }
  async function publish() { setSaving(true); const response = await fetch(`/api/partner/forms/${form.id}/publish`, { method: "POST" }); if (response.ok) { await onReload(); onNotify("Form published. Applicants can use the hosted link now."); } else { const body = await response.json().catch(() => null) as { error?: string } | null; onNotify(body?.error ?? "Add at least one field before publishing."); } setSaving(false); }
  function addField() { const key = newField.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"); if (!key || !newField.label.trim()) return; if (draft.formSchema.fields.some((field) => field.key === key)) { onNotify("That field key is already in use."); return; } setDraft({ ...draft, formSchema: { ...draft.formSchema, fields: [...draft.formSchema.fields, { ...newField, key, label: newField.label.trim(), profileKey: newField.profileKey || undefined }] } }); setNewField({ key: "", label: "", type: "text", required: true, profileKey: "" }); }
  function removeField(key: string) { setDraft({ ...draft, formSchema: { ...draft.formSchema, fields: draft.formSchema.fields.filter((field) => field.key !== key) } }); }
  function addDocument() { const key = newDocument.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"); if (!key || !newDocument.label.trim()) return; if (draft.formSchema.documents.some((document) => document.key === key)) { onNotify("That document key is already in use."); return; } setDraft({ ...draft, formSchema: { ...draft.formSchema, documents: [...draft.formSchema.documents, { ...newDocument, key, label: newDocument.label.trim() }] } }); setNewDocument({ key: "", label: "", required: true }); }
  function removeDocument(key: string) { setDraft({ ...draft, formSchema: { ...draft.formSchema, documents: draft.formSchema.documents.filter((document) => document.key !== key) } }); }
  async function copyLink() { if (draft.status !== "published") { onNotify("Publish this form before sharing its hosted link."); return; } await navigator.clipboard?.writeText(`${window.location.origin}/portal/${form.slug}`); onNotify("Hosted form link copied."); }
  return <PartnerPanel><button className="ao-back-link" onClick={onBack}><ArrowLeft /> Back to forms</button><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Form builder</span><h1>{draft.name}</h1><p>Map the fields your applicants already trust you to ask for.</p></div><div className="ao-inline-actions"><button className="ao-button ao-button--outline" onClick={() => void copyLink()}><Copy /> Copy hosted link</button>{draft.status === "published" ? <a className="ao-button ao-button--primary" href={`/portal/${draft.slug}`} target="_blank" rel="noreferrer">Open hosted form <ExternalLink /></a> : <button className="ao-button ao-button--primary" onClick={() => void publish()} disabled={saving}>Publish form <Send /></button>}</div></div><div className="ao-builder-grid"><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Form details</div><h2>What applicants will see</h2></div><Status value={draft.status} /></div><div className="ao-form-grid ao-form-grid--single"><label>Form name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><label>Purpose<input value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} /></label></div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> This purpose appears before consent.</span><button className="ao-button ao-button--outline" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save changes"}<Check /></button></div></section><aside className="ao-product-card ao-builder-preview"><div className="ao-card-kicker">Live preview</div><div className="ao-preview-brand"><span className="ao-sidebar-mark"><SparklesIcon /></span><div><strong>{draft.branding.organizationName ?? "Your organization"}</strong><small>Application form</small></div></div><h2>{draft.name || "Untitled application"}</h2><p>{draft.description || "Your form description will appear here."}</p><div className="ao-preview-fields">{draft.formSchema.fields.slice(0, 4).map((field) => <div key={field.key}><span>{field.label}</span><i /></div>)}</div><span className="ao-preview-consent"><LockIcon /> Consent shown before submission</span></aside></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Field mapping</div><h2>Ask once, reuse where approved</h2></div><span className="ao-card-meta">{draft.formSchema.fields.length} fields</span></div><div className="ao-editor-fields">{draft.formSchema.fields.map((field) => <div className="ao-editor-field" key={field.key}><span className="ao-list-icon ao-list-icon--mint"><Link2 /></span><div><strong>{field.label}</strong><small>{field.key} · {field.profileKey ? `reuses ${field.profileKey}` : "citizen input"}</small></div><span className="ao-editor-type">{field.type}{field.required ? " · required" : ""}</span><button className="ao-icon-danger" onClick={() => removeField(field.key)} aria-label={`Remove ${field.label}`}><X /></button></div>)}</div><div className="ao-add-field"><input value={newField.key} onChange={(event) => setNewField({ ...newField, key: event.target.value })} placeholder="field_key" aria-label="Field key" /><input value={newField.label} onChange={(event) => setNewField({ ...newField, label: event.target.value })} placeholder="Field label" aria-label="Field label" /><select value={newField.type} onChange={(event) => setNewField({ ...newField, type: event.target.value })} aria-label="Field type"><option value="text">Text</option><option value="email">Email</option><option value="date">Date</option><option value="select">Select</option></select><input value={newField.profileKey} onChange={(event) => setNewField({ ...newField, profileKey: event.target.value })} placeholder="profile key (optional)" aria-label="Profile key" /><button className="ao-button ao-button--primary" onClick={addField}><Plus /> Add field</button></div></section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Document requirements</div><h2>Collect only the proof you need</h2></div><span className="ao-card-meta">{draft.formSchema.documents.length} documents</span></div><div className="ao-editor-fields">{draft.formSchema.documents.map((document) => <div className="ao-editor-field" key={document.key}><span className="ao-list-icon ao-list-icon--blue"><FilePlus2 /></span><div><strong>{document.label}</strong><small>{document.key} · {document.required ? "required" : "optional"}</small></div><span className="ao-editor-type">Private upload</span><button className="ao-icon-danger" onClick={() => removeDocument(document.key)} aria-label={`Remove ${document.label}`}><X /></button></div>)}</div><div className="ao-add-field"><input value={newDocument.key} onChange={(event) => setNewDocument({ ...newDocument, key: event.target.value })} placeholder="document_key" aria-label="Document key" /><input value={newDocument.label} onChange={(event) => setNewDocument({ ...newDocument, label: event.target.value })} placeholder="Document label" aria-label="Document label" /><label className="ao-add-toggle"><input type="checkbox" checked={newDocument.required} onChange={(event) => setNewDocument({ ...newDocument, required: event.target.checked })} /> Required</label><button className="ao-button ao-button--primary" onClick={addDocument}><Plus /> Add document</button></div></section></PartnerPanel>;
}

function SparklesIcon() { return <Sparkles aria-hidden="true" />; }
function LockIcon() { return <LockKeyhole aria-hidden="true" />; }
function Github() { return <GitBranch aria-hidden="true" />; }

function SubmissionsView({ data, onReload, onNotify }: { data: Overview; onReload: () => Promise<void>; onNotify: (message: string) => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Submission | null>(null);
  async function update(id: string, status: string) { setUpdating(id); const response = await fetch(`/api/partner/submissions/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); if (response.ok) { await onReload(); onNotify("Submission status updated."); } else onNotify("We could not update that submission."); setUpdating(null); }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Submission inbox</span><h1>Move applications forward.</h1><p>Review what applicants sent, request what is missing, and keep the status visible.</p></div><span className="ao-privacy-badge"><ShieldCheck /> Consent recorded</span></div><section className="ao-product-card"><div className="ao-submission-table-head"><span>Applicant</span><span>Form</span><span>Status</span><span>Receipt</span><span>Last update</span><span>Action</span></div><div className="ao-submission-table">{data.submissions.map((item) => { const { submission, form } = item; return <div className="ao-submission-table-row" key={submission.id}><div className="ao-applicant-cell"><span className="ao-topbar-avatar">{submission.applicantName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span><strong>{submission.applicantName}</strong><small>{submission.applicantEmail}</small></span></div><span className="ao-submission-form">{form.name}</span><select value={submission.status} onChange={(event) => void update(submission.id, event.target.value)} disabled={updating === submission.id} aria-label={`Status for ${submission.applicantName}`}><option value="received">Received</option><option value="under_review">Under review</option><option value="needs_documents">Needs documents</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select><span className="ao-mono-label">{submission.receiptCode}</span><span className="ao-submission-date">{formatDate(submission.updatedAt)}</span><button className="ao-button ao-button--quiet ao-submission-review" onClick={() => setSelected(item)}>Review <ChevronRight /></button></div>; })}</div>{data.submissions.length === 0 ? <div className="ao-partner-empty">No submissions yet. Publish a form and share its hosted link.</div> : null}</section>{selected ? <div className="ao-modal-backdrop" role="presentation"><section className="ao-modal ao-submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-detail-title"><div className="ao-card-heading"><div><div className="ao-card-kicker">Submission detail</div><h2 id="submission-detail-title">{selected.submission.applicantName}</h2></div><button className="ao-topbar-icon" onClick={() => setSelected(null)} aria-label="Close submission detail"><X /></button></div><p className="ao-modal-lede">{selected.form.name} · {selected.submission.applicantEmail}</p><div className="ao-detail-grid"><div><span>Receipt</span><strong className="ao-mono-label">{selected.submission.receiptCode}</strong></div><div><span>Submitted</span><strong>{formatDate(selected.submission.createdAt)}</strong></div><div><span>Consent record</span><strong>{selected.submission.partnerConsentId ? "Recorded" : "Unavailable"}</strong></div><div><span>Documents</span><strong>{selected.submission.documentIds.length} attached</strong></div></div><div className="ao-modal-section"><div className="ao-card-kicker">Submitted fields</div><div className="ao-submission-data-grid">{Object.entries(selected.submission.data).map(([key, value]) => <div key={key}><span>{selected.form.formSchema.fields.find((field) => field.key === key)?.label ?? key}</span><strong>{value || "Not provided"}</strong></div>)}</div></div><div className="ao-modal-actions"><label className="ao-modal-status">Status<select value={selected.submission.status} onChange={(event) => { void update(selected.submission.id, event.target.value); setSelected(null); }} disabled={updating === selected.submission.id}><option value="received">Received</option><option value="under_review">Under review</option><option value="needs_documents">Needs documents</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select></label><button className="ao-button ao-button--outline" onClick={() => setSelected(null)}>Close detail</button></div></section></div> : null}</PartnerPanel>;
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
  async function load() {
    const [webhookResponse, keyResponse] = await Promise.all([
      fetch("/api/partner/webhooks", { cache: "no-store" }),
      fetch("/api/partner/api-keys", { cache: "no-store" }),
    ]);
    if (webhookResponse.ok) setWebhooks(((await webhookResponse.json()) as { webhooks: Webhook[] }).webhooks);
    if (keyResponse.ok) setApiKeys(((await keyResponse.json()) as { keys: ApiKey[] }).keys);
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/partner/webhooks", { cache: "no-store" }),
      fetch("/api/partner/api-keys", { cache: "no-store" }),
    ]).then(async ([webhookResponse, keyResponse]) => {
      if (!active) return;
      if (webhookResponse.ok) setWebhooks(((await webhookResponse.json()) as { webhooks: Webhook[] }).webhooks);
      if (keyResponse.ok) setApiKeys(((await keyResponse.json()) as { keys: ApiKey[] }).keys);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  async function addWebhook() {
    setSaving(true);
    const response = await fetch("/api/partner/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, events: ["application.submitted", "application.status_changed"] }) });
    if (response.ok) {
      const body = (await response.json()) as { secret?: string };
      setSecret(body.secret ?? "");
      setUrl("");
      await load();
      onNotify("Webhook added. Copy the signing secret before leaving this page.");
    } else {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      onNotify(body?.error ?? "Enter a valid HTTPS webhook URL.");
    }
    setSaving(false);
  }
  async function processDeliveries() {
    setProcessing(true);
    const response = await fetch("/api/partner/webhooks/process", { method: "POST" });
    const body = (await response.json().catch(() => null)) as { result?: { attempted: number; delivered: number; failed: number } } | null;
    if (response.ok && body?.result) onNotify(`${body.result.delivered} webhook deliveries sent, ${body.result.failed} failed.`);
    else onNotify("Pending webhook deliveries could not be processed.");
    await load();
    setProcessing(false);
  }
  async function copySecret() { await navigator.clipboard?.writeText(secret); onNotify("Signing secret copied."); }
  async function createApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!keyName.trim() || keyScopes.length === 0) return;
    setSaving(true);
    const response = await fetch("/api/partner/api-keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: keyName.trim(), scopes: keyScopes }) });
    const body = (await response.json().catch(() => null)) as { key?: ApiKey; secret?: string; error?: string } | null;
    if (response.ok && body?.key && body.secret) {
      setApiKeys((current) => [body.key as ApiKey, ...current]);
      setApiSecret(body.secret);
      setKeyName("");
      onNotify("API key created. Copy the secret before leaving this page.");
    } else onNotify(body?.error ?? "The API key could not be created.");
    setSaving(false);
  }
  async function revokeApiKey(id: string, name: string) {
    setRevoking(id);
    const response = await fetch(`/api/partner/api-keys/${id}`, { method: "DELETE" });
    if (response.ok) { setApiKeys((current) => current.map((key) => key.id === id ? { ...key, revokedAt: new Date().toISOString() } : key)); onNotify(`${name} was revoked.`); } else onNotify("The API key could not be revoked.");
    setRevoking(null);
  }
  function toggleScope(scope: string) { setKeyScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]); }
  async function copyApiSecret() { await navigator.clipboard?.writeText(apiSecret); onNotify("API key copied."); }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Developer tools</span><h1>Connect your systems cleanly.</h1><p>Use hosted forms for speed or signed webhooks and APIs for a deeper integration.</p></div><Code2 className="ao-heading-icon" /></div><div className="ao-section-grid ao-section-grid--two"><section className="ao-product-card"><div className="ao-card-kicker">REST API</div><h2>One contract for every form.</h2><p>Use scoped API keys, idempotency keys, and versioned payloads to create and track applications.</p><Link className="ao-button ao-button--primary" href="/docs">Read API docs <ArrowRight /></Link></section><section className="ao-product-card"><div className="ao-card-kicker">Hosted form</div><h2>Share a link today.</h2><p>Every published form has a mobile-ready ApplyOnce URL with consent and receipt built in.</p><Link className="ao-button ao-button--outline" href="/docs#hosted-forms">Read hosted form guide <ArrowRight /></Link></section></div><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">API keys</div><h2>Give each system the least access it needs.</h2></div><KeyRound className="ao-heading-icon" /></div><p className="ao-card-copy">Secrets are shown once, stored as hashes, and scoped to specific form, submission, or webhook operations.</p><form className="ao-api-key-create" onSubmit={(event) => void createApiKey(event)}><label>Key name<input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Admissions CRM" maxLength={80} required /></label><div className="ao-scope-picker" role="group" aria-label="API key scopes"><span>Permissions</span><div>{API_KEY_SCOPES.map((scope) => <label key={scope}><input type="checkbox" checked={keyScopes.includes(scope)} onChange={() => toggleScope(scope)} />{scope}</label>)}</div></div><button className="ao-button ao-button--primary" type="submit" disabled={saving || keyScopes.length === 0}>{saving ? "Creating..." : "Create API key"}<Plus /></button></form>{apiSecret ? <div className="ao-webhook-secret ao-api-key-secret"><div><strong>Save this API key now</strong><span>It cannot be recovered after this page closes.</span></div><code>{apiSecret}</code><div className="ao-inline-actions"><button className="ao-button ao-button--outline" type="button" onClick={() => void copyApiSecret()}><Copy /> Copy key</button><button className="ao-button ao-button--quiet" type="button" onClick={() => setApiSecret("")}><X /> Hide</button></div></div> : null}<div className="ao-api-key-list">{apiKeys.map((key) => <div className={`ao-api-key-row ${key.revokedAt ? "is-revoked" : ""}`} key={key.id}><span className="ao-list-icon ao-list-icon--indigo"><KeyRound /></span><div><strong>{key.name}</strong><small><code>{key.keyPrefix}••••••••</code> · {key.scopes.join(" · ")}</small></div><span className={`ao-setting-value ${key.revokedAt ? "ao-setting-value--negative" : "ao-setting-value--positive"}`}>{key.revokedAt ? "Revoked" : key.lastUsedAt ? `Used ${formatDate(key.lastUsedAt)}` : "Never used"}</span>{!key.revokedAt ? <button className="ao-button ao-button--quiet" type="button" onClick={() => void revokeApiKey(key.id, key.name)} disabled={revoking === key.id}>{revoking === key.id ? "Revoking..." : <><Trash2 /> Revoke</>}</button> : null}</div>)}</div>{apiKeys.length === 0 ? <div className="ao-partner-empty">No API keys yet. Create one when you are ready to connect a partner system.</div> : null}</section><section className="ao-product-card"><div className="ao-card-heading"><div><div className="ao-card-kicker">Signed webhooks</div><h2>Deliver updates to your backend</h2></div><Webhook className="ao-heading-icon" /></div><div className="ao-webhook-add"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-domain.com/applyonce/webhook" aria-label="Webhook URL" /><button className="ao-button ao-button--primary" onClick={() => void addWebhook()} disabled={saving || !url}>{saving ? "Adding..." : "Add endpoint"}<Plus /></button></div>{secret ? <div className="ao-webhook-secret"><div><strong>Copy this signing secret now</strong><span>It is encrypted at rest and shown only once.</span></div><code>{secret}</code><button className="ao-button ao-button--outline" onClick={() => void copySecret()}><Copy /> Copy secret</button></div> : null}<div className="ao-webhook-list">{webhooks.map((webhook) => <div className="ao-webhook-row" key={webhook.id}><span className="ao-list-icon ao-list-icon--mint"><Webhook /></span><div><strong>{webhook.url}</strong><small>{webhook.events.join(" · ")} {webhook.lastError ? ` · Last error: ${webhook.lastError}` : webhook.lastDeliveryAt ? ` · Delivered ${formatDate(webhook.lastDeliveryAt)}` : " · Waiting for first delivery"}</small></div><span className={`ao-setting-value ${webhook.lastError ? "ao-setting-value--negative" : "ao-setting-value--positive"}`}>{webhook.lastError ? "Needs attention" : "Active"}</span></div>)}</div><div className="ao-form-actions"><span className="ao-form-help"><ShieldCheck /> Failed deliveries stay visible for retry.</span><button className="ao-button ao-button--outline" onClick={() => void processDeliveries()} disabled={processing}>{processing ? "Retrying..." : "Process pending deliveries"}<Webhook /></button></div>{webhooks.length === 0 ? <div className="ao-partner-empty">No webhook endpoints configured yet.</div> : null}</section></PartnerPanel>;
}

function SettingsView({ data, onNotify }: { data: Overview; onNotify: (message: string) => void }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  async function loadTeam() {
    setLoadingTeam(true);
    const response = await fetch("/api/partner/team", { cache: "no-store" });
    if (response.ok) {
      setMembers(((await response.json()) as { members: TeamMember[] }).members);
      setTeamLoaded(true);
    } else onNotify("Team access could not be loaded.");
    setLoadingTeam(false);
  }
  return <PartnerPanel><div className="ao-view-heading"><div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Workspace settings</span><h1>{data.organization.name}</h1><p>Manage the organization identity and how your team works with applicants.</p></div><Settings2 className="ao-heading-icon" /></div><div className="ao-settings-grid"><section className="ao-product-card"><div className="ao-card-kicker">Organization</div><h2>Education partner workspace</h2><p>Organization slug: <span className="ao-mono-label">{data.organization.slug}</span></p><div className="ao-setting-row"><span><UsersRound /><span><strong>Team access</strong><small>Owner and reviewer roles</small></span></span><span className="ao-setting-value">{data.membership.role}</span></div><button className="ao-button ao-button--outline ao-button--full" onClick={() => void loadTeam()} disabled={loadingTeam}>{loadingTeam ? "Loading team..." : "View team access"} <UsersRound /></button>{teamLoaded ? <div className="ao-team-list">{members.map((member) => <div className="ao-team-row" key={member.id}><span className="ao-topbar-avatar">{member.email.slice(0, 2).toUpperCase()}</span><span><strong>{member.email}</strong><small>Joined {formatDate(member.createdAt)}</small></span><span className="ao-setting-value">{member.role}</span></div>)}</div> : null}</section><section className="ao-product-card"><div className="ao-card-kicker">Safety boundary</div><h2>Consent stays visible.</h2><p>Applicants review the purpose and requested fields before any form submission reaches your organization.</p><div className="ao-guide-row"><ShieldCheck /><span>Purpose-bound sharing</span></div><div className="ao-guide-row"><BadgeCheck /><span>Source-aware values</span></div><div className="ao-guide-row"><Activity /><span>Auditable status history</span></div></section></div><section className="ao-product-card ao-settings-footer"><div><strong>Open source product</strong><span>Review the code, data boundaries, and implementation notes.</span></div><a className="ao-button ao-button--outline" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><Github /> View source code</a></section></PartnerPanel>;
}

export default function PartnerWorkspace() {
  const [data, setData] = useState<Overview | null>(null);
  const [view, setView] = useState<PartnerView>("overview");
  const [form, setForm] = useState<PartnerForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  async function reload() { const response = await fetch("/api/partner/overview", { cache: "no-store" }); if (response.ok) setData((await response.json()) as Overview); setLoading(false); }
  useEffect(() => { let active = true; fetch("/api/partner/overview", { cache: "no-store" }).then(async (response) => { if (!active) return; if (response.ok) setData((await response.json()) as Overview); setLoading(false); }).catch(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  function notify(text: string) { setMessage(text); window.setTimeout(() => setMessage(""), 4200); }
  function navigate(next: PartnerView) { setForm(null); setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  const currentLabel = navItems.find((item) => item.id === view)?.label ?? "Overview";
  const content = loading && !data ? <div className="ao-loading-card"><div className="ao-loading-spinner" /><span>Loading partner workspace...</span></div> : !data ? <div className="ao-loading-card"><CircleAlert /><span>The partner workspace could not be loaded.</span><button className="ao-button ao-button--outline" onClick={() => void reload()}>Retry</button></div> : form ? <FormEditor form={form} onBack={() => setForm(null)} onReload={async () => { await reload(); const response = await fetch(`/api/partner/forms/${form.id}`, { cache: "no-store" }); if (response.ok) setForm(((await response.json()) as { form: PartnerForm }).form); }} onNotify={notify} /> : view === "overview" ? <OverviewView data={data} onView={navigate} /> : view === "forms" ? <FormsView data={data} onReload={reload} onOpenForm={setForm} onNotify={notify} /> : view === "submissions" ? <SubmissionsView data={data} onReload={reload} onNotify={notify} /> : view === "developer" ? <DeveloperView onNotify={notify} /> : <SettingsView data={data} onNotify={notify} />;
  return <div className="ao-workspace-shell ao-partner-workspace"><aside className={`ao-product-sidebar ${mobileNav ? "ao-product-sidebar--open" : ""}`}><div className="ao-sidebar-head"><ApplyOnceLogo size="sm" /><button className="ao-sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button></div><div className="ao-sidebar-context"><span>Partner workspace</span><strong>{data?.organization.name ?? "Loading workspace"}</strong></div><nav className="ao-product-nav" aria-label="Partner navigation">{navItems.map(({ id, label, icon: Icon }) => <button className={view === id && !form ? "is-active" : ""} key={id} onClick={() => navigate(id)}><Icon /><span>{label}</span>{id === "submissions" && data?.metrics.needsReview ? <em>{data.metrics.needsReview}</em> : null}</button>)}</nav><div className="ao-sidebar-bottom"><Link href="/app" className="ao-partner-switch"><span><UsersRound /><span><strong>Are you applying?</strong><small>Open citizen workspace</small></span></span><ArrowRight /></Link><a className="ao-sidebar-source" href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer"><Github /> Open source on GitHub</a><div className="ao-sidebar-security"><ShieldCheck /><span>Consent visible by default</span></div></div></aside>{mobileNav ? <button className="ao-nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" /> : null}<section className="ao-workspace-main"><header className="ao-product-topbar"><button className="ao-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><span className="ao-breadcrumb">Partner workspace <ChevronRight /> {currentLabel}</span><div className="ao-topbar-actions"><button className="ao-topbar-icon" onClick={() => notify("You are up to date.")} aria-label="View notifications"><Bell /></button><span className="ao-topbar-user"><span className="ao-topbar-avatar">{data?.organization.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "PW"}</span><span>{data?.membership.role ?? "Owner"}</span></span></div></header><main className="ao-workspace-content">{message ? <div className="ao-toast" role="status"><CheckCircle2 />{message}<button onClick={() => setMessage("")} aria-label="Dismiss message"><X /></button></div> : null}<AnimatePresence mode="wait"><div key={`${view}-${form?.id ?? "none"}`}>{content}</div></AnimatePresence></main></section></div>;
}

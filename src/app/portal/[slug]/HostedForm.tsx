"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

type FormField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  profileKey?: string;
  helpText?: string;
};

type HostedFormPayload = {
  form: {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    purpose: string;
    version: number;
    formSchema: { fields: FormField[]; documents: Array<{ key: string; label: string; required: boolean }> };
    branding: { accentColor?: string; logoUrl?: string; organizationName?: string };
  };
  organization: { id?: string; name: string; slug: string };
  prefill: Record<string, string>;
  viewer: { authenticated: boolean; fullName?: string; email?: string };
};

type Submission = {
  id: string;
  receiptCode: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
  partnerConsentId?: string | null;
};

type UploadedDocument = {
  id: string;
  key: string;
  label: string;
  title: string;
  status: string;
};

const selectOptions = ["Computer Science", "Data Science", "Economics", "Design"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function fieldValueLabel(field: FormField, values: Record<string, string>) {
  return values[field.key] ?? "";
}

function FormFieldInput({
  field,
  value,
  onChange,
  reused,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  reused: boolean;
}) {
  const commonProps = {
    id: field.key,
    name: field.key,
    value,
    required: field.required,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };

  return (
    <label className="ao-hosted-field" htmlFor={field.key}>
      <span className="ao-hosted-field-label">
        <span>{field.label}{field.required ? <em>Required</em> : null}</span>
        {reused ? <small><BadgeCheck /> Reused from your profile</small> : null}
      </span>
      {field.type === "select" ? (
        <select {...commonProps}>
          <option value="">Choose an option</option>
          {selectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : field.type === "date" ? (
        <input {...commonProps} type="date" />
      ) : field.type === "email" ? (
        <input {...commonProps} type="email" autoComplete="email" />
      ) : field.type === "number" ? (
        <input {...commonProps} type="number" inputMode="numeric" />
      ) : field.type === "file" ? (
        <div className="ao-hosted-file-handoff">
          <Upload />
          <span>Upload after signing in to keep this document private</span>
          <Link href="/sign-in">Sign in</Link>
        </div>
      ) : (
        <input {...commonProps} type="text" />
      )}
      {field.helpText ? <small className="ao-hosted-helper">{field.helpText}</small> : null}
    </label>
  );
}

function ScopePanel({ payload }: { payload: HostedFormPayload }) {
  const { form, organization } = payload;
  return (
    <aside className="ao-hosted-scope">
      <div className="ao-hosted-scope-head"><ShieldCheck /><span>Before you share</span></div>
      <h2>You stay in control.</h2>
      <p>{organization.name} is requesting this information only to {form.purpose.toLowerCase().replace(/\.$/, "")}.</p>
      <div className="ao-hosted-scope-list">
        <div><Check /><span>Fields you review here</span></div>
        <div><Check /><span>Documents shown before sharing</span></div>
        <div><Check /><span>Consent receipt after submission</span></div>
        <div><Check /><span>ApplyOnce never submits twice</span></div>
      </div>
      <Link href="/security" className="ao-hosted-scope-link">Read the privacy boundary <ArrowRight /></Link>
    </aside>
  );
}

export default function HostedForm({ slug }: { slug: string }) {
  const reducedMotion = useReducedMotion();
  const [payload, setPayload] = useState<HostedFormPayload | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [step, setStep] = useState<"details" | "review" | "complete">("details");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/public/forms/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) throw new Error("This form is not available right now.");
        const nextPayload = (await response.json()) as HostedFormPayload;
        setPayload(nextPayload);
        setValues(nextPayload.prefill);
        setApplicantName(nextPayload.viewer.fullName ?? nextPayload.prefill.full_name ?? "");
        setApplicantEmail(nextPayload.viewer.email ?? nextPayload.prefill.email_address ?? "");
        try {
          const saved = window.localStorage.getItem(`applyonce-form:${slug}`);
          if (saved) {
            const draft = JSON.parse(saved) as { values?: Record<string, string>; applicantName?: string; applicantEmail?: string };
            setValues({ ...nextPayload.prefill, ...(draft.values ?? {}) });
            setApplicantName(draft.applicantName ?? nextPayload.viewer.fullName ?? nextPayload.prefill.full_name ?? "");
            setApplicantEmail(draft.applicantEmail ?? nextPayload.viewer.email ?? nextPayload.prefill.email_address ?? "");
          }
        } catch {
          // A corrupt browser draft should never prevent a form from opening.
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "This form is not available right now.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!payload || step === "complete") return;
    window.localStorage.setItem(`applyonce-form:${slug}`, JSON.stringify({ values, applicantName, applicantEmail }));
  }, [applicantEmail, applicantName, payload, slug, step, values]);

  const requiredFields = useMemo(() => payload?.form.formSchema.fields.filter((field) => field.required) ?? [], [payload]);
  const missingFields = useMemo(() => requiredFields.filter((field) => !fieldValueLabel(field, values).trim()), [requiredFields, values]);

  function updateValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function uploadDocument(documentKey: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!viewerIsAuthenticated) {
      setError("Sign in before uploading a private document.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setError("Use a PDF, JPG, or PNG document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Documents must be 10 MB or smaller.");
      return;
    }
    setUploadingDocument(documentKey);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("documentKey", documentKey);
      const response = await fetch(`/api/public/forms/${encodeURIComponent(slug)}/documents`, { method: "POST", body });
      const result = (await response.json().catch(() => null)) as { document?: UploadedDocument; error?: string } | null;
      if (!response.ok || !result?.document) throw new Error(result?.error ?? "The private upload could not be completed.");
      setUploadedDocuments((current) => [...current.filter((document) => document.key !== documentKey), result.document as UploadedDocument]);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The private upload could not be completed.");
    } finally {
      setUploadingDocument(null);
    }
  }

  function review() {
    if (!applicantName.trim() || !applicantEmail.trim() || missingFields.length > 0) {
      setError("Complete your name, email, and every required field before reviewing.");
      return;
    }
    setError("");
    setStep("review");
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  async function submit() {
    if (!payload || !consentAccepted) {
      setError("Please confirm the consent shown above before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/public/forms/${encodeURIComponent(slug)}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ applicantName: applicantName.trim(), applicantEmail: applicantEmail.trim(), data: values, documentIds: uploadedDocuments.map((document) => document.id), consentAccepted: true, consentMethod: "manual" }),
      });
      const body = (await response.json()) as { error?: string; submission?: Submission };
      if (!response.ok || !body.submission) throw new Error(body.error ?? "We could not submit this application.");
      setSubmission(body.submission);
      setStep("complete");
      window.localStorage.removeItem(`applyonce-form:${slug}`);
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not submit this application.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyReceipt() {
    if (!submission) return;
    await navigator.clipboard?.writeText(submission.receiptCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  if (loading) {
    return <main className="ao-hosted-page"><div className="ao-hosted-loading"><div className="ao-loading-spinner" /><span>Opening the secure application form...</span></div></main>;
  }

  if (error && !payload) {
    return <main className="ao-hosted-page"><div className="ao-hosted-error"><ApplyOnceLogo size="lg" /><CircleError /><h1>This form is unavailable.</h1><p>{error}</p><Link className="ao-button ao-button--primary" href="/">Return to ApplyOnce <ArrowRight /></Link></div></main>;
  }

  if (!payload) return null;
  const { form, organization, viewer } = payload;
  const viewerIsAuthenticated = viewer.authenticated;
  const missingRequiredDocuments = form.formSchema.documents.filter((document) => document.required && !uploadedDocuments.some((uploaded) => uploaded.key === document.key));
  const accent = form.branding.accentColor ?? "#4F46E5";

  return (
    <main className="ao-hosted-page" style={{ "--ao-host-accent": accent } as React.CSSProperties}>
      <header className="ao-hosted-topbar">
        <ApplyOnceLogo size="sm" />
        <div className="ao-hosted-powered"><span>Hosted by {organization.name}</span><span className="ao-hosted-powered-dot" /><span>Powered by ApplyOnce</span></div>
        <Link href="/security" className="ao-hosted-top-link"><LockKeyhole /> Privacy</Link>
      </header>

      <div className="ao-hosted-layout">
        <section className="ao-hosted-main">
          <div className="ao-hosted-context"><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> {form.category}</span><span className="ao-hosted-version">Form v{form.version}</span></div>
          <div className="ao-hosted-title"><h1>{form.name}</h1><p>{form.description}</p></div>
          <div className="ao-hosted-steps" aria-label="Application progress">
            {[{ id: "details", label: "Your details" }, { id: "review", label: "Review and consent" }, { id: "complete", label: "Receipt" }].map((item, index) => {
              const currentIndex = ["details", "review", "complete"].indexOf(step);
              const complete = index < currentIndex;
              return <div className={`ao-hosted-step ${step === item.id ? "is-current" : ""} ${complete ? "is-complete" : ""}`} key={item.id}><span>{complete ? <Check /> : index + 1}</span><strong>{item.label}</strong></div>;
            })}
          </div>

          {error ? <div className="ao-hosted-alert" role="alert"><X /><span>{error}</span></div> : null}

          <AnimatePresence mode="wait" initial={false}>
            {step === "details" ? (
              <motion.div key="details" className="ao-hosted-stage" initial={reducedMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: .2 }}>
                <section className="ao-hosted-card"><div className="ao-hosted-card-head"><div><span className="ao-card-kicker">Step 1 of 2</span><h2>Tell us about yourself</h2></div><UserRound /></div><div className="ao-hosted-contact-grid"><label className="ao-hosted-field"><span className="ao-hosted-field-label"><span>Your full name<em>Required</em></span></span><input value={applicantName} onChange={(event) => { setApplicantName(event.target.value); updateValue("full_name", event.target.value); }} autoComplete="name" required /></label><label className="ao-hosted-field"><span className="ao-hosted-field-label"><span>Email address<em>Required</em></span></span><input value={applicantEmail} onChange={(event) => { setApplicantEmail(event.target.value); updateValue("email_address", event.target.value); }} type="email" autoComplete="email" required /></label></div></section>
                <section className="ao-hosted-card"><div className="ao-hosted-card-head"><div><span className="ao-card-kicker">Application information</span><h2>Only what this application needs</h2></div><ClipboardCheck /></div><div className="ao-hosted-fields">{form.formSchema.fields.filter((field) => field.key !== "full_name" && field.key !== "email_address").map((field) => <FormFieldInput key={field.key} field={field} value={values[field.key] ?? ""} onChange={(value) => updateValue(field.key, value)} reused={Boolean(viewer.authenticated && values[field.key] && field.profileKey)} />)}</div></section>
                {form.formSchema.documents.length > 0 ? <section className="ao-hosted-card ao-hosted-doc-card"><div className="ao-hosted-card-head"><div><span className="ao-card-kicker">Documents</span><h2>Keep your documents private</h2></div><FileText /></div><p className="ao-hosted-card-copy">Upload only what this application requests. Required documents can be added now or after submission if the partner asks for them.</p><div className="ao-hosted-document-list">{form.formSchema.documents.map((document) => { const uploaded = uploadedDocuments.find((item) => item.key === document.key); return <div className="ao-hosted-document" key={document.key}><span className="ao-list-icon ao-list-icon--mint"><FileText /></span><span><strong>{document.label}</strong><small>{uploaded ? `Added: ${uploaded.title}` : document.required ? "Required before review is complete" : "Optional"}</small></span>{uploaded ? <span className="ao-hosted-doc-status ao-hosted-doc-status--ready"><BadgeCheck /> Added</span> : viewerIsAuthenticated ? <label className="ao-hosted-upload-action"><Upload /> {uploadingDocument === document.key ? "Uploading..." : "Add file"}<input className="ao-hidden-input" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => void uploadDocument(document.key, event)} disabled={uploadingDocument !== null} /></label> : <Link className="ao-hosted-doc-status" href="/sign-in"><LockKeyhole /> Sign in to add</Link>}</div>; })}</div></section> : null}
                <div className="ao-hosted-actions"><span className="ao-hosted-save-note"><Sparkles /> Your progress stays in this browser until you submit.</span><button className="ao-button ao-button--primary" onClick={review}>Review information <ArrowRight /></button></div>
              </motion.div>
            ) : step === "review" ? (
              <motion.div key="review" className="ao-hosted-stage" initial={reducedMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: .2 }}>
                <section className="ao-hosted-card"><div className="ao-hosted-card-head"><div><span className="ao-card-kicker">Step 2 of 2</span><h2>Review before you share</h2></div><BadgeCheck /></div><p className="ao-hosted-card-copy">Check every value. ApplyOnce will send only the information shown below to {organization.name} for this form’s stated purpose.</p><div className="ao-hosted-review-grid"><div><span>Name</span><strong>{applicantName}</strong></div><div><span>Email</span><strong>{applicantEmail}</strong></div>{form.formSchema.fields.map((field) => <div key={field.key}><span>{field.label}</span><strong>{values[field.key] || "Not provided"}</strong>{viewer.authenticated && field.profileKey && values[field.key] ? <small><BadgeCheck /> Profile value</small> : null}</div>)}</div></section>
                <section className="ao-hosted-card ao-hosted-consent-card"><div className="ao-hosted-card-head"><div><span className="ao-card-kicker">Purpose-bound consent</span><h2>{organization.name} is requesting your permission</h2></div><ShieldCheck /></div><p>{form.purpose}</p><div className="ao-hosted-consent-summary"><div><CheckCircle2 /><span><strong>{form.formSchema.fields.length} fields</strong> will be shared after you confirm.</span></div><div><FileText /><span><strong>{uploadedDocuments.length} documents</strong> will be shared. {missingRequiredDocuments.length > 0 ? `${missingRequiredDocuments.length} required document${missingRequiredDocuments.length === 1 ? " is" : "s are"} still missing.` : "All requested documents are attached."}</span></div><div><LockKeyhole /><span>Your consent is recorded with a receipt and can be reviewed later.</span></div></div><label className="ao-hosted-consent-check"><input type="checkbox" checked={consentAccepted} onChange={(event) => { setConsentAccepted(event.target.checked); setError(""); }} /><span>I have reviewed the information and consent to share it with {organization.name} for this purpose.</span></label></section>
                <div className="ao-hosted-actions"><button className="ao-button ao-button--quiet" onClick={() => { setStep("details"); setError(""); }}><ArrowLeft /> Edit information</button><button className="ao-button ao-button--primary" onClick={() => void submit()} disabled={submitting || !consentAccepted}>{submitting ? "Submitting securely..." : "Share and submit"}<ArrowRight /></button></div>
              </motion.div>
            ) : (
              <motion.div key="complete" className="ao-hosted-stage" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}>
                <section className="ao-hosted-success"><div className="ao-hosted-success-mark"><Check /></div><span className="ao-eyebrow"><span className="ao-eyebrow-mark" /> Submission complete</span><h2>Your application is on its way.</h2><p>{organization.name} received your application and your consent receipt is ready below.</p><div className="ao-hosted-receipt"><span>Receipt ID</span><strong>{submission?.receiptCode}</strong><button onClick={() => void copyReceipt()}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy ID"}</button><div><span>Submitted</span><strong>{submission ? formatDate(submission.createdAt) : "Just now"}</strong></div><div><span>Status</span><strong className="ao-hosted-receipt-status">{submission?.status === "needs_documents" ? "Needs documents" : "Received"}</strong></div></div><div className="ao-hosted-actions ao-hosted-actions--center"><button className="ao-button ao-button--outline" onClick={() => window.print()}><ExternalLink /> Print receipt</button><Link className="ao-button ao-button--primary" href="/">Done <ArrowRight /></Link></div></section><div className="ao-hosted-aftercare"><ShieldCheck /><div><strong>What happens next?</strong><span>{submission?.status === "needs_documents" ? "The partner can review your details now and request the missing document. " : "Your application is ready for the partner to review. "}Keep your receipt ID. If you signed in, status updates will also appear in your ApplyOnce workspace.</span></div>{viewer.authenticated ? <Link href="/app">Open workspace <ArrowRight /></Link> : <Link href="/sign-in">Sign in to track <ArrowRight /></Link>}</div></motion.div>
            )}
          </AnimatePresence>
        </section>
        {step !== "complete" ? <ScopePanel payload={payload} /> : null}
      </div>
      <footer className="ao-hosted-footer"><ApplyOnceLogo size="xs" /><span>ApplyOnce keeps applications clearer, safer, and easier to finish.</span><a href="https://github.com/AyushCoder9/applyonce" target="_blank" rel="noreferrer">View source <ExternalLink /></a></footer>
    </main>
  );
}

function CircleError() {
  return <span className="ao-hosted-error-mark"><X /></span>;
}

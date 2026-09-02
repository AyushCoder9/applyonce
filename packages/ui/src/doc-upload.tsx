"use client";
/** DocUpload — drag-drop → docType → presigned PUT (progress) → complete → processing → done. Fetch is injected so this stays app-agnostic. */
import { useRef, useState } from "react";
import { Button, Select, ListBox, Label, ProgressBar } from "@heroui/react";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cx, type Locale } from "./format";

export interface DocUploadProps {
  docTypes: { id: string; label: string }[];
  defaultDocType?: string;
  getUploadUrl: (file: File, docType: string) => Promise<{ documentId: string; url: string }>;
  complete: (documentId: string, meta: { size: number; sha256: string }) => Promise<void>;
  onDone?: (documentId: string) => void;
  locale?: Locale;
  className?: string;
}
type Phase = "idle" | "picked" | "uploading" | "processing" | "done" | "error";
const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

async function sha256Hex(file: File) {
  const buf = await file.arrayBuffer();
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed — check your connection"));
    xhr.send(file);
  });
}

export function DocUpload({ docTypes, defaultDocType, getUploadUrl, complete, onDone, locale = "en", className }: DocUploadProps) {
  const hi = locale === "hi";
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string | null>(defaultDocType ?? null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) return setErr(hi ? "केवल PDF, JPG, PNG या WebP" : "PDF, JPG, PNG or WebP only");
    if (f.size > 15 * 1024 * 1024) return setErr(hi ? "अधिकतम 15 MB" : "Max 15 MB");
    setErr(null); setFile(f); setPhase("picked");
  };
  const reset = () => { setFile(null); setPhase("idle"); setPct(0); setErr(null); setDocId(null); };
  const start = async () => {
    if (!file || !docType) return;
    setPhase("uploading"); setErr(null);
    try {
      const { documentId, url } = await getUploadUrl(file, docType);
      setDocId(documentId);
      await putWithProgress(url, file, setPct);
      setPhase("processing");
      await complete(documentId, { size: file.size, sha256: await sha256Hex(file) });
      setPhase("done");
      onDone?.(documentId);
    } catch (e) { setErr((e as Error).message); setPhase("error"); }
  };

  return (
    <div className={cx("card p-5", className)} data-testid="doc-upload" data-phase={phase}>
      {phase === "idle" && (
        <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          className={cx("grid w-full place-items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors", drag ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-500/60 hover:bg-surface-2")}>
          <span className="grid size-12 place-items-center rounded-pill bg-accent-50 text-accent-600"><UploadCloud className="size-6" /></span>
          <span className="font-semibold">{hi ? "फ़ाइल यहाँ छोड़ें या चुनें" : "Drop a file here or tap to choose"}</span>
          <span className="text-sm text-ink-3">{hi ? "PDF, JPG, PNG · 15 MB तक · हम तथ्य निकालेंगे और आपसे पुष्टि लेंगे" : "PDF, JPG, PNG · up to 15 MB · we’ll read it and ask you to confirm the facts"}</span>
        </button>
      )}
      <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      {file && phase !== "idle" && (
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2"><FileText className="size-5" /></span>
            <div className="min-w-0 flex-1"><div className="truncate font-medium">{file.name}</div><div className="text-xs text-ink-3">{(file.size / 1024).toFixed(0)} KB · {file.type.replace("application/", "").replace("image/", "").toUpperCase()}</div></div>
            {(phase === "picked" || phase === "error" || phase === "done") && <button type="button" aria-label="Remove" onClick={reset} className="grid size-9 place-items-center rounded-pill text-ink-3 hover:bg-surface-2"><X className="size-4" /></button>}
          </div>
          {phase === "picked" && (
            <>
              <Select selectedKey={docType} onSelectionChange={(k) => setDocType(k == null ? null : String(k))} placeholder={hi ? "यह कौन-सा दस्तावेज़ है?" : "What document is this?"} fullWidth>
                <Label>{hi ? "दस्तावेज़ का प्रकार" : "Document type"}</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover><ListBox>{docTypes.map((d) => <ListBox.Item key={d.id} id={d.id} textValue={d.label}>{d.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
              </Select>
              <Button className="cta" size="lg" onPress={start} isDisabled={!docType}>{hi ? "अपलोड करें" : "Upload"}</Button>
            </>
          )}
          {phase === "uploading" && <div className="grid gap-1"><ProgressBar value={pct} color="accent" aria-label="Upload progress" /><div className="text-sm text-ink-2">{hi ? "अपलोड हो रहा है" : "Uploading"} · {pct}%</div></div>}
          {phase === "processing" && <div className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin text-brand-600" />{hi ? "पढ़ रहे हैं… कुछ सेकंड" : "Reading the document… a few seconds"}</div>}
          {phase === "done" && <div className="flex items-center gap-2 text-sm text-verified-700"><CheckCircle2 className="size-4" />{hi ? "अपलोड पूरा। तथ्य मिलते ही हम बताएँगे।" : "Uploaded. We’ll tell you when the facts are ready to review."}</div>}
          {phase === "error" && <div className="flex items-center gap-2 text-sm text-danger-500"><AlertTriangle className="size-4" />{err}<Button size="sm" variant="outline" onPress={start} className="ml-auto">{hi ? "फिर कोशिश करें" : "Retry"}</Button></div>}
          {docId && phase === "done" && <div className="text-xs text-ink-3">ID {docId.slice(0, 8)}</div>}
        </div>
      )}
      {err && phase === "idle" && <p className="mt-2 text-sm text-danger-500">{err}</p>}
    </div>
  );
}

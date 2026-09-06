"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Button, Chip, Drawer, Modal, Tabs, toast } from "@heroui/react";
import { Plus, ShieldCheck, Users, Trash2, ArrowRightLeft, PencilLine, Send } from "lucide-react";
import { SECTION_META, SECTIONS, GENDER, RELATION, ENUM_LABELS } from "@applyonce/schema";
import { EmptyState, ProgressRing, Callout, fmtDate, type Locale } from "@applyonce/ui";
import type { FamilyMember } from "./data";

const T = {
  guardian: { en: "Guardian", hi: "अभिभावक" }, delegate: { en: "Delegate", hi: "प्रतिनिधि" }, pending: { en: "Invite sent", hi: "आमंत्रण भेजा" }, claimed: { en: "Own account", hi: "अपना खाता" },
  addMinor: { en: "Add minor", hi: "बच्चा जोड़ें" }, addElder: { en: "Invite elder / delegate", hi: "बुज़ुर्ग / प्रतिनिधि आमंत्रित करें" },
  until: { en: "Access until", hi: "पहुँच समाप्ति" }, noExpiry: { en: "Until they turn 18", hi: "18 वर्ष तक" }, all: { en: "Everything", hi: "सब कुछ" },
  switchTo: { en: "Switch to", hi: "बदलें" }, edit: { en: "Edit access", hi: "पहुँच बदलें" }, remove: { en: "Remove", hi: "हटाएँ" },
  empty: { en: "No family yet", hi: "अभी कोई परिवार नहीं" }, emptyBlurb: { en: "Add a child under 18 or invite a parent to manage their forms too.", hi: "18 से कम उम्र का बच्चा जोड़ें या माता-पिता को आमंत्रित करें।" },
};
const REL: Record<string, { en: string; hi: string }> = { father: { en: "Father", hi: "पिता" }, mother: { en: "Mother", hi: "माता" }, guardian: { en: "Guardian", hi: "अभिभावक" }, spouse: { en: "Spouse", hi: "जीवनसाथी" }, sibling: { en: "Sibling", hi: "भाई/बहन" }, child: { en: "Child", hi: "बच्चा" }, grandparent: { en: "Grandparent", hi: "दादा-दादी / नाना-नानी" }, other: { en: "Other", hi: "अन्य" } };
const inp = "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] disabled:opacity-60";
const lbl = "text-sm font-medium text-ink";
const api = async (url: string, method: string, data?: unknown) => {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: data ? JSON.stringify(data) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message ?? "Something went wrong");
  return j.data;
};
const secLabel = (s: string, l: Locale) => (s === "*" ? T.all[l] : SECTION_META.find((m) => m.id === s)?.label[l] ?? s);

export function FamilyClient({ members, locale, openAdd, activeProfileId }: { members: FamilyMember[]; locale: Locale; openAdd: boolean; activeProfileId: string }) {
  const l = locale;
  const router = useRouter();
  const [, start] = useTransition();
  const [add, setAdd] = useState(openAdd);
  const [edit, setEdit] = useState<FamilyMember | null>(null);
  const [claim, setClaim] = useState<FamilyMember | null>(null);
  useEffect(() => { if (openAdd) setAdd(true); }, [openAdd]);
  const refresh = () => start(() => router.refresh());

  const switchTo = async (m: FamilyMember) => {
    try { await api("/api/v1/profiles/active", "POST", { profileId: m.profileId }); toast.success(`${l === "hi" ? "अब देख रहे हैं" : "Now viewing"}: ${m.displayName}`); refresh(); }
    catch (e) { toast.danger((e as Error).message); }
  };
  const remove = async (m: FamilyMember) => {
    if (!confirm(l === "hi" ? `${m.displayName} की पहुँच हटाएँ?` : `Remove access for ${m.displayName}?`)) return;
    try { await api(`/api/v1/family/${m.relationId}`, "DELETE"); toast.success(l === "hi" ? "हटाया गया" : "Removed"); refresh(); } catch (e) { toast.danger((e as Error).message); }
  };
  const due = members.filter((m) => m.handoverDue);

  return (
    <>
      {due.map((m) => (
        <Callout key={m.relationId} tone="info" title={l === "hi" ? `${m.displayName} अब अपनी प्रोफ़ाइल ले सकती/सकता है` : `${m.displayName} can claim their profile`}
          action={<Button size="sm" onPress={() => setClaim(m)}><Send className="size-4" />{l === "hi" ? "क्लेम लिंक भेजें" : "Send claim link"}</Button>}>
          {l === "hi" ? "18 वर्ष के होने पर प्रोफ़ाइल उनकी होती है। आपको 90 दिन तक पहचान व शिक्षा की पहुँच रहेगी।" : "At 18 the profile becomes theirs. You keep identity and education access for 90 days, then it ends."}
        </Callout>
      ))}
      {members.length === 0 ? (
        <EmptyState icon={<Users className="size-7" />} title={T.empty[l]} blurb={T.emptyBlurb[l]} action={<Button className="cta" onPress={() => setAdd(true)}><Plus className="size-4" />{T.addMinor[l]}</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((m, i) => (
            <section key={m.relationId} className="card rise p-5" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
              <div className="flex items-start gap-3">
                <Avatar size="lg" color={m.basis === "minor" ? "warning" : "accent"}><Avatar.Fallback>{m.displayName.slice(0, 1)}</Avatar.Fallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">{m.displayName}</h3>
                    {m.pending ? <Chip size="sm" color="warning">{T.pending[l]}</Chip> : <Chip size="sm" color={m.basis === "minor" ? "warning" : "accent"}>{m.basis === "minor" ? T.guardian[l] : T.delegate[l]}</Chip>}
                    {m.claimed && <Chip size="sm" color="success">{T.claimed[l]}</Chip>}
                    {m.profileId === activeProfileId && <Chip size="sm" color="default">{l === "hi" ? "सक्रिय" : "Active"}</Chip>}
                  </div>
                  <div className="mt-0.5 text-sm text-ink-2">{REL[m.relation]?.[l] ?? m.relation}{m.dobYear ? ` · ${l === "hi" ? "जन्म" : "born"} ${m.dobYear}` : ""}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{m.scope.map((s) => <Chip key={s} size="sm" variant="soft" color="default"><ShieldCheck className="size-3" />{secLabel(s, l)}</Chip>)}</div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <ProgressRing value={m.filled} max={m.total} size="sm" label={`${m.verified} ${l === "hi" ? "सत्यापित" : "verified"}`} />
                <div className="text-right text-ink-3"><div className="text-xs">{T.until[l]}</div><div className="font-medium text-ink-2">{m.basis === "minor" ? T.noExpiry[l] : m.validUntil ? fmtDate(m.validUntil, l) : l === "hi" ? "रद्द करने तक" : "Until revoked"}</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!m.pending && <Button size="sm" variant="secondary" onPress={() => switchTo(m)} isDisabled={m.profileId === activeProfileId}><ArrowRightLeft className="size-4" />{T.switchTo[l]}</Button>}
                {m.basis !== "minor" && !m.pending && <Button size="sm" variant="outline" onPress={() => setEdit(m)}><PencilLine className="size-4" />{T.edit[l]}</Button>}
                <Button size="sm" variant="danger-soft" onPress={() => remove(m)}><Trash2 className="size-4" />{T.remove[l]}</Button>
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-ink-3">{l === "hi" ? "बच्चों का डेटा (DPDP नियम 10): आप अभिभावक के रूप में सहमति देते हैं। बच्चे के 18 होने पर प्रोफ़ाइल उसे सौंपी जाती है।" : "Children's data (DPDP Rule 10): you consent as the verifiable parent/guardian. At 18 the profile is handed over to them."} <Link href="/privacy" className="underline">{l === "hi" ? "गोपनीयता सूचना" : "Privacy notice"}</Link></p>

      <AddDrawer open={add} onOpenChange={setAdd} locale={l} onDone={refresh} />
      {edit && <EditModal m={edit} locale={l} onClose={() => setEdit(null)} onDone={refresh} />}
      {claim && <ClaimModal m={claim} locale={l} onClose={() => setClaim(null)} onDone={refresh} />}
    </>
  );
}

function AddDrawer({ open, onOpenChange, locale: l, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; locale: Locale; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"minor" | "elder">("minor");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr(null); setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (tab === "minor") {
        await api("/api/v1/family/minor", "POST", { name: fd.get("name"), dob: fd.get("dob"), gender: fd.get("gender"), relation: fd.get("relation") });
        toast.success(l === "hi" ? "प्रोफ़ाइल बनी" : "Profile created", { description: l === "hi" ? "ऊपर स्विचर से बदलें।" : "Switch to it from the header." });
      } else {
        const vu = String(fd.get("validUntil") ?? "");
        const r = await api("/api/v1/family/elder/invite", "POST", { name: fd.get("name"), phone: fd.get("phone"), relation: fd.get("relation"), scope: fd.getAll("scope"), validUntil: vu ? new Date(vu).toISOString() : null });
        toast.success(l === "hi" ? "आमंत्रण भेजा" : "Invite sent by SMS", { description: r.devLink ? `Dev link: ${r.devLink}` : undefined, timeout: r.devLink ? 20000 : undefined });
      }
      onOpenChange(false); onDone();
    } catch (er) { setErr((er as Error).message); }
    setBusy(false);
  };
  return (
    <Drawer isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Backdrop><Drawer.Content placement="bottom"><Drawer.Dialog className="mx-auto w-full max-w-2xl">
        <Drawer.Header><Drawer.Heading>{l === "hi" ? "परिवार का सदस्य जोड़ें" : "Add a family member"}</Drawer.Heading></Drawer.Header>
        <Drawer.Body>
          <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as "minor" | "elder")} className="w-full">
            <Tabs.ListContainer><Tabs.List aria-label="Type"><Tabs.Tab id="minor">{T.addMinor[l]}<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="elder">{T.addElder[l]}<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs.ListContainer>
            <Tabs.Panel id="minor" className="pt-4">
              <form onSubmit={submit} className="grid gap-4" data-testid="add-minor-form">
                <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "पूरा नाम (जन्म प्रमाण पत्र / आधार अनुसार)" : "Full name (as on birth certificate / Aadhaar)"}</span><input name="name" required minLength={2} className={inp} autoFocus /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "जन्म तिथि" : "Date of birth"}</span><input name="dob" type="date" required max={new Date().toISOString().slice(0, 10)} className={inp} /><span className="text-xs text-ink-3">{l === "hi" ? "18 से कम होना चाहिए" : "Must be under 18"}</span></label>
                  <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "लिंग" : "Gender"}</span><select name="gender" required className={inp} defaultValue="">{[<option key="" value="" disabled>—</option>, ...GENDER.map((g) => <option key={g} value={g}>{ENUM_LABELS.gender?.[g]?.[l] ?? g}</option>)]}</select></label>
                </div>
                <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "आपका रिश्ता" : "They are your"}</span><select name="relation" className={inp} defaultValue="child">{RELATION.map((r) => <option key={r} value={r}>{REL[r]?.[l] ?? r}</option>)}</select></label>
                {err && <p role="alert" className="text-sm text-danger-500">{err}</p>}
                <Button type="submit" size="lg" className="cta" isPending={busy}>{l === "hi" ? "प्रोफ़ाइल बनाएँ" : "Create profile"}</Button>
              </form>
            </Tabs.Panel>
            <Tabs.Panel id="elder" className="pt-4">
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "नाम" : "Name"}</span><input name="name" required minLength={2} className={inp} /></label>
                  <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "उनका मोबाइल" : "Their mobile"}</span><input name="phone" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" required className={inp} placeholder="10 digits" /></label>
                </div>
                <fieldset className="grid gap-2"><legend className={lbl}>{l === "hi" ? "आप क्या संभालेंगे" : "What you can manage"}</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{SECTIONS.map((s) => <label key={s} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm has-checked:border-brand-500 has-checked:bg-brand-50"><input type="checkbox" name="scope" value={s} defaultChecked={s === "identity"} />{SECTION_META.find((m) => m.id === s)?.label[l]}</label>)}</div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "पहुँच समाप्ति" : "Access until"}</span><input name="validUntil" type="date" min={new Date().toISOString().slice(0, 10)} className={inp} defaultValue={new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)} /></label>
                  <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "रिश्ता" : "Relation"}</span><select name="relation" className={inp} defaultValue="grandparent">{RELATION.map((r) => <option key={r} value={r}>{REL[r]?.[l] ?? r}</option>)}</select></label>
                </div>
                <p className="text-sm text-ink-2">{l === "hi" ? "उन्हें SMS मिलेगा। वे अपने नंबर से लॉगिन कर सहमति देंगे। आप कभी भी हटा सकते हैं।" : "They get an SMS, log in with their own number and consent. You can remove access any time."}</p>
                {err && <p role="alert" className="text-sm text-danger-500">{err}</p>}
                <Button type="submit" size="lg" className="cta" isPending={busy}>{l === "hi" ? "आमंत्रण भेजें" : "Send invite"}</Button>
              </form>
            </Tabs.Panel>
          </Tabs>
        </Drawer.Body>
      </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>
    </Drawer>
  );
}

function EditModal({ m, locale: l, onClose, onDone }: { m: FamilyMember; locale: Locale; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget); const vu = String(fd.get("validUntil") ?? "");
    try { await api(`/api/v1/family/${m.relationId}`, "PATCH", { scope: fd.getAll("scope"), validUntil: vu ? new Date(vu).toISOString() : null }); toast.success(l === "hi" ? "पहुँच अपडेट" : "Access updated"); onClose(); onDone(); }
    catch (er) { toast.danger((er as Error).message); }
    setBusy(false);
  };
  return (
    <Modal isOpen onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop><Modal.Container><Modal.Dialog>
        <Modal.CloseTrigger /><Modal.Header><Modal.Heading>{T.edit[l]} · {m.displayName}</Modal.Heading></Modal.Header>
        <Modal.Body>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">{SECTIONS.map((s) => <label key={s} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm has-checked:border-brand-500 has-checked:bg-brand-50"><input type="checkbox" name="scope" value={s} defaultChecked={m.scope.includes("*") || m.scope.includes(s)} />{SECTION_META.find((x) => x.id === s)?.label[l]}</label>)}</div>
            <label className="grid gap-1"><span className={lbl}>{T.until[l]}</span><input name="validUntil" type="date" className={inp} defaultValue={m.validUntil ? m.validUntil.slice(0, 10) : ""} /></label>
            <Button type="submit" className="cta" isPending={busy}>{l === "hi" ? "सहेजें" : "Save"}</Button>
          </form>
        </Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
}

function ClaimModal({ m, locale: l, onClose, onDone }: { m: FamilyMember; locale: Locale; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api(`/api/v1/family/${m.relationId}`, "PATCH", { sendClaimLink: true, phone: new FormData(e.currentTarget).get("phone") }); toast.success(l === "hi" ? "क्लेम लिंक भेजा" : "Claim link sent", { description: r.devLink ? `Dev link: ${r.devLink}` : undefined, timeout: r.devLink ? 20000 : undefined }); onClose(); onDone(); }
    catch (er) { toast.danger((er as Error).message); }
    setBusy(false);
  };
  return (
    <Modal isOpen onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop><Modal.Container size="sm"><Modal.Dialog>
        <Modal.CloseTrigger /><Modal.Header><Modal.Heading>{l === "hi" ? "क्लेम लिंक भेजें" : "Send claim link"}</Modal.Heading></Modal.Header>
        <Modal.Body>
          <form onSubmit={submit} className="grid gap-4">
            <p className="text-ink-2">{l === "hi" ? `${m.displayName} का अपना मोबाइल नंबर। वे उसी नंबर से लॉगिन कर प्रोफ़ाइल क्लेम करेंगे।` : `${m.displayName}'s own mobile. They log in with it and claim the profile.`}</p>
            <label className="grid gap-1"><span className={lbl}>{l === "hi" ? "मोबाइल" : "Mobile"}</span><input name="phone" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" required className={inp} autoFocus /></label>
            <Button type="submit" className="cta" isPending={busy}><Send className="size-4" />{l === "hi" ? "भेजें" : "Send"}</Button>
          </form>
        </Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
}

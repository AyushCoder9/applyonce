import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, t, eq, and, inArray, isNull, audit, getDek, getFacts, putFact, systemDek } from "@praman/db";
import { encrypt, sha256, canonicalHash } from "@praman/crypto";
import { field, isFactKey, scopeForPurpose, scopeContains, documentAllowed, customAnswerErrors, type PramanPayload, type SharedFact } from "@praman/schema";
import { handler, citizen, body, ok, ApiError } from "@/lib/api";
import { loadShareSession, newShareToken, hashToken, withQuery, SHARE_TTL_MS } from "@/lib/share";
import { signSharePayload } from "@/lib/signing";
import { queueWebhook, flushDeliveries } from "@/lib/webhooks";

const schema = z.object({
  profileId: z.uuid(),
  acceptedFields: z.array(z.string()).max(200),
  customAnswers: z.record(z.string(), z.unknown()).default({}),
  /** values the citizen typed for missing fields; written as self-declared facts before the payload is built */
  newFacts: z.record(z.string(), z.unknown()).default({}),
  stepUpMethod: z.enum(["passkey", "otp"]).default("otp"),
});

/**
 * POST /api/v1/share/:token/consent — the only path that creates a share. Step-up required.
 * One transaction: facts → consent → application → signed payload → share (trigger-guarded) → session consented → event → audit → webhook rows.
 */
export const POST = handler(async (req, { params }) => {
  const b = await body(req, schema);
  const { user, profile, ownerUserId, scope } = await citizen(req, { profileId: b.profileId, stepUp: true });
  const s = await loadShareSession(params.token!);
  if (!s) throw new ApiError(404, "SHARE_NOT_FOUND");
  if (s.problem) throw new ApiError(410, `SHARE_${s.problem.toUpperCase()}`, "This share link is no longer valid. Go back to the partner and start again.");
  const { session: ss, form, partner } = s;
  if (partner.status === "suspended") throw new ApiError(403, "PARTNER_SUSPENDED");

  if (form.status !== "live" || (form.deadlineAt && form.deadlineAt <= new Date())) throw new ApiError(409, "FORM_CLOSED", "This form is no longer accepting applications.");
  const requested = form.requestedFields.filter((r) => isFactKey(r.key));
  const { allowed } = scopeForPurpose(requested.map((r) => r.key), form.purpose);
  const required = requested.filter((r) => r.required && allowed.includes(r.key)).map((r) => r.key);
  if (required.some(key => !scopeContains(scope, key))) throw new ApiError(403, "SCOPE_FORBIDDEN", "This application requests fields outside your delegated access. The profile owner must apply.");
  const accepted = [...new Set([...required, ...b.acceptedFields.filter((k) => allowed.includes(k) && scopeContains(scope, k))])];
  const customErrors = customAnswerErrors(form.customFields, b.customAnswers);
  if (Object.keys(customErrors).length) throw new ApiError(422, "VALIDATION", "Answer the required questions", customErrors);
  const custom = Object.fromEntries(form.customFields.filter((c) => c.id in b.customAnswers).map((c) => [c.id, b.customAnswers[c.id]]));

  const dek = await getDek(ownerUserId);
  const ipHash = sha256(req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "local");
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const claimed = await tx.update(t.shareSessions).set({ status: "consented", profileId: profile.id }).where(and(eq(t.shareSessions.id, ss.id), eq(t.shareSessions.status, "open"))).returning({ id: t.shareSessions.id });
    if (!claimed.length) throw new ApiError(409, "SHARE_ALREADY_USED", "This request was already completed.");
    for (const c of form.customFields.filter(c => c.type === "file" && custom[c.id])) {
      const doc = await tx.query.documents.findFirst({ where: and(eq(t.documents.id, String(custom[c.id])), eq(t.documents.profileId, profile.id), eq(t.documents.status, "ready")) });
      if (!doc || !documentAllowed(scope,doc.docType)) throw new ApiError(422, "INVALID_DOCUMENT", "Choose a ready document from this profile", { [c.id]: "Invalid document" });
    }
    for (const [key, value] of Object.entries(b.newFacts)) {
      if (!accepted.includes(key) || !field(key).sources.includes("self_declared") || value == null || value === "") continue;
      try { await putFact(dek, { profileId: profile.id, key, value: value as never, source: "self_declared", updatedBy: user.id, reason: `share:${partner.slug}` }, tx); }
      catch (e) { throw new ApiError(422, "VALIDATION", "Check the highlighted fields", { [key]: String((e as Error).message).replace(/^invalid [^:]+: /, "") }); }
    }
    const facts = (await getFacts(dek, profile.id, { keys: accepted }, tx)).filter((f) => f.repeatIndex === 0 && f.value != null && f.value !== "");
    const expired = facts.filter(f => f.expiresAt && Date.parse(f.expiresAt) <= now.getTime());
    if (expired.some(f => required.includes(f.key))) throw new ApiError(422, "EXPIRED_EVIDENCE", "Re-verify expired evidence before sharing.", Object.fromEntries(expired.map(f => [f.key, "Evidence has expired"])));
    const unresolved = await tx.select({ key: t.mismatches.factKey }).from(t.mismatches).where(and(eq(t.mismatches.profileId, profile.id), isNull(t.mismatches.resolvedAt)));
    if (unresolved.some(m => required.includes(m.key))) throw new ApiError(409, "UNRESOLVED_CONFLICT", "Resolve conflicting evidence in Verify before sharing.");
    const missing = required.filter((k) => !facts.some((f) => f.key === k));
    if (missing.length) throw new ApiError(422, "MISSING_REQUIRED", "Fill the required fields first", Object.fromEntries(missing.map((k) => [k, "Required"])));
    const shareableFacts = facts.filter(f => !expired.includes(f));
    const sharedKeys = [...new Set(shareableFacts.map((f) => f.key))];

    const docIds = [...new Set(shareableFacts.flatMap((f) => [f.evidenceDocumentId, field(f.key).type === "file_ref" ? String(f.value) : null]).filter((x): x is string => !!x))];
    const docs = docIds.length ? await tx.select({ id: t.documents.id, sha256: t.documents.sha256, title: t.documents.title }).from(t.documents).where(and(inArray(t.documents.id, docIds), eq(t.documents.profileId, profile.id), eq(t.documents.status, "ready"))) : [];
    const doc = (id?: string | null) => { const d = id ? docs.find((x) => x.id === id) : undefined; return d ? { documentId: d.id, sha256: d.sha256 ?? "", title: d.title } : null; };

    const [consent] = await tx.insert(t.consents).values({ profileId: profile.id, grantedByUserId: user.id, partnerId: partner.id, formId: form.id, purpose: form.purpose, scope: sharedKeys, expiresAt: new Date(now.getTime() + form.retentionDays * 864e5), stepUpMethod: b.stepUpMethod, ipHash }).returning();
    const [app] = await tx.insert(t.applications).values({ profileId: profile.id, partnerId: partner.id, formId: form.id, title: form.name, orgName: partner.name, kind: form.kind, status: "submitted", submittedAt: now, source: "sdk", deadlineAt: form.deadlineAt, portalUrl: partner.website }).returning();

    const shareId = randomUUID();
    const token = newShareToken(ss.id);
    const sharedFacts: SharedFact[] = shareableFacts.map((f) => ({ key: f.key, value: f.value, source: f.source, verifiedBy: f.verifiedBy ?? null, verifiedAt: f.verifiedAt ?? null, evidence: doc(field(f.key).type === "file_ref" ? String(f.value) : f.evidenceDocumentId) }));
    const iat = Math.floor(now.getTime() / 1000);
    const payload: PramanPayload = {
      iss: "praman", sub: sha256(profile.id + partner.id), aud: partner.id, iat, exp: iat + SHARE_TTL_MS / 1000, jti: shareId,
      consent_id: consent!.id, application_id: app!.id, form_id: form.id, form_version: form.version, purpose: form.purpose,
      profile: { kind: profile.kind, display_name: profile.displayName, ...(profile.role === "guardian" ? { guardian_acting: true } : {}) },
      facts: sharedFacts, custom, profile_hash: canonicalHash(sharedFacts),
    };
    const jws = await signSharePayload(payload, SHARE_TTL_MS / 1000);
    await tx.insert(t.shares).values({ id: shareId, consentId: consent!.id, applicationId: app!.id, shareSessionId: ss.id, sharedKeys, payloadHash: sha256(jws), payloadEnc: encrypt(systemDek(), jws, `share:${shareId}`), shareTokenHash: hashToken(token), expiresAt: new Date(now.getTime() + SHARE_TTL_MS) });
    await tx.update(t.shareSessions).set({ status: "consented", profileId: profile.id }).where(eq(t.shareSessions.id, ss.id));
    await tx.insert(t.applicationEvents).values({ applicationId: app!.id, type: "created", title: `Shared with ${partner.name} via Praman`, body: `${sharedFacts.length} fields · consent ${consent!.id}`, actor: "citizen", meta: { consentId: consent!.id, shareId, fields: sharedFacts.length } });
    await audit({ actorUserId: user.id, action: "share.create", targetType: "share", targetId: shareId, meta: { consentId: consent!.id, applicationId: app!.id, partnerId: partner.id, profileId: profile.id, fields: sharedKeys.length, guardian: profile.role === "guardian" } }, tx);
    const deliveries = await queueWebhook(partner.id, "share.completed", { application_id: app!.id, consent_id: consent!.id, share_session_id: ss.id, state: ss.state, form_id: form.id }, tx);
    return { token, consentId: consent!.id, applicationId: app!.id, deliveries, shared: sharedFacts.length };
  });
  await flushDeliveries(result.deliveries).catch(error => console.error("Webhook dispatch pending; consent remains committed", error));
  return ok({ return_url: ss.state?.startsWith("hosted:") ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300"}/app/applications/${result.applicationId}?shared=1` : withQuery(ss.returnUrl, { share_token: result.token, state: ss.state }), consent_id: result.consentId, application_id: result.applicationId, shared: result.shared });
});

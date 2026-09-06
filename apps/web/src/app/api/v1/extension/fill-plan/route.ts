import { getDek, getFacts } from "@praman/db";
import { field, isFactKey, scopeContains } from "@praman/schema";
import { fmtValue } from "@praman/ui";
import { MOCK_OTP } from "@praman/providers";
import { handler, ok, ApiError } from "@/lib/api";
import { extensionUser } from "../_auth";

/**
 * GET /api/v1/extension/fill-plan?recipe=<id>&profile=<id>&keys=a,b,c&stepUp=<otp>
 * Values are decrypted server-side and returned once, over TLS — never cached on disk
 * by the extension. Sensitive facts require a fresh step-up; in mock mode that's the OTP
 * `123456`. Live mode must call the real step-up endpoint (`/api/v1/auth/step-up`) first —
 * this route does not implement live step-up itself (ponytail: out of WP6 scope).
 */
export const GET = handler(async (req) => {
  const { profile, ownerUserId, extSession } = await extensionUser(req);
  const url = new URL(req.url);
  const keys = (url.searchParams.get("keys") ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  if (!keys.length) throw new ApiError(400, "KEYS_REQUIRED", "Pass ?keys=fact.key,fact.key2");
  const stepUp = req.headers.get("x-praman-step-up") ?? "";
  const mockSms = (process.env.PROVIDER_SMS ?? "mock") === "mock";
  const steppedUp = (mockSms && stepUp === MOCK_OTP) || (!!extSession.steppedUpAt && Date.now()-extSession.steppedUpAt.getTime()<300000);

  const dek = await getDek(ownerUserId);
  const facts = await getFacts(dek, profile.id, { keys });
  const byKey = new Map(facts.filter((f) => f.repeatIndex === 0).map((f) => [f.key, f]));

  const values: Record<string, { value: unknown; source: string; verifiedBy: string | null }> = {};
  const labels: Record<string, string> = {};
  const missing: string[] = [];

  for (const key of keys) {
    if (!isFactKey(key) || field(key).system || !scopeContains(profile.scope,key)) { missing.push(key); continue; }
    const fact = byKey.get(key);
    if (!fact || (fact.expiresAt && new Date(fact.expiresAt).getTime() <= Date.now()) || fact.value == null || fact.value === "") { missing.push(key); continue; }
    if (field(key).sensitive && !steppedUp) { missing.push(key); continue; }
    values[key] = { value: fact.value, source: fact.source, verifiedBy: fact.verifiedBy ?? null };
    labels[key] = fmtValue(key, fact.value);
  }

  return ok({ profile: { id: profile.id, displayName: profile.displayName, kind: profile.kind }, values, labels, missing });
});

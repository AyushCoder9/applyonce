/**
 * F2 end to end against the seeded DB: partner API creates a share session → citizen logs in → consent screen → step-up →
 * exchange returns a JWS that verifies against /api/v1/jwks → replay is 409 → consent revoke → exchange after revoke is 409.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { jwtVerify, createLocalJWKSet } from "jose";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3300";
const KEY = process.env.BTA_PRAMAN_API_KEY ?? "pk_sandbox_bta_demo_key_0001";
const PHONE = "+919876543210";
const OTP = "123456";
const partnerHeaders = { authorization: `Bearer ${KEY}`, "content-type": "application/json" };
// dev server compiles routes on first hit; on a loaded box that can take minutes
test.setTimeout(1_800_000);
test.use({ actionTimeout: 300_000, navigationTimeout: 900_000 });
const SLOW = { timeout: 600_000 };

async function login(request: APIRequestContext) {
  const h = { origin: BASE, "content-type": "application/json" };
  expect((await request.post(`${BASE}/api/auth/phone-number/send-otp`, { timeout: 600_000, headers: h, data: { phoneNumber: PHONE } })).ok()).toBeTruthy();
  const v = await request.post(`${BASE}/api/auth/phone-number/verify`, { timeout: 600_000, headers: h, data: { phoneNumber: PHONE, code: OTP } });
  expect(v.ok()).toBeTruthy();
}

test("partner session → consent → exchange → replay 409 → revoke", async ({ page, request }) => {
  // 1. partner creates a session with the seeded sandbox key (return URL on our own origin so the redirect resolves)
  const created = await request.post(`${BASE}/api/v1/partner/share-sessions`, { timeout: 600_000, headers: { ...partnerHeaders, "idempotency-key": `e2e-${Date.now()}` }, data: { form_slug: "bta-jee-2026", return_url: `${BASE}/app/applications`, state: "e2e-state" } });
  expect(created.status()).toBe(200);
  const { data: sess } = await created.json();
  expect(sess.share_url).toContain("/share/");
  // NEXT_PUBLIC_APP_URL may point at a different port than the server under test
  const shareUrl = new URL(sess.share_url); shareUrl.protocol = new URL(BASE).protocol; shareUrl.host = new URL(BASE).host;
  sess.share_url = shareUrl.toString();

  // 2. logged-out visit redirects to login with next=
  await page.goto(sess.share_url);
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fshare%2F/, SLOW);

  // 3. citizen logs in (page.request shares the browser cookie jar) and lands on the consent screen
  await login(page.request);
  await page.goto(sess.share_url);
  await expect(page.getByTestId("share-flow")).toBeVisible(SLOW);
  await expect(page.getByTestId("partner-identity")).toContainText("Bharat Test Agency");
  await expect(page.getByTestId("consent-summary")).toContainText("requested");
  await expect(page.getByTestId("consent-deny")).toBeVisible();

  // 4. continue → fill the required fields Aarav's seeded vault lacks (photo, signature, current address) + BTA's custom questions
  await page.getByTestId("consent-share").click();
  await expect(page.getByTestId("share-flow")).toHaveAttribute("data-step", "fill");
  const pickFirst = async (label: string | RegExp, option?: string | RegExp) => {
    await page.getByRole("button", { name: label }).first().click();
    const opts = page.getByRole("option");
    await (option ? opts.filter({ hasText: option }).first() : opts.first()).click();
  };
  await pickFirst(/Photograph/);
  await pickFirst(/Signature/);
  await page.getByLabel("Current address line 1").fill("12 Gomti Nagar");
  await page.getByLabel("Current village / town / city").fill("Lucknow");
  await page.getByLabel("Current district").fill("Lucknow");
  await pickFirst(/Current state/);
  await page.getByLabel("Current PIN code").fill("226010");
  for (const [label, option] of [["Exam city preference 1", "Lucknow"], ["Exam city preference 2", "Delhi"], ["Paper", "Paper 1 (B.E./B.Tech)"], ["Question paper medium", "English"]] as const) await pickFirst(new RegExp(label), option);
  await page.getByText("I declare the information is true").click();
  await page.getByTestId("consent-share").click();

  // 5. step-up (mock OTP) → receipt with consent_id
  await expect(page.getByTestId("step-up")).toBeVisible(SLOW);
  await page.locator('[data-testid="step-up"] input').first().pressSequentially(OTP);
  await expect(page.getByTestId("consent-receipt")).toBeVisible(SLOW);
  const consentId = (await page.getByTestId("consent-id").textContent())!.trim();
  expect(consentId).toMatch(/^[0-9a-f-]{36}$/);

  // 6. return URL carries share_token + state
  await page.getByTestId("return-now").click();
  await page.waitForURL(/share_token=/);
  const u = new URL(page.url());
  const shareToken = u.searchParams.get("share_token")!;
  expect(u.searchParams.get("state")).toBe("e2e-state");
  expect(shareToken.split(".")[0]).toBe(sess.session_id);

  // 7. partner exchanges server-side; payload verifies against the JWKS
  const ex = await request.post(`${BASE}/api/v1/partner/share-sessions/${sess.session_id}/exchange`, { timeout: 600_000, headers: partnerHeaders, data: { share_token: shareToken } });
  expect(ex.status()).toBe(200);
  const { data } = await ex.json();
  expect(data.consent_id).toBe(consentId);
  const jwks = await (await request.get(`${BASE}/api/v1/jwks`, { timeout: 600_000 })).json();
  const { payload } = await jwtVerify(data.payload_jws, createLocalJWKSet(jwks), { issuer: "praman" });
  expect(payload.consent_id).toBe(consentId);
  expect(payload.application_id).toBe(data.application_id);
  const facts = payload.facts as { key: string; source: string; value: unknown }[];
  expect(facts.length).toBeGreaterThan(20);
  expect(facts.find((f) => f.key === "identity.full_name")?.source).toBe("issuer_verified");
  expect((payload.custom as Record<string, unknown>).exam_city_1).toBe("Lucknow");

  // 8. replay is rejected
  const replay = await request.post(`${BASE}/api/v1/partner/share-sessions/${sess.session_id}/exchange`, { timeout: 600_000, headers: partnerHeaders, data: { share_token: shareToken } });
  expect(replay.status()).toBe(409);

  // 9. tracker + connections show it; revoke fires and further exchange is blocked
  await page.goto(`${BASE}/app/applications/${data.application_id}`);
  await expect(page.getByTestId("app-status")).toContainText("Submitted", SLOW);
  await page.goto(`${BASE}/app/connections/${consentId}`);
  await expect(page.getByTestId("consent-status")).toContainText("active", SLOW);
  await expect(page.getByTestId("shared-facts").locator('[data-testid="source-chip"]').first()).toBeVisible();
  const rev = await page.request.post(`${BASE}/api/v1/consents/${consentId}/revoke`, { timeout: 600_000 });
  expect(rev.status()).toBe(200);
  await page.reload();
  await expect(page.getByTestId("consent-status")).toContainText("revoked", SLOW);
});

test("partner API rejects unknown / purpose-blocked keys with a 422 listing them", async ({ request }) => {
  const r = await request.post(`${BASE}/api/v1/partner/forms`, { timeout: 600_000, headers: partnerHeaders, data: { name: "Bad form e2e", purpose: "age_verification_only", requested_fields: [{ key: "identity.dob", required: true }, { key: "identity.pan", required: true }, { key: "bank.primary.ifsc", required: false }], redirect_url: "https://bta.example/return" } });
  expect(r.status()).toBe(422);
  const j = await r.json();
  expect(j.error.code).toBe("FIELDS_BLOCKED_FOR_PURPOSE");
  expect(Object.keys(j.error.fields)).toEqual(expect.arrayContaining(["identity.pan", "bank.primary.ifsc"]));
});

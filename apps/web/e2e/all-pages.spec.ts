import { expect, test, type Page } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3300";
const PORTAL = process.env.AUDIT_PORTAL_URL ?? "http://localhost:3301";

async function login(page: Page, phone: string) {
  const headers = { origin: BASE };
  expect((await page.request.post(`${BASE}/api/auth/phone-number/send-otp`, { headers, data: { phoneNumber: `+91${phone}` } })).ok()).toBe(true);
  expect((await page.request.post(`${BASE}/api/auth/phone-number/verify`, { headers, data: { phoneNumber: `+91${phone}`, code: "123456" } })).ok()).toBe(true);
}

async function assertRendered(page: Page, url: string) {
  const errors: string[] = [];
  const onPageError = (error: Error) => errors.push(error.message);
  page.on("pageerror", onPageError);
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.status(), url).toBeLessThan(400);
  await expect(page.locator("body"), url).toBeVisible();
  await expect(page.locator("body"), url).not.toContainText(/Runtime Error|Application error: a client-side exception/i);
  const controls = page.locator('button, a[href], input:not([type="hidden"]), select, textarea');
  for (let i = 0; i < await controls.count(); i++) {
    const control = controls.nth(i);
    if (!(await control.isVisible())) continue;
    const label = await control.evaluate((el) => {
      const aria = el.getAttribute("aria-label") ?? el.getAttribute("title") ?? "";
      const text = (el.textContent ?? "").trim();
      const placeholder = el.getAttribute("placeholder") ?? "";
      const labelledBy = el.getAttribute("aria-labelledby");
      const labelled = labelledBy ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ") : "";
      const wrapped = el.closest("label")?.textContent ?? "";
      const id = el.getAttribute("id");
      const explicit = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent ?? "" : "";
      return `${aria} ${text} ${placeholder} ${labelled} ${wrapped} ${explicit}`.trim();
    });
    expect(label, `Unlabelled visible control ${i} on ${url}`).not.toBe("");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `Horizontal overflow on ${url}`).toBe(true);
  expect(errors, `Uncaught browser errors on ${url}`).toEqual([]);
  page.off("pageerror", onPageError);
}

test("all public pages render with labelled controls", async ({ page }) => {
  for (const path of ["/", "/demo", "/for-institutions", "/privacy", "/security", "/terms", "/dpo", "/status", "/auth/login"]) {
    await assertRendered(page, `${BASE}${path}`);
  }
});

test("all citizen workspace pages render with labelled controls", async ({ page }) => {
  await login(page, "9876543210");
  const paths = [
    "/app", "/app/vault", "/app/vault/identity", "/app/vault/contact", "/app/vault/address",
    "/app/vault/family", "/app/vault/category", "/app/vault/education", "/app/vault/employment",
    "/app/vault/bank", "/app/vault/health", "/app/vault/prefs", "/app/apply",
    "/app/apply/bta-jee-2026", "/app/apply/nova-btech-2026", "/app/apply/savings-account-kyc",
    "/app/applications", "/app/documents", "/app/verify", "/app/sign", "/app/connections",
    "/app/family", "/app/settings", "/app/settings/notifications", "/app/notifications",
    "/app/extension", "/app/extension/connect",
  ];
  for (const path of paths) await assertRendered(page, `${BASE}${path}`);

  for (const [listPath, pattern] of [["/app/documents", /\/app\/documents\/[^/]+$/], ["/app/applications", /\/app\/applications\/[^/]+$/], ["/app/connections", /\/app\/connections\/[^/]+$/]] as const) {
    await page.goto(`${BASE}${listPath}`);
    const href = await page.locator(`a[href]`).evaluateAll((links, source) => links.map((link) => (link as HTMLAnchorElement).href).find((href) => new RegExp(source).test(new URL(href).pathname)) ?? null, pattern.source);
    expect(href, `Expected a seeded detail link on ${listPath}`).toBeTruthy();
    await assertRendered(page, href!);
  }
});

test("all partner pages render with labelled controls", async ({ page }) => {
  await login(page, "9000000001");
  for (const path of ["/partner", "/partner/forms", "/partner/forms/new", "/partner/applicants", "/partner/developers", "/partner/team", "/partner/settings", "/partner/onboarding"]) {
    await assertRendered(page, `${BASE}${path}`);
  }
  await page.goto(`${BASE}/partner/forms`);
  const href = await page.locator('a[href^="/partner/forms/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  await assertRendered(page, `${BASE}${href}`);
});

test("all operations pages render with labelled controls", async ({ page }) => {
  await login(page, "9000000000");
  for (const path of ["/admin", "/admin/partners", "/admin/providers", "/admin/queues", "/admin/flags", "/admin/audit", "/admin/requests"]) {
    await assertRendered(page, `${BASE}${path}`);
  }
});

test("exam portal public and manual pages render with labelled controls", async ({ page }) => {
  for (const path of ["/", "/apply/manual", "/apply/return?error=state", "/admin/webhooks"]) {
    await assertRendered(page, `${PORTAL}${path}`);
  }
});

import { test, expect, type Page } from "@playwright/test";

const PHONE = "9876543210";
async function login(page: Page) {
  await page.goto("/auth/login?next=/app/vault/identity", { waitUntil: "networkidle" });
  const phone = page.getByPlaceholder("10-digit mobile");
  const send = page.getByRole("button", { name: "Send OTP" });
  // hydration can lag on a loaded dev box: type until the controlled input sticks and the CTA enables
  for (let i = 0; i < 5 && !(await send.isEnabled()); i++) { await phone.fill(""); await phone.pressSequentially(PHONE, { delay: 20 }); await page.waitForTimeout(800); }
  await expect(send).toBeEnabled();
  await send.click();
  await page.getByRole("button", { name: "Verify & continue" }).waitFor();
  await page.keyboard.type("123456", { delay: 40 });
  await page.waitForURL(/\/app\/vault\/identity/, { timeout: 120_000 });
}

test.describe("WP1 vault", () => {
  test("every fact row shows a source chip; edit self-declared; mask/reveal with step-up", async ({ page }) => {
    await login(page);
    const rows = page.getByTestId("fact-row");
    await expect(rows.first()).toBeVisible();
    const n = await rows.count();
    expect(n).toBeGreaterThan(5);
    expect(await page.getByTestId("source-chip").count()).toBeGreaterThanOrEqual(n);

    // edit a self-declared fact (mother tongue)
    const row = page.locator('[data-testid="fact-row"][data-key="identity.mother_tongue"]');
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "More" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const sheet = page.getByTestId("fact-sheet");
    await expect(sheet).toBeVisible();
    const input = sheet.getByRole("textbox").first();
    await input.fill(`Hindi ${Date.now() % 1000}`);
    await page.getByTestId("fact-save").click();
    await expect(sheet).toBeHidden();
    await expect(row.getByTestId("source-chip")).toContainText(/Self-declared/);

    // PAN is masked; reveal needs step-up (OTP 123456)
    const pan = page.locator('[data-testid="fact-row"][data-key="identity.pan"]');
    await expect(pan).toContainText("****");
    await pan.getByRole("button", { name: "Reveal" }).click();
    const dialog = page.getByTestId("step-up-dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().click();
    await page.keyboard.type("123456");
    await expect(dialog).toBeHidden({ timeout: 60_000 });
    await expect(pan).toContainText("BXYPS1234K");
  });
});

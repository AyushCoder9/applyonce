import { test, expect, type Page } from "@playwright/test";
/** Golden flow WP5: Sunita logs in → adds a minor → switches profile → "Now viewing" toast → language toggle flips a settings label to Hindi. */
const SUNITA = "9876500002";
async function login(page: Page, phone: string) {
  await page.goto("/auth/login?next=/app/family");
  await page.getByRole("textbox", { name: /mobile/i }).fill(phone);
  await page.getByRole("button", { name: /send otp/i }).click();
  await expect(page.getByText(/Enter the 6-digit code/)).toBeVisible({ timeout: 120_000 });
  const otp = page.locator('input[autocomplete="one-time-code"]').first();
  await otp.click();
  await page.keyboard.type("123456");
  await page.waitForURL((u) => u.pathname === "/app/family", { timeout: 300_000 });
}
async function setLocale(page: Page, locale: "en" | "hi") {
  await page.request.patch("/api/v1/me", { data: { locale }, timeout: 300_000 });
}

test("family: add minor → switch → Hindi", async ({ page }) => {
  test.setTimeout(process.env.CI ? 120_000 : 900_000); // shared dev server under load compiles routes slowly
  await login(page, SUNITA);
  await setLocale(page, "en"); // seed has Sunita in Hindi; start in English so the toggle is observable
  await page.goto("/app/family?add=1");
  await expect(page.getByRole("heading", { name: "Family", exact: true })).toBeVisible();
  const name = `Test Minor ${Date.now().toString().slice(-5)}`;
  const form = page.getByTestId("add-minor-form");
  await form.locator('input[name="name"]').fill(name);
  await form.locator('input[name="dob"]').fill("2012-05-06");
  await form.locator('select[name="gender"]').selectOption("F");
  await form.getByRole("button", { name: /create profile/i }).click();
  await expect(page.getByText("Profile created")).toBeVisible();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({ timeout: 180_000 });

  // switch via header switcher (WP1's /api/v1/profiles/active)
  await page.getByRole("button", { name: /switch profile/i }).click();
  await page.getByRole("menuitem", { name: name }).click();
  await expect(page.getByText(`Now viewing: ${name}`)).toBeVisible({ timeout: 180_000 });

  // language toggle re-renders labels
  await page.goto("/app/settings");
  await expect(page.getByTestId("settings-language-label")).toHaveText("Language");
  await page.getByTestId("locale-switch").click();
  await expect(page.getByTestId("settings-language-label")).toHaveText("भाषा", { timeout: 180_000 });
  await setLocale(page, "hi"); // restore seed state
});

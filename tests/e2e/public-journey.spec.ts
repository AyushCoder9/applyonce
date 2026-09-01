import { expect, test } from "@playwright/test";

test("public product routes and source link remain available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your details");
  await page.goto("/programs");
  await expect(page.getByRole("heading", { name: "Know who is asking before you apply." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Review and apply/ }).first()).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Your data should move with permission, not momentum." })).toBeVisible();
  await expect(page.getByRole("link", { name: /View source code/ })).toHaveAttribute("href", "https://github.com/AyushCoder9/applyonce");
});

test("synthetic citizen journey requires explicit affirmation", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/demo");
  await page.getByRole("button", { name: /Open exam portal/ }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Continue with ApplyOnce/ }).click();
  await page.getByRole("button", { name: "Confirm it is still valid" }).click();
  await page.getByRole("button", { name: /Review sharing scope/ }).click();
  const dialog = page.getByRole("dialog", { name: /Share 38 fields and 2 documents/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("does not contact or claim confirmation from a real external portal");
  await dialog.getByRole("button", { name: /Confirm, share and submit/ }).click();
  await expect(page.getByRole("heading", { name: "ApplyOnce submission recorded." })).toBeVisible();
  await expect(page.getByText("External confirmation")).toBeVisible();
  await page.getByRole("button", { name: /Copy ID/ }).click();
  await expect(page.getByRole("button", { name: /Copied/ })).toBeVisible();
});

test("private citizen routes send signed-out users to authentication", async ({ page }) => {
  await page.goto("/app/profile");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("public contracts expose honest connector states", async ({ request }) => {
  const openApi = await request.get("/api/openapi");
  expect(openApi.ok()).toBe(true);
  expect((await openApi.json()).openapi).toBe("3.1.0");

  const response = await request.get("/api/integrations");
  expect(response.ok()).toBe(true);
  const body = await response.json() as { integrations: Array<{ id: string; status: string; liveData?: boolean }> };
  expect(body.integrations.find((item) => item.id === "digilocker")).toMatchObject({ status: "approval_pending", liveData: false });
  expect(body.integrations.find((item) => item.id === "apaar")).toMatchObject({ status: "unavailable", liveData: false });
});

test("private partner routes send signed-out users to authentication", async ({ page }) => {
  await page.goto("/partner/programs");
  await expect(page).toHaveURL(/\/sign-in/);
});

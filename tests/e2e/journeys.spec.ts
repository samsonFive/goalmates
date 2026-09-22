import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 90000 });

test("household member can sign in and use capture + standalone task", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jordan@goalmates.local");
  await page.getByLabel("Password").fill("household-demo");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Hello, Jordan/ })).toBeVisible({ timeout: 20000 });

  await page.getByPlaceholder("Call dentist tomorrow").fill("Water plants 10m\nBuy stamps Saturday");
  await page.getByRole("button", { name: "Review extracted items" }).click();
  await expect(page.getByRole("heading", { name: "Review extracted items" })).toBeVisible();
  await page.getByRole("button", { name: "Accept selected items" }).click();
  await expect(page.getByRole("heading", { name: "Week on the desk" })).toBeVisible();

  await page.goto("/tasks");
  await page.getByLabel("Title").fill("Write thank-you note");
  await page.getByRole("button", { name: "Save task" }).click();
  await expect(page.getByRole("link", { name: "Write thank-you note" })).toBeVisible({ timeout: 20000 });
});

test("private titles do not appear for the other household member", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("sam@goalmates.local");
  await page.getByLabel("Password").fill("household-demo");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Hello, Sam/ })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Renew passport quietly")).toHaveCount(0);
});

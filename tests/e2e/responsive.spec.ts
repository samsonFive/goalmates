import { expect, test } from "@playwright/test";

test("core chrome adapts by device", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jordan@goalmates.local");
  await page.getByLabel("Password").fill("household-demo");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Hello, Jordan/ })).toBeVisible({ timeout: 15000 });

  if (testInfo.project.name === "phone") {
    await expect(page.getByRole("navigation").getByText("Capture")).toBeVisible();
    await expect(page.getByRole("link", { name: "Projects" })).toHaveCount(0);
  }

  if (testInfo.project.name === "tablet" || testInfo.project.name === "desktop") {
    await page.goto("/plan");
    await expect(page.getByRole("heading", { name: "Week on the desk" })).toBeVisible();
    await expect(page.getByText("Unscheduled work")).toBeVisible();
  }

  if (testInfo.project.name === "desktop") {
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Finish Kitchen Remodel" })).toBeVisible();
  }
});

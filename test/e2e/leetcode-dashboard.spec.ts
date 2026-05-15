import { expect, test } from "@playwright/test";

test("@smoke @full /leetcode redirects to dashboard", async ({ page }) => {
  await page.goto("/leetcode");

  await expect(page).toHaveURL(/\/leetcode\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("@full dashboard quick actions route to all problems", async ({ page }) => {
  await page.goto("/leetcode/dashboard");

  await page.getByRole("link", { name: "View all problems" }).click();

  await expect(page).toHaveURL(/\/leetcode\/allproblems$/);
  await expect(page.getByRole("heading", { name: "Practice Problems" })).toBeVisible();
});

test("@full stats page loads from direct route", async ({ page }) => {
  await page.goto("/leetcode/stats");

  await expect(page).toHaveURL(/\/leetcode\/stats$/);
  await expect(page.getByRole("heading", { name: "Practice dashboard" })).toBeVisible();
});

test("@full tracks list opens and shows at least one track link", async ({ page }) => {
  await page.goto("/leetcode/tracks");

  await expect(page.getByRole("heading", { name: "Tracks" })).toBeVisible();
  await expect(page.locator('a[href^="/leetcode/tracks/"]').first()).toBeVisible();
});

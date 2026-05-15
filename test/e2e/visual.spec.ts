import { expect, test } from "@playwright/test";

test("@visual app shell with LeetCode menu open matches the visual baseline", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "LeetCode" }).hover();
  await expect(page.getByRole("menu", { name: "LeetCode menu" })).toBeVisible();

  await expect(page).toHaveScreenshot("app-shell-leetcode-menu.png", {
    animations: "disabled",
    fullPage: false,
  });
});

test("@visual coming soon page matches the visual baseline", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.locator("main")).toHaveScreenshot("coming-soon-home.png", {
    animations: "disabled",
  });
});

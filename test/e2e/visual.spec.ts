import { expect, test } from "@playwright/test";

test("app shell with LeetCode menu open matches the visual baseline", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "LeetCode" }).click();

  await expect(page).toHaveScreenshot("app-shell-leetcode-menu.png", {
    animations: "disabled",
    fullPage: false,
  });
});

test("coming soon page matches the visual baseline", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.locator("main")).toHaveScreenshot("coming-soon-home.png", {
    animations: "disabled",
  });
});

import { expect, test } from "@playwright/test";

test("loads the dashboard shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page).toHaveTitle(/LeetCode Backend Helper/);
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toContainText(
    "LeetCode",
  );
});

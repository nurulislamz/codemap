import { expect, test } from "@playwright/test";

test("@smoke @full dashboard shell loads with primary navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page).toHaveTitle(/LeetCode Backend Helper/);
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toContainText(
    "LeetCode",
  );
});

test("@smoke @full leetcode menu opens and closes from app shell", async ({ page }) => {
  await page.goto("/dashboard");

  const leetcodeButton = page.getByRole("link", { name: "LeetCode" });
  await leetcodeButton.hover();

  const leetcodeMenu = page.getByRole("menu", { name: "LeetCode menu" });
  await expect(leetcodeMenu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Stats" })).toBeVisible();

  await page.getByRole("heading", { name: "Home" }).click();
  await expect(leetcodeMenu).toBeHidden();
});

test("@full primary navigation routes render expected headings", async ({ page }) => {
  const routes = [
    ["/dashboard", "Home"],
    ["/roadmap", "Roadmaps"],
    ["/system-design", "System Design"],
  ] as const;

  for (const [path, heading] of routes) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

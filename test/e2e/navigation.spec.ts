import { expect, test } from "@playwright/test";

test("LeetCode menu opens and closes in the app shell", async ({ page }) => {
  await page.goto("/dashboard");

  const leetcodeButton = page.getByRole("button", { name: "LeetCode" });
  await leetcodeButton.click();

  await expect(page.getByRole("menu", { name: "LeetCode menu" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Stats" })).toBeVisible();

  await page.getByRole("heading", { name: "Home" }).click();
  await expect(page.getByRole("menu", { name: "LeetCode menu" })).toBeHidden();
});

test.describe("coming soon routes", () => {
  for (const [path, heading] of [
    ["/dashboard", "Home"],
    ["/roadmap", "Roadmap"],
    ["/system-design", "System Design"],
  ] as const) {
    test(`${path} renders ${heading}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText("To be implemented soon.")).toBeVisible();
    });
  }
});

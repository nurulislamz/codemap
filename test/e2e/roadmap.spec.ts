import { expect, test } from "@playwright/test";

test("@full roadmap deep link opens the topic dialog with learned badges", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "codemap:roadmap-progress:api-design:graphqlApis",
      JSON.stringify({
        roadmapSlug: "api-design",
        topicSlug: "graphqlApis",
        learned: true,
        notes: "",
        links: [],
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  await page.goto("/roadmap/api-design?topic=graphqlApis");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("GraphQL APIs");
  await expect(dialog.getByText("Learned")).toBeVisible();
  await expect(dialog.locator("a")).not.toHaveCount(0);
});

test("@full roadmap topic rows expand inline resources", async ({ page }) => {
  await page.goto("/roadmap/api-design");

  const expander = page.locator(
    'button[aria-label="Expand resources for Different API Styles"]',
  );
  const controls = await expander.getAttribute("aria-controls");

  await expander.click();

  await expect(page.locator(`#${controls}`)).toBeVisible();
  await expect(page.locator(`#${controls} a`).first()).toBeVisible();
  await expect(page.locator(`#${controls}`).getByText(/Learned|To learn/).first()).toBeVisible();
});

test("@full roadmap expanded sections show counts", async ({ page }) => {
  await page.goto("/roadmap/bi-analyst");

  await expect(page.getByText(/section resources/i)).toHaveCount(0);
  await expect(page.getByText(/topics/i).first()).toBeVisible();
  await expect(page.getByText(/total resources/i).first()).toBeVisible();
  await expect(page.getByText(/learned/i).first()).toBeVisible();
});

test("@full roadmap group rows expand their own resources", async ({ page }) => {
  await page.goto("/roadmap/bi-analyst");

  await page.getByRole("button", { name: "Expand IQR" }).click();

  await expect(page.getByRole("link", { name: /Interquartile range/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /How to Find Interquartile Range/ })).toBeVisible();
});

test("@full roadmap expand all opens sections and resource panels", async ({ page }) => {
  await page.goto("/roadmap/bi-analyst");

  await page.getByRole("button", { name: "Expand all" }).click();

  await expect(page.getByRole("button", { name: "Collapse all" })).toBeVisible();
  await expect(page.locator("#topic-resources-predictiveAnalysis")).toBeVisible();
  await expect(page.getByRole("link", { name: /Interquartile range/ })).toBeVisible();
});

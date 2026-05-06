import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/leetcode/allproblems");
  await page.evaluate(() => window.localStorage.removeItem("codemap.leetcodeAttempts.v1"));
});

test("All Problems renders and supports search, filters, and reset", async ({ page }) => {
  await page.goto("/leetcode/allproblems");

  await expect(page).toHaveURL(/\/leetcode\/allproblems$/);
  await expect(page.getByRole("heading", { name: "Practice Problems" })).toBeVisible();
  await expect(page.getByRole("link", { name: /All Problems/ })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();

  await page.getByPlaceholder("Search problems...").fill("binary tree");
  await page.getByPlaceholder("Search problems...").press("Enter");
  await expect(page).toHaveURL(/q=binary\+tree/);
  await expect(page.getByRole("row", { name: /Binary Tree Level Order Traversal/ })).toBeVisible();

  await page.getByRole("button", { name: "All difficulties" }).click();
  await page.getByRole("menuitemradio", { name: "Medium" }).click();
  await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
  await expect(page).toHaveURL(/difficulty=Medium/);

  await page.getByRole("button", { name: "All statuses" }).click();
  await page.getByRole("menuitemradio", { name: "Not started" }).click();
  await expect(page.locator('button[aria-controls="leetcode-status-menu"]')).toContainText(
    "Not started",
  );
  await expect(page.getByRole("row", { name: /Binary Tree Level Order Traversal/ })).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("button", { name: "All difficulties" })).toBeVisible();
  await expect(page.locator('button[aria-controls="leetcode-status-menu"]')).toContainText(
    "All statuses",
  );
});

test("All Problems attempt overlay has clickable controls and closes from backdrop", async ({ page }) => {
  await page.goto("/leetcode/allproblems?q=binary+tree");

  const row = page.getByRole("row", { name: /Binary Tree Level Order Traversal/ });
  const startButton = row.getByRole("button", { name: "Start", exact: true });

  await expect(startButton).toHaveCSS("cursor", "pointer");
  await startButton.click();

  const dialog = page.getByRole("dialog", { name: /Binary Tree Level Order Traversal/ });
  await expect(dialog).toBeVisible();
  await expect(page.getByText("You are not signed in. Attempts will save to this browser only.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start timer" })).toHaveCSS("cursor", "pointer");
  await expect(page.getByRole("button", { name: "Show last notes" })).toHaveCSS("cursor", "pointer");

  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
});

test("All Problems saves signed-out attempts locally and displays them in history", async ({ page }) => {
  await page.goto("/leetcode/allproblems?q=binary+tree");

  const row = page.getByRole("row", { name: /Binary Tree Level Order Traversal/ });

  await row.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Start timer" }).click();
  await page.getByRole("button", { name: "Finish attempt" }).click();
  await page.getByLabel("Notes").fill("Saved by all problems e2e");
  await page.getByRole("button", { name: "Save attempt" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await expect(page.getByRole("button", { name: /Completed · 1 attempts/ })).toBeVisible();
  const savedAttempts = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("codemap.leetcodeAttempts.v1") ?? "[]"),
  );
  expect(savedAttempts[0]).toMatchObject({
    problemId: "102",
    notes: "Saved by all problems e2e",
    isSuccessful: true,
  });

  await page.getByRole("button", { name: /Completed · 1 attempts/ }).click();
  await expect(page.getByText("Accepted")).toBeVisible();
  await expect(page.getByText("Saved by all problems e2e")).toBeVisible();
});

test("All Problems displays locally stored timed-out attempts as time ran out", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "codemap.leetcodeAttempts.v1",
      JSON.stringify([
        {
          attemptId: "local-timeout-1",
          problemId: "102",
          problemTitle: "Binary Tree Level Order Traversal",
          problemUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
          status: "timed_out",
          startedAt: "2026-05-06T10:00:00.000Z",
          endedAt: "2026-05-06T10:30:00.000Z",
          notes: "Timed out locally",
          isSuccessful: false,
          durationSeconds: 1800,
          savedAt: "2026-05-06T10:30:00.000Z",
        },
      ]),
    );
  });

  await page.goto("/leetcode/allproblems?q=binary+tree");

  await expect(page.getByRole("button", { name: /In progress · 1 attempts/ })).toBeVisible();
  await page.getByRole("button", { name: /In progress · 1 attempts/ }).click();
  await expect(page.getByText("Time ran out")).toBeVisible();
  await expect(page.getByText("Timed out locally")).toBeVisible();
});

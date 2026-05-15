import { expect, test } from "@playwright/test";
import { createOrSignInE2EUser, seedFirebaseAuthSession } from "./helpers/firebase-auth";

test("@smoke @full seeded session loads as signed-in and persists after reload", async ({
  page,
  request,
}) => {
  const auth = await createOrSignInE2EUser(request);

  await page.goto("/dashboard");
  await seedFirebaseAuthSession(page, auth);
  await page.reload();

  await expect(page.getByText(auth.email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("@full signed-in user can sign out from app shell", async ({ page, request }) => {
  const auth = await createOrSignInE2EUser(request);

  await page.goto("/dashboard");
  await seedFirebaseAuthSession(page, auth);
  await page.reload();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(auth.email)).toHaveCount(0);
});

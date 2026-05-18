import { expect, test } from "@playwright/test";
import {
  createOrSignInE2EUser,
  getFirestoreAttemptsCollectionUrl,
  seedFirebaseAuthSession,
} from "./helpers/firebase-auth";

test("@full signed-in attempt is persisted to firestore emulator", async ({
  page,
  request,
}) => {
  const auth = await createOrSignInE2EUser(request);
  const notes = `e2e attempt ${Date.now()}`;

  await page.goto("/dashboard");
  await seedFirebaseAuthSession(page, auth);

  await page.goto("/leetcode/dashboard");
  const firstStartButton = page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: /^Start$|^Resume$/ });
  await expect(firstStartButton).toBeVisible();
  await firstStartButton.click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("You are not signed in. Attempts will save to this browser only."),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByRole("button", { name: "Finish attempt" })).toBeVisible();
  await page.getByRole("button", { name: "Finish attempt" }).click();
  await expect(page.getByRole("heading", { name: "Record attempt" })).toBeVisible();
  await page.getByLabel("Notes").fill(notes);
  await page.getByRole("button", { name: "Save attempt" }).click();

  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15000 });

  await expect
    .poll(
      async () => {
        const response = await request.get(getFirestoreAttemptsCollectionUrl(auth.uid), {
          headers: { authorization: `Bearer ${auth.idToken}` },
        });

        if (!response.ok()) {
          return false;
        }

        const body = await response.json();
        const documents: Array<{ fields?: { notes?: { stringValue?: string } } }> =
          body?.documents ?? [];

        return documents.some((doc) => doc.fields?.notes?.stringValue === notes);
      },
      {
        message: "expected attempt document to be persisted in firestore emulator",
        timeout: 10000,
      },
    )
    .toBe(true);
});

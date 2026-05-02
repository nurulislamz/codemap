import { type APIRequestContext, type Page, expect, test } from "@playwright/test";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo";
const FIREBASE_AUTH_HOST = normalizeHost(
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099",
);
const FIRESTORE_HOST = normalizeHost(process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080");
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "codemap-dev";
const E2E_EMAIL = process.env.E2E_AUTH_EMAIL ?? "e2e-leetcode@codemap.dev";
const E2E_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? "e2e-leetcode-password";

test("sign in, attempt a problem, and save to Firebase", async ({ page, request }) => {
  const auth = await signInWithPassword(request, E2E_EMAIL, E2E_PASSWORD);
  const notes = `e2e attempt ${Date.now()}`;

  await page.goto("/leetcode");
  await seedFirebaseAuthSession(page, auth);

  await page.goto("/leetcode");
  const firstStartButton = page.locator("tbody tr").first().getByRole("button", { name: /Start|Resume/ });
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

  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });

  const saved = await waitForSavedAttempt({
    request,
    userId: auth.uid,
    notes,
  });

  expect(saved).toBe(true);
});

type E2EAuth = {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
};

async function signInWithPassword(request: APIRequestContext, email: string, password: string): Promise<E2EAuth> {
  const signUpUrl = `http://${FIREBASE_AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const signInUrl = `http://${FIREBASE_AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const payload = {
    email,
    password,
    returnSecureToken: true,
  };

  const signUpResponse = await request.post(signUpUrl, { data: payload });
  const signUp = await signUpResponse.json();

  if (
    signUpResponse.status() === 200 &&
    !signUp.error &&
    signUp.localId &&
    signUp.idToken
  ) {
    return {
      uid: signUp.localId,
      email: signUp.email,
      idToken: signUp.idToken,
      refreshToken: signUp.refreshToken,
      expiresIn: signUp.expiresIn,
    };
  }

  const signInResponse = await request.post(signInUrl, { data: payload });
  const signIn = await signInResponse.json();

  if (!signIn.idToken || !signIn.localId) {
    throw new Error(
      `Auth sign in failed. Sign-up response: ${JSON.stringify(signUp)}; sign-in response: ${JSON.stringify(signIn)}`,
    );
  }

  return {
    uid: signIn.localId,
    email: signIn.email ?? email,
    idToken: signIn.idToken,
    refreshToken: signIn.refreshToken,
    expiresIn: signIn.expiresIn,
  };
}

async function seedFirebaseAuthSession(page: Page, auth: E2EAuth) {
  await page.evaluate(
    async ({ apiKey, auth }) => {
      const now = Date.now();
      const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
      const persistenceKey = `firebase:persistence:${apiKey}:[DEFAULT]`;
      const value = {
        uid: auth.uid,
        email: auth.email,
        emailVerified: false,
        isAnonymous: false,
        providerData: [
          {
            providerId: "password",
            uid: auth.email,
            displayName: null,
            email: auth.email,
            phoneNumber: null,
            photoURL: null,
          },
        ],
        stsTokenManager: {
          refreshToken: auth.refreshToken,
          accessToken: auth.idToken,
          expirationTime: now + Number(auth.expiresIn) * 1000,
        },
        createdAt: String(now),
        lastLoginAt: String(now),
        apiKey,
        appName: "[DEFAULT]",
      };

      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem(persistenceKey, JSON.stringify("LOCAL"));

      await new Promise<void>((resolve, reject) => {
        const openRequest = indexedDB.open("firebaseLocalStorageDb", 1);

        openRequest.onupgradeneeded = () => {
          const database = openRequest.result;

          if (!database.objectStoreNames.contains("firebaseLocalStorage")) {
            database.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
          }
        };

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction("firebaseLocalStorage", "readwrite");
          const store = transaction.objectStore("firebaseLocalStorage");

          store.put({ fbase_key: key, value });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    { apiKey: FIREBASE_API_KEY, auth },
  );
}

async function waitForSavedAttempt({
  request,
  userId,
  notes,
}: {
  request: APIRequestContext;
  userId: string;
  notes: string;
}) {
  const base = `http://${FIRESTORE_HOST}/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${base}/users/${userId}/leetcodeAttempts`);

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

  return true;
}

function normalizeHost(host: string) {
  return host.trim().replace(/^https?:\/\//, "");
}

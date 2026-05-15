import type { APIRequestContext, Page } from "@playwright/test";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo";
const FIREBASE_AUTH_HOST = normalizeHost(
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099",
);
const FIRESTORE_HOST = normalizeHost(process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080");
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "codemap-dev";

const defaultEmail = process.env.E2E_AUTH_EMAIL ?? "e2e-leetcode@codemap.dev";
const defaultPassword = process.env.E2E_AUTH_PASSWORD ?? "e2e-leetcode-password";

export type E2EAuth = {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
};

export function getFirestoreAttemptsCollectionUrl(userId: string) {
  return `http://${FIRESTORE_HOST}/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/leetcodeAttempts`;
}

export async function createOrSignInE2EUser(
  request: APIRequestContext,
  options?: { email?: string; password?: string },
): Promise<E2EAuth> {
  const email = options?.email ?? defaultEmail;
  const password = options?.password ?? defaultPassword;
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

export async function seedFirebaseAuthSession(page: Page, auth: E2EAuth) {
  await page.evaluate(
    async ({ apiKey, authUser }) => {
      const now = Date.now();
      const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
      const persistenceKey = `firebase:persistence:${apiKey}:[DEFAULT]`;
      const value = {
        uid: authUser.uid,
        email: authUser.email,
        emailVerified: false,
        isAnonymous: false,
        providerData: [
          {
            providerId: "password",
            uid: authUser.email,
            displayName: null,
            email: authUser.email,
            phoneNumber: null,
            photoURL: null,
          },
        ],
        stsTokenManager: {
          refreshToken: authUser.refreshToken,
          accessToken: authUser.idToken,
          expirationTime: now + Number(authUser.expiresIn) * 1000,
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
    { apiKey: FIREBASE_API_KEY, authUser: auth },
  );
}

function normalizeHost(host: string) {
  return host.trim().replace(/^https?:\/\//, "");
}

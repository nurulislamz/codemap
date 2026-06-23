import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

import { resolveFirebaseProjectId } from "@/lib/env";

export function getFirebaseAdminApp(): App {
  const app = getApps()[0];

  if (app) {
    return app;
  }

  const projectId = resolveFirebaseProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail || privateKey) {
    if (!clientEmail || !privateKey) {
      throw new Error(
        "Set both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY for Firebase Admin",
      );
    }

    return initializeApp({
      projectId,
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return initializeApp({ projectId });
}

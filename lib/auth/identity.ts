import "server-only";

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";

type RequestUserSource =
  | FormData
  | {
      idToken?: string | null;
    }
  | string
  | null
  | undefined;

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getRequestUserId(source?: RequestUserSource): Promise<string> {
  const token = await getRequestIdToken(source);

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const decodedToken = await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    throw new UnauthorizedError();
  }
}

async function getRequestIdToken(source?: RequestUserSource): Promise<string | null> {
  const sourceToken = getIdTokenFromSource(source);

  if (sourceToken) {
    return sourceToken;
  }

  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization");

  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getIdTokenFromSource(source?: RequestUserSource): string | null {
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    return source.trim() || null;
  }

  if (typeof FormData !== "undefined" && source instanceof FormData) {
    const token = source.get("idToken");
    return typeof token === "string" ? token.trim() || null : null;
  }

  if ("idToken" in source) {
    return source.idToken?.trim() || null;
  }

  return null;
}

function getFirebaseAdminApp() {
  const app = getApps()[0];

  if (app) {
    return app;
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;

  if (!projectId) {
    throw new Error("Missing Firebase project ID. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  return initializeApp({ projectId });
}

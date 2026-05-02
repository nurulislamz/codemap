import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let firestoreSingleton: Firestore | null = null;

function resolveProjectId(): string {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;

  if (!projectId) {
    throw new Error("Missing Firebase project ID. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  return projectId;
}

export function getFirestoreDb(): Firestore {
  if (firestoreSingleton) {
    return firestoreSingleton;
  }

  const projectId = resolveProjectId();
  const app = getApps()[0] ?? initializeApp({ projectId });
  firestoreSingleton = getFirestore(app);

  return firestoreSingleton;
}

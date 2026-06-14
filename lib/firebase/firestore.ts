import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { resolveFirebaseProjectId } from "@/lib/env";

let firestoreSingleton: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (firestoreSingleton) {
    return firestoreSingleton;
  }

  const app =
    getApps()[0] ?? initializeApp({ projectId: resolveFirebaseProjectId() });
  firestoreSingleton = getFirestore(app);

  return firestoreSingleton;
}

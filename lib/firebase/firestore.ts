import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { getFirebaseAdminApp } from "@/lib/firebase/admin";

let firestoreSingleton: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (firestoreSingleton) {
    return firestoreSingleton;
  }

  firestoreSingleton = getFirestore(getFirebaseAdminApp());

  return firestoreSingleton;
}

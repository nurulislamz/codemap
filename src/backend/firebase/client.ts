"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";

let authSingleton: Auth | null = null;
let emulatorConnected = false;

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfig();

  if (!config) return null;

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

export function getFirebaseAuth(): Auth | null {
  if (authSingleton) return authSingleton;

  const app = getFirebaseApp();

  if (!app) return null;

  authSingleton = getAuth(app);

  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR === "true" &&
    !emulatorConnected
  ) {
    connectAuthEmulator(authSingleton, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    emulatorConnected = true;
  }

  return authSingleton;
}

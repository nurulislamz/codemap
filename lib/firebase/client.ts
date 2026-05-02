"use client";

import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

type FirebaseClientServices = {
  app: FirebaseApp;
  auth: Auth;
};

let services: FirebaseClientServices | null = null;

export function getFirebaseAuth(): Auth {
  const auth = getFirebaseClientServices()?.auth ?? null;
  if (!auth) throw new Error("Firebase auth is not configured.");
  return auth;
}

function getFirebaseClientServices(): FirebaseClientServices | null {
  if (services) return services;
  const config = getFirebaseClientConfig();
  if (!config) return null;

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuthentication(app);
  services = { app, auth };
  return services;
}

function getFirebaseClientConfig(): FirebaseOptions | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  } satisfies FirebaseOptions;

  if (!config.apiKey || !config.authDomain || !config.projectId) {
    return null;
  }

  return config;
}

function getAuthentication(app: FirebaseApp): Auth {
  const auth = getAuth(app);
  const emulatorOrigin = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_ORIGIN;

  if (!emulatorOrigin) {
    return auth;
  }

  connectAuthEmulator(auth, emulatorOrigin, {
    disableWarnings: true,
  });
  return auth;
}

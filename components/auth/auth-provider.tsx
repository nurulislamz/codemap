"use client";

import {
  type Auth,
  type User,
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

type AuthStatus = "loading" | "signed-in" | "signed-out" | "unavailable";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  getIdToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth] = useState<Auth | null>(() => {
    try {
      return getFirebaseAuth();
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    auth ? "loading" : "unavailable",
  );

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setStatus(nextUser ? "signed-in" : "signed-out");
    });
  }, [auth]);

  useEffect(() => {
    if (
      !auth ||
      status !== "signed-out" ||
      process.env.NEXT_PUBLIC_LOCAL_DEV_AUTO_SIGN_IN !== "true" ||
      !process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_ORIGIN
    ) {
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const email =
      process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_EMAIL || "local-owner@codemap.dev";
    const password =
      process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_PASSWORD || "local-owner-password";

    const signIn = async () => {
      attempts += 1;

      try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (attempts >= 30) {
          console.warn("Local dev auto sign-in failed.", error);
          return;
        }

        retryTimer = setTimeout(signIn, 500);
      }
    };

    void signIn();

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [auth, status]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user,
      getIdToken: async () => {
        return auth?.currentUser ? auth.currentUser.getIdToken() : null;
      },
      signInWithGoogle: async () => {
        const authInstance = requireAuth(auth);
        await setPersistence(authInstance, browserLocalPersistence);
        await signInWithPopup(authInstance, new GoogleAuthProvider());
      },
      signOutUser: async () => {
        if (auth) {
          await signOut(auth);
        }
      },
    };
  }, [auth, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() : AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

function requireAuth(auth: Auth | null) : Auth {
  if (!auth) throw new Error("Firebase auth is not configured.");
  return auth;
}

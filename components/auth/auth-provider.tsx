"use client";

import {
  type Auth,
  type User,
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
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

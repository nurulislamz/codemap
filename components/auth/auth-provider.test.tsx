import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./auth-provider";

const authMocks = vi.hoisted(() => {
  return {
    auth: { currentUser: null },
    authStateChanged: null as null | ((user: null) => void),
    onAuthStateChanged: vi.fn(),
    setPersistence: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock("@/lib/firebase/client", () => ({
  getFirebaseAuth: () => authMocks.auth,
}));

vi.mock("firebase/auth", () => ({
  browserLocalPersistence: "browser-local-persistence",
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: authMocks.onAuthStateChanged,
  setPersistence: authMocks.setPersistence,
  signInWithEmailAndPassword: authMocks.signInWithEmailAndPassword,
  signInWithPopup: authMocks.signInWithPopup,
  signOut: authMocks.signOut,
}));

describe("AuthProvider", () => {
  beforeEach(() => {
    authMocks.authStateChanged = null;
    authMocks.onAuthStateChanged.mockImplementation((_auth, callback) => {
      authMocks.authStateChanged = callback;
      return vi.fn();
    });
    authMocks.setPersistence.mockResolvedValue(undefined);
    authMocks.signInWithEmailAndPassword.mockResolvedValue(undefined);
    delete process.env.NEXT_PUBLIC_LOCAL_DEV_AUTO_SIGN_IN;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_ORIGIN;
    delete process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_EMAIL;
    delete process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_PASSWORD;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not auto sign in unless the local dev flag is enabled", async () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.authStateChanged).not.toBeNull());

    act(() => {
      authMocks.authStateChanged?.(null);
    });

    expect(authMocks.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("auto signs in with the local emulator user when explicitly enabled", async () => {
    process.env.NEXT_PUBLIC_LOCAL_DEV_AUTO_SIGN_IN = "true";
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_ORIGIN = "http://127.0.0.1:9099";
    process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_EMAIL = "local-owner@codemap.dev";
    process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_PASSWORD = "local-owner-password";

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.authStateChanged).not.toBeNull());

    act(() => {
      authMocks.authStateChanged?.(null);
    });

    await waitFor(() => {
      expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
        authMocks.auth,
        "local-owner@codemap.dev",
        "local-owner-password",
      );
    });
    expect(authMocks.setPersistence).toHaveBeenCalledWith(
      authMocks.auth,
      "browser-local-persistence",
    );
  });
});

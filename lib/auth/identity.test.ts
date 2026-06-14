import { afterEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.hoisted(() => vi.fn());
const requestHeaders = vi.hoisted(() => new Map<string, string>());

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{ name: "test-admin-app" }],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ verifyIdToken }),
}));

vi.mock("next/headers", () => ({
  headers: () => ({
    get: (name: string) => requestHeaders.get(name.toLowerCase()) ?? null,
  }),
}));

describe("getRequestUserId", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    requestHeaders.clear();
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  });

  it("throws unauthorized when a non-local request has no token", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { UnauthorizedError, getRequestUserId } = await import("./identity");

    await expect(getRequestUserId()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws unauthorized when Firebase rejects the token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    verifyIdToken.mockRejectedValueOnce(new Error("expired"));

    const { UnauthorizedError, getRequestUserId } = await import("./identity");

    await expect(getRequestUserId({ idToken: "bad-token" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(verifyIdToken).toHaveBeenCalledWith("bad-token");
  });

  it("returns the verified Firebase uid from a bearer token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    requestHeaders.set("authorization", "Bearer valid-token");
    verifyIdToken.mockResolvedValueOnce({ uid: "firebase-user-123" });

    const { getRequestUserId } = await import("./identity");

    await expect(getRequestUserId()).resolves.toBe("firebase-user-123");
    expect(verifyIdToken).toHaveBeenCalledWith("valid-token");
  });

  it("returns the verified Firebase uid from a server action token source", async () => {
    vi.stubEnv("NODE_ENV", "production");
    verifyIdToken.mockResolvedValueOnce({ uid: "action-user-456" });

    const { getRequestUserId } = await import("./identity");

    await expect(getRequestUserId({ idToken: "action-token" })).resolves.toBe(
      "action-user-456",
    );
    expect(verifyIdToken).toHaveBeenCalledWith("action-token");
  });
});

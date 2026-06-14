import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const listProjects = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  getRequestUserId,
}));

vi.mock("@/lib/projects/db-server", () => ({
  listProjects,
}));

describe("GET /api/projects", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns projects for the authenticated user", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    const projects = [{ projectId: "p1", title: "Rate limiter" }];
    listProjects.mockResolvedValue(projects);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(listProjects).toHaveBeenCalledWith("firebase-user-123");
    expect(await response.json()).toEqual({ projects });
  });

  it("returns 401 when the request is unauthorized", async () => {
    const { UnauthorizedError } = await import("@/lib/auth/identity");
    getRequestUserId.mockRejectedValue(new UnauthorizedError());
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      projects: [],
      error: "Unauthorized",
    });
  });
});

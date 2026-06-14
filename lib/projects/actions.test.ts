import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestUserId = vi.hoisted(() => vi.fn());
const upsertProject = vi.hoisted(() => vi.fn());
const getProject = vi.hoisted(() => vi.fn());
const deleteProject = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/identity", () => ({
  getRequestUserId,
}));

vi.mock("./db-server", () => ({
  upsertProject,
  getProject,
  deleteProject,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

describe("project actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new project with a generated id and timestamps", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    upsertProject.mockResolvedValue(undefined);
    const { saveProject } = await import("./actions");

    await saveProject({
      title: "Build a rate limiter",
      notes: "Token bucket in Go",
      status: "idea",
      idToken: "id-token",
    });

    expect(getProject).not.toHaveBeenCalled();
    expect(upsertProject).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: expect.any(String),
        title: "Build a rate limiter",
        status: "idea",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
      "firebase-user-123",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
  });

  it("preserves createdAt when updating an existing project", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    getProject.mockResolvedValue({
      projectId: "11111111-1111-4111-8111-111111111111",
      title: "Build a rate limiter",
      notes: "",
      status: "idea",
      createdAt: "2026-06-01T09:00:00.000Z",
      updatedAt: "2026-06-01T09:00:00.000Z",
    });
    upsertProject.mockResolvedValue(undefined);
    const { saveProject } = await import("./actions");

    await saveProject({
      projectId: "11111111-1111-4111-8111-111111111111",
      title: "Build a rate limiter",
      notes: "",
      status: "in_progress",
      idToken: "id-token",
    });

    expect(upsertProject).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "11111111-1111-4111-8111-111111111111",
        status: "in_progress",
        createdAt: "2026-06-01T09:00:00.000Z",
      }),
      "firebase-user-123",
    );
  });

  it("deletes a project for the authenticated user", async () => {
    getRequestUserId.mockResolvedValue("firebase-user-123");
    deleteProject.mockResolvedValue(undefined);
    const { removeProject } = await import("./actions");

    await removeProject({
      projectId: "11111111-1111-4111-8111-111111111111",
      idToken: "id-token",
    });

    expect(deleteProject).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      "firebase-user-123",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
  });
});

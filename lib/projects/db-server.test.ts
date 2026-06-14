import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const collection = vi.hoisted(() => vi.fn());
const userDoc = vi.hoisted(() => vi.fn());
const projectDoc = vi.hoisted(() => vi.fn());
const setProject = vi.hoisted(() => vi.fn());
const deleteDoc = vi.hoisted(() => vi.fn());
const getProjects = vi.hoisted(() => vi.fn());
const orderBy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/firestore", () => ({
  getFirestoreDb: () => ({
    collection,
  }),
}));

vi.mock("@/lib/auth/identity", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  getRequestUserId: vi.fn(),
}));

const validProject = {
  projectId: "11111111-1111-4111-8111-111111111111",
  title: "Build a rate limiter",
  notes: "Token bucket in Go",
  status: "idea" as const,
  createdAt: "2026-06-12T09:00:00.000Z",
  updatedAt: "2026-06-12T09:00:00.000Z",
};

describe("projects db-server", () => {
  beforeEach(() => {
    const projectsCollection = {
      doc: projectDoc,
      orderBy,
    };
    const userDocument = {
      collection: vi.fn(() => projectsCollection),
    };
    const usersCollection = {
      doc: userDoc,
    };

    collection.mockReturnValue(usersCollection);
    userDoc.mockReturnValue(userDocument);
    projectDoc.mockReturnValue({
      set: setProject,
      delete: deleteDoc,
      get: vi.fn().mockResolvedValue({ exists: false }),
    });
    orderBy.mockReturnValue({ get: getProjects });
    getProjects.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes projects under the supplied authenticated user id", async () => {
    const { upsertProject } = await import("./db-server");

    await upsertProject(validProject, "firebase-user-123");

    expect(collection).toHaveBeenCalledWith("users");
    expect(userDoc).toHaveBeenCalledWith("firebase-user-123");
    expect(projectDoc).toHaveBeenCalledWith(validProject.projectId);
    expect(setProject).toHaveBeenCalledWith(validProject, { merge: true });
  });

  it("rejects projects with an empty title", async () => {
    const { upsertProject } = await import("./db-server");

    await expect(
      upsertProject({ ...validProject, title: "   " }, "firebase-user-123"),
    ).rejects.toThrow();
    expect(setProject).not.toHaveBeenCalled();
  });

  it("lists projects newest first and drops malformed documents", async () => {
    getProjects.mockResolvedValue({
      docs: [
        { data: () => validProject },
        { data: () => ({ malformed: "row" }) },
      ],
    });
    const { listProjects } = await import("./db-server");

    const projects = await listProjects("firebase-user-123");

    expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(projects).toEqual([validProject]);
  });

  it("deletes the requested project document", async () => {
    const { deleteProject } = await import("./db-server");

    await deleteProject(validProject.projectId, "firebase-user-123");

    expect(projectDoc).toHaveBeenCalledWith(validProject.projectId);
    expect(deleteDoc).toHaveBeenCalled();
  });
});

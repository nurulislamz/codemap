import { afterEach, describe, expect, it } from "vitest";

import {
  deleteLocalProject,
  getLocalProjects,
  saveLocalProject,
} from "./local-project-storage";

const project = {
  projectId: "11111111-1111-4111-8111-111111111111",
  title: "Build a rate limiter",
  notes: "Token bucket in Go",
  status: "idea" as const,
  createdAt: "2026-06-12T09:00:00.000Z",
  updatedAt: "2026-06-12T09:00:00.000Z",
};

describe("local project storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("upserts projects by id keeping the newest first", () => {
    saveLocalProject(project);
    saveLocalProject({ ...project, status: "in_progress" });

    const projects = getLocalProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]?.status).toBe("in_progress");
  });

  it("deletes projects by id", () => {
    saveLocalProject(project);

    deleteLocalProject(project.projectId);

    expect(getLocalProjects()).toEqual([]);
  });

  it("returns an empty list when storage is empty or corrupt", () => {
    expect(getLocalProjects()).toEqual([]);

    window.localStorage.setItem("codemap.projects.v1", "{corrupt");

    expect(getLocalProjects()).toEqual([]);
  });
});

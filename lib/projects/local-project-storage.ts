import type { Project } from "@/lib/firebase/projects";

const localProjectStorageKey = "codemap.projects.v1";

export function saveLocalProject(project: Project) {
  const storage = getLocalStorage();

  if (!storage) {
    throw new Error("Local project storage is unavailable.");
  }

  const others = getLocalProjects().filter(
    (existing) => existing.projectId !== project.projectId,
  );

  storage.setItem(localProjectStorageKey, JSON.stringify([project, ...others]));

  return project;
}

export function deleteLocalProject(projectId: string) {
  const storage = getLocalStorage();

  if (!storage) return;

  storage.setItem(
    localProjectStorageKey,
    JSON.stringify(
      getLocalProjects().filter((project) => project.projectId !== projectId),
    ),
  );
}

export function getLocalProjects(): Project[] {
  const storage = getLocalStorage();
  const rawValue = storage?.getItem(localProjectStorageKey);

  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed) ? parsed.filter(isLocalProject) : [];
  } catch {
    return [];
  }
}

function getLocalStorage() {
  if (
    typeof window === "undefined" ||
    !window.localStorage ||
    typeof window.localStorage.getItem !== "function" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    return null;
  }

  return window.localStorage;
}

function isLocalProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;

  const project = value as Partial<Project>;

  return (
    typeof project.projectId === "string" &&
    typeof project.title === "string" &&
    typeof project.status === "string"
  );
}

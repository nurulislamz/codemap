import "server-only";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { projectSchema, type Project } from "@/lib/firebase/projects";

export async function upsertProject(
  project: Project,
  userId: string,
): Promise<Project> {
  const parsed = projectSchema.parse(project);

  await getProjectsCollection(userId)
    .doc(parsed.projectId)
    .set(parsed, { merge: true });

  return parsed;
}

export async function getProject(
  projectId: string,
  userId: string,
): Promise<Project | null> {
  const snapshot = await getProjectsCollection(userId).doc(projectId).get();

  if (!snapshot.exists) {
    return null;
  }

  const parsed = projectSchema.safeParse(snapshot.data());
  return parsed.success ? parsed.data : null;
}

export async function listProjects(userId: string): Promise<Project[]> {
  const snapshot = await getProjectsCollection(userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs
    .map((doc) => projectSchema.safeParse(doc.data()))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data);
}

export async function listProjectsForRequest(): Promise<Project[]> {
  try {
    const userId = await getRequestUserId();
    return await listProjects(userId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return [];
    }

    throw error;
  }
}

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<void> {
  await getProjectsCollection(userId).doc(projectId).delete();
}

function getProjectsCollection(userId: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(userId)
    .collection("projects");
}

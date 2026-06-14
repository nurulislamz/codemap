"use server";

import { revalidatePath } from "next/cache";
import { getRequestUserId } from "@/lib/auth/identity";
import type { ProjectStatus } from "@/lib/firebase/projects";
import { deleteProject, getProject, upsertProject } from "./db-server";

export type SaveProjectInput = {
  projectId?: string | null;
  title: string;
  notes: string;
  status: ProjectStatus;
  idToken?: string | null;
};

export type DeleteProjectInput = {
  projectId: string;
  idToken?: string | null;
};

export async function saveProject(input: SaveProjectInput): Promise<void> {
  const userId = await getRequestUserId(input);
  const now = new Date().toISOString();
  const existing = input.projectId
    ? await getProject(input.projectId, userId)
    : null;

  await upsertProject(
    {
      projectId: input.projectId ?? crypto.randomUUID(),
      title: input.title,
      notes: input.notes,
      status: input.status,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    userId,
  );

  revalidatePath("/projects");
}

export async function removeProject(input: DeleteProjectInput): Promise<void> {
  const userId = await getRequestUserId(input);

  await deleteProject(input.projectId, userId);
  revalidatePath("/projects");
}

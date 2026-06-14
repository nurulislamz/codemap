import "server-only";

import { z } from "zod";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import {
  roadmapProgressDocumentId,
  type RoadmapTopicProgress,
  type RoadmapTopicProgressInput,
} from "@/lib/roadmap/progress-shared";

export type {
  RoadmapTopicProgress,
  RoadmapTopicProgressInput,
} from "@/lib/roadmap/progress-shared";

const roadmapTopicProgressInputSchema = z.object({
  roadmapSlug: z.string().min(1).max(80),
  topicSlug: z.string().min(1).max(120),
  learned: z.boolean(),
  notes: z.string().max(4000),
  links: z.array(z.string().trim().min(1).max(500).refine(isValidUrl)).max(10),
});

const roadmapTopicProgressSchema = roadmapTopicProgressInputSchema.extend({
  updatedAt: z.string().optional(),
});

export async function saveRoadmapTopicProgress(
  input: RoadmapTopicProgressInput,
  userId: string,
): Promise<RoadmapTopicProgress> {
  const progress = roadmapTopicProgressInputSchema.parse(input);
  const document = {
    ...progress,
    notes: progress.notes.trim(),
    updatedAt: new Date().toISOString(),
  };

  await getRoadmapProgressCollection(userId)
    .doc(roadmapProgressDocumentId(progress.roadmapSlug, progress.topicSlug))
    .set(document, { merge: true });

  return document;
}

export async function getRoadmapTopicProgress(
  userId: string,
  roadmapSlug: string,
  topicSlug: string,
): Promise<RoadmapTopicProgress | null> {
  const snapshot = await getRoadmapProgressCollection(userId)
    .doc(roadmapProgressDocumentId(roadmapSlug, topicSlug))
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const parsed = roadmapTopicProgressSchema.safeParse(snapshot.data());
  return parsed.success ? parsed.data : null;
}

export async function getRoadmapLearnedMap(
  userId: string,
  roadmapSlug: string,
): Promise<Record<string, boolean>> {
  const snapshot = await getRoadmapProgressCollection(userId).get();
  const learned: Record<string, boolean> = {};

  snapshot.docs.forEach((doc) => {
    const parsed = roadmapTopicProgressSchema.safeParse(doc.data());
    if (!parsed.success) return;
    if (parsed.data.roadmapSlug !== roadmapSlug) return;
    learned[parsed.data.topicSlug] = parsed.data.learned;
  });

  return learned;
}

function getRoadmapProgressCollection(userId: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(userId)
    .collection("roadmapProgress");
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

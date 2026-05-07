"use server";

import { revalidatePath } from "next/cache";
import { getRequestUserId } from "@/lib/auth/identity";
import {
  saveRoadmapTopicProgress,
  type RoadmapTopicProgressInput,
} from "@/lib/roadmap/progress";

export type SaveRoadmapProgressInput = RoadmapTopicProgressInput & {
  idToken?: string | null;
};

export async function saveRoadmapProgress(
  input: SaveRoadmapProgressInput,
): Promise<void> {
  const userId = await getRequestUserId(input);

  await saveRoadmapTopicProgress(input, userId);
  revalidatePath("/roadmap");
}

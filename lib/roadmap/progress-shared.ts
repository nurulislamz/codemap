export type RoadmapTopicProgressInput = {
  roadmapSlug: string;
  topicSlug: string;
  learned: boolean;
  notes: string;
  links: string[];
};

export type RoadmapTopicProgress = RoadmapTopicProgressInput & {
  updatedAt?: string;
};

export function localProgressKey(roadmapSlug: string, topicSlug: string) {
  return `codemap:roadmap-progress:${roadmapSlug}:${topicSlug}`;
}

export function roadmapProgressDocumentId(
  roadmapSlug: string,
  topicSlug: string,
) {
  return `${roadmapSlug}__${topicSlug}`;
}

export function readLocalProgress(
  roadmapSlug: string,
  topicSlug: string,
): RoadmapTopicProgress | null {
  const key = localProgressKey(roadmapSlug, topicSlug);
  const saved = window.localStorage.getItem(key);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as RoadmapTopicProgress;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function writeLocalProgress(progress: RoadmapTopicProgress) {
  window.localStorage.setItem(
    localProgressKey(progress.roadmapSlug, progress.topicSlug),
    JSON.stringify(progress),
  );
}

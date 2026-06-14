"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import type { SaveRoadmapProgressInput } from "@/lib/roadmap/actions";
import {
  writeLocalProgress,
  type RoadmapTopicProgress,
} from "@/lib/roadmap/progress-shared";
import { useRoadmapTopicProgress } from "@/lib/roadmap/use-progress";

type RoadmapTopicProgressFormProps = {
  roadmapSlug: string;
  topicSlug: string;
  initialProgress: RoadmapTopicProgress | null;
  saveProgressAction: (input: SaveRoadmapProgressInput) => Promise<void>;
  onSaved?: (progress: RoadmapTopicProgress) => void;
};

export function RoadmapTopicProgressForm({
  roadmapSlug,
  topicSlug,
  initialProgress,
  saveProgressAction,
  onSaved,
}: RoadmapTopicProgressFormProps) {
  const { status: authStatus, getIdToken } = useAuth();
  const savedProgress = useRoadmapTopicProgress(
    roadmapSlug,
    topicSlug,
    initialProgress,
  );
  const [learned, setLearned] = useState(initialProgress?.learned ?? false);
  const [notes, setNotes] = useState(initialProgress?.notes ?? "");
  const [links, setLinks] = useState(initialProgress?.links ?? []);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync form fields when loaded progress arrives, as a render-phase
  // derivation rather than an effect (avoids a cascading render).
  const [appliedProgress, setAppliedProgress] = useState(initialProgress);
  if (savedProgress !== appliedProgress) {
    setAppliedProgress(savedProgress);
    if (savedProgress) {
      setLearned(savedProgress.learned);
      setNotes(savedProgress.notes);
      setLinks(savedProgress.links);
    }
  }

  function saveProgress() {
    setMessage(null);
    startTransition(async () => {
      const progress = {
        roadmapSlug,
        topicSlug,
        learned,
        notes,
        links,
      };

      if (authStatus === "signed-in") {
        const idToken = await getIdToken();

        if (!idToken) {
          setMessage("Sign in again before saving.");
          return;
        }

        await saveProgressAction({ ...progress, idToken });
        setMessage("Saved.");
        onSaved?.({ ...progress, updatedAt: new Date().toISOString() });
        return;
      }

      writeLocalProgress(progress);
      setMessage("Saved locally.");
      onSaved?.({ ...progress, updatedAt: new Date().toISOString() });
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        saveProgress();
      }}
    >
      <label className="flex items-center gap-3 rounded-lg border border-[#26364d] bg-[#101a2a]/74 px-4 py-3 text-base font-bold text-white">
        <input
          type="checkbox"
          checked={learned}
          className="h-5 w-5 accent-[#29d17d]"
          onChange={(event) => setLearned(event.target.checked)}
        />
        Learned
      </label>

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#6747ff] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(103,71,255,0.25)] transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {message ? (
          <p className="text-sm font-semibold text-slate-400" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

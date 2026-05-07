"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import type { SaveRoadmapProgressInput } from "@/lib/roadmap/actions";
import type { RoadmapTopicProgress } from "@/lib/roadmap/progress";

type RoadmapTopicProgressFormProps = {
  roadmapSlug: string;
  topicSlug: string;
  initialProgress: RoadmapTopicProgress | null;
  saveProgressAction: (input: SaveRoadmapProgressInput) => Promise<void>;
  onSaved?: (progress: RoadmapTopicProgress) => void;
};

type ProgressResponse = {
  progress?: RoadmapTopicProgress | null;
};

export function RoadmapTopicProgressForm({
  roadmapSlug,
  topicSlug,
  initialProgress,
  saveProgressAction,
  onSaved,
}: RoadmapTopicProgressFormProps) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [learned, setLearned] = useState(initialProgress?.learned ?? false);
  const [notes, setNotes] = useState(initialProgress?.notes ?? "");
  const [links, setLinks] = useState(initialProgress?.links ?? []);
  const [nextLink, setNextLink] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    let cancelled = false;

    async function loadProgress() {
      if (authStatus === "signed-in" && user) {
        const idToken = await getIdToken();
        const response = await fetch(
          `/api/roadmap/progress?roadmap=${encodeURIComponent(roadmapSlug)}&topic=${encodeURIComponent(topicSlug)}`,
          {
            cache: "no-store",
            headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
          },
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as ProgressResponse;

        if (data.progress) {
          setLearned(data.progress.learned);
          setNotes(data.progress.notes);
          setLinks(data.progress.links);
        }
        return;
      }

      const saved = window.localStorage.getItem(localProgressKey(roadmapSlug, topicSlug));

      if (!saved || cancelled) {
        return;
      }

      try {
        const progress = JSON.parse(saved) as RoadmapTopicProgress;
        setLearned(progress.learned);
        setNotes(progress.notes);
        setLinks(progress.links);
      } catch {
        window.localStorage.removeItem(localProgressKey(roadmapSlug, topicSlug));
      }
    }

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, [authStatus, getIdToken, roadmapSlug, topicSlug, user]);

  function addLink() {
    const value = nextLink.trim();

    if (!value) {
      return;
    }

    try {
      new URL(value);
    } catch {
      setMessage("Enter a full URL before adding it.");
      return;
    }

    setLinks((currentLinks) =>
      currentLinks.includes(value) ? currentLinks : [...currentLinks, value],
    );
    setNextLink("");
    setMessage(null);
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

      window.localStorage.setItem(
        localProgressKey(roadmapSlug, topicSlug),
        JSON.stringify(progress),
      );
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

      <label className="block">
        <span className="text-sm font-bold uppercase tracking-[0.12em] text-slate-400">
          Notes
        </span>
        <textarea
          value={notes}
          rows={7}
          className="mt-2 w-full resize-none rounded-lg border border-[#26364d] bg-[#0a1422] px-4 py-3 text-base leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#7c68ff]"
          placeholder="Write what you learned, what confused you, or what to review next."
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <div>
        <span className="text-sm font-bold uppercase tracking-[0.12em] text-slate-400">
          Links
        </span>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={nextLink}
            className="min-w-0 flex-1 rounded-lg border border-[#26364d] bg-[#0a1422] px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#7c68ff]"
            placeholder="https://..."
            onChange={(event) => setNextLink(event.target.value)}
          />
          <button
            type="button"
            className="rounded-lg border border-[#374967] px-4 text-sm font-bold text-slate-200 transition hover:border-[#7c68ff] hover:text-white"
            onClick={addLink}
          >
            Add link
          </button>
        </div>

        {links.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {links.map((link) => (
              <li
                key={link}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#22314a] bg-[#0b1626] px-3 py-2 text-sm"
              >
                <a
                  href={link}
                  className="min-w-0 truncate text-[#f3b857] hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link}
                </a>
                <button
                  type="button"
                  className="shrink-0 text-slate-500 transition hover:text-white"
                  onClick={() =>
                    setLinks((currentLinks) =>
                      currentLinks.filter((currentLink) => currentLink !== link),
                    )
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#6747ff] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(103,71,255,0.25)] transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save notes"}
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

function localProgressKey(roadmapSlug: string, topicSlug: string) {
  return `codemap:roadmap-progress:${roadmapSlug}:${topicSlug}`;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoadmapDetail, RoadmapTopic } from "@/lib/roadmap/catalog";
import { useAuth } from "@/components/auth/auth-provider";
import { RoadmapTopicProgressForm } from "@/components/roadmap/roadmap-topic-progress-form";
import type { RoadmapTopicProgress } from "@/lib/roadmap/progress";
import type { SaveRoadmapProgressInput } from "@/lib/roadmap/actions";
import { LeetcodePanel } from "@/components/leetcode/leetcode-ui";

type RoadmapConceptsModalProps = {
  roadmap: RoadmapDetail;
  initialSelectedTopicSlug?: string | null;
  saveProgressAction: (input: SaveRoadmapProgressInput) => Promise<void>;
};

type LearnedMapResponse = {
  learned?: Record<string, boolean>;
};

export function RoadmapConceptsModal({
  roadmap,
  initialSelectedTopicSlug = null,
  saveProgressAction,
}: RoadmapConceptsModalProps) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(
    initialSelectedTopicSlug,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [learnedByTopic, setLearnedByTopic] = useState<Record<string, boolean>>(
    {},
  );

  const selectedTopic = useMemo(() => {
    return (
      roadmap.topics.find((topic) => topic.slug === selectedTopicSlug) ??
      roadmap.topics[0]
    );
  }, [roadmap.topics, selectedTopicSlug]);

  const topicGroups = useMemo(() => {
    const groups: Array<{ title: string; topics: RoadmapTopic[] }> = [];
    let current: { title: string; topics: RoadmapTopic[] } | null = null;

    roadmap.topics.forEach((topic) => {
      if (topic.type === "topic") {
        current = { title: topic.title, topics: [] };
        groups.push(current);
      }

      if (!current) {
        current = { title: "Other", topics: [] };
        groups.push(current);
      }

      current.topics.push(topic);
    });

    return groups;
  }, [roadmap.topics]);

  useEffect(() => {
    if (authStatus !== "signed-in" || !user) {
      const learned: Record<string, boolean> = {};

      roadmap.topics.forEach((topic) => {
        const saved = window.localStorage.getItem(localProgressKey(roadmap.slug, topic.slug));
        if (!saved) return;
        try {
          const parsed = JSON.parse(saved) as RoadmapTopicProgress;
          learned[topic.slug] = Boolean(parsed.learned);
        } catch {
          window.localStorage.removeItem(localProgressKey(roadmap.slug, topic.slug));
        }
      });

      const timeoutId = window.setTimeout(() => setLearnedByTopic(learned), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let cancelled = false;

    async function loadLearned() {
      const idToken = await getIdToken();
      const response = await fetch(
        `/api/roadmap/progress-map?roadmap=${encodeURIComponent(roadmap.slug)}`,
        {
          cache: "no-store",
          headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
        },
      );

      if (!response.ok || cancelled) {
        return;
      }

      const data = (await response.json()) as LearnedMapResponse;
      setLearnedByTopic(data.learned ?? {});
    }

    void loadLearned();
    return () => {
      cancelled = true;
    };
  }, [authStatus, getIdToken, roadmap.slug, roadmap.topics, user]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [isOpen]);

  function openTopic(topicSlug: string) {
    setSelectedTopicSlug(topicSlug);
    setIsOpen(true);

    const url = new URL(window.location.href);
    url.searchParams.set("topic", topicSlug);
    window.history.pushState(null, "", url.toString());
  }

  function markSaved(progress: RoadmapTopicProgress) {
    setLearnedByTopic((current) => ({
      ...current,
      [progress.topicSlug]: progress.learned,
    }));
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <LeetcodePanel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#22314a] bg-[#0b1423] px-6 py-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Concepts
            </h2>
            <p className="mt-2 text-base text-slate-400">
              Ordered from the roadmap.sh graph data.
            </p>
          </div>
          <div className="rounded-full border border-[#22314a] bg-[#08111d] px-5 py-2.5 text-base font-bold text-slate-200">
            {roadmap.topicCount} concepts
          </div>
        </div>

        <div className="divide-y divide-[#22314a]">
          {topicGroups.map((group) => (
            <div key={group.title}>
              <div className="flex items-center gap-3 bg-[#0b1626] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#a997ff]">
                <span className="h-2 w-2 rounded-full bg-[#7c68ff]" aria-hidden="true" />
                {group.title}
              </div>
              {group.topics.map((topic) => {
                const learned = learnedByTopic[topic.slug] === true;

                return (
                  <button
                    key={topic.slug}
                    type="button"
                    className={`grid w-full gap-5 px-6 py-5 text-left transition md:grid-cols-[3.25rem_minmax(0,1fr)_14.5rem] md:items-center ${
                      learned
                        ? "bg-[#0f2a22] hover:bg-[#13362c]"
                        : "bg-transparent hover:bg-[#0f1a2b]"
                    }`}
                    onClick={() => openTopic(topic.slug)}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-extrabold ${
                        learned
                          ? "border-[#29d17d] bg-[#0b241a] text-[#63e59d]"
                          : "border-[#3b4a62] bg-[#0b1626] text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      {topic.order}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-lg font-extrabold text-white">
                        {topic.title}
                      </span>
                      <span className="mt-2 block max-h-14 overflow-hidden text-base leading-7 text-slate-400">
                        {topic.summary || "No summary available yet."}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#22314a] bg-[#08111d] px-4 py-2 text-sm font-bold text-slate-200">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-4 w-4 text-[#a997ff]"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        >
                          <path d="M12 20h9" />
                          <path d="M12 4h9" />
                          <path d="M4 7h6v6H4z" />
                          <path d="M4 17h6v3H4z" />
                        </svg>
                        {topic.resourceCount} resources
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-5 w-5 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </LeetcodePanel>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedTopic.title} details`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <LeetcodePanel className="w-full max-w-5xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-6 border-b border-[#22314a] bg-[#0b1423] px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-extrabold text-white">
                  {selectedTopic.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-300">
                  {selectedTopic.summary || "No summary available yet."}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[#22314a] bg-[#08111d] px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-[#7c68ff] hover:bg-white/5 hover:text-white"
                onClick={close}
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-400">
                    Resources
                  </h3>
                  {selectedTopic.video || selectedTopic.articles.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {[
                        ...(selectedTopic.video
                          ? [{ ...selectedTopic.video, type: "video" }]
                          : []),
                        ...selectedTopic.articles,
                      ].map((resource) => (
                        <li key={`${resource.type}:${resource.url}`}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl border border-[#22314a] bg-[#08111d] px-4 py-3 text-sm font-semibold text-[#f3b857] transition hover:border-[#f3b857]/50 hover:bg-[#0f1a2b] hover:text-white"
                          >
                            <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                              {resource.type}
                            </span>
                            <span className="mt-1 block leading-5">
                              {resource.title}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      No resources are attached to this concept yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <RoadmapTopicProgressForm
                  roadmapSlug={roadmap.slug}
                  topicSlug={selectedTopic.slug}
                  initialProgress={null}
                  saveProgressAction={saveProgressAction}
                  onSaved={markSaved}
                />
              </div>
            </div>
          </LeetcodePanel>
        </div>
      ) : null}
    </>
  );
}

function localProgressKey(roadmapSlug: string, topicSlug: string) {
  return `codemap:roadmap-progress:${roadmapSlug}:${topicSlug}`;
}

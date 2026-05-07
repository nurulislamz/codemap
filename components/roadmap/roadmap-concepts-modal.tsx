"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoadmapDetail, RoadmapTopic } from "@/lib/roadmap/catalog";
import { useAuth } from "@/components/auth/auth-provider";
import { RoadmapTopicProgressForm } from "@/components/roadmap/roadmap-topic-progress-form";
import type { RoadmapTopicProgress } from "@/lib/roadmap/progress";
import type { SaveRoadmapProgressInput } from "@/lib/roadmap/actions";

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
    url.searchParams.set("roadmap", roadmap.slug);
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
      <section className="rounded-lg border border-[#26364d] bg-[#101a2a]/74 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between gap-4 border-b border-[#26364d] px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-white">Concepts</h2>
            <p className="mt-1 text-sm text-slate-400">
              Ordered from the roadmap.sh graph data.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            {roadmap.topicCount} concepts
          </p>
        </div>

        <div className="divide-y divide-[#22314a]">
          {topicGroups.map((group) => (
            <div key={group.title}>
              <div className="bg-[#0b1626] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </div>
              {group.topics.map((topic) => {
                const learned = learnedByTopic[topic.slug] === true;

                return (
                  <button
                    key={topic.slug}
                    type="button"
                    className={`grid w-full gap-4 px-6 py-4 text-left transition md:grid-cols-[3rem_minmax(0,1fr)_9rem] md:items-center ${
                      learned
                        ? "bg-[#102e22] hover:bg-[#143a2b]"
                        : "bg-transparent hover:bg-[#111d30]"
                    }`}
                    onClick={() => openTopic(topic.slug)}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-extrabold ${
                        learned
                          ? "border-[#29d17d] bg-[#123a2a] text-[#63e59d]"
                          : "border-[#516278] text-slate-500"
                      }`}
                      aria-hidden="true"
                    >
                      {topic.order}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-bold text-white">
                        {topic.title}
                      </span>
                      <span className="mt-1 block max-h-12 overflow-hidden text-sm leading-6 text-slate-400">
                        {topic.summary || "No summary available yet."}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-slate-400 md:text-right">
                      {topic.resourceCount} resources
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedTopic.title} details`}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="w-full max-w-3xl rounded-lg border border-[#26364d] bg-[#0b1626] shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-6 border-b border-[#22314a] px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-extrabold text-white">
                  {selectedTopic.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {selectedTopic.summary || "No summary available yet."}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[#22314a] px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-[#7c68ff] hover:text-white"
                onClick={close}
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
                            className="block rounded-lg border border-[#22314a] bg-[#08111d] px-3 py-2 text-sm font-semibold text-[#f3b857] transition hover:border-[#f3b857]/50 hover:text-white"
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
          </div>
        </div>
      ) : null}
    </>
  );
}

function localProgressKey(roadmapSlug: string, topicSlug: string) {
  return `codemap:roadmap-progress:${roadmapSlug}:${topicSlug}`;
}

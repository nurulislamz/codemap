"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoadmapDetail } from "@/lib/roadmap/catalog";
import { RoadmapTopicProgressForm } from "@/components/roadmap/roadmap-topic-progress-form";
import type { SaveRoadmapProgressInput } from "@/lib/roadmap/actions";
import { useRoadmapLearnedMap } from "@/lib/roadmap/use-progress";
import { AppPanel, Icon } from "@/components/shared";

type RoadmapConceptsModalProps = {
  roadmap: RoadmapDetail;
  initialSelectedTopicSlug?: string | null;
  initialLearned?: Record<string, boolean>;
  saveProgressAction: (input: SaveRoadmapProgressInput) => Promise<void>;
};

export function RoadmapConceptsModal({
  roadmap,
  initialSelectedTopicSlug = null,
  initialLearned = {},
  saveProgressAction,
}: RoadmapConceptsModalProps) {
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(
    initialSelectedTopicSlug,
  );
  const [isOpen, setIsOpen] = useState(Boolean(initialSelectedTopicSlug));
  const { learnedByTopic, markSaved } = useRoadmapLearnedMap(
    roadmap.slug,
    roadmap.topics,
    initialLearned,
  );
  const initiallyExpandedTopicSlug = initialSelectedTopicSlug ?? roadmap.topics[0]?.slug;
  const [collapsedTopicSlugs, setCollapsedTopicSlugs] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        roadmap.topics
          .filter((topic) => topic.slug !== initiallyExpandedTopicSlug)
          .map((topic) => [topic.slug, true]),
      ),
  );

  const selectedTopic = useMemo(() => {
    return (
      roadmap.topics.find((topic) => topic.slug === selectedTopicSlug) ??
      roadmap.topics[0]
    );
  }, [roadmap.topics, selectedTopicSlug]);

  const selectedTopicResources = selectedTopic
    ? [
        ...(selectedTopic.video
          ? [{ ...selectedTopic.video, type: "video" as const }]
          : []),
        ...selectedTopic.articles,
      ]
    : [];

  const hasCollapsedSection = roadmap.topics.some(
    (topic) => collapsedTopicSlugs[topic.slug] === true,
  );
  const isFullyExpanded = !hasCollapsedSection;

  const learnedCount = Object.values(learnedByTopic).filter(Boolean).length;

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
    setCollapsedTopicSlugs((current) => ({
      ...current,
      [topicSlug]: false,
    }));

    const url = new URL(window.location.href);
    url.searchParams.set("topic", topicSlug);
    window.history.pushState(null, "", url.toString());
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <div
      className={`grid gap-5 ${isOpen ? "xl:grid-cols-[minmax(0,1fr)_25rem]" : ""}`}
    >
      <AppPanel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-[#22314a] bg-[#0b1423] px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[#8d72ff]/65 bg-[#241d55] text-[#a997ff] shadow-[inset_0_0_22px_rgba(141,114,255,0.22)]">
              <Icon name="grid" className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                Concepts
              </h2>
              <p className="mt-1.5 text-base text-slate-400">
                Step-by-step concepts and topics in this roadmap.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 rounded-lg border border-[#22314a] bg-[#0c1829] px-5 py-3 text-sm font-bold text-slate-100">
              <span>{roadmap.topicCount} sections</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#a997ff]" aria-hidden="true" />
              <span>{roadmap.topicCount} concepts</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#29d17d]" aria-hidden="true" />
              <span>{learnedCount} learned</span>
            </div>
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-[#22314a] bg-[#0c1829] px-5 text-sm font-bold text-slate-200 transition hover:border-[#7c68ff] hover:bg-[#101e33] hover:text-white"
              onClick={() => {
                if (isFullyExpanded) {
                  setCollapsedTopicSlugs(
                    Object.fromEntries(
                      roadmap.topics.map((topic) => [topic.slug, true]),
                    ),
                  );
                  return;
                }

                setCollapsedTopicSlugs({});
              }}
            >
              <Icon
                name="chevron"
                className={`h-4 w-4 transition ${
                  isFullyExpanded ? "-rotate-90" : "rotate-90"
                }`}
              />
              {isFullyExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </div>

        <div className="hidden border-b border-[#22314a] bg-[#0a1322] px-6 py-3 text-xs font-extrabold uppercase text-slate-500 md:grid md:grid-cols-[4rem_3.5rem_minmax(12rem,1fr)_minmax(14rem,1.25fr)_6rem_5rem_2rem] md:items-center md:gap-4">
          <span className="text-center">#</span>
          <span />
          <span>Concept</span>
          <span>Summary</span>
          <span>Resources</span>
          <span>Test</span>
          <span />
        </div>

        <div className="space-y-1 bg-[#08111d] p-3">
          {roadmap.topics.map((topic, topicIndex) => {
            const learned = learnedByTopic[topic.slug] === true;
            const isCollapsed = collapsedTopicSlugs[topic.slug] === true;
            const topicResources = [
              ...(topic.video ? [{ ...topic.video, type: "video" as const }] : []),
              ...topic.articles,
            ];

            return (
              <div
                key={topic.slug}
                className="overflow-hidden rounded-lg border border-[#1a2a3f] bg-[#0b1626]"
              >
                <div
                  className={`grid w-full gap-4 px-4 py-4 text-left transition md:grid-cols-[4rem_3.5rem_minmax(12rem,1fr)_minmax(14rem,1.25fr)_6rem_5rem_2rem] md:items-center ${
                    learned ? "bg-[#0f2a22]" : "bg-[#0d192a] hover:bg-[#101e33]"
                  }`}
                >
                  <div className="hidden text-center text-sm font-extrabold text-slate-500 md:block">
                    {topicIndex + 1}
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#7c68ff]/65 bg-[#151f3a] text-[#b5a6ff] transition hover:border-[#a997ff] hover:bg-[#1b2850] hover:text-white"
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${topic.title}`}
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsedTopicSlugs((current) => ({
                        ...current,
                        [topic.slug]: !current[topic.slug],
                      }))
                    }
                  >
                    <Icon
                      name="chevron"
                      className={`h-5 w-5 transition ${isCollapsed ? "" : "rotate-90"}`}
                    />
                  </button>
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => openTopic(topic.slug)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#7c68ff]/40 bg-[#241d55] text-sm font-extrabold text-[#b5a6ff] md:hidden">
                        {topicIndex + 1}
                      </span>
                      <span className="block truncate text-xl font-extrabold text-white md:text-lg">
                        {topic.title}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-slate-500 md:hidden">
                      {topic.resourceCount} resources
                    </span>
                  </button>
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => openTopic(topic.slug)}
                  >
                    <span className="block max-h-14 overflow-hidden text-sm leading-6 text-slate-400 md:text-base md:leading-7">
                      {topic.summary || "No summary available yet."}
                    </span>
                  </button>
                  <span className="hidden items-center gap-2 text-sm font-bold text-slate-300 md:flex">
                    <Icon name="grid" className="h-4 w-4 text-slate-500" />
                    {topic.resourceCount}
                  </span>
                  <a
                    href={`/roadmap/${encodeURIComponent(roadmap.slug)}?test=${encodeURIComponent(topic.slug)}`}
                    className="hidden min-h-8 items-center justify-center rounded-md border border-[#22314a] bg-[#0c1829] px-3 text-xs font-bold text-slate-300 transition hover:border-[#7c68ff] hover:bg-[#101e33] hover:text-white md:inline-flex"
                  >
                    Test
                  </a>
                  <button
                    type="button"
                    className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-white md:flex"
                    aria-label={`${topic.title} options`}
                    onClick={() => openTopic(topic.slug)}
                  >
                    <span aria-hidden="true" className="text-xl leading-none">
                      ⋮
                    </span>
                  </button>
                </div>

                {!isCollapsed ? (
                  <div className="border-t border-[#1a2a3f] bg-[#07111d] px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26364d] bg-[#0d1828] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        <Icon name="grid" className="h-3.5 w-3.5" />
                        {topic.resourceCount} resources
                      </span>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                          learned
                            ? "border-[#2b8b58]/50 bg-[#0d301f] text-[#63e59d]"
                            : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                        }`}
                      >
                        <Icon name="check" className="h-3.5 w-3.5" />
                        {learned ? "Learned" : "Not learned"}
                      </span>
                    </div>

                    {topicResources.length > 0 ? (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {topicResources.map((resource) => (
                          <a
                            key={`${topic.slug}:${resource.type}:${resource.url}`}
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`group block rounded-xl border px-4 py-4 transition ${
                              learned
                                ? "border-[#2b8b58]/35 bg-[#0d301f] hover:border-[#63e59d]/60 hover:bg-[#103924]"
                                : "border-[#22314a] bg-[#08111d] hover:border-[#7c68ff] hover:bg-[#0f1a2b]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                  {resource.type}
                                </span>
                                <span className="mt-2 block text-sm font-semibold leading-6 text-white transition group-hover:text-[#f3b857]">
                                  {resource.title}
                                </span>
                              </div>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                                  learned
                                    ? "border-[#2b8b58]/50 bg-[#0a2418] text-[#63e59d]"
                                    : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                                }`}
                              >
                                <Icon name="check" className="h-3.5 w-3.5" />
                                {learned ? "Learned" : "To learn"}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">
                        No resources are attached to this concept yet.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </AppPanel>

      {isOpen ? (
        <aside
          aria-label={`${selectedTopic.title} details`}
          className="min-w-0 xl:sticky xl:top-6 xl:self-start"
        >
          <AppPanel className="overflow-hidden border-[#2b3c56] shadow-2xl shadow-black/40">
            <div className="border-b border-[#22314a] bg-[#0b1423] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                    Topic
                  </span>
                  <h2 className="mt-2 text-xl font-extrabold leading-7 text-white">
                    {selectedTopic.title}
                  </h2>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#22314a] bg-[#08111d] text-slate-400 transition hover:border-[#7c68ff] hover:bg-white/5 hover:text-white"
                  aria-label="Close details"
                  onClick={close}
                >
                  <span aria-hidden="true" className="text-xl leading-none">
                    x
                  </span>
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {selectedTopic.summary || "No summary available yet."}
              </p>
              <a
                href={`/roadmap/${encodeURIComponent(roadmap.slug)}?test=${encodeURIComponent(selectedTopic.slug)}`}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-[#22314a] bg-[#0c1829] px-4 text-sm font-bold text-slate-200 transition hover:border-[#7c68ff] hover:bg-white/5 hover:text-white"
              >
                Test yourself
              </a>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  Resources
                </h3>
                {selectedTopicResources.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selectedTopicResources.map((resource) => (
                      <a
                        key={`${selectedTopic.slug}:${resource.type}:${resource.url}`}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-lg border border-[#22314a] bg-[#08111d] px-3 py-3 transition hover:border-[#f3b857]/60 hover:bg-[#0f1a2b]"
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            {resource.type}
                          </span>
                          <span className="mt-1 block truncate text-sm font-semibold text-white transition group-hover:text-[#f3b857]">
                            {resource.title}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md border border-[#2f3d54] px-2.5 py-1 text-xs font-extrabold text-[#f3b857] transition group-hover:border-[#f3b857]/60 group-hover:text-white">
                          Open
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-[#22314a] bg-[#08111d] px-3 py-3 text-sm text-slate-400">
                    No resources are attached to this{" "}
                    topic yet.
                  </p>
                )}
              </div>

              <RoadmapTopicProgressForm
                key={selectedTopic.slug}
                roadmapSlug={roadmap.slug}
                topicSlug={selectedTopic.slug}
                initialProgress={null}
                saveProgressAction={saveProgressAction}
                onSaved={markSaved}
              />
            </div>
          </AppPanel>
        </aside>
      ) : null}
    </div>
  );
}

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
  const [collapsedTopicSlugs, setCollapsedTopicSlugs] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        roadmap.topicGroups.slice(1).map((group) => [group.topic.slug, true]),
      ),
  );
  const [expandedTopicSlugs, setExpandedTopicSlugs] = useState<Record<string, boolean>>(
    () => (initialSelectedTopicSlug ? { [initialSelectedTopicSlug]: true } : {}),
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

  const hasCollapsedGroup = roadmap.topicGroups.some(
    (group) => collapsedTopicSlugs[group.topic.slug] === true,
  );
  const childResourceTopicSlugs = roadmap.topicGroups.flatMap((group) =>
    group.children
      .filter((topic) => topic.resourceCount > 0)
      .map((topic) => topic.slug),
  );
  const isFullyExpanded =
    !hasCollapsedGroup &&
    childResourceTopicSlugs.every((topicSlug) => expandedTopicSlugs[topicSlug] === true);

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
    setExpandedTopicSlugs((current) =>
      current[topicSlug] ? current : { ...current, [topicSlug]: true },
    );

    const url = new URL(window.location.href);
    url.searchParams.set("topic", topicSlug);
    window.history.pushState(null, "", url.toString());
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <>
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
              <span>{roadmap.topicGroups.length} groups</span>
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
                      roadmap.topicGroups.map((group) => [group.topic.slug, true]),
                    ),
                  );
                  setExpandedTopicSlugs({});
                  return;
                }

                setCollapsedTopicSlugs({});
                setExpandedTopicSlugs(
                  Object.fromEntries(
                    childResourceTopicSlugs.map((topicSlug) => [topicSlug, true]),
                  ),
                );
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

        <div className="hidden border-b border-[#22314a] bg-[#0a1322] px-6 py-3 text-xs font-extrabold uppercase text-slate-500 md:grid md:grid-cols-[5rem_4rem_minmax(15rem,1fr)_minmax(18rem,1.35fr)_7rem_8rem_9rem_2rem] md:items-center md:gap-4">
          <span className="text-center">#</span>
          <span />
          <span>Concept</span>
          <span>Summary</span>
          <span>Related</span>
          <span>Resources</span>
          <span>Status</span>
          <span />
        </div>

        <div className="space-y-1 bg-[#08111d] p-3">
          {roadmap.topicGroups.map((group, groupIndex) => {
            const learned = learnedByTopic[group.topic.slug] === true;
            const isCollapsed = collapsedTopicSlugs[group.topic.slug] === true;
            const groupResourceCount = group.children.reduce(
              (total, topic) => total + topic.resourceCount,
              group.topic.resourceCount,
            );
            const groupLearnedCount =
              (learned ? 1 : 0) +
              group.children.filter((topic) => learnedByTopic[topic.slug] === true).length;
            const groupTopicResources = [
              ...(group.topic.video ? [{ ...group.topic.video, type: "video" as const }] : []),
              ...group.topic.articles,
            ];

            return (
              <div
                key={group.topic.slug}
                className="overflow-hidden rounded-lg border border-[#1a2a3f] bg-[#0b1626]"
              >
                <div
                  className={`grid w-full gap-4 px-4 py-4 text-left transition md:grid-cols-[5rem_4rem_minmax(15rem,1fr)_minmax(18rem,1.35fr)_7rem_8rem_9rem_2rem] md:items-center ${
                    learned ? "bg-[#0f2a22]" : "bg-[#0d192a] hover:bg-[#101e33]"
                  }`}
                >
                  <div className="hidden text-center text-sm font-extrabold text-slate-500 md:block">
                    {groupIndex + 1}
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#7c68ff]/65 bg-[#151f3a] text-[#b5a6ff] transition hover:border-[#a997ff] hover:bg-[#1b2850] hover:text-white"
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${group.topic.title}`}
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsedTopicSlugs((current) => ({
                        ...current,
                        [group.topic.slug]: !current[group.topic.slug],
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
                    onClick={() => openTopic(group.topic.slug)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#7c68ff]/40 bg-[#241d55] text-sm font-extrabold text-[#b5a6ff] md:hidden">
                        {groupIndex + 1}
                      </span>
                      <span className="block truncate text-xl font-extrabold text-white md:text-lg">
                        {group.topic.title}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-slate-500 md:hidden">
                      {group.children.length} related · {groupResourceCount} resources
                    </span>
                  </button>
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => openTopic(group.topic.slug)}
                  >
                    <span className="block max-h-14 overflow-hidden text-sm leading-6 text-slate-400 md:text-base md:leading-7">
                      {group.topic.summary || "No summary available yet."}
                    </span>
                  </button>
                  <span className="hidden items-center gap-2 text-sm font-bold text-slate-300 md:flex">
                    <Icon name="layers" className="h-4 w-4 text-slate-500" />
                    {group.children.length}
                  </span>
                  <span className="hidden items-center gap-2 text-sm font-bold text-slate-300 md:flex">
                    <Icon name="grid" className="h-4 w-4 text-slate-500" />
                    {groupResourceCount}
                  </span>
                  <span
                    className={`hidden w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-bold md:inline-flex ${
                      learned
                        ? "border-[#2b8b58]/50 bg-[#0d301f] text-[#63e59d]"
                        : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                    }`}
                  >
                    <Icon name="check" className="h-4 w-4" />
                    {learned ? "Learned" : "Not Started"}
                  </span>
                  <button
                    type="button"
                    className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-white md:flex"
                    aria-label={`${group.topic.title} options`}
                    onClick={() => openTopic(group.topic.slug)}
                  >
                    <span aria-hidden="true" className="text-xl leading-none">
                      ⋮
                    </span>
                  </button>
                </div>

                {!isCollapsed && (group.children.length > 0 || groupTopicResources.length > 0) ? (
                  <div className="relative bg-[#08111d]">
                    <div className="grid gap-3 border-t border-[#1a2a3f] bg-[#07111d] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 md:grid-cols-3 md:px-6">
                      <span className="inline-flex items-center gap-2">
                        <Icon name="layers" className="h-3.5 w-3.5 text-slate-500" />
                        {group.children.length} topics
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Icon name="sparkle" className="h-3.5 w-3.5 text-slate-500" />
                        {groupResourceCount} total resources
                      </span>
                      <span
                        className={`inline-flex items-center gap-2 ${
                          groupLearnedCount > 0 ? "text-[#63e59d]" : "text-slate-500"
                        }`}
                      >
                        <Icon name="check" className="h-3.5 w-3.5" />
                        {groupLearnedCount}/{group.children.length + 1} learned
                      </span>
                    </div>
                    <div
                      className={`absolute bottom-7 left-[3.42rem] top-0 hidden w-px bg-[#29384f] md:block ${
                        group.children.length > 0 ? "" : "md:hidden"
                      }`}
                      aria-hidden="true"
                    />
                    {groupTopicResources.length > 0 ? (
                      <div className="border-t border-[#1a2a3f] bg-[#07111d] px-4 py-4 md:px-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full border border-[#26364d] bg-[#0d1828] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            <Icon name="grid" className="h-3.5 w-3.5" />
                            {group.topic.resourceCount} resources
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

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {groupTopicResources.map((resource) => (
                            <a
                              key={`${group.topic.slug}:${resource.type}:${resource.url}`}
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
                      </div>
                    ) : null}
                    {group.children.map((topic, childIndex) => {
                      const childLearned = learnedByTopic[topic.slug] === true;

                      const isExpanded = expandedTopicSlugs[topic.slug] === true;
                      const topicResources = [
                        ...(topic.video ? [{ ...topic.video, type: "video" as const }] : []),
                        ...topic.articles,
                      ];

                      return (
                        <div
                          key={topic.slug}
                          className={`overflow-hidden transition ${
                            childLearned
                              ? "bg-[#0f2a22]"
                              : "bg-[#08111d]"
                          }`}
                        >
                          <div
                            className={`grid w-full gap-4 px-4 py-4 text-left transition md:grid-cols-[5rem_4rem_minmax(15rem,1fr)_minmax(18rem,1.35fr)_7rem_8rem_9rem_2rem] md:items-center ${
                              childLearned ? "hover:bg-[#13362c]" : "hover:bg-[#0d192a]"
                            }`}
                          >
                            <span className="relative hidden text-center text-sm font-bold text-slate-400 md:block">
                              <span
                                className="absolute right-0 top-1/2 h-px w-3 bg-[#29384f]"
                                aria-hidden="true"
                              />
                              {groupIndex + 1}.{childIndex + 1}
                            </span>
                            <span
                              className={`hidden h-3 w-3 rounded-full border md:block ${
                                childLearned
                                  ? "border-[#63e59d] bg-[#29d17d]"
                                  : "border-[#4a5870] bg-[#172235]"
                              }`}
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              className="min-w-0 text-left"
                              onClick={() => openTopic(topic.slug)}
                            >
                              <span className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-500 md:hidden">
                                  {groupIndex + 1}.{childIndex + 1}
                                </span>
                                <span className="block truncate text-base font-extrabold text-white">
                                  {topic.title}
                                </span>
                              </span>
                              <span className="mt-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
                                {topic.resourceCount} resources
                              </span>
                            </button>
                            <button
                              type="button"
                              className="min-w-0 text-left"
                              onClick={() => openTopic(topic.slug)}
                            >
                              <span className="block max-h-12 overflow-hidden text-sm leading-6 text-slate-400">
                                {topic.summary || "No summary available yet."}
                              </span>
                            </button>
                            <span className="hidden text-sm font-bold text-slate-500 md:block">
                              -
                            </span>
                            <span className="hidden items-center gap-2 text-sm font-bold text-slate-300 md:flex">
                              <Icon name="grid" className="h-4 w-4 text-slate-500" />
                              {topic.resourceCount}
                            </span>
                            <span
                              className={`hidden w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-bold md:inline-flex ${
                                childLearned
                                  ? "border-[#2b8b58]/50 bg-[#0d301f] text-[#63e59d]"
                                  : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                              }`}
                            >
                              <Icon name="check" className="h-4 w-4" />
                              {childLearned ? "Learned" : "Not Started"}
                            </span>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-white"
                                aria-label={`${isExpanded ? "Collapse" : "Expand"} resources for ${topic.title}`}
                                aria-expanded={isExpanded}
                                aria-controls={`topic-resources-${topic.slug}`}
                                onClick={() =>
                                  setExpandedTopicSlugs((current) => ({
                                    ...current,
                                    [topic.slug]: !current[topic.slug],
                                  }))
                                }
                              >
                                <Icon
                                  name="chevron"
                                  className={`h-5 w-5 transition ${isExpanded ? "rotate-90" : ""}`}
                                />
                              </button>
                              <button
                                type="button"
                                className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-white md:flex"
                                aria-label={`${topic.title} details`}
                                onClick={() => openTopic(topic.slug)}
                              >
                                <span aria-hidden="true" className="text-xl leading-none">
                                  ⋮
                                </span>
                              </button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div
                              id={`topic-resources-${topic.slug}`}
                              className="border-t border-[#1a2a3f] bg-[#07111d] px-4 py-4 md:px-6"
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#26364d] bg-[#0d1828] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                  <Icon name="grid" className="h-3.5 w-3.5" />
                                  {topic.resourceCount} resources
                                </span>
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                                    childLearned
                                      ? "border-[#2b8b58]/50 bg-[#0d301f] text-[#63e59d]"
                                      : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                                  }`}
                                >
                                  <Icon name="check" className="h-3.5 w-3.5" />
                                  {childLearned ? "Learned" : "Not learned"}
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
                                        childLearned
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
                                            childLearned
                                              ? "border-[#2b8b58]/50 bg-[#0a2418] text-[#63e59d]"
                                              : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                                          }`}
                                        >
                                          <Icon name="check" className="h-3.5 w-3.5" />
                                          {childLearned ? "Learned" : "To learn"}
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
                ) : null}
              </div>
            );
          })}
        </div>
      </AppPanel>

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
          <AppPanel className="w-full max-w-5xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/60">
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
                    <div className="mt-3 grid gap-2">
                      {selectedTopicResources.map((resource) => (
                        <a
                          key={`${selectedTopic.slug}:${resource.type}:${resource.url}`}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`block rounded-xl border px-4 py-3 text-sm transition ${
                            learnedByTopic[selectedTopic.slug]
                              ? "border-[#2b8b58]/35 bg-[#0d301f] text-[#f3b857] hover:border-[#63e59d]/60 hover:bg-[#103924] hover:text-white"
                              : "border-[#22314a] bg-[#08111d] text-[#f3b857] hover:border-[#f3b857]/50 hover:bg-[#0f1a2b] hover:text-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                                {resource.type}
                              </span>
                              <span className="mt-1 block leading-5">
                                {resource.title}
                              </span>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                                learnedByTopic[selectedTopic.slug]
                                  ? "border-[#2b8b58]/50 bg-[#0a2418] text-[#63e59d]"
                                  : "border-[#2f3d54] bg-[#0d1828] text-slate-400"
                              }`}
                            >
                              <Icon name="check" className="h-3.5 w-3.5" />
                              {learnedByTopic[selectedTopic.slug] ? "Learned" : "To learn"}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
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
          </AppPanel>
        </div>
      ) : null}
    </>
  );
}

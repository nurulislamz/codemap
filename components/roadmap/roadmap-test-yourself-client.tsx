"use client";

import { useState } from "react";
import type { RoadmapDetail } from "@/lib/roadmap/catalog";
import { AppPanel, Icon } from "@/components/shared";

type RoadmapTestYourselfClientProps = {
  initialOpen?: boolean;
  roadmap: RoadmapDetail;
  initialTopicSlug?: string | null;
};

export function RoadmapTestYourselfClient({
  initialOpen = false,
  roadmap,
  initialTopicSlug = null,
}: RoadmapTestYourselfClientProps) {
  const initialTopic = initialTopicSlug
    ? roadmap.topics.find((topic) => topic.slug === initialTopicSlug)
    : null;
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [scope, setScope] = useState<"full" | "topic">(
    initialTopic ? "topic" : "full",
  );
  const [selectedTopicSlug, setSelectedTopicSlug] = useState(
    initialTopic?.slug ?? roadmap.topics[0]?.slug ?? "",
  );
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);

  const selectedTopic = roadmap.topics.find(
    (topic) => topic.slug === selectedTopicSlug,
  );
  const currentSubject =
    scope === "topic" && selectedTopic ? selectedTopic.title : roadmap.title;

  return (
    <AppPanel className="overflow-hidden">
      <button
        type="button"
        className="flex w-full flex-wrap items-center justify-between gap-5 border-b border-[#22314a] bg-[#0b1423] px-6 py-5 text-left transition hover:bg-[#101e33]"
        aria-expanded={isOpen}
        aria-controls="roadmap-test-yourself-section"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[#8d72ff]/65 bg-[#241d55] text-[#a997ff] shadow-[inset_0_0_22px_rgba(141,114,255,0.22)]">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-2xl font-extrabold tracking-tight text-white">
              Test Yourself
            </span>
            <span className="mt-1.5 block text-base text-slate-400">
              Practice the full roadmap or focus on a single topic.
            </span>
          </span>
        </span>
        <span className="inline-flex items-center gap-3 rounded-lg border border-[#22314a] bg-[#0c1829] px-4 py-2 text-sm font-bold text-slate-200">
          {isOpen ? "Hide" : "Open"}
          <Icon
            name="chevron"
            className={`h-4 w-4 transition ${isOpen ? "-rotate-90" : "rotate-90"}`}
          />
        </span>
      </button>

      {isOpen ? (
        <div
          id="roadmap-test-yourself-section"
          className="grid gap-5 bg-[#08111d] p-5 xl:grid-cols-[22rem_minmax(0,1fr)]"
        >
          <div className="rounded-lg border border-[#1a2a3f] bg-[#0b1626] p-5">
            <h2 className="text-xl font-extrabold text-white">Test scope</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Choose whether this session covers the full roadmap or one topic.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-[#22314a] bg-[#08111d] p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-2.5 text-sm font-bold transition ${
                  scope === "full"
                    ? "bg-[#6747ff] text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => {
                  setScope("full");
                  setShowResult(false);
                }}
              >
                Full roadmap
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-2.5 text-sm font-bold transition ${
                  scope === "topic"
                    ? "bg-[#6747ff] text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => {
                  setScope("topic");
                  setShowResult(false);
                }}
              >
                Topic
              </button>
            </div>

            {scope === "topic" ? (
              <label className="mt-5 block">
                <span className="text-sm font-bold text-slate-300">Topic</span>
                <select
                  value={selectedTopicSlug}
                  className="mt-2 w-full rounded-lg border border-[#22314a] bg-[#08111d] px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#7c68ff]"
                  onChange={(event) => {
                    setSelectedTopicSlug(event.target.value);
                    setShowResult(false);
                  }}
                >
                  {roadmap.topics.map((topic) => (
                    <option key={topic.slug} value={topic.slug}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="mt-5 rounded-lg border border-[#22314a] bg-[#0c1829] p-4">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                <Icon name="layers" className="h-4 w-4 text-[#a997ff]" />
                {scope === "topic" ? "Selected topic" : "Selected roadmap"}
              </div>
              <p className="mt-2 text-lg font-extrabold text-white">{currentSubject}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#1a2a3f] bg-[#0b1626]">
            <div className="border-b border-[#22314a] bg-[#0b1423] px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                    Question
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-white">
                    Explain {currentSubject} in your own words.
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#26364d] bg-[#0d1828] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  <Icon name="sparkle" className="h-3.5 w-3.5" />
                  Practice
                </span>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <label className="block">
                <span className="text-sm font-bold text-slate-300">Your answer</span>
                <textarea
                  value={answer}
                  rows={8}
                  className="mt-2 w-full resize-y rounded-lg border border-[#22314a] bg-[#08111d] px-4 py-3 text-base leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-[#7c68ff]"
                  placeholder="Write your answer here..."
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setShowResult(false);
                  }}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={answer.trim().length === 0}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#6747ff] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#6747ff]/25 transition hover:bg-[#765cff] disabled:cursor-not-allowed disabled:bg-[#26364d] disabled:text-slate-500 disabled:shadow-none"
                  onClick={() => setShowResult(true)}
                >
                  Check answer
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#22314a] bg-[#0c1829] px-5 text-sm font-bold text-slate-200 transition hover:border-[#7c68ff] hover:bg-[#101e33] hover:text-white"
                  onClick={() => {
                    setAnswer("");
                    setShowResult(false);
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="rounded-lg border border-[#22314a] bg-[#08111d] p-5">
                {showResult ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[#2b8b58]/50 bg-[#0d301f] p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#63e59d]">
                        <Icon name="check" className="h-4 w-4" />
                        Correct
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        This is the success state for a checked answer.
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#6d3546] bg-[#30111a] p-4">
                      <div className="text-sm font-extrabold text-[#ff8fa8]">
                        Wrong
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        This is the retry state for an answer that needs work.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    Answer feedback will appear here after the checking logic is connected.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppPanel>
  );
}

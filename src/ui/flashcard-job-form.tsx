"use client";

import { useState } from "react";

type GenerateFlashcardsResponse = {
  error?: string;
  job?: {
    id?: string;
  };
};

export function FlashcardJobForm() {
  const [topic, setTopic] = useState("DNS resolution");
  const [notes, setNotes] = useState(
    "Include resolver, root, TLD, authoritative, caching/TTL. Mention common failure modes.",
  );
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "ok"; jobId: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus({ kind: "submitting" });

        try {
          const response = await fetch("/api/flashcards/generate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ topic, notes, source_track: "roadmap", source_table: "seed" }),
          });
          const data = (await response.json()) as GenerateFlashcardsResponse;
          if (!response.ok) {
            throw new Error(data?.error ?? "Request failed");
          }

          setStatus({ kind: "ok", jobId: String(data?.job?.id ?? "") });
        } catch (e) {
          setStatus({
            kind: "error",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }}
    >
      <label className="text-sm font-semibold text-slate-700">
        Topic
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none ring-emerald-700/30 focus:ring-4"
          required
        />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none ring-emerald-700/30 focus:ring-4"
          required
        />
      </label>

      <button
        type="submit"
        disabled={status.kind === "submitting"}
        className="mt-2 inline-flex justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.kind === "submitting" ? "Queueing..." : "Queue AI flashcards"}
      </button>

      {status.kind === "ok" ? (
        <p className="text-sm font-semibold text-emerald-800">
          Queued job: <span className="font-mono">{status.jobId}</span>
        </p>
      ) : null}
      {status.kind === "error" ? (
        <p className="text-sm font-semibold text-rose-800">{status.message}</p>
      ) : null}
    </form>
  );
}

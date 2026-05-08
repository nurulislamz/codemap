import type {
  DailyTrack,
  DailyTrackProblemList,
  LeetcodeTrackData,
} from "@/lib/leetcode/daily-track";
import dailyTrackData from "@/data/leetcode/daily-track.json";
import blind75trackData from "@/data/leetcode/blind75track.json";

export type LeetcodeTrack = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  data: LeetcodeTrackData;
};

export function getLeetcodeTrackProblemIds(track: LeetcodeTrack): string[] {
  return "problemIds" in track.data
    ? [...track.data.problemIds]
    : track.data.days.flatMap((day) => day.tasks.map((task) => task.problemId));
}

const TRACKS: LeetcodeTrack[] = [
  {
    slug: "complete-track",
    title: "Complete Track",
    summary: "A full daily sequence covering the curated LeetCode practice flow.",
    description: "Daily track plan and progress for all days.",
    data: dailyTrackData as DailyTrack,
  },
  {
    slug: "blind75track",
    title: "Blind 75",
    summary: "A focused 75-problem track for high-yield interview prep.",
    description: "Sequence of the Blind 75 problems in order.",
    data: blind75trackData as DailyTrackProblemList,
  },
];

export function getLeetcodeTracks(): LeetcodeTrack[] {
  return TRACKS;
}

export function getAllLeetcodeTrackProblemIds(): string[] {
  return Array.from(
    new Set(getLeetcodeTracks().flatMap((track) => getLeetcodeTrackProblemIds(track))),
  );
}

export function getLeetcodeTrackBySlug(slug: string): LeetcodeTrack | null {
  return TRACKS.find((track) => track.slug === slug) ?? null;
}

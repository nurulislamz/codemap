type Status = "not_started" | "in_progress" | "completed" | "skipped" | "failed";
type Confidence = "low" | "medium" | "high";
type Track = "leetcode" | "roadmap" | "system_design" | "flashcards";

export interface DailyPlanInput {
  date: string;
  leetcode: Array<{
    id: string;
    title: string;
    status: Status;
    confidence: Confidence;
    pattern: string;
  }>;
  roadmap: Array<{
    id: string;
    title: string;
    status: Status;
    order: number;
  }>;
  systemDesign: Array<{
    id: string;
    title: string;
    status: Status;
    kind: "reading" | "practice";
  }>;
  flashcards: Array<{
    id: string;
    title: string;
    nextReviewAt: string;
  }>;
}

export interface DailyPlanOutput {
  date: string;
  items: DailyPlanItem[];
}

export interface DailyPlanItem {
  track: Track;
  targetId: string;
  title: string;
  scheduledOrder: number;
}

interface CandidatePlanItem {
  track: Track;
  targetId: string;
  title: string;
}

export function buildDailyPlan(input: DailyPlanInput): DailyPlanOutput {
  const leetcode = input.leetcode
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status !== "completed")
    .sort((a, b) => scoreLeetcode(b.item) - scoreLeetcode(a.item) || a.index - b.index)[0]
    ?.item;

  const roadmap = input.roadmap
    .filter((item) => item.status !== "completed")
    .sort((a, b) => a.order - b.order)[0];

  const systemDesign = input.systemDesign.find((item) => item.status !== "completed");

  const flashcard = input.flashcards
    .filter((item) => dateKey(item.nextReviewAt) <= input.date)
    .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt))[0];

  const items: Array<CandidatePlanItem | undefined> = [
    leetcode && {
      track: "leetcode",
      targetId: leetcode.id,
      title: leetcode.title,
    },
    roadmap && {
      track: "roadmap",
      targetId: roadmap.id,
      title: roadmap.title,
    },
    systemDesign && {
      track: "system_design",
      targetId: systemDesign.id,
      title: systemDesign.title,
    },
    flashcard && {
      track: "flashcards",
      targetId: flashcard.id,
      title: flashcard.title,
    },
  ];

  return {
    date: input.date,
    items: items
      .filter((item): item is CandidatePlanItem => Boolean(item))
      .map((item, scheduledOrder) => ({ ...item, scheduledOrder })),
  };
}

function scoreLeetcode(item: { status: Status; confidence: Confidence }): number {
  const statusScore = item.status === "failed" ? 10 : item.status === "in_progress" ? 7 : 3;
  const confidenceScore =
    item.confidence === "low" ? 5 : item.confidence === "medium" ? 2 : 0;

  return statusScore + confidenceScore;
}

function dateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

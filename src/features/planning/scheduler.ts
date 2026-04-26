type Status = "not_started" | "in_progress" | "completed" | "skipped" | "failed";
type Confidence = "low" | "medium" | "high";
type Track = "leetcode" | "roadmap" | "system_design" | "flashcards";

export interface DailyPlanInput {
  date: string;
  timezone?: string;
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
  assertPlanDate(input.date);
  const timezone = input.timezone ?? "UTC";

  const leetcode = input.leetcode
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status !== "completed")
    .sort((a, b) => scoreLeetcode(b.item) - scoreLeetcode(a.item) || a.index - b.index)[0]
    ?.item;

  const roadmap = input.roadmap
    .filter((item) => item.status !== "completed")
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))[0];

  const systemDesign = input.systemDesign.find((item) => item.status !== "completed");

  const flashcard = input.flashcards
    .filter((item) => localDateKey(item.nextReviewAt, timezone, item.id) <= input.date)
    .sort(
      (a, b) =>
        a.nextReviewAt.localeCompare(b.nextReviewAt) || a.id.localeCompare(b.id),
    )[0];

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

function assertPlanDate(value: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid plan date: ${value}`);
  }

  const [, year, month, day] = match;
  const date = new Date(`${value}T00:00:00Z`);
  const isValid =
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day);

  if (!isValid) {
    throw new Error(`Invalid plan date: ${value}`);
  }
}

function localDateKey(value: string, timezone: string, flashcardId: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid flashcard nextReviewAt for ${flashcardId}: ${value}`);
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = partValue(parts, "year");
  const month = partValue(parts, "month");
  const day = partValue(parts, "day");

  return `${year}-${month}-${day}`;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to format local date part: ${type}`);
  }

  return value;
}

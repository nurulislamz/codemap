type Status = "not_started" | "in_progress" | "completed" | "skipped" | "failed";
type Confidence = "low" | "medium" | "high";
type Track = "leetcode" | "roadmap" | "system_design";

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

  let leetcodeBest:
    | { item: DailyPlanInput["leetcode"][number]; index: number; score: number }
    | undefined;
  input.leetcode.forEach((item, index) => {
    if (item.status === "completed") return;
    const score = scoreLeetcode(item);
    if (
      !leetcodeBest ||
      score > leetcodeBest.score ||
      (score === leetcodeBest.score && index < leetcodeBest.index)
    ) {
      leetcodeBest = { item, index, score };
    }
  });
  const leetcode = leetcodeBest?.item;

  let roadmap: DailyPlanInput["roadmap"][number] | undefined;
  for (const item of input.roadmap) {
    if (item.status === "completed") continue;
    if (
      !roadmap ||
      item.order < roadmap.order ||
      (item.order === roadmap.order && item.id.localeCompare(roadmap.id) < 0)
    ) {
      roadmap = item;
    }
  }

  const systemDesign = input.systemDesign.find((item) => item.status !== "completed");

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

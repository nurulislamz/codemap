import "server-only";

import { getSeedContent } from "./seed-content";

export interface EmailPlanItem {
  track: "leetcode" | "roadmap" | "system_design" | "flashcards";
  title: string;
  href: string;
  meta?:
    | { kind: "leetcode"; sourceUrl: string }
    | { kind: "roadmap"; topicSlug: string; resourceUrl?: string }
    | { kind: "system_design"; promptSlug: string }
    | { kind: "flashcards" };
}

function dayOfYearUtc(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86_400_000);
}

function pickIndex(length: number, date: Date): number {
  if (length <= 0) return 0;
  return dayOfYearUtc(date) % length;
}

export async function buildDailyPlanItems(date = new Date()): Promise<EmailPlanItem[]> {
  const seed = await getSeedContent();

  const roadmapTopic = seed.roadmap.topics[pickIndex(seed.roadmap.topics.length, date)];
  const roadmapResource = seed.roadmap.resources.find(
    (resource) => resource.topicSlug === roadmapTopic?.slug,
  );

  const systemPrompt =
    seed.systemDesign.prompts[pickIndex(seed.systemDesign.prompts.length, date)];

  const items: EmailPlanItem[] = [];

  if (roadmapTopic) {
    items.push({
      track: "roadmap",
      title: roadmapTopic.title,
      href: roadmapResource?.url ?? "/roadmap",
      meta: {
        kind: "roadmap",
        topicSlug: roadmapTopic.slug,
        resourceUrl: roadmapResource?.url,
      },
    });
  }

  if (systemPrompt) {
    items.push({
      track: "system_design",
      title: systemPrompt.title,
      href: `/system-design#${systemPrompt.slug}`,
      meta: { kind: "system_design", promptSlug: systemPrompt.slug },
    });
  }

  items.push({
    track: "flashcards",
    title: "Review due flashcards",
    href: "/flashcards",
    meta: { kind: "flashcards" },
  });

  return items;
}

export function toDailyEmailHtml(input: { appBaseUrl: string; items: EmailPlanItem[] }) {
  const rows = input.items
    .map((item) => {
      const url = new URL(item.href, input.appBaseUrl).toString();
      return `<li><strong>${item.track}</strong>: <a href="${url}">${item.title}</a></li>`;
    })
    .join("");

  return `<h1>Today's backend interview plan</h1><ul>${rows}</ul>`;
}

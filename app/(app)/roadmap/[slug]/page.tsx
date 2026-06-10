import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { RoadmapConceptsModal } from "@/components/roadmap/roadmap-concepts-modal";
import { saveRoadmapProgress } from "@/lib/roadmap/actions";
import { getRoadmapBySlug } from "@/lib/roadmap/catalog";
import { getRoadmapLearnedMap } from "@/lib/roadmap/progress";
import {
  Icon,
  SectionHero,
  StatCard,
  primaryActionClass,
} from "@/components/shared";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const roadmap = getRoadmapBySlug(slug);

  if (!roadmap) return {};

  return {
    title: roadmap.title,
    description: roadmap.summary,
  };
}

export default async function RoadmapSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ topic?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const roadmap = getRoadmapBySlug(slug);
  if (!roadmap || roadmap.topics.length === 0) {
    notFound();
  }

  const resourceCount = roadmap.topics.reduce(
    (total, topic) => total + topic.resourceCount,
    0,
  );
  let learnedMap: Record<string, boolean> = {};

  try {
    const userId = await getRequestUserId();
    learnedMap = await getRoadmapLearnedMap(userId, roadmap.slug);
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) {
      throw error;
    }
  }

  const learnedCount = Object.values(learnedMap).filter(Boolean).length;

  const completionRate = roadmap.topicCount === 0
    ? 0
    : Math.round((learnedCount / roadmap.topicCount) * 100);

  return (
    <div className="mx-[calc(50%-50vw)] -mt-3 px-8 pb-4">
      <main className="min-w-0 space-y-5">
        <SectionHero
          icon={<Icon name="tree" className="h-9 w-9" />}
          title={roadmap.title}
          description={roadmap.summary}
        >
          <a
            href={roadmap.url}
            target="_blank"
            rel="noreferrer"
            className={primaryActionClass}
          >
            Open on roadmap.sh
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </a>
        </SectionHero>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Concepts"
            value={roadmap.topicCount}
            note="Topics in roadmap"
            tone="primary"
            icon={<Icon name="layers" className="h-7 w-7" />}
          />
          <StatCard
            label="Resources"
            value={resourceCount}
            note="Articles and videos"
            tone="info"
            icon={<Icon name="sparkle" className="h-7 w-7" />}
          />
          <StatCard
            label="Learned"
            value={learnedCount}
            note={`${completionRate}% complete`}
            tone="success"
            icon={<Icon name="check" className="h-7 w-7" />}
          />
          <StatCard
            label="Progress"
            value={`${learnedCount}/${roadmap.topicCount}`}
            note="Completed concepts"
            tone="warning"
            icon={<Icon name="calendar" className="h-7 w-7" />}
          />
        </div>

        <RoadmapConceptsModal
          roadmap={roadmap}
          initialSelectedTopicSlug={query?.topic ?? null}
          initialLearned={learnedMap}
          saveProgressAction={saveRoadmapProgress}
        />
      </main>
    </div>
  );
}

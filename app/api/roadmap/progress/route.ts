import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getRoadmapTopicProgress } from "@/lib/roadmap/progress";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const roadmapSlug = searchParams.get("roadmap");
  const topicSlug = searchParams.get("topic");

  if (!roadmapSlug || !topicSlug) {
    return NextResponse.json(
      { progress: null, error: "Missing roadmap or topic" },
      { status: 400 },
    );
  }

  try {
    const userId = await getRequestUserId();
    const progress = await getRoadmapTopicProgress(
      userId,
      roadmapSlug,
      topicSlug,
    );

    return NextResponse.json({ progress });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ progress: null });
    }

    throw error;
  }
}

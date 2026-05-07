import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getRoadmapLearnedMap } from "@/lib/roadmap/progress";

export async function GET(request: Request) {
  const roadmapSlug = new URL(request.url).searchParams.get("roadmap");

  if (!roadmapSlug) {
    return NextResponse.json(
      { learned: {}, error: "Missing roadmap" },
      { status: 400 },
    );
  }

  try {
    const userId = await getRequestUserId();
    const learned = await getRoadmapLearnedMap(userId, roadmapSlug);
    return NextResponse.json({ learned });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ learned: {} });
    }

    throw error;
  }
}

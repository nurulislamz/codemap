import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getLeetcodeAttemptRowsForUser } from "@/lib/leetcode/attempts";

export async function GET(request: Request) {
  try {
    const problemId = new URL(request.url).searchParams.get("problemId");

    if (!problemId) {
      return NextResponse.json(
        { attempts: [], error: "Missing problemId" },
        { status: 400 },
      );
    }

    const userId = await getRequestUserId();
    const attempts = await getLeetcodeAttemptRowsForUser(userId, problemId);

    return NextResponse.json({ attempts });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ attempts: [] });
    }

    throw error;
  }
}

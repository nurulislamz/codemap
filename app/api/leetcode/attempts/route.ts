import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import {
  getLeetcodeAttemptRowsForUser,
  getSortedLeetcodeAttemptEventsForUser,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";

export async function GET(request: Request) {
  try {
    const problemId = new URL(request.url).searchParams.get("problemId");
    const userId = await getRequestUserId();

    // No problemId => return every attempt for the user in a single request,
    // avoiding an N+1 fan-out of one request per problem from the client.
    if (!problemId) {
      const events = await getSortedLeetcodeAttemptEventsForUser(userId);
      return NextResponse.json({ attempts: toLeetcodeAttemptRows(events, new Map()) });
    }

    const attempts = await getLeetcodeAttemptRowsForUser(userId, problemId);

    return NextResponse.json({ attempts });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { attempts: [], error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.error("Failed to load leetcode attempts", error);
    return NextResponse.json(
      { attempts: [], error: "Internal error" },
      { status: 500 },
    );
  }
}

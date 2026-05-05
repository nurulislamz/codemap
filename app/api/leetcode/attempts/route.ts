import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getLeetcodeAttemptRowsForUser } from "@/lib/leetcode/attempts";

export async function GET() {
  try {
    const userId = await getRequestUserId();
    const attempts = await getLeetcodeAttemptRowsForUser(userId);

    return NextResponse.json({ attempts });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ attempts: [] });
    }

    throw error;
  }
}

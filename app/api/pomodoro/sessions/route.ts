import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getRecentPomodoroSessions } from "@/lib/pomodoro/db-server";

export async function GET() {
  try {
    const userId = await getRequestUserId();
    const sessions = await getRecentPomodoroSessions(userId);

    return NextResponse.json({ sessions });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { sessions: [], error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.error("Failed to load pomodoro sessions", error);
    return NextResponse.json(
      { sessions: [], error: "Internal error" },
      { status: 500 },
    );
  }
}

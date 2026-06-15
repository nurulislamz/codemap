import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getPomodoroTasks } from "@/lib/pomodoro/task-db-server";

export async function GET() {
  try {
    const userId = await getRequestUserId();
    const tasks = await getPomodoroTasks(userId);

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { tasks: [], error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.error("Failed to load pomodoro tasks", error);
    return NextResponse.json(
      { tasks: [], error: "Internal error" },
      { status: 500 },
    );
  }
}

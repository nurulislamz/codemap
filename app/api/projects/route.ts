import { NextResponse } from "next/server";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { listProjects } from "@/lib/projects/db-server";

export async function GET() {
  try {
    const userId = await getRequestUserId();
    const projects = await listProjects(userId);

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { projects: [], error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.error("Failed to load projects", error);
    return NextResponse.json(
      { projects: [], error: "Internal error" },
      { status: 500 },
    );
  }
}

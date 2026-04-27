import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { createEnv, isOfflineMode, requireEnv } from "@/server/env";
import type { Database } from "@/server/supabase/types";

const publicPaths = new Set<string>(["/login", "/auth/callback"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Local/dev convenience: allow running the UI without Supabase setup.
  if (isOfflineMode(process.env)) {
    return NextResponse.next();
  }

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const env = createEnv(process.env);
  let response = NextResponse.next();

  const supabase = createServerClient<Database>(
    requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname !== "/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

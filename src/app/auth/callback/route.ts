import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { createEnv, hasSupabasePublicEnv, requireEnv } from "@/server/env";
import type { Database } from "@/server/supabase/types";

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv(process.env)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const env = createEnv(process.env);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const redirectTo = new URL("/dashboard", request.url);
  const next = requestUrl.searchParams.get("next");
  if (next && next.startsWith("/")) {
    redirectTo.pathname = next;
  }

  const response = NextResponse.redirect(redirectTo);

  if (!code) {
    return response;
  }

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

  await supabase.auth.exchangeCodeForSession(code);

  return response;
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getEnv } from "../env";
import type { Database } from "./types";

export async function createSupabaseServerClient() {
  const appEnv = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    appEnv.NEXT_PUBLIC_SUPABASE_URL,
    appEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot mutate cookies; middleware refresh handles it.
          }
        },
      },
    },
  );
}

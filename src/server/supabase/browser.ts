import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

export function createSupabaseBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase public env vars");
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

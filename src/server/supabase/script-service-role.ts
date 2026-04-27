import { createClient } from "@supabase/supabase-js";

import { getEnv, requireEnv } from "../env";
import type { Database } from "./types";

export function createSupabaseScriptServiceRoleClient() {
  const appEnv = getEnv();

  return createClient<Database>(
    requireEnv(appEnv, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(appEnv, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

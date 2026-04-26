import { createClient } from "@supabase/supabase-js";

import { getEnv } from "../env";
import type { Database } from "./types";

export function createSupabaseScriptServiceRoleClient() {
  const appEnv = getEnv();

  return createClient<Database>(
    appEnv.NEXT_PUBLIC_SUPABASE_URL,
    appEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

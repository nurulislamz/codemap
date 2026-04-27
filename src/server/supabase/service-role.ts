import "server-only";

import { createSupabaseScriptServiceRoleClient } from "./script-service-role";

export function createSupabaseServiceRoleClient() {
  return createSupabaseScriptServiceRoleClient();
}

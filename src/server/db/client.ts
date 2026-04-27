import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { getEnv } from "@/server/env";
import * as schema from "./schema";
import { ensureLocalSchema } from "./ensure-schema";

let dbSingleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!dbSingleton) {
    const env = getEnv();
    const url = env.DATABASE_URL ?? "file:./dev.db";
    const client = createClient({ url });
    await ensureLocalSchema(client);
    dbSingleton = drizzle(client, { schema });
  }

  return dbSingleton;
}

import { NextResponse } from "next/server";

import { assertCronRequest } from "@/lib/cron/auth";
import { getEnv, requireEnv } from "@/lib/env";
import { buildDailyPlanItems } from "@/lib/data/daily-plan";
import {
  filterEmailPlanItemsForPreferences,
  getUtcDateString,
  listDailyEmailEnabledPreferences,
  replaceDailyPlanItemsForPlan,
  upsertDailyPlanForUser,
  utcMidnightFromDateString,
} from "@/lib/data/daily-plan-persistence";

export async function GET(request: Request) {
  const env = getEnv();

  if (!assertCronRequest(request, requireEnv(env, "CRON_SECRET"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planDate = getUtcDateString();
  const seedDate = utcMidnightFromDateString(planDate);

  const prefs = await listDailyEmailEnabledPreferences();

  let usersProcessed = 0;
  let plansUpserted = 0;
  let planItemsUpserted = 0;
  const errors: Array<{ user_id: string; error: string }> = [];

  for (const pref of prefs) {
    usersProcessed += 1;
    try {
      const allItems = await buildDailyPlanItems(seedDate);
      const items = filterEmailPlanItemsForPreferences(allItems, pref);

      const plan = await upsertDailyPlanForUser({
        userId: pref.user_id,
        planDate,
      });
      plansUpserted += 1;

      const result = await replaceDailyPlanItemsForPlan({
        planId: plan.id,
        items,
        stableKeyPrefix: `${pref.user_id}:${planDate}`,
      });
      planItemsUpserted += result.upserted;
    } catch (e) {
      console.error(`Daily plan generation failed for user ${pref.user_id}`, e);
      errors.push({
        user_id: pref.user_id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Non-200 lets the cron scheduler detect and alert on partial failures.
  return NextResponse.json(
    {
      ok: errors.length === 0,
      planDate,
      usersProcessed,
      plansUpserted,
      planItemsUpserted,
      errors,
    },
    { status: errors.length === 0 ? 200 : 500 },
  );
}

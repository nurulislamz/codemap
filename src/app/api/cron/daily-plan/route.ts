import { NextResponse } from "next/server";

import { assertCronRequest } from "@/server/cron/auth";
import { getEnv, requireEnv } from "@/server/env";
import { buildDailyPlanItems } from "@/server/data/daily-plan";
import {
  filterEmailPlanItemsForPreferences,
  getUtcDateString,
  listDailyEmailEnabledPreferences,
  replaceDailyPlanItemsForPlan,
  upsertDailyPlanForUser,
  utcMidnightFromDateString,
} from "@/server/data/daily-plan-persistence";

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
      errors.push({
        user_id: pref.user_id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    planDate,
    usersProcessed,
    plansUpserted,
    planItemsUpserted,
    errors,
  });
}

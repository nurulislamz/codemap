import { NextResponse } from "next/server";

import { assertCronRequest } from "@/backend/cron/auth";
import { buildDailyPlanItems, toDailyEmailHtml } from "@/backend/data/daily-plan";
import { sendDailyEmail } from "@/backend/email/resend";
import { getEnv, requireEnv } from "@/backend/env";
import {
  createEmailNotificationQueued,
  filterEmailPlanItemsForPreferences,
  getDailyPlanEmailItemsForUser,
  getUtcDateString,
  listDailyEmailEnabledPreferences,
  markEmailNotificationFailed,
  markEmailNotificationSent,
  replaceDailyPlanItemsForPlan,
  upsertDailyPlanForUser,
  utcMidnightFromDateString,
} from "@/backend/data/daily-plan-persistence";

function extractProviderMessageId(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const root = result as Record<string, unknown>;

  const data = root["data"];
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    if (typeof dataObj["id"] === "string") return dataObj["id"];
  }

  if (typeof root["id"] === "string") return root["id"];
  return null;
}

export async function GET(request: Request) {
  const env = getEnv();

  if (!assertCronRequest(request, requireEnv(env, "CRON_SECRET"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return NextResponse.json({
      ok: true,
      skipped: "Missing RESEND_API_KEY or EMAIL_FROM",
    });
  }

  const planDate = getUtcDateString();
  const seedDate = utcMidnightFromDateString(planDate);

  const prefs = await listDailyEmailEnabledPreferences();

  let usersProcessed = 0;
  let queued = 0;
  let sent = 0;
  let failed = 0;
  const errors: Array<{ user_id: string; error: string }> = [];

  for (const pref of prefs) {
    usersProcessed += 1;

    let notificationId: string | null = null;
    try {
      let items = await getDailyPlanEmailItemsForUser({
        userId: pref.user_id,
        planDate,
      });

      // If today's plan isn't present yet, generate and persist it now.
      if (items.length === 0) {
        const allItems = await buildDailyPlanItems(seedDate);
        const filtered = filterEmailPlanItemsForPreferences(allItems, pref);

        const plan = await upsertDailyPlanForUser({
          userId: pref.user_id,
          planDate,
        });

        await replaceDailyPlanItemsForPlan({
          planId: plan.id,
          items: filtered,
          stableKeyPrefix: `${pref.user_id}:${planDate}`,
        });

        items = filtered;
      }

      if (items.length === 0) {
        // User has notifications enabled but all tracks are disabled; nothing to send.
        continue;
      }

      const html = toDailyEmailHtml({ appBaseUrl: env.APP_BASE_URL, items });
      const subject = "Today's backend interview plan";
      const scheduledForIso = new Date().toISOString();

      try {
        const queuedRow = await createEmailNotificationQueued({
          userId: pref.user_id,
          scheduledForIso,
          subject,
          body: html,
          notificationType: "daily_plan",
        });
        if (queuedRow?.id) {
          notificationId = queuedRow.id;
          queued += 1;
        }
      } catch {
        // Best-effort: do not fail the email send if notification logging fails.
      }

      const result = await sendDailyEmail({
        to: pref.email,
        subject,
        html,
      });

      sent += 1;

      if (notificationId) {
        try {
          const providerMessageId = extractProviderMessageId(result);
          await markEmailNotificationSent({
            id: notificationId,
            sentAtIso: new Date().toISOString(),
            providerMessageId,
          });
        } catch {
          // Best-effort
        }
      }
    } catch (e) {
      failed += 1;
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ user_id: pref.user_id, error: message });

      if (notificationId) {
        try {
          await markEmailNotificationFailed({
            id: notificationId,
            errorMessage: message,
          });
        } catch {
          // Best-effort
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    planDate,
    usersProcessed,
    queued,
    sent,
    failed,
    errors,
  });
}

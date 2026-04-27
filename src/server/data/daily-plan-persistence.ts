import "server-only";

import { asc, eq } from "drizzle-orm";

import type { EmailPlanItem } from "./daily-plan";
import { getDb } from "@/server/db/client";
import {
  dailyPlanItems,
  dailyPlans,
  emailNotifications,
  notificationPreferences,
} from "@/server/db/schema";
import { stableUuidFromString } from "@/server/ids/stable-uuid";
import { LOCAL_USER_ID } from "@/server/db/local-user";

export type NotificationPreference = {
  user_id: string;
  email: string;
  leetcode_enabled: boolean;
  roadmap_enabled: boolean;
  system_design_enabled: boolean;
  flashcards_enabled: boolean;
};

export function getUtcDateString(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function utcMidnightFromDateString(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

export function filterEmailPlanItemsForPreferences(
  items: EmailPlanItem[],
  prefs: Pick<
    NotificationPreference,
    "leetcode_enabled" | "roadmap_enabled" | "system_design_enabled" | "flashcards_enabled"
  >,
): EmailPlanItem[] {
  return items.filter((item) => {
    switch (item.track) {
      case "leetcode":
        return prefs.leetcode_enabled;
      case "roadmap":
        return prefs.roadmap_enabled;
      case "system_design":
        return prefs.system_design_enabled;
      case "flashcards":
        return prefs.flashcards_enabled;
      default: {
        const _exhaustive: never = item.track;
        return _exhaustive;
      }
    }
  });
}

export async function listDailyEmailEnabledPreferences(): Promise<NotificationPreference[]> {
  const db = await getDb();
  let rows = await db.select().from(notificationPreferences);

  if (rows.length === 0) {
    // Local default.
    await db
      .insert(notificationPreferences)
      .values({ userId: LOCAL_USER_ID, email: "local@localhost" })
      .onConflictDoNothing();
    rows = await db.select().from(notificationPreferences);
  }

  return rows
    .filter(
      (row) =>
        row.leetcodeEnabled || row.roadmapEnabled || row.systemDesignEnabled || row.flashcardsEnabled,
    )
    .map((row) => ({
      user_id: row.userId,
      email: row.email,
      leetcode_enabled: Boolean(row.leetcodeEnabled),
      roadmap_enabled: Boolean(row.roadmapEnabled),
      system_design_enabled: Boolean(row.systemDesignEnabled),
      flashcards_enabled: Boolean(row.flashcardsEnabled),
    }));
}

export async function upsertDailyPlanForUser(input: { userId: string; planDate: string }) {
  const db = await getDb();
  const id = stableUuidFromString(`${input.userId}:plan:${input.planDate}`);
  const nowIso = new Date().toISOString();

  await db
    .insert(dailyPlans)
    .values({
      id,
      userId: input.userId,
      planDate: input.planDate,
      generatedAt: nowIso,
      status: "not_started",
    })
    .onConflictDoUpdate({
      target: dailyPlans.id,
      set: { generatedAt: nowIso },
    });

  return { id };
}

export async function replaceDailyPlanItemsForPlan(input: {
  planId: string;
  items: EmailPlanItem[];
  stableKeyPrefix: string;
}) {
  const db = await getDb();

  await db.delete(dailyPlanItems).where(eq(dailyPlanItems.planId, input.planId));

  const rows = input.items.map((item, idx) => ({
    id: stableUuidFromString(`${input.stableKeyPrefix}:${idx}:${item.track}:${item.href}`),
    planId: input.planId,
    track: item.track,
    title: item.title,
    href: item.href,
    status: "not_started",
    scheduledOrder: idx,
  }));

  if (rows.length) {
    await db.insert(dailyPlanItems).values(rows);
  }

  return { upserted: rows.length };
}

export async function getDailyPlanEmailItemsForUser(input: {
  userId: string;
  planDate: string;
}): Promise<EmailPlanItem[]> {
  const db = await getDb();
  const planId = stableUuidFromString(`${input.userId}:plan:${input.planDate}`);

  const rows = await db
    .select()
    .from(dailyPlanItems)
    .where(eq(dailyPlanItems.planId, planId))
    .orderBy(asc(dailyPlanItems.scheduledOrder));

  return rows.map((row) => ({
    track: row.track as EmailPlanItem["track"],
    title: row.title,
    href: row.href,
  }));
}

export async function createEmailNotificationQueued(input: {
  userId: string;
  scheduledForIso: string;
  subject: string;
  body: string;
  notificationType: string;
}): Promise<{ id: string } | null> {
  const db = await getDb();
  const id = stableUuidFromString(`${input.userId}:email:${input.scheduledForIso}:${input.subject}`);

  await db
    .insert(emailNotifications)
    .values({
      id,
      userId: input.userId,
      scheduledFor: input.scheduledForIso,
      subject: input.subject,
      body: input.body,
      notificationType: input.notificationType,
      status: "queued",
    })
    .onConflictDoNothing();

  return { id };
}

export async function markEmailNotificationSent(input: {
  id: string;
  sentAtIso: string;
  providerMessageId?: string | null;
}) {
  const db = await getDb();
  await db
    .update(emailNotifications)
    .set({
      status: "sent",
      sentAt: input.sentAtIso,
      providerMessageId: input.providerMessageId ?? null,
    })
    .where(eq(emailNotifications.id, input.id));
}

export async function markEmailNotificationFailed(input: { id: string; errorMessage: string }) {
  const db = await getDb();
  await db
    .update(emailNotifications)
    .set({
      status: "failed",
      errorMessage: input.errorMessage,
      attempts: 1,
    })
    .where(eq(emailNotifications.id, input.id));
}

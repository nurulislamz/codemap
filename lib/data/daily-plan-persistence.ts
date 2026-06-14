import "server-only";

import { z } from "zod";
import type { EmailPlanItem } from "./daily-plan";
import { stableUuidFromString } from "@/lib/ids/stable-uuid";
import { getFirestoreDb } from "@/lib/firebase/firestore";

export type NotificationPreference = {
  user_id: string;
  email: string;
  leetcode_enabled: boolean;
  roadmap_enabled: boolean;
  system_design_enabled: boolean;
};

const notificationPreferenceSchema = z.object({
  user_id: z.string().min(1),
  email: z.string().min(1),
  leetcode_enabled: z.boolean(),
  roadmap_enabled: z.boolean(),
  system_design_enabled: z.boolean(),
});

const emailPlanItemRowSchema = z.object({
  plan_id: z.string().min(1),
  track: z.enum(["leetcode", "roadmap", "system_design"]),
  title: z.string(),
  href: z.string(),
  scheduled_order: z.number(),
  meta: z
    .union([
      z.object({ kind: z.literal("leetcode"), sourceUrl: z.string() }),
      z.object({
        kind: z.literal("roadmap"),
        topicSlug: z.string(),
        resourceUrl: z.string().optional(),
      }),
      z.object({ kind: z.literal("system_design"), promptSlug: z.string() }),
    ])
    .nullish(),
});

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
    "leetcode_enabled" | "roadmap_enabled" | "system_design_enabled"
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
      default: {
        const _exhaustive: never = item.track;
        return _exhaustive;
      }
    }
  });
}

export async function listDailyEmailEnabledPreferences(): Promise<NotificationPreference[]> {
  const snapshot = await getFirestoreDb()
    .collection("notification_preferences")
    .get();

  return snapshot.docs
    .map((doc) => notificationPreferenceSchema.safeParse(doc.data()))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data)
    .filter(
      (pref) =>
        pref.leetcode_enabled ||
        pref.roadmap_enabled ||
        pref.system_design_enabled,
    );
}

export async function upsertDailyPlanForUser(input: {
  userId: string;
  planDate: string;
}) {
  const id = dailyPlanId(input.userId, input.planDate);
  const planRef = getFirestoreDb().collection("daily_plans").doc(id);
  const existing = await planRef.get();

  if (existing.exists) {
    await planRef.set(
      { generated_at: new Date().toISOString() },
      { merge: true },
    );
  } else {
    await planRef.set({
      id,
      user_id: input.userId,
      plan_date: input.planDate,
      generated_at: new Date().toISOString(),
      status: "not_started",
    });
  }

  return { id };
}

export async function replaceDailyPlanItemsForPlan(input: {
  planId: string;
  items: EmailPlanItem[];
  stableKeyPrefix: string;
}) {
  const db = getFirestoreDb();
  const itemsCollection = db.collection("daily_plan_items");
  const existing = await itemsCollection
    .where("plan_id", "==", input.planId)
    .get();

  const batch = db.batch();
  existing.docs.forEach((doc) => batch.delete(doc.ref));

  input.items.forEach((item, idx) => {
    const id = stableUuidFromString(
      `${input.stableKeyPrefix}:item:${idx}:${item.track}`,
    );
    batch.set(itemsCollection.doc(id), {
      id,
      plan_id: input.planId,
      track: item.track,
      title: item.title,
      href: item.href,
      status: "not_started",
      scheduled_order: idx,
      meta: item.meta ?? null,
    });
  });

  await batch.commit();
  return { upserted: input.items.length };
}

export async function getDailyPlanEmailItemsForUser(input: {
  userId: string;
  planDate: string;
}): Promise<EmailPlanItem[]> {
  const planId = dailyPlanId(input.userId, input.planDate);
  const snapshot = await getFirestoreDb()
    .collection("daily_plan_items")
    .where("plan_id", "==", planId)
    .get();

  return snapshot.docs
    .map((doc) => emailPlanItemRowSchema.safeParse(doc.data()))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data)
    .sort((a, b) => a.scheduled_order - b.scheduled_order)
    .map((row) => ({
      track: row.track,
      title: row.title,
      href: row.href,
      ...(row.meta ? { meta: row.meta } : {}),
    }));
}

export async function createEmailNotificationQueued(input: {
  userId: string;
  scheduledForIso: string;
  subject: string;
  body: string;
  notificationType: string;
}): Promise<{ id: string } | null> {
  const id = stableUuidFromString(
    `${input.userId}:email:${input.scheduledForIso}:${input.subject}`,
  );

  await getFirestoreDb().collection("email_notifications").doc(id).set({
    id,
    user_id: input.userId,
    notification_type: input.notificationType,
    subject: input.subject,
    body: input.body,
    status: "queued",
    scheduled_for: input.scheduledForIso,
    sent_at: null,
    provider_message_id: null,
    error_message: null,
    attempts: 0,
  });

  return { id };
}

export async function markEmailNotificationSent(input: {
  id: string;
  sentAtIso: string;
  providerMessageId?: string | null;
}) {
  await getFirestoreDb().collection("email_notifications").doc(input.id).set(
    {
      status: "sent",
      sent_at: input.sentAtIso,
      provider_message_id: input.providerMessageId ?? null,
    },
    { merge: true },
  );
}

export async function markEmailNotificationFailed(input: {
  id: string;
  errorMessage: string;
}) {
  await getFirestoreDb().collection("email_notifications").doc(input.id).set(
    {
      status: "failed",
      error_message: input.errorMessage,
    },
    { merge: true },
  );
}

function dailyPlanId(userId: string, planDate: string) {
  return stableUuidFromString(`${userId}:plan:${planDate}`);
}

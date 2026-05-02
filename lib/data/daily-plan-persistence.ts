import "server-only";

import type { EmailPlanItem } from "./daily-plan";
import { stableUuidFromString } from "@/lib/ids/stable-uuid";
import { LOCAL_USER_ID } from "@/lib/db/local-user";

export type NotificationPreference = {
  user_id: string;
  email: string;
  leetcode_enabled: boolean;
  roadmap_enabled: boolean;
  system_design_enabled: boolean;
  flashcards_enabled: boolean;
};

const planItemsByPlanId = new Map<string, EmailPlanItem[]>();

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
  return [
    {
      user_id: LOCAL_USER_ID,
      email: "local@localhost",
      leetcode_enabled: true,
      roadmap_enabled: true,
      system_design_enabled: true,
      flashcards_enabled: true,
    },
  ];
}

export async function upsertDailyPlanForUser(input: { userId: string; planDate: string }) {
  return {
    id: stableUuidFromString(`${input.userId}:plan:${input.planDate}`),
  };
}

export async function replaceDailyPlanItemsForPlan(input: {
  planId: string;
  items: EmailPlanItem[];
  stableKeyPrefix: string;
}) {
  void input.stableKeyPrefix;
  planItemsByPlanId.set(input.planId, input.items);
  return { upserted: input.items.length };
}

export async function getDailyPlanEmailItemsForUser(input: {
  userId: string;
  planDate: string;
}): Promise<EmailPlanItem[]> {
  const planId = stableUuidFromString(`${input.userId}:plan:${input.planDate}`);
  return planItemsByPlanId.get(planId) ?? [];
}

export async function createEmailNotificationQueued(input: {
  userId: string;
  scheduledForIso: string;
  subject: string;
  body: string;
  notificationType: string;
}): Promise<{ id: string } | null> {
  void input.body;
  void input.notificationType;
  return {
    id: stableUuidFromString(`${input.userId}:email:${input.scheduledForIso}:${input.subject}`),
  };
}

export async function markEmailNotificationSent(input: {
  id: string;
  sentAtIso: string;
  providerMessageId?: string | null;
}) {
  void input;
}

export async function markEmailNotificationFailed(input: { id: string; errorMessage: string }) {
  void input;
}

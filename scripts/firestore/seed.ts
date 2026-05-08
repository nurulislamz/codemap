#!/usr/bin/env node
import { FieldValue } from "firebase-admin/firestore";

import { getFirestoreDb } from "../../src/backend/firebase/firestore";
import { LOCAL_USER_ID } from "../../src/backend/db/local-user";
import { stableUuidFromString } from "../../src/backend/ids/stable-uuid";
import { getUtcDateString } from "../../src/backend/data/daily-plan-persistence";
import { getSeedContent } from "../../src/backend/data/seed-content";
import { starterLeetCodeAssignments } from "../../src/domain/leetcode/starter-assignments";
import type { RoadmapSeed, SystemDesignSeed } from "../../src/backend/data/seed-content";

function isDryRun(): boolean {
  return process.argv.includes("--dry-run");
}

function pickIndex(length: number, date: Date): number {
  if (length <= 0) return 0;
  const yday = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) /
      86_400_000,
  );
  return yday % length;
}

function buildPlanItems(input: {
  date: Date;
  roadmap: RoadmapSeed;
  systemDesign: SystemDesignSeed;
}): Array<{ track: "leetcode" | "roadmap" | "system_design"; title: string; href: string }> {
  const items: Array<{
    track: "leetcode" | "roadmap" | "system_design";
    title: string;
    href: string;
  }> = [];

  const assignment = starterLeetCodeAssignments[pickIndex(starterLeetCodeAssignments.length, input.date)];
  const roadmapTopic = input.roadmap.topics[pickIndex(input.roadmap.topics.length, input.date)];
  const roadmapResource = input.roadmap.resources.find(
    (resource) => resource.topicSlug === roadmapTopic?.slug,
  );
  const systemPrompt = input.systemDesign.prompts[pickIndex(input.systemDesign.prompts.length, input.date)];

  if (assignment) {
    items.push({
      track: "leetcode",
      title: assignment.problemTitle,
      href: `/leetcode/${assignment.id}/timer`,
    });
  }

  if (roadmapTopic) {
    items.push({
      track: "roadmap",
      title: roadmapTopic.title,
      href: roadmapResource?.url ?? "/roadmap",
    });
  }

  if (systemPrompt) {
    items.push({
      track: "system_design",
      title: systemPrompt.title,
      href: `/system-design#${systemPrompt.slug}`,
    });
  }

  return items;
}

async function seedFirestoreSchema(db: ReturnType<typeof getFirestoreDb>) {
  const nowIso = new Date().toISOString();
  const dryRun = isDryRun();
  const planDate = new Date();
  const seed = await getSeedContent();
  const dailyPlanItems = buildPlanItems({
    date: planDate,
    roadmap: seed.roadmap,
    systemDesign: seed.systemDesign,
  });
  const dailyPlanDate = getUtcDateString(planDate);
  const dailyPlanId = stableUuidFromString(`${LOCAL_USER_ID}:plan:${dailyPlanDate}`);

  const patternNames = Array.from(new Set(starterLeetCodeAssignments.map((item) => item.pattern)));
  const majorRows = patternNames.map((name, displayOrder) => ({
    id: stableUuidFromString(`leetcode-major:${name}`),
    name,
    display_order: displayOrder,
  }));
  const majorIdByName = new Map(majorRows.map((row) => [row.name, row.id]));
  const minorRows = starterLeetCodeAssignments.map((assignment, displayOrder) => ({
    id: stableUuidFromString(`leetcode-minor:${assignment.pattern}:${assignment.subpattern}`),
    major_id: majorIdByName.get(assignment.pattern) ?? majorRows[0]?.id ?? "missing",
    name: assignment.subpattern,
    display_order: displayOrder,
    problems_csv: assignment.problemTitle,
  }));

  const profileId = LOCAL_USER_ID;
  const attemptId = stableUuidFromString(`${LOCAL_USER_ID}:attempt:seed`);
  const dailyItemRows = dailyPlanItems.map((item, idx) => ({
    id: stableUuidFromString(`${dailyPlanId}:item:${idx}:${item.track}`),
    plan_id: dailyPlanId,
    track: item.track,
    title: item.title,
    href: item.href,
    status: "not_started",
    scheduled_order: idx,
  }));
  const aiJobId = stableUuidFromString(`${LOCAL_USER_ID}:ai-job:seed`);
  const emailNotificationId = stableUuidFromString(`${LOCAL_USER_ID}:email:seed`);

  const operations = [
    ["profiles", profileId, { id: profileId, email: "local@localhost", created_at: nowIso }],
    [
      "notification_preferences",
      profileId,
      {
        user_id: profileId,
        email: "local@localhost",
        timezone: "Europe/London",
        daily_send_time: "06:00",
        leetcode_enabled: true,
        roadmap_enabled: true,
        system_design_enabled: true,
        reminders_enabled: false,
      },
    ],
    ...majorRows.map((row) => ["leetcode_major_patterns", row.id, row]),
    ...minorRows.map((row) => ["leetcode_minor_patterns", row.id, row]),
    [
      "daily_plans",
      dailyPlanId,
      {
        id: dailyPlanId,
        user_id: profileId,
        plan_date: dailyPlanDate,
        generated_at: nowIso,
        status: "not_started",
      },
    ],
    ...dailyItemRows.map((row) => ["daily_plan_items", row.id, row]),
    [
      "leetcode_attempts",
      attemptId,
      {
        id: attemptId,
        user_id: profileId,
        assignment_id: "seed-assignment",
        problem_title: "Sample LeetCode starter problem",
        source_url: "/leetcode/seed/problem",
        started_at: nowIso,
        ended_at: nowIso,
        time_limit_minutes: 30,
        elapsed_seconds: 0,
        result: "completed",
        confidence: null,
        notes: "Seeded for local schema bootstrap",
      },
    ],
    [
      "ai_generation_jobs",
      aiJobId,
      {
        id: aiJobId,
        user_id: profileId,
        job_type: "seed",
        input_payload: JSON.stringify({
          topic: "Firestore bootstrap",
          notes: "Seed job for local development",
          source_track: "roadmap",
          source_table: "seed",
          source_key: "bootstrap",
        }),
        status: "queued",
        output_payload: null,
        error_message: null,
        attempts: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ],
    [
      "email_notifications",
      emailNotificationId,
      {
        id: emailNotificationId,
        user_id: profileId,
        notification_type: "daily_plan",
        subject: "Welcome to local Firestore",
        body: "This is a seeded local email notification for dev.",
        status: "queued",
        scheduled_for: nowIso,
        sent_at: null,
        provider_message_id: null,
        error_message: null,
        attempts: 0,
      },
    ],
    [
      "_meta",
      "schema",
      {
        collections: [
          "profiles",
          "notification_preferences",
          "leetcode_major_patterns",
          "leetcode_minor_patterns",
          "leetcode_attempts",
          "daily_plans",
          "daily_plan_items",
          "ai_generation_jobs",
          "email_notifications",
        ],
        seeded_at: FieldValue.serverTimestamp(),
        note: "Firestore schema bootstrap",
      },
    ],
  ] as Array<[string, string, Record<string, unknown>]>;

  console.log(`[seed] planning write for ${operations.length} root docs`);
  if (dryRun) {
    console.log("[seed] dry-run mode, no writes performed");
    return operations.map(([collectionName, id, data]) => ({ collectionName, id, fields: Object.keys(data).length }));
  }

  const batch = db.batch();
  for (const [collectionName, id, data] of operations) {
    batch.set(db.collection(collectionName).doc(id), data, { merge: true });
  }
  await batch.commit();

  return {
    seededAt: nowIso,
    profiles: 1,
    notificationPreferences: 1,
    majorCount: majorRows.length,
    minorCount: minorRows.length,
    dailyPlanItems: dailyItemRows.length,
  };
}

async function main() {
  const db = getFirestoreDb();
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.log("[seed] FIRESTORE_EMULATOR_HOST not set. Targeting live Firestore project.");
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`[seed] seeding Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  const result = await seedFirestoreSchema(db);
  if (Array.isArray(result)) {
    console.log("[seed] planned docs:");
    console.log(result);
    return;
  }

  console.log("[seed] completed", JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

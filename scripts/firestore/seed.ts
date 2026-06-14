#!/usr/bin/env node
import { FieldValue } from "firebase-admin/firestore";

import { getFirestoreDb } from "../../lib/firebase/firestore";
import { LOCAL_USER_ID } from "../../lib/db/local-user";

function isDryRun(): boolean {
  return process.argv.includes("--dry-run");
}

async function seedFirestoreSchema(db: ReturnType<typeof getFirestoreDb>) {
  const nowIso = new Date().toISOString();
  const dryRun = isDryRun();
  const profileId = LOCAL_USER_ID;

  // Daily plans, plan items, and email notifications are created by the cron
  // routes (app/api/cron/*) against these preferences; leetcode attempts and
  // roadmap progress live under users/{uid} and are written by the app.
  const operations = [
    [
      "profiles",
      profileId,
      { id: profileId, email: "local@localhost", created_at: nowIso },
    ],
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
    [
      "_meta",
      "schema",
      {
        collections: ["profiles", "notification_preferences"],
        seeded_at: FieldValue.serverTimestamp(),
        note: "Firestore schema bootstrap",
      },
    ],
  ] as Array<[string, string, Record<string, unknown>]>;

  console.log(`[seed] planning write for ${operations.length} root docs`);
  if (dryRun) {
    console.log("[seed] dry-run mode, no writes performed");
    return operations.map(([collectionName, id, data]) => ({
      collectionName,
      id,
      fields: Object.keys(data).length,
    }));
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
  };
}

async function main() {
  const db = getFirestoreDb();
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      "[seed] FIRESTORE_EMULATOR_HOST not set. Targeting live Firestore project.",
    );
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      `[seed] seeding Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`,
    );
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

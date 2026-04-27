import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const leetcodeMajorPatterns = sqliteTable("leetcode_major_patterns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const leetcodeMinorPatterns = sqliteTable("leetcode_minor_patterns", {
  id: text("id").primaryKey(),
  majorId: text("major_id").notNull(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  problemsCsv: text("problems_csv").notNull().default(""),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
});

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  timezone: text("timezone").notNull().default("Europe/London"),
  dailySendTime: text("daily_send_time").notNull().default("06:00"),
  leetcodeEnabled: integer("leetcode_enabled", { mode: "boolean" }).notNull().default(true),
  roadmapEnabled: integer("roadmap_enabled", { mode: "boolean" }).notNull().default(true),
  systemDesignEnabled: integer("system_design_enabled", { mode: "boolean" }).notNull().default(true),
  flashcardsEnabled: integer("flashcards_enabled", { mode: "boolean" }).notNull().default(true),
  remindersEnabled: integer("reminders_enabled", { mode: "boolean" }).notNull().default(false),
  aiFlashcardsEnabled: integer("ai_flashcards_enabled", { mode: "boolean" }).notNull().default(false),
});

export const leetcodeAttempts = sqliteTable("leetcode_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  assignmentId: text("assignment_id").notNull(),
  problemTitle: text("problem_title").notNull(),
  sourceUrl: text("source_url").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  timeLimitMinutes: integer("time_limit_minutes").notNull(),
  elapsedSeconds: integer("elapsed_seconds"),
  result: text("result").notNull().default("in_progress"),
  confidence: text("confidence"),
  notes: text("notes").notNull().default(""),
});

export const dailyPlans = sqliteTable("daily_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planDate: text("plan_date").notNull(), // YYYY-MM-DD
  generatedAt: text("generated_at").notNull(),
  status: text("status").notNull().default("not_started"),
});

export const dailyPlanItems = sqliteTable("daily_plan_items", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  track: text("track").notNull(),
  title: text("title").notNull(),
  href: text("href").notNull(),
  status: text("status").notNull().default("not_started"),
  scheduledOrder: integer("scheduled_order").notNull().default(0),
});

export const flashcards = sqliteTable("flashcards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  sourceTrack: text("source_track").notNull(),
  sourceTable: text("source_table").notNull(),
  sourceId: text("source_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const aiGenerationJobs = sqliteTable("ai_generation_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobType: text("job_type").notNull(),
  inputPayload: text("input_payload").notNull(), // JSON string
  status: text("status").notNull().default("queued"),
  outputPayload: text("output_payload"),
  errorMessage: text("error_message"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const emailNotifications = sqliteTable("email_notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  notificationType: text("notification_type").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("queued"),
  scheduledFor: text("scheduled_for").notNull(),
  sentAt: text("sent_at"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  attempts: integer("attempts").notNull().default(0),
});

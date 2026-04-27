import type { Client } from "@libsql/client";

// Minimal, idempotent schema initializer so the app runs with only `DATABASE_URL=file:...`.
// This intentionally does not try to mirror the Supabase Postgres schema.
export async function ensureLocalSchema(client: Client) {
  await client.execute(`
    create table if not exists leetcode_major_patterns (
      id text primary key,
      name text not null,
      display_order integer not null default 0
    );
  `);

  await client.execute(`
    create table if not exists leetcode_minor_patterns (
      id text primary key,
      major_id text not null,
      name text not null,
      display_order integer not null default 0,
      problems_csv text not null default ''
    );
  `);

  await client.execute(`
    create table if not exists profiles (
      id text primary key,
      email text not null,
      created_at text not null
    );
  `);

  await client.execute(`
    create table if not exists notification_preferences (
      user_id text primary key,
      email text not null,
      timezone text not null default 'Europe/London',
      daily_send_time text not null default '06:00',
      leetcode_enabled integer not null default 1,
      roadmap_enabled integer not null default 1,
      system_design_enabled integer not null default 1,
      flashcards_enabled integer not null default 1,
      reminders_enabled integer not null default 0,
      ai_flashcards_enabled integer not null default 0
    );
  `);

  await client.execute(`
    create table if not exists leetcode_attempts (
      id text primary key,
      user_id text not null,
      assignment_id text not null,
      problem_title text not null,
      source_url text not null,
      started_at text not null,
      ended_at text,
      time_limit_minutes integer not null,
      elapsed_seconds integer,
      result text not null default 'in_progress',
      confidence text,
      notes text not null default ''
    );
  `);

  await client.execute(`
    create table if not exists daily_plans (
      id text primary key,
      user_id text not null,
      plan_date text not null,
      generated_at text not null,
      status text not null default 'not_started'
    );
  `);

  await client.execute(`
    create table if not exists daily_plan_items (
      id text primary key,
      plan_id text not null,
      track text not null,
      title text not null,
      href text not null,
      status text not null default 'not_started',
      scheduled_order integer not null default 0
    );
  `);

  await client.execute(`
    create table if not exists flashcards (
      id text primary key,
      user_id text not null,
      source_track text not null,
      source_table text not null,
      source_id text not null,
      question text not null,
      answer text not null,
      hint text not null default '',
      status text not null default 'draft',
      created_at text not null
    );
  `);

  await client.execute(`
    create table if not exists ai_generation_jobs (
      id text primary key,
      user_id text not null,
      job_type text not null,
      input_payload text not null,
      status text not null default 'queued',
      output_payload text,
      error_message text,
      attempts integer not null default 0,
      created_at text not null,
      updated_at text not null
    );
  `);

  await client.execute(`
    create table if not exists email_notifications (
      id text primary key,
      user_id text not null,
      notification_type text not null,
      subject text not null,
      body text not null,
      status text not null default 'queued',
      scheduled_for text not null,
      sent_at text,
      provider_message_id text,
      error_message text,
      attempts integer not null default 0
    );
  `);
}

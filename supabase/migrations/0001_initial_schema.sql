create extension if not exists "pgcrypto";

create type task_track as enum ('leetcode', 'roadmap', 'system_design', 'flashcards');
create type item_status as enum ('not_started', 'in_progress', 'completed', 'skipped', 'failed');
create type confidence_level as enum ('low', 'medium', 'high');
create type flashcard_status as enum ('draft', 'active', 'rejected', 'archived');
create type ai_job_status as enum ('queued', 'processing', 'completed', 'failed');
create type email_status as enum ('queued', 'sent', 'failed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  email text not null,
  timezone text not null default 'Europe/London',
  daily_send_time time not null default '06:00',
  leetcode_enabled boolean not null default true,
  roadmap_enabled boolean not null default true,
  system_design_enabled boolean not null default true,
  flashcards_enabled boolean not null default true,
  reminders_enabled boolean not null default false,
  ai_flashcards_enabled boolean not null default false
);

create table leetcode_patterns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  display_order integer not null default 0
);

create table leetcode_subpatterns (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references leetcode_patterns(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text not null default '',
  display_order integer not null default 0
);

create table leetcode_problems (
  id uuid primary key default gen_random_uuid(),
  subpattern_id uuid not null references leetcode_subpatterns(id) on delete restrict,
  slug text not null unique,
  title text not null,
  source_url text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  estimated_minutes integer not null default 30,
  tags text[] not null default '{}'
);

create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_url text not null,
  description text not null default ''
);

create table roadmap_topics (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  parent_topic_id uuid references roadmap_topics(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  source_url text,
  display_order integer not null default 0
);

create table roadmap_resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references roadmap_topics(id) on delete cascade,
  title text not null,
  url text not null,
  resource_type text not null default 'article',
  summary text not null default ''
);

create table system_design_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  concept_tags text[] not null default '{}'
);

create table system_design_prompts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references system_design_topics(id) on delete cascade,
  slug text not null unique,
  title text not null,
  prompt_text text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  source_url text,
  expected_concepts text[] not null default '{}'
);

create table system_design_resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references system_design_topics(id) on delete cascade,
  prompt_id uuid references system_design_prompts(id) on delete cascade,
  title text not null,
  url text not null,
  resource_type text not null default 'article',
  summary text not null default '',
  check ((topic_id is not null) or (prompt_id is not null))
);

create table leetcode_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  problem_id uuid not null references leetcode_problems(id) on delete cascade,
  assigned_date date not null,
  due_date date not null,
  status item_status not null default 'not_started',
  priority integer not null default 0,
  unique (user_id, problem_id, assigned_date)
);

create table leetcode_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  problem_id uuid not null references leetcode_problems(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  time_limit_minutes integer not null,
  elapsed_seconds integer,
  result item_status not null default 'in_progress',
  confidence confidence_level,
  notes text not null default ''
);

create table roadmap_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references roadmap_topics(id) on delete cascade,
  status item_status not null default 'not_started',
  confidence confidence_level,
  last_reviewed_at timestamptz,
  notes text not null default '',
  primary key (user_id, topic_id)
);

create table system_design_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references system_design_prompts(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status item_status not null default 'in_progress',
  notes text not null default '',
  self_score integer check (self_score between 1 and 5)
);

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_date date not null,
  generated_at timestamptz not null default now(),
  status item_status not null default 'not_started',
  unique (user_id, plan_date)
);

create table daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references daily_plans(id) on delete cascade,
  track task_track not null,
  target_table text not null,
  target_id uuid not null,
  title text not null,
  description text not null default '',
  status item_status not null default 'not_started',
  scheduled_order integer not null default 0
);

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source_track task_track not null,
  source_table text not null,
  source_id uuid not null,
  question text not null,
  answer text not null,
  hint text not null default '',
  status flashcard_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  recall_rating integer not null check (recall_rating between 0 and 5),
  next_review_at timestamptz not null
);

create table ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  job_type text not null,
  input_payload jsonb not null,
  status ai_job_status not null default 'queued',
  output_payload jsonb,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table email_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  notification_type text not null,
  subject text not null,
  body text not null,
  status email_status not null default 'queued',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  provider_message_id text,
  error_message text,
  attempts integer not null default 0
);

alter table profiles enable row level security;
alter table notification_preferences enable row level security;
alter table leetcode_patterns enable row level security;
alter table leetcode_subpatterns enable row level security;
alter table leetcode_problems enable row level security;
alter table roadmaps enable row level security;
alter table roadmap_topics enable row level security;
alter table roadmap_resources enable row level security;
alter table system_design_topics enable row level security;
alter table system_design_prompts enable row level security;
alter table system_design_resources enable row level security;
alter table leetcode_assignments enable row level security;
alter table leetcode_attempts enable row level security;
alter table roadmap_progress enable row level security;
alter table system_design_sessions enable row level security;
alter table daily_plans enable row level security;
alter table daily_plan_items enable row level security;
alter table flashcards enable row level security;
alter table flashcard_reviews enable row level security;
alter table ai_generation_jobs enable row level security;
alter table email_notifications enable row level security;

create policy "profiles owner access" on profiles for all using (auth.uid() = id);
create policy "notification preferences owner access" on notification_preferences for all using (auth.uid() = user_id);
create policy "leetcode assignments owner access" on leetcode_assignments for all using (auth.uid() = user_id);
create policy "leetcode attempts owner access" on leetcode_attempts for all using (auth.uid() = user_id);
create policy "roadmap progress owner access" on roadmap_progress for all using (auth.uid() = user_id);
create policy "system design sessions owner access" on system_design_sessions for all using (auth.uid() = user_id);
create policy "daily plans owner access" on daily_plans for all using (auth.uid() = user_id);
create policy "flashcards owner access" on flashcards for all using (auth.uid() = user_id);
create policy "flashcard reviews owner access" on flashcard_reviews for all using (auth.uid() = user_id);
create policy "ai jobs owner read access" on ai_generation_jobs for select using (auth.uid() = user_id);
create policy "email notifications owner read access" on email_notifications for select using (auth.uid() = user_id);

create policy "daily plan items via owner plan" on daily_plan_items
  for all using (
    exists (
      select 1 from daily_plans
      where daily_plans.id = daily_plan_items.plan_id
        and daily_plans.user_id = auth.uid()
    )
  );

create policy "public content readable leetcode patterns" on leetcode_patterns for select using (true);
create policy "public content readable leetcode subpatterns" on leetcode_subpatterns for select using (true);
create policy "public content readable leetcode problems" on leetcode_problems for select using (true);
create policy "public content readable roadmaps" on roadmaps for select using (true);
create policy "public content readable roadmap topics" on roadmap_topics for select using (true);
create policy "public content readable roadmap resources" on roadmap_resources for select using (true);
create policy "public content readable system topics" on system_design_topics for select using (true);
create policy "public content readable system prompts" on system_design_prompts for select using (true);
create policy "public content readable system resources" on system_design_resources for select using (true);

-- RLS policies + auth trigger helpers.
-- Assumes `0001_initial_schema.sql` created the tables referenced below.

-- ---------------------------------------------------------------------------
-- Auth trigger: create `profiles` + default `notification_preferences`
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;

alter table public.leetcode_patterns enable row level security;
alter table public.leetcode_subpatterns enable row level security;
alter table public.leetcode_problems enable row level security;

alter table public.roadmaps enable row level security;
alter table public.roadmap_topics enable row level security;
alter table public.roadmap_resources enable row level security;

alter table public.system_design_topics enable row level security;
alter table public.system_design_prompts enable row level security;
alter table public.system_design_resources enable row level security;

alter table public.leetcode_assignments enable row level security;
alter table public.leetcode_attempts enable row level security;
alter table public.roadmap_progress enable row level security;
alter table public.system_design_sessions enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_plan_items enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.ai_generation_jobs enable row level security;
alter table public.email_notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Policies: seeded content (readable by authenticated)
-- ---------------------------------------------------------------------------

drop policy if exists "seeded content: leetcode_patterns select" on public.leetcode_patterns;
create policy "seeded content: leetcode_patterns select"
on public.leetcode_patterns
for select
to authenticated
using (true);

drop policy if exists "seeded content: leetcode_subpatterns select" on public.leetcode_subpatterns;
create policy "seeded content: leetcode_subpatterns select"
on public.leetcode_subpatterns
for select
to authenticated
using (true);

drop policy if exists "seeded content: leetcode_problems select" on public.leetcode_problems;
create policy "seeded content: leetcode_problems select"
on public.leetcode_problems
for select
to authenticated
using (true);

drop policy if exists "seeded content: roadmaps select" on public.roadmaps;
create policy "seeded content: roadmaps select"
on public.roadmaps
for select
to authenticated
using (true);

drop policy if exists "seeded content: roadmap_topics select" on public.roadmap_topics;
create policy "seeded content: roadmap_topics select"
on public.roadmap_topics
for select
to authenticated
using (true);

drop policy if exists "seeded content: roadmap_resources select" on public.roadmap_resources;
create policy "seeded content: roadmap_resources select"
on public.roadmap_resources
for select
to authenticated
using (true);

drop policy if exists "seeded content: system_design_topics select" on public.system_design_topics;
create policy "seeded content: system_design_topics select"
on public.system_design_topics
for select
to authenticated
using (true);

drop policy if exists "seeded content: system_design_prompts select" on public.system_design_prompts;
create policy "seeded content: system_design_prompts select"
on public.system_design_prompts
for select
to authenticated
using (true);

drop policy if exists "seeded content: system_design_resources select" on public.system_design_resources;
create policy "seeded content: system_design_resources select"
on public.system_design_resources
for select
to authenticated
using (true);

-- ---------------------------------------------------------------------------
-- Policies: user-owned rows (CRUD where user_id = auth.uid())
-- ---------------------------------------------------------------------------

drop policy if exists "profiles: owner select" on public.profiles;
create policy "profiles: owner select"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "notification_preferences: owner crud" on public.notification_preferences;
create policy "notification_preferences: owner crud"
on public.notification_preferences
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "leetcode_assignments: owner crud" on public.leetcode_assignments;
create policy "leetcode_assignments: owner crud"
on public.leetcode_assignments
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "leetcode_attempts: owner crud" on public.leetcode_attempts;
create policy "leetcode_attempts: owner crud"
on public.leetcode_attempts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "roadmap_progress: owner crud" on public.roadmap_progress;
create policy "roadmap_progress: owner crud"
on public.roadmap_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "system_design_sessions: owner crud" on public.system_design_sessions;
create policy "system_design_sessions: owner crud"
on public.system_design_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_plans: owner crud" on public.daily_plans;
create policy "daily_plans: owner crud"
on public.daily_plans
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "flashcards: owner crud" on public.flashcards;
create policy "flashcards: owner crud"
on public.flashcards
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "flashcard_reviews: owner crud" on public.flashcard_reviews;
create policy "flashcard_reviews: owner crud"
on public.flashcard_reviews
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_generation_jobs: owner crud" on public.ai_generation_jobs;
create policy "ai_generation_jobs: owner crud"
on public.ai_generation_jobs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "email_notifications: owner crud" on public.email_notifications;
create policy "email_notifications: owner crud"
on public.email_notifications
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- daily_plan_items is owned through daily_plans via plan_id.
drop policy if exists "daily_plan_items: via owner plan" on public.daily_plan_items;
create policy "daily_plan_items: via owner plan"
on public.daily_plan_items
for all
to authenticated
using (
  exists (
    select 1
    from public.daily_plans
    where public.daily_plans.id = public.daily_plan_items.plan_id
      and public.daily_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_plans
    where public.daily_plans.id = public.daily_plan_items.plan_id
      and public.daily_plans.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies)
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select on table
  public.leetcode_patterns,
  public.leetcode_subpatterns,
  public.leetcode_problems,
  public.roadmaps,
  public.roadmap_topics,
  public.roadmap_resources,
  public.system_design_topics,
  public.system_design_prompts,
  public.system_design_resources
to authenticated;

grant select, insert, update, delete on table
  public.notification_preferences,
  public.leetcode_assignments,
  public.leetcode_attempts,
  public.roadmap_progress,
  public.system_design_sessions,
  public.daily_plans,
  public.daily_plan_items,
  public.flashcards,
  public.flashcard_reviews,
  public.ai_generation_jobs,
  public.email_notifications
to authenticated;

grant select, update on table public.profiles to authenticated;

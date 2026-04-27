import "server-only";

import type { createSupabaseServiceRoleClient } from "@/server/supabase/service-role";

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceRoleClient>;

export async function listLeetcodeProblems(supabase: SupabaseServiceClient) {
  const { data, error } = await supabase
    .from("leetcode_problems")
    .select("id,title,slug,difficulty,estimated_minutes,source_url")
    .order("title");

  if (error) throw error;
  return data ?? [];
}

export async function listRoadmapTopics(supabase: SupabaseServiceClient) {
  const { data, error } = await supabase
    .from("roadmap_topics")
    .select("id,title,slug,description,display_order")
    .order("display_order");

  if (error) throw error;
  return data ?? [];
}

export async function listSystemDesignPrompts(supabase: SupabaseServiceClient) {
  const { data, error } = await supabase
    .from("system_design_prompts")
    .select("id,title,slug,difficulty,source_url")
    .order("title");

  if (error) throw error;
  return data ?? [];
}


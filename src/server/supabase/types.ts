export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TemporaryTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type PublicTableName =
  | "profiles"
  | "notification_preferences"
  | "leetcode_patterns"
  | "leetcode_subpatterns"
  | "leetcode_problems"
  | "roadmaps"
  | "roadmap_topics"
  | "roadmap_resources"
  | "system_design_topics"
  | "system_design_prompts"
  | "system_design_resources"
  | "leetcode_assignments"
  | "leetcode_attempts"
  | "roadmap_progress"
  | "system_design_sessions"
  | "daily_plans"
  | "daily_plan_items"
  | "flashcards"
  | "flashcard_reviews"
  | "ai_generation_jobs"
  | "email_notifications";

// Temporary shim until generated Supabase types replace it.
export interface Database {
  public: {
    Tables: Record<PublicTableName, TemporaryTable>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

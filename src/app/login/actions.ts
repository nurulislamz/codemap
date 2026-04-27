"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/server/supabase/server";
import { getEnv, hasSupabasePublicEnv } from "@/server/env";

const loginSchema = z.object({
  email: z.string().email(),
});

export async function sendMagicLink(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_email");
  }

  if (!hasSupabasePublicEnv(process.env)) {
    redirect("/dashboard?offline=1");
  }

  const env = getEnv();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      // Supabase will redirect back with a ?code=... for /auth/callback to exchange.
      emailRedirectTo: new URL("/auth/callback", env.APP_BASE_URL).toString(),
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?sent=1");
}

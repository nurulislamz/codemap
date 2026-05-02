import "server-only";

import { Resend } from "resend";

import { getEnv, requireEnv } from "@/lib/env";

export interface DailyEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendDailyEmail(input: DailyEmailInput) {
  const env = getEnv();
  const resend = new Resend(requireEnv(env, "RESEND_API_KEY"));

  return resend.emails.send({
    from: requireEnv(env, "EMAIL_FROM"),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

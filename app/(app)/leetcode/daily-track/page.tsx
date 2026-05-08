import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LeetcodeDailyTrackPage() {
  redirect("/leetcode/tracks/complete-track");
}

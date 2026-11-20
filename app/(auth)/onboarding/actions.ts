"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth/session";
import type { QuizAnswers } from "@/components/onboarding/OnboardingQuiz";
import type { UserRole } from "@/types";

const clip = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Saves the onboarding quiz (role, headhunting signals, location, resume) in one call. */
export async function completeOnboardingAction(a: QuizAnswers): Promise<{ home?: string; error?: string }> {
  const intent = a?.intent;
  if (!intent || !["job", "open", "refer", "both"].includes(intent)) return { error: "Pick what brings you to ECRN." };

  const payload = {
    intent,
    discipline: clip(a.discipline, 120),
    connection: clip(a.connection, 120),
    years_experience: clip(a.years_experience, 20),
    location_city: clip(a.location_city, 100),
    location_state: clip(a.location_state, 2),
    location_lat: num(a.location_lat),
    location_lng: num(a.location_lng),
    relocation: ["yes", "maybe", "no"].includes(a.relocation ?? "") ? a.relocation : undefined,
    move_motivators: Array.isArray(a.move_motivators) ? a.move_motivators.slice(0, 10).map((m) => clip(m, 60)) : [],
    current_employer: clip(a.current_employer, 160),
    resume_path: clip(a.resume_path, 300),
    resume_choice: clip(a.resume_choice, 10),
  };

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("complete_onboarding", { p: payload });
  if (error) return { error: error.message };

  const role = (data as { role: UserRole }).role;
  revalidatePath("/", "layout");
  let home = homeForRole(role, true);
  if (role === "candidate") home = a.resume_choice === "build" ? "/candidate/resume/build" : "/candidate?welcome=1";
  else if (role === "referral_partner") home = "/referrals/import?welcome=1";
  return { home };
}

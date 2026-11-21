"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { generateResume, type ResumeAnswers } from "@/lib/resume";

const shortAnswer = z.string().max(1000).optional();
const ResumeAnswersSchema = z.object({
  headline: shortAnswer,
  years: shortAnswer,
  strengths: z.array(z.string().max(200)).max(20).optional(),
  strengthNote: shortAnswer,
  jobs: z.array(z.object({
    company: shortAnswer,
    title: shortAnswer,
    years: shortAnswer,
    highlights: z.string().max(5000).optional(),
  })).max(10).optional(),
  school: shortAnswer,
  degree: shortAnswer,
  certifications: shortAnswer,
  software: z.array(z.string().max(200)).max(40).optional(),
  references: z.array(z.object({ name: shortAnswer, relationship: shortAnswer, phone: shortAnswer })).max(10).optional(),
});

function refreshResumePages() {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/candidate/resume");
  revalidatePath("/candidate/resume/build");
  revalidatePath("/candidate/apply");
}

/** After the browser uploads to storage, record the path on profile + candidate. */
export async function setResumePathAction(path: string | null): Promise<{ ok: boolean; error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Please sign in again." };
  if (path !== null && (typeof path !== "string" || !path.startsWith(`${profile.id}/`))) {
    return { ok: false, error: "Invalid file." };
  }
  const sb = await createSupabaseServerClient();
  const old = profile.resumePath;
  const { error } = await sb.rpc("set_my_resume", { p_path: path });
  if (error) return { ok: false, error: error.message };
  if (old && old !== path) await sb.storage.from("resumes").remove([old]);
  refreshResumePages();
  return { ok: true };
}

/** Short-lived link to view the member's own resume file. */
export async function resumeLinkAction(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile?.resumePath) return null;
  const sb = await createSupabaseServerClient();
  const { data } = await sb.storage.from("resumes").createSignedUrl(profile.resumePath, 300);
  return data?.signedUrl ?? null;
}

/** Autosave builder answers; optionally generate the finished resume. */
export async function saveResumeBuilderAction(
  answers: ResumeAnswers,
  opts: { generate?: boolean } = {}
): Promise<{ ok: boolean; error?: string; usedAi?: boolean }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Please sign in again." };
  const parsed = ResumeAnswersSchema.safeParse(answers);
  if (!parsed.success) return { ok: false, error: "Check your resume answers and keep each answer brief." };
  const clean = parsed.data;
  if (JSON.stringify(clean).length > 30000) return { ok: false, error: "That's a lot of text. Trim it a little." };

  let builder: Record<string, unknown> = { ...profile.resumeBuilder, answers: clean, updated_at: new Date().toISOString() };
  let usedAi = false;
  if (opts?.generate) {
    const out = await generateResume(clean, profile);
    usedAi = out.usedAi;
    builder = { ...builder, generated: out.resume, generated_at: new Date().toISOString(), used_ai: out.usedAi };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("profiles").update({ resume_builder: builder }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  // Draft autosaves do not change other screens. Invalidating the root layout
  // on every keystroke rebuilt the app shell and discarded prefetched pages.
  if (opts?.generate) refreshResumePages();
  return { ok: true, usedAi };
}

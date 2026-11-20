"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { generateResume, type ResumeAnswers } from "@/lib/resume";

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
  revalidatePath("/", "layout");
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
  const clean = JSON.parse(JSON.stringify(answers ?? {})) as ResumeAnswers;
  if (JSON.stringify(clean).length > 30000) return { ok: false, error: "That's a lot of text. Trim it a little." };

  let builder: Record<string, unknown> = { ...profile.resumeBuilder, answers: clean, updated_at: new Date().toISOString() };
  let usedAi = false;
  if (opts.generate) {
    const out = await generateResume(clean, profile);
    usedAi = out.usedAi;
    builder = { ...builder, generated: out.resume, generated_at: new Date().toISOString(), used_ai: out.usedAi };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("profiles").update({ resume_builder: builder }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, usedAi };
}

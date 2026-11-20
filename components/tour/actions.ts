"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

/** Remember that this member has seen the tour. */
export async function markTourDoneAction(): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.tourCompletedAt) return;
  const sb = await createSupabaseServerClient();
  await sb.from("profiles").update({ tour_completed_at: new Date().toISOString() }).eq("id", profile.id);
}

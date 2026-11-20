"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchOutbox } from "@/lib/integrations/staffing-referrals";

export async function dispatchNowAction(): Promise<{ message: string }> {
  await requireAdmin();
  const sb = await createSupabaseServerClient();
  try {
    const r = await dispatchOutbox(sb);
    revalidatePath("/admin/sync");
    return { message: r.skipped ?? `Sent ${r.sent}, failed ${r.failed}.` };
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Dispatch failed" };
  }
}

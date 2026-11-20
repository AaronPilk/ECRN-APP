import { notFound, redirect } from "next/navigation";
import { Page, BackLink } from "@/components/ui/Page";
import { ResumeView } from "@/components/profile/ResumeView";
import { PrintButton } from "@/components/profile/PrintButton";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GeneratedResume } from "@/lib/resume";

export default async function AdminBuiltResume(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const me = await getCurrentProfile();
  if (me?.role !== "admin") redirect("/dashboard");
  const sb = await createSupabaseServerClient();
  const { data: c } = await sb.from("candidates").select("user_id").eq("id", id).maybeSingle();
  if (!c?.user_id) notFound();
  const { data: p } = await sb.from("profiles").select("resume_builder").eq("id", c.user_id).maybeSingle();
  const r = (p?.resume_builder as { generated?: GeneratedResume } | null)?.generated;
  if (!r) notFound();
  return (
    <Page>
      <div className="print:hidden">
        <BackLink href={`/admin/candidates/${id}`} label="Candidate" />
      </div>
      <ResumeView r={r} />
      <div className="print:hidden max-w-xs">
        <PrintButton />
      </div>
    </Page>
  );
}

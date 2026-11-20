import Link from "next/link";
import { Lock } from "lucide-react";
import { Panel, Pill } from "@/components/admin/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toCandidate, toProfile } from "@/lib/data/mappers";

const STATUS: Record<string, string> = {
  actively_looking: "Actively looking",
  open_to_offers: "Employed · open to the right move",
  not_looking: "Not looking",
};
const RELO: Record<string, string> = { yes: "Open to relocating", maybe: "For the right role", no: "Not relocating" };

/**
 * Headhunting signals from onboarding (admin only): career status, what would
 * make them move, private employer, relocation, and their resume.
 */
export async function CareerSignals({ candidateId }: { candidateId: string }) {
  const sb = await createSupabaseServerClient();
  const { data: c } = await sb.from("candidates").select("*").eq("id", candidateId).maybeSingle();
  if (!c) return null;
  const cand = toCandidate(c);
  const { data: p } = cand.userId ? await sb.from("profiles").select("*").eq("id", cand.userId).maybeSingle() : { data: null };
  const member = p ? toProfile(p) : null;
  const resumePath = cand.resumePath ?? member?.resumePath ?? null;
  const signed = resumePath ? (await sb.storage.from("resumes").createSignedUrl(resumePath, 600)).data?.signedUrl : null;
  const built = member?.resumeBuilder?.generated ? true : false;

  if (!cand.careerStatus && !member && !resumePath) return null;

  return (
    <Panel
      title="Career signals"
      className={cand.isConfidential ? "border-cobalt/40" : undefined}
      action={
        cand.isConfidential ? (
          <Pill tone="blue">
            <Lock className="h-3.5 w-3.5" /> Confidential: do not contact current employer
          </Pill>
        ) : undefined
      }
    >
      <dl className="grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
        {cand.careerStatus && <Item k="Status" v={STATUS[cand.careerStatus] ?? cand.careerStatus} />}
        {cand.currentCompany && <Item k="Current employer" v={cand.currentCompany} />}
        {member?.discipline && <Item k="Discipline" v={member.discipline} />}
        {member?.yearsExperience && <Item k="Experience" v={`${member.yearsExperience} years`} />}
        {cand.relocation && <Item k="Relocation" v={RELO[cand.relocation] ?? cand.relocation} />}
        {cand.moveMotivators.length > 0 && <Item k="Would move for" v={cand.moveMotivators.join(", ")} />}
        {member && <Item k="ECRN account" v={`${member.email}${member.onboardingCompletedAt ? " · onboarded" : ""}`} />}
      </dl>
      {(signed || built) && (
        <div className="mt-4 flex flex-wrap gap-4 text-[14px] font-medium">
          {signed && (
            <a href={signed} target="_blank" rel="noopener noreferrer" className="text-ecrn-green-text hover:underline">
              Download resume ↗
            </a>
          )}
          {built && member && (
            <Link href={`/admin/candidates/${candidateId}/resume`} className="text-ecrn-green-text hover:underline">
              View resume built in ECRN
            </Link>
          )}
        </div>
      )}
    </Panel>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-ecrn-secondary">{k}</dt>
      <dd className="min-w-0 text-ecrn-ink">{v}</dd>
    </div>
  );
}

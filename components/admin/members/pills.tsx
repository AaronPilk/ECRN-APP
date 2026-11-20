import { Lock } from "lucide-react";
import { Pill } from "@/components/admin/ui";
import type { Profile } from "@/types";

/**
 * Where a member stands: actively looking, quietly open to a move (shown with
 * a lock because their employer must not find out), or only here to refer.
 */
export function MemberStatusPill({ member }: { member: Pick<Profile, "careerStatus" | "intent"> }) {
  if (member.careerStatus === "open_to_offers" || (!member.careerStatus && member.intent === "open")) {
    return (
      <Pill tone="blue">
        <Lock className="h-3 w-3" aria-hidden /> Open to a move
      </Pill>
    );
  }
  if (member.careerStatus === "actively_looking" || (!member.careerStatus && member.intent === "job")) {
    return <Pill tone="green">Actively looking</Pill>;
  }
  if (member.careerStatus === "not_looking" || member.intent === "refer") {
    return <Pill>Referring only</Pill>;
  }
  return <span className="text-ecrn-secondary">Not answered</span>;
}

export function YesNo({ value, yes = "Yes", no = "No" }: { value: boolean; yes?: string; no?: string }) {
  return value ? <Pill tone="green">{yes}</Pill> : <span className="text-ecrn-secondary">{no}</span>;
}

export function ActivePill({ active }: { active: boolean }) {
  return active ? <Pill tone="green">Active</Pill> : <Pill tone="red">Inactive</Pill>;
}

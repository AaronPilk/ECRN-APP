import { Badge } from "@/components/ui/Badge";
import type { ApplicationStatus, PayoutStatus, ReferralStatus } from "@/types";
import { STATUS_LABEL, APPLICATION_STATUS_LABEL, PAYOUT_STATUS_LABEL } from "@/lib/data/repository";

type Variant = "neutral" | "amber" | "blue" | "green" | "red" | "dark";

/**
 * Maps a referral pipeline status to the right Badge variant.
 *
 * The pipeline conceptually flows: new → contacted → qualified →
 * submitted_to_job → interviewing → offer → placed → payout_paid.
 *
 * Color rules (kept consistent across every list / detail view):
 *   - early/neutral stages → neutral
 *   - in-process stages → blue
 *   - positive milestones → green
 *   - flags / blockers → red
 *   - special "needs admin" → amber
 */
const REFERRAL_VARIANT: Record<ReferralStatus, Variant> = {
  submitted: "neutral",
  duplicate_review: "amber",
  new: "neutral",
  contacted: "blue",
  qualified: "blue",
  not_qualified: "red",
  submitted_to_job: "blue",
  interviewing: "blue",
  offer_stage: "green",
  placed: "green",
  payout_pending: "amber",
  payout_approved: "green",
  payout_paid: "green",
  rejected: "red",
  inactive: "neutral",
};

const APPLICATION_VARIANT: Record<ApplicationStatus, Variant> = {
  submitted: "neutral",
  reviewing: "blue",
  interviewing: "blue",
  offer: "green",
  hired: "green",
  rejected: "red",
  withdrawn: "neutral",
};

const PAYOUT_VARIANT: Record<PayoutStatus, Variant> = {
  pending: "amber",
  approved: "blue",
  paid: "green",
  denied: "red",
  disputed: "red",
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  return <Badge variant={REFERRAL_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={APPLICATION_VARIANT[status]}>{APPLICATION_STATUS_LABEL[status]}</Badge>;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Badge variant={PAYOUT_VARIANT[status]}>{PAYOUT_STATUS_LABEL[status]}</Badge>;
}

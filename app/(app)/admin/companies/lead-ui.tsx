import { Pill } from "@/components/admin/ui";
import type { CompanyLeadStatus, JobUrgency } from "@/types";

/** Shared labels for the company lead list and detail screens. */

export const LEAD_STATUSES: CompanyLeadStatus[] = ["new", "contacted", "qualified", "engaged", "won", "lost", "archived"];

export const LEAD_STATUS_LABEL: Record<CompanyLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  engaged: "Engaged",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

export const LEAD_STATUS_TONE: Record<CompanyLeadStatus, "neutral" | "green" | "blue" | "cobalt" | "amber" | "red"> = {
  new: "amber",
  contacted: "blue",
  qualified: "blue",
  engaged: "cobalt",
  won: "green",
  lost: "red",
  archived: "neutral",
};

export const URGENCY_LABEL: Record<JobUrgency, string> = {
  low: "Low priority",
  normal: "Normal",
  high: "High priority",
  critical: "Urgent",
};

/** Nothing for a normal lead, so only the ones that stand out get a pill. */
export function UrgencyPill({ urgency }: { urgency: JobUrgency }) {
  if (urgency === "normal") return null;
  return <Pill tone={urgency === "critical" ? "red" : urgency === "high" ? "amber" : "neutral"}>{URGENCY_LABEL[urgency]}</Pill>;
}

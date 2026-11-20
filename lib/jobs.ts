import type { Job } from "@/types";

export function jobLocation(j: Pick<Job, "locationCity" | "locationState">): string {
  return [j.locationCity, j.locationState].filter(Boolean).join(", ");
}

/** "$5,000" from the cents column, falling back to the admin's display text. */
export function jobPayout(j: Pick<Job, "referralPayoutAmount" | "referralPayoutDisplay">): string | null {
  if (j.referralPayoutAmount && j.referralPayoutAmount > 0) {
    return `$${Math.round(j.referralPayoutAmount / 100).toLocaleString("en-US")}`;
  }
  return j.referralPayoutDisplay ?? null;
}

export function jobSalary(j: Pick<Job, "compensationDisplay" | "compensationMin" | "compensationMax">): string | null {
  if (j.compensationDisplay) return j.compensationDisplay;
  if (j.compensationMin && j.compensationMax) {
    return `$${Math.round(j.compensationMin / 1000)}–${Math.round(j.compensationMax / 1000)}K`;
  }
  return null;
}

export function isHighPriority(j: Pick<Job, "urgency">): boolean {
  return j.urgency === "high" || j.urgency === "critical";
}

/** Great-circle distance in miles. */
export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatCents(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

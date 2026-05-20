import type {
  ActivityLog,
  Candidate,
  CompanyLead,
  Integration,
  Job,
  JobApplication,
  JobReferral,
  NotificationEvent,
  Payout,
  Profile,
  Referral,
} from "@/types";
import {
  seedCandidates,
  seedJobs,
  seedPayouts,
  seedProfiles,
} from "./seeds";

/**
 * In-memory store backing the V1 mock data layer.
 *
 * Persistence is module-level (lives as long as the Node process), which is
 * fine for a dev build. When you flip to Supabase (lib/data/repository.ts),
 * this whole file becomes unused.
 *
 * Important: Next.js can have multiple instances of this module in
 * development due to HMR. We attach to globalThis so state survives
 * hot reloads.
 */

interface MockDb {
  profiles: Profile[];
  candidates: Candidate[];
  referrals: Referral[];
  jobs: Job[];
  jobReferrals: JobReferral[];
  jobApplications: JobApplication[];
  companyLeads: CompanyLead[];
  payouts: Payout[];
  activityLogs: ActivityLog[];
  notificationEvents: NotificationEvent[];
  integrations: Integration[];
}

declare global {
  // eslint-disable-next-line no-var
  var __ecrnMockDb: MockDb | undefined;
}

function makeDb(): MockDb {
  return {
    profiles: [...seedProfiles],
    candidates: [...seedCandidates],
    referrals: [],
    jobs: [...seedJobs],
    jobReferrals: [],
    jobApplications: [],
    companyLeads: [],
    payouts: [...seedPayouts],
    activityLogs: [],
    notificationEvents: [],
    integrations: [],
  };
}

export const db: MockDb = globalThis.__ecrnMockDb ?? makeDb();
if (!globalThis.__ecrnMockDb) {
  globalThis.__ecrnMockDb = db;
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

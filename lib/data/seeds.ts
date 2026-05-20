import type { Candidate, Job, Payout, Profile } from "@/types";

/**
 * Initial seed data for the mock store.
 *
 * This is what populates the in-memory database on cold start. Replace
 * with Supabase queries when ready.
 */

const now = new Date().toISOString();

// Master admin — Aaron at Skyway (configurable via NEXT_PUBLIC_ADMIN_EMAILS)
export const seedProfiles: Profile[] = [
  {
    id: "p_admin_aaron",
    authUserId: null,
    role: "admin",
    firstName: "Aaron",
    lastName: "—",
    email: "aaron@skyway.media",
    phone: null,
    locationCity: "Tampa",
    locationState: "FL",
    linkedinUrl: null,
    companyName: "Delta Construction Partners",
    externalCrmId: null,
    isActive: true,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "p_demo_partner",
    authUserId: null,
    role: "referral_partner",
    firstName: "Demo",
    lastName: "Partner",
    email: "partner@example.com",
    phone: "+17275550100",
    locationCity: "Tampa",
    locationState: "FL",
    linkedinUrl: "https://www.linkedin.com/in/demo-partner",
    companyName: null,
    externalCrmId: null,
    isActive: true,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
];

export const seedJobs: Job[] = [
  {
    id: "j_001",
    title: "Senior Electrical Project Manager",
    companyName: "Confidential Top-ENR Electrical Contractor",
    isCompanyPublic: false,
    locationCity: "Tampa",
    locationState: "FL",
    jobType: "Full-time",
    trade: "electrical",
    description:
      "Lead large-scale commercial electrical projects from preconstruction through closeout. Manage PMs, scheduling, budgets, and client relationships across $10M+ projects.",
    requirements:
      "8+ years electrical PM experience. Strong P&L ownership. Bluebeam / Procore proficiency.",
    compensationMin: 130000,
    compensationMax: 165000,
    compensationDisplay: "$130–165K + bonus + vehicle",
    startDate: null,
    urgency: "high",
    status: "open",
    isPublic: true,
    referralPayoutAmount: 500000,
    referralPayoutDisplay: "$5,000",
    internalNotes: null,
    externalCrmId: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "j_002",
    title: "Electrical Estimator",
    companyName: "National Electrical Contractor",
    isCompanyPublic: false,
    locationCity: "Orlando",
    locationState: "FL",
    jobType: "Full-time",
    trade: "electrical",
    description:
      "Estimate commercial and industrial electrical projects up to $25M. Work directly with senior leadership and project executives.",
    requirements:
      "5+ years estimating. Accubid or McCormick preferred. Strong takeoff skills.",
    compensationMin: 95000,
    compensationMax: 130000,
    compensationDisplay: "$95–130K",
    startDate: null,
    urgency: "normal",
    status: "open",
    isPublic: true,
    referralPayoutAmount: 350000,
    referralPayoutDisplay: "$3,500",
    internalNotes: null,
    externalCrmId: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "j_003",
    title: "Construction Superintendent — Healthcare",
    companyName: "Confidential GC",
    isCompanyPublic: false,
    locationCity: "Miami",
    locationState: "FL",
    jobType: "Full-time",
    trade: "general_construction",
    description:
      "Run field operations for ground-up healthcare projects. Coordinate subs, safety, schedule, and inspections.",
    requirements:
      "10+ years field experience, healthcare GC exposure required, OSHA 30.",
    compensationMin: 120000,
    compensationMax: 155000,
    compensationDisplay: "$120–155K + per diem",
    startDate: null,
    urgency: "critical",
    status: "open",
    isPublic: true,
    referralPayoutAmount: 500000,
    referralPayoutDisplay: "$5,000",
    internalNotes: null,
    externalCrmId: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "j_004",
    title: "Mechanical Project Manager",
    companyName: "Confidential MEP Contractor",
    isCompanyPublic: false,
    locationCity: "St. Petersburg",
    locationState: "FL",
    jobType: "Full-time",
    trade: "mechanical",
    description:
      "Manage commercial HVAC and plumbing projects, $5–20M scope. Direct PM and APM teams.",
    requirements:
      "7+ years mechanical PM. PE preferred. Track record of profitable closeouts.",
    compensationMin: 115000,
    compensationMax: 150000,
    compensationDisplay: "$115–150K + bonus",
    startDate: null,
    urgency: "normal",
    status: "open",
    isPublic: true,
    referralPayoutAmount: 400000,
    referralPayoutDisplay: "$4,000",
    internalNotes: null,
    externalCrmId: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
];

export const seedCandidates: Candidate[] = [];
export const seedPayouts: Payout[] = [];

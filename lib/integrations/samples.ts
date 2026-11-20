/**
 * Sample inbound events, shaped the way Staffing Referrals / Bullhorn would
 * send them. Used by Admin → Integrations → Simulator so the owners can watch
 * the whole loop work before Bullhorn is connected, and mirrored in
 * docs/BULLHORN_INTEGRATION.md.
 *
 * Sample Bullhorn ids start at 900000 and sample people use example.com
 * addresses, so anything the simulator creates is easy to spot and remove.
 */

export interface SampleContext {
  /** A real ECRN person to aim the candidate, submission and placement samples at. */
  candidate?: { id: string; name: string; email: string | null } | null;
  job?: { id: string; title: string } | null;
  application?: { id: string; candidateId: string; jobId: string } | null;
}

export interface InboundSample {
  key: string;
  type: string;
  label: string;
  description: string;
  event: { type: string; data: Record<string, unknown> };
}

/** What the simulator's server action returns to the form. */
export interface SimulateResult {
  ok: boolean;
  message: string | null;
  events: {
    type: string;
    status: string;
    summary: string;
    error: string | null;
    notes: string[];
    /** Pretty-printed result JSON. */
    detail: string | null;
  }[];
}

export const SAMPLE_IDS = {
  accountManager: 900001,
  recruiter: 900002,
  job: 900100,
  candidate: 900200,
  submission: 900300,
  placement: 900400,
} as const;

const PASTE_CANDIDATE = "PASTE-AN-ECRN-CANDIDATE-ID";
const PASTE_APPLICATION = "PASTE-AN-ECRN-APPLICATION-ID";

export function buildInboundSamples(ctx: SampleContext = {}): InboundSample[] {
  const candidateId = ctx.candidate?.id ?? PASTE_CANDIDATE;
  const who = ctx.candidate ? ctx.candidate.name : "an ECRN person (paste their id)";
  const applicationId = ctx.application?.id ?? PASTE_APPLICATION;
  const startInTwoWeeks = Date.now() + 14 * 24 * 60 * 60 * 1000;

  return [
    {
      key: "user-account-manager",
      type: "user.upserted",
      label: "Team: add an account manager",
      description: "A Bullhorn user becomes an ECRN team member with their own invite code. Run this first: owners are matched to the team.",
      event: {
        type: "user.upserted",
        data: {
          id: SAMPLE_IDS.accountManager,
          firstName: "Dana",
          lastName: "Whitfield",
          email: "dana.whitfield@example.com",
          mobile: "813-555-0142",
          occupation: "Account Manager",
          userType: { id: 12, name: "Account Manager" },
          enabled: true,
          isDeleted: false,
        },
      },
    },
    {
      key: "user-recruiter",
      type: "user.upserted",
      label: "Team: add a recruiter who reports to that manager",
      description: "The recruiter is linked to the account manager through the manager's Bullhorn id.",
      event: {
        type: "user.upserted",
        data: {
          id: SAMPLE_IDS.recruiter,
          firstName: "Marcus",
          lastName: "Reyes",
          email: "marcus.reyes@example.com",
          mobile: "813-555-0177",
          occupation: "Senior Recruiter",
          userType: { id: 14, name: "Recruiter" },
          reportToPerson: { id: SAMPLE_IDS.accountManager },
          enabled: true,
          isDeleted: false,
        },
      },
    },
    {
      key: "job-upserted",
      type: "job.upserted",
      label: "Job: create or update a job order",
      description:
        "Creates the job with its owner and recruiters. The client name stays admin-only. The sample sets isPublic to false so it does not show on the public job board; change it to true to test that too.",
      event: {
        type: "job.upserted",
        data: {
          id: SAMPLE_IDS.job,
          title: "Senior Electrical Estimator",
          status: "Accepting Candidates",
          isOpen: true,
          isPublic: false,
          employmentType: "Direct Hire",
          salary: 135000,
          salaryUnit: "Per Year",
          startDate: startInTwoWeeks,
          numOpenings: 1,
          address: { city: "Tampa", state: "Florida", zip: "33602" },
          publicDescription:
            "<p>Lead estimates for commercial and industrial electrical projects from $2M to $40M.</p><ul><li>8+ years estimating for an electrical contractor</li><li>Accubid or ConEst experience</li></ul>",
          owner: { id: SAMPLE_IDS.accountManager, firstName: "Dana", lastName: "Whitfield" },
          assignedUsers: { total: 1, data: [{ id: SAMPLE_IDS.recruiter, firstName: "Marcus", lastName: "Reyes" }] },
          clientCorporation: { id: 900050, name: "Gulf Coast Electric (sample client)" },
          publishedCategory: { id: 3, name: "Electrical" },
          dateLastModified: Date.now(),
        },
      },
    },
    {
      key: "candidate-linked",
      type: "candidate.linked",
      label: "Person: link to their Bullhorn candidate",
      description: `Saves the Bullhorn candidate id on ${who}. This is what Staffing Referrals sends back after it creates the candidate.`,
      event: {
        type: "candidate.linked",
        data: { ecrnId: candidateId, id: SAMPLE_IDS.candidate },
      },
    },
    {
      key: "candidate-updated",
      type: "candidate.updated",
      label: "Person: status and owner changed in Bullhorn",
      description: `Moves ${who} to Interviewing and hands them to the sample account manager and recruiter (run the two team samples first).`,
      event: {
        type: "candidate.updated",
        data: {
          ecrnId: candidateId,
          id: SAMPLE_IDS.candidate,
          status: "Interviewing",
          owner: { id: SAMPLE_IDS.accountManager },
          assignedRecruiter: { id: SAMPLE_IDS.recruiter },
        },
      },
    },
    {
      key: "submission-updated",
      type: "submission.updated",
      label: "Application: submission status changed",
      description: ctx.application
        ? "Moves the most recent ECRN application to Interviewing."
        : "Moves an application to Interviewing. There is no application in ECRN yet, so paste an application id or apply to a job first.",
      event: {
        type: "submission.updated",
        data: {
          id: SAMPLE_IDS.submission,
          ecrnId: applicationId,
          status: "Interview Scheduled",
          candidate: { ecrnId: ctx.application?.candidateId ?? candidateId },
          jobOrder: { ecrnId: ctx.application?.jobId ?? ctx.job?.id ?? "PASTE-AN-ECRN-JOB-ID" },
        },
      },
    },
    {
      key: "placement-created",
      type: "placement.created",
      label: "Placement: the person was placed",
      description: `Marks ${who} as placed. If a member referred them, ECRN opens a pending payout for that member. This changes a real record.`,
      event: {
        type: "placement.created",
        data: {
          id: SAMPLE_IDS.placement,
          status: "Approved",
          candidate: { ecrnId: candidateId, id: SAMPLE_IDS.candidate },
          jobOrder: ctx.job ? { ecrnId: ctx.job.id } : { id: SAMPLE_IDS.job },
          employmentType: "Direct Hire",
          salary: 135000,
          salaryUnit: "Per Year",
          dateBegin: startInTwoWeeks,
        },
      },
    },
    {
      key: "job-closed",
      type: "job.closed",
      label: "Job: closed in Bullhorn",
      description: "Marks the sample job as filled (run the job sample first). Any other reason archives it.",
      event: {
        type: "job.closed",
        data: { id: SAMPLE_IDS.job, status: "Placed", reason: "filled" },
      },
    },
  ];
}

import type { BlogPost } from "@/lib/blog/types";
import { projectEngineerVsProjectManager } from "./posts/project-engineer-vs-project-manager";
import { electricalConstructionCareerPath } from "./posts/electrical-construction-career-path";
import { electricalConstructionJobsForVeterans } from "./posts/electrical-construction-jobs-for-veterans";
import { howToWorkWithAConstructionRecruiter } from "./posts/how-to-work-with-a-construction-recruiter";
import { whoToReferForConstructionJobs } from "./posts/who-to-refer-for-construction-jobs";

/** Batch G: careers and referrals. Each post lives in ./posts/<slug>.ts. */
export const POSTS_G: BlogPost[] = [
  projectEngineerVsProjectManager,
  electricalConstructionCareerPath,
  electricalConstructionJobsForVeterans,
  howToWorkWithAConstructionRecruiter,
  whoToReferForConstructionJobs,
];

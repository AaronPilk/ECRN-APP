import type { BlogPost } from "@/lib/blog/types";
import { areConstructionRecruitersWorthIt } from "./posts/are-construction-recruiters-worth-it";
import { dataCenterConstructionElectricalJobs } from "./posts/data-center-construction-electrical-jobs";
import { electricalConstructionResumeGuide } from "./posts/electrical-construction-resume-guide";
import { howToJobSearchConfidentially } from "./posts/how-to-job-search-confidentially";

/** Batch C: job search, industry and employers. Each post lives in ./posts/<slug>.ts. */
export const POSTS_C: BlogPost[] = [
  dataCenterConstructionElectricalJobs,
  howToJobSearchConfidentially,
  electricalConstructionResumeGuide,
  areConstructionRecruitersWorthIt,
];

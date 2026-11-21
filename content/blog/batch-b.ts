import type { BlogPost } from "@/lib/blog/types";
import { electricalProjectManagerSalary } from "./posts/electrical-project-manager-salary";
import { electricianSalaryByState } from "./posts/electrician-salary-by-state";
import { electricalForemanVsSuperintendent } from "./posts/electrical-foreman-vs-superintendent";
import { electricianShortageStatistics } from "./posts/electrician-shortage-statistics";

/** Batch B: pay and careers. Each post lives in ./posts/<slug>.ts. */
export const POSTS_B: BlogPost[] = [
  electricalProjectManagerSalary,
  electricianSalaryByState,
  electricalForemanVsSuperintendent,
  electricianShortageStatistics,
];

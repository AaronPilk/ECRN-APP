import type { BlogPost } from "@/lib/blog/types";
import { electricalEstimatorSalary } from "./posts/electrical-estimator-salary";
import { electricalSuperintendentSalary } from "./posts/electrical-superintendent-salary";
import { electricalForemanSalary } from "./posts/electrical-foreman-salary";
import { apprenticeElectricianPayByYear } from "./posts/apprentice-electrician-pay-by-year";
import { unionVsNonUnionElectricianPay } from "./posts/union-vs-non-union-electrician-pay";

/** Batch D: pay. Each post lives in ./posts/<slug>.ts. */
export const POSTS_D: BlogPost[] = [
  electricalEstimatorSalary,
  electricalSuperintendentSalary,
  electricalForemanSalary,
  apprenticeElectricianPayByYear,
  unionVsNonUnionElectricianPay,
];

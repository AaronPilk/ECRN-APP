import type { BlogPost } from "@/lib/blog/types";
import { travelingElectricianPerDiem } from "./posts/traveling-electrician-per-diem";
import { relocatingForAConstructionJob } from "./posts/relocating-for-a-construction-job";
import { howToNegotiateSalaryInConstruction } from "./posts/how-to-negotiate-salary-in-construction";
import { shouldYouAcceptACounteroffer } from "./posts/should-you-accept-a-counteroffer";
import { areReferralBonusesTaxable } from "./posts/are-referral-bonuses-taxable";

/** Batch E: money moves and referral tax. Each post lives in ./posts/<slug>.ts. */
export const POSTS_E: BlogPost[] = [
  travelingElectricianPerDiem,
  relocatingForAConstructionJob,
  howToNegotiateSalaryInConstruction,
  shouldYouAcceptACounteroffer,
  areReferralBonusesTaxable,
];

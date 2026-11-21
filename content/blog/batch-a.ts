import type { BlogPost } from "@/lib/blog/types";
import { howConstructionReferralBonusesWork } from "./posts/how-construction-referral-bonuses-work";
import { isEcrnLegit } from "./posts/is-ecrn-legit";
import { howToReferSomeoneForAConstructionJob } from "./posts/how-to-refer-someone-for-a-construction-job";
import { recruiterVsJobBoardVsReferralNetwork } from "./posts/recruiter-vs-job-board-vs-referral-network";

/** Batch A: referrals and trust. Each post lives in ./posts/<slug>.ts. */
export const POSTS_A: BlogPost[] = [
  howConstructionReferralBonusesWork,
  isEcrnLegit,
  howToReferSomeoneForAConstructionJob,
  recruiterVsJobBoardVsReferralNetwork,
];

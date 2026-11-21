import type { BlogPost } from "@/lib/blog/types";
import { osha10VsOsha30 } from "./posts/osha-10-vs-osha-30";
import { electricalForemanInterviewQuestions } from "./posts/electrical-foreman-interview-questions";
import { electricalProjectManagerInterviewQuestions } from "./posts/electrical-project-manager-interview-questions";
import { howToAskSomeoneIfTheyreOpenToANewJob } from "./posts/how-to-ask-someone-if-theyre-open-to-a-new-job";

/** Batch I: safety, interviews and referral conversations. Each post lives in ./posts/<slug>.ts. */
export const POSTS_I: BlogPost[] = [
  osha10VsOsha30,
  electricalForemanInterviewQuestions,
  electricalProjectManagerInterviewQuestions,
  howToAskSomeoneIfTheyreOpenToANewJob,
];

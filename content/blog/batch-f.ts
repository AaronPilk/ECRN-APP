import type { BlogPost } from "@/lib/blog/types";
import { howToBecomeAnElectricalEstimator } from "./posts/how-to-become-an-electrical-estimator";
import { howToBecomeAnElectricalProjectManager } from "./posts/how-to-become-an-electrical-project-manager";
import { howToBecomeAnElectricalForeman } from "./posts/how-to-become-an-electrical-foreman";
import { electricalSuperintendentJobDescription } from "./posts/electrical-superintendent-job-description";
import { assistantProjectManagerElectrical } from "./posts/assistant-project-manager-electrical";

/** Batch F: careers. Each post lives in ./posts/<slug>.ts. */
export const POSTS_F: BlogPost[] = [
  howToBecomeAnElectricalEstimator,
  howToBecomeAnElectricalProjectManager,
  howToBecomeAnElectricalForeman,
  electricalSuperintendentJobDescription,
  assistantProjectManagerElectrical,
];

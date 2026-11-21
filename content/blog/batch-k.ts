import type { BlogPost } from "@/lib/blog/types";
import { howToHireAnElectricalProjectManager } from "./posts/how-to-hire-an-electrical-project-manager";
import { howToFindAndHireElectricians } from "./posts/how-to-find-and-hire-electricians";
import { howToRetainElectricians } from "./posts/how-to-retain-electricians";
import { electricalProjectManagerJobDescription } from "./posts/electrical-project-manager-job-description";

/** Batch K: employers. Each post lives in ./posts/<slug>.ts. */
export const POSTS_K: BlogPost[] = [
  howToHireAnElectricalProjectManager,
  howToFindAndHireElectricians,
  howToRetainElectricians,
  electricalProjectManagerJobDescription,
];

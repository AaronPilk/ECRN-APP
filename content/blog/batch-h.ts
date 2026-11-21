import type { BlogPost } from "@/lib/blog/types";
import { journeymanVsMasterElectrician } from "./posts/journeyman-vs-master-electrician";
import { howToGetAnElectricianLicenseInFlorida } from "./posts/how-to-get-an-electrician-license-in-florida";
import { howToGetAnElectricianLicenseInTexas } from "./posts/how-to-get-an-electrician-license-in-texas";
import { howToGetAnElectricianLicenseInCalifornia } from "./posts/how-to-get-an-electrician-license-in-california";
import { electricianLicenseReciprocity } from "./posts/electrician-license-reciprocity";

/** Batch H: licensing. Each post lives in ./posts/<slug>.ts. */
export const POSTS_H: BlogPost[] = [
  journeymanVsMasterElectrician,
  howToGetAnElectricianLicenseInFlorida,
  howToGetAnElectricianLicenseInTexas,
  howToGetAnElectricianLicenseInCalifornia,
  electricianLicenseReciprocity,
];

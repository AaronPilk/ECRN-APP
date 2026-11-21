/**
 * Public-site facts. Keep these identical everywhere the brand appears
 * (site, Google Business Profile, LinkedIn, directories): PILK AI SEO SOP, Phase 3.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ecrn.com").replace(/\/$/, "");

export const BRAND = {
  name: "ECRN",
  legalName: "Electrical Construction Referral Network",
  tagline: "Power Your Connections.",
  description:
    "ECRN is the referral network and job board for electrical construction, powered by Delta Construction Partners. Find your next role or refer people you know and earn up to $10,000 when they're hired.",
  parent: {
    name: "Delta Construction Partners",
    url: "https://deltaconstructionpartners.com",
    foundingDate: "2008",
    sameAs: [
      "https://www.linkedin.com/company/delta-construction-partners-inc-/",
      "https://www.instagram.com/deltaconstructionpartners/",
      "https://www.facebook.com/DeltaConstructionPartners",
    ],
  },
  /** Ink-type version: Google shows logos on white, where the white-type file disappears. */
  logo: `${SITE_URL}/brand/ecrn-logo-ink.png`,
  ogImage: `${SITE_URL}/og.jpg`,
  /** Add social/LinkedIn/Crunchbase profile URLs here as they're claimed. */
  sameAs: [] as string[],
};

/** Payout tiers (from ecrn.com, program terms effective April 2026). */
export const TIERS = [
  {
    tier: "Tier 1",
    name: "Field positions",
    amount: "Up to $2,500",
    summary: "Field workers placed in hands-on trade roles.",
    roles: ["Wireman", "Journeyman", "Electrician"],
  },
  {
    tier: "Tier 2",
    name: "Field leadership",
    amount: "Up to $5,000",
    summary: "Lead tradespeople and site supervisors managing crews on active projects.",
    roles: ["Foreman", "Superintendent", "Field professional"],
  },
  {
    tier: "Tier 3",
    name: "Office positions",
    amount: "Up to $7,500",
    summary: "Office professionals managing projects, estimates, and contractor relationships.",
    roles: ["Estimator (all levels)", "Project manager (all levels)"],
  },
  {
    tier: "Tier 4",
    name: "Executive leadership",
    amount: "Up to $10,000",
    summary: "C-suite and senior executives driving company-wide strategy and operations.",
    roles: ["CEO", "COO", "Vice president"],
  },
];

export const STEPS = [
  { n: "01", title: "Join the network", body: "Create a free account in about a minute. Tell us what you do and where you're based." },
  { n: "02", title: "Apply or refer", body: "Apply to open roles with your profile, or refer people straight from your phone's contacts." },
  { n: "03", title: "Delta handles it", body: "Delta Construction Partners' recruiters take it from there: vetting, interviews, and follow-up." },
  { n: "04", title: "Get hired or get paid", body: "Land the role, or earn up to $10,000 once your referral is placed and completes the guarantee period." },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "What is ECRN?",
    a: "ECRN (Electrical Construction Referral Network) is a free network and job board for electrical construction professionals. You can apply to open roles or refer people you know, and Delta Construction Partners handles the recruiting.",
  },
  {
    q: "How much can I earn for a referral?",
    a: "Up to $10,000 per hire, depending on the role: up to $2,500 for field positions, $5,000 for field leadership, $7,500 for office positions, and $10,000 for executive leadership. Amounts are estimates and are confirmed in writing before payout.",
  },
  {
    q: "When is a referral payout made?",
    a: "After your referral is placed with a Delta Construction Partners client and completes the guarantee period, typically 90 days from their start date.",
  },
  {
    q: "How is ECRN different from a staffing agency?",
    a: "ECRN is a structured referral network, not a placement firm. You bring the connection. Delta Construction Partners handles the professional process behind it, and you earn compensation when your referral is placed.",
  },
  {
    q: "Can I look for a job without my employer finding out?",
    a: "Yes. When you sign up, choose “I'm open to the right move.” Only Delta's recruiters see that, and your current employer is never contacted.",
  },
  {
    q: "Can I apply for jobs and refer people with the same account?",
    a: "Yes. Every member can apply to roles and refer others from one account, on the web or in the ECRN app for iPhone and Android.",
  },
  {
    q: "Do I need recruiting experience?",
    a: "No. You already know great people in this industry. Submit their name and phone number, or pick them from your contacts, and Delta takes it from there.",
  },
  {
    q: "What does it cost to join?",
    a: "Joining ECRN is free for professionals. Contractors who want to hire through Delta can request details on the employer page.",
  },
  {
    q: "Who is ECRN backed by?",
    a: "ECRN is an initiative of Delta Construction Partners, which brings 30+ recruiters and long-standing national contractor relationships to the network.",
  },
  {
    q: "What if two people refer the same person?",
    a: "The first verified referral on record keeps ownership. Later submissions of the same person are reviewed by Delta's team.",
  },
];

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    alternateName: BRAND.legalName,
    url: SITE_URL,
    logo: BRAND.logo,
    description: BRAND.description,
    slogan: BRAND.tagline,
    parentOrganization: {
      "@type": "Organization",
      name: BRAND.parent.name,
      url: BRAND.parent.url,
      foundingDate: BRAND.parent.foundingDate,
      sameAs: BRAND.parent.sameAs,
    },
    areaServed: ORGANIZATION_AREA_SERVED,
    knowsAbout: ORGANIZATION_KNOWS_ABOUT,
    ...(BRAND.sameAs.length ? { sameAs: BRAND.sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND.name,
    alternateName: BRAND.legalName,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** Per-page metadata helper: unique title/description, canonical, OG/Twitter. */
export function pageMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }) {
  const url = absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "ECRN",
      type: "website" as const,
      images: [{ url: image ?? BRAND.ogImage, width: 1200, height: 630, alt: "ECRN, the Electrical Construction Referral Network" }],
    },
    twitter: { card: "summary_large_image" as const, title, description, images: [image ?? BRAND.ogImage] },
  };
}

// ─────────────────────────────────────────────────────────────────────
// SEO additions (Nov 20, 2026). Additive: nothing above changed except
// two extra facts on the Organization block (areaServed, knowsAbout).
// ─────────────────────────────────────────────────────────────────────

/** Ids of the two site-wide JSON-LD blocks, so page data can point at them. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Where ECRN works: the program is for people authorized to work in the United States. */
export const ORGANIZATION_AREA_SERVED = { "@type": "Country", name: "United States" };

/** Topics the site covers. Topics only: no claims, counts or awards. */
export const ORGANIZATION_KNOWS_ABOUT = [
  "Electrical construction",
  "Electrical construction jobs",
  "Electrical construction recruiting",
  "Referral rewards for electrical construction hires",
  "Electrician, foreman and superintendent careers",
  "Electrical estimator and project manager careers",
];

/**
 * Ownership codes for the tools that verify a site by meta tag
 * (PILK AI SEO SOP, Phase 2). Paste only the code, which is the `content`
 * value of the meta tag each tool shows, then deploy and click Verify.
 * An empty value renders no tag.
 */
export const SITE_VERIFICATION = {
  /** Google Search Console: <meta name="google-site-verification" content="…"> */
  google: "",
  /** Bing Webmaster Tools: <meta name="msvalidate.01" content="…"> */
  bing: "",
  /**
   * Meta (Facebook) domain verification. This code is on the old ecrn.com
   * home page today (read Nov 20, 2026). Keeping it means Meta's verification
   * of ecrn.com survives the move to this site. Clear it if that Meta
   * Business account is no longer used.
   */
  facebook: "1w0eromzok2zhj8k6tq7d87t1coz13",
};

/** For `verification` in the root layout's metadata. Undefined when no code is set. */
export function siteVerification(): { google?: string; other?: Record<string, string> } | undefined {
  const { google, bing, facebook } = SITE_VERIFICATION;
  const other: Record<string, string> = {
    ...(bing ? { "msvalidate.01": bing } : {}),
    ...(facebook ? { "facebook-domain-verification": facebook } : {}),
  };
  if (!google && !Object.keys(other).length) return undefined;
  return { ...(google ? { google } : {}), ...(Object.keys(other).length ? { other } : {}) };
}

/** Delta Construction Partners as its own Organization node (the firm that does the recruiting). */
export function parentOrganizationJsonLd() {
  return {
    "@type": "Organization",
    name: BRAND.parent.name,
    url: BRAND.parent.url,
    foundingDate: BRAND.parent.foundingDate,
    sameAs: BRAND.parent.sameAs,
  };
}

/**
 * A service the page describes (SOP Phase 1: "the type each page really is").
 * `provider` is "delta" for the recruiting itself (the employer page) and
 * "ecrn" for the referral network.
 *
 *   <JsonLd data={serviceJsonLd({ name: "Electrical construction recruiting", description, path: "/hire",
 *     serviceType: "Construction recruiting", audience: "Electrical contractors", provider: "delta" })} />
 */
export function serviceJsonLd({
  name,
  description,
  path,
  serviceType,
  audience,
  provider = "ecrn",
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  /** Who it is for, in plain words: "Electrical contractors". */
  audience?: string;
  provider?: "ecrn" | "delta";
}) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    url,
    serviceType,
    provider: provider === "delta" ? parentOrganizationJsonLd() : { "@id": ORGANIZATION_ID },
    areaServed: ORGANIZATION_AREA_SERVED,
    ...(audience ? { audience: { "@type": "Audience", audienceType: audience } } : {}),
  };
}

/** The About page, tied to the site-wide Organization block as the thing it is about. */
export function aboutPageJsonLd(description: string, path = "/about") {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#webpage`,
    url,
    name: `About ${BRAND.name}`,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": ORGANIZATION_ID },
    inLanguage: "en-US",
  };
}

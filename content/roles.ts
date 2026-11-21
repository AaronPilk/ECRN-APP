import type { Block, BlogSource } from "@/lib/blog/types";
import type { RolePage } from "@/lib/careers/types";
import { TIERS } from "@/lib/site";

/**
 * Career pages, one per role Delta Construction Partners recruits for.
 *
 * Pay figures are the Bureau of Labor Statistics' Occupational Employment and
 * Wage Statistics (OEWS) national estimates for May 2025, read on 2026-11-20
 * from O*NET OnLine's national wage pages (BLS now serves occupation profiles
 * through an interactive tool). They live in WAGES below so the text, the
 * tables, the key-facts strip and the structured data can never disagree.
 * When BLS publishes May 2026 data: update WAGES, PAY_PERIOD and `accessed`.
 */

/** One BLS occupation's national wage distribution, in dollars. */
export interface RolePay {
  /** BLS occupation title. */
  occupation: string;
  /** Short name for tight spaces (cards, key facts). */
  short: string;
  /** Standard Occupational Classification code. */
  soc: string;
  /** True when the occupation is a stand-in because BLS has no electrical-specific one. */
  proxy: boolean;
  annual: { p10: number; p25: number; median: number; p75: number; p90: number };
  hourly: { p10: number; p25: number; median: number; p75: number; p90: number };
  /** Id of the entry in the role's `sources` these figures were read from. */
  source: number;
}

/** A career page plus the pay data and card text the pages need. */
export interface RoleEntry extends RolePage {
  /** One line for cards on /careers and related-role links. */
  summary: string;
  /** BLS occupations shown in the key facts and the Occupation data (first is the main one). */
  pay: RolePay[];
}

/** Reference period of every wage figure in this file. */
export const PAY_PERIOD = "May 2025";

const READ = "2026-11-20";
const UPDATED = "2026-11-20";

type Wage = Omit<RolePay, "source" | "proxy"> & { onet: string };

const WAGES = {
  electricians: {
    occupation: "Electricians",
    short: "Electricians",
    soc: "47-2111",
    onet: "47-2111.00",
    annual: { p10: 42640, p25: 49430, median: 63190, p75: 83940, p90: 108510 },
    hourly: { p10: 20.5, p25: 23.76, median: 30.38, p75: 40.36, p90: 52.17 },
  },
  supervisors: {
    occupation: "First-Line Supervisors of Construction Trades and Extraction Workers",
    short: "First-line construction supervisors",
    soc: "47-1011",
    onet: "47-1011.00",
    annual: { p10: 53280, p25: 63400, median: 79920, p75: 101460, p90: 128260 },
    hourly: { p10: 25.62, p25: 30.48, median: 38.42, p75: 48.78, p90: 61.66 },
  },
  estimators: {
    occupation: "Cost Estimators",
    short: "Cost estimators",
    soc: "13-1051",
    onet: "13-1051.00",
    annual: { p10: 48530, p25: 61150, median: 78740, p75: 101850, p90: 130820 },
    hourly: { p10: 23.33, p25: 29.4, median: 37.86, p75: 48.97, p90: 62.9 },
  },
  managers: {
    occupation: "Construction Managers",
    short: "Construction managers",
    soc: "11-9021",
    onet: "11-9021.00",
    annual: { p10: 69690, p25: 88550, median: 114990, p75: 151640, p90: 189440 },
    hourly: { p10: 33.5, p25: 42.57, median: 55.28, p75: 72.91, p90: 91.08 },
  },
  chiefExecutives: {
    occupation: "Chief Executives",
    short: "Chief executives",
    soc: "11-1011",
    onet: "11-1011.00",
    annual: { p10: 75700, p25: 129540, median: 213990, p75: 356200, p90: 507730 },
    hourly: { p10: 36.39, p25: 62.28, median: 102.88, p75: 171.25, p90: 244.1 },
  },
  generalManagers: {
    occupation: "General and Operations Managers",
    short: "General and operations managers",
    soc: "11-1021",
    onet: "11-1021.00",
    annual: { p10: 50090, p25: 72320, median: 105770, p75: 167280, p90: 253390 },
    hourly: { p10: 24.08, p25: 34.77, median: 50.85, p75: 80.42, p90: 121.82 },
  },
} satisfies Record<string, Wage>;

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const hr = (n: number) => `$${n.toFixed(2)}`;
/** "up to $5,000" for a tier, straight from the program tiers. */
const reward = (tierIndex: 0 | 1 | 2 | 3) => TIERS[tierIndex].amount.toLowerCase();

function pay(w: Wage, source: number, proxy: boolean): RolePay {
  return { occupation: w.occupation, short: w.short, soc: w.soc, proxy, annual: w.annual, hourly: w.hourly, source };
}

function wageSource(id: number, w: Wage): BlogSource {
  return {
    id,
    publisher: "O*NET OnLine, U.S. Department of Labor",
    title: `National wages: ${w.occupation} (${w.onet})`,
    url: `https://www.onetonline.org/link/localwages/${w.onet}`,
    accessed: READ,
    note: "National annual and hourly wages at the 10th, 25th, 50th (median), 75th and 90th percentiles. The page credits Bureau of Labor Statistics 2025 wage data.",
  };
}

function oewsSource(id: number): BlogSource {
  return {
    id,
    publisher: "U.S. Bureau of Labor Statistics",
    title: "Occupational Employment and Wage Statistics (OEWS) tables",
    url: "https://www.bls.gov/oes/tables.htm",
    accessed: READ,
    note: "Lists May 2025 as the latest OEWS release (page last modified May 15, 2026). BLS serves the 2025 occupation profiles through an interactive tool, so the wage figures here were read from O*NET OnLine's copy of the same data.",
  };
}

const OOH_PAGES = {
  electricians: {
    title: "Occupational Outlook Handbook: Electricians",
    url: "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm",
    note: "Median pay and the 10th and 90th percentile wages for May 2025, jobs in 2025, projected growth and yearly openings for 2025 to 2035, the share of electricians employed by electrical contractors and the median wage there, apprenticeship length, and state licensing.",
  },
  managers: {
    title: "Occupational Outlook Handbook: Construction Managers",
    url: "https://www.bls.gov/ooh/management/construction-managers.htm",
    note: "Median pay and the 10th and 90th percentile wages for May 2025, the median at specialty trade contractors, typical education, bonuses, state licensing, and projected growth and yearly openings for 2025 to 2035.",
  },
  estimators: {
    title: "Occupational Outlook Handbook: Cost Estimators",
    url: "https://www.bls.gov/ooh/business-and-financial/cost-estimators.htm",
    note: "Median pay and the 10th and 90th percentile wages for May 2025, the share employed by specialty trade contractors and the median wage there, typical education, and the projected decline and yearly openings for 2025 to 2035.",
  },
  executives: {
    title: "Occupational Outlook Handbook: Top Executives",
    url: "https://www.bls.gov/ooh/management/top-executives.htm",
    note: "Median pay and the 10th and 90th percentile wages for chief executives and for general and operations managers in May 2025, typical education and experience, and projected growth for 2025 to 2035.",
  },
};

function oohSource(id: number, page: keyof typeof OOH_PAGES): BlogSource {
  return { id, publisher: "U.S. Bureau of Labor Statistics", accessed: READ, ...OOH_PAGES[page] };
}

function tdlrJourneymanSource(id: number): BlogSource {
  return {
    id,
    publisher: "Texas Department of Licensing and Regulation",
    title: "Apply for a New Journeyman Electrician License",
    url: "https://www.tdlr.texas.gov/electricians/apply/individuals/journeyman-electrician.htm",
    accessed: READ,
    note: "Who must be licensed in Texas, supervision by a master electrician, the 8,000 hours of on-the-job training (exam allowed at 7,000), the exam, annual renewal, and the list of Texas license types.",
  };
}

function californiaSource(id: number): BlogSource {
  return {
    id,
    publisher: "California Department of Industrial Relations, Labor Commissioner's Office",
    title: "Electrician Certification Program",
    url: "https://www.dir.ca.gov/dlse/ecu/electricaltrade.html",
    accessed: READ,
    note: "Electricians working for a C-10 licensed electrical contractor must be certified under standards set by the Division of Labor Standards Enforcement.",
  };
}

function supervisorProfileSource(id: number): BlogSource {
  return {
    id,
    publisher: "My Next Move, U.S. Department of Labor (O*NET)",
    title: "First-Line Supervisors of Construction Trades and Extraction Workers",
    url: "https://www.mynextmove.org/profile/summary/47-1011.00",
    accessed: READ,
    note: "Job titles reported under this occupation (construction foreman, electrical supervisor, site superintendent) and its preparation level: on-the-job experience, vocational training or an associate's degree.",
  };
}

function managerProfileSource(id: number): BlogSource {
  return {
    id,
    publisher: "My Next Move, U.S. Department of Labor (O*NET)",
    title: "Construction Managers",
    url: "https://www.mynextmove.org/profile/summary/11-9021.00",
    accessed: READ,
    note: "Job titles reported under this occupation (construction superintendent, general superintendent, construction manager) and the education and experience usually needed.",
  };
}

function payTable(rows: { w: Wage; source: number }[]): Block {
  return {
    type: "table",
    caption: `Annual pay, United States, ${PAY_PERIOD}`,
    head: ["BLS occupation", "10th", "25th", "Median", "75th", "90th"],
    rows: rows.map(({ w, source }) => [
      `${w.occupation} (SOC ${w.soc})[^${source}]`,
      usd(w.annual.p10),
      usd(w.annual.p25),
      usd(w.annual.median),
      usd(w.annual.p75),
      usd(w.annual.p90),
    ]),
    note: "National figures for all industries from the BLS Occupational Employment and Wage Statistics survey. The 10th percentile means 10 percent of workers earned that amount or less.",
  };
}

const E = WAGES.electricians;
const S = WAGES.supervisors;
const C = WAGES.estimators;
const M = WAGES.managers;
const X = WAGES.chiefExecutives;
const G = WAGES.generalManagers;

// ─────────────────────────────────────────────────────────────────────
// 1. Journeyman electrician
// ─────────────────────────────────────────────────────────────────────

const journeyman: RoleEntry = {
  slug: "journeyman-electrician",
  title: "Journeyman Electrician",
  plural: "journeyman electricians",
  heading: "Journeyman electrician: pay, license rules and open jobs",
  metaTitle: "Journeyman Electrician: Pay, License & Open Jobs | ECRN",
  description:
    "What a journeyman electrician (wireman) does on commercial and industrial jobs, BLS pay for May 2025, state license rules, the path to foreman and open roles.",
  summary: "The licensed electrician who builds the work: conduit, wire, gear, terminations and testing.",
  answer: `A journeyman electrician, also called a wireman, is a fully trained electrician who installs, terminates and troubleshoots power, lighting and control systems without direct supervision. The Bureau of Labor Statistics put median pay for electricians at ${usd(E.annual.median)} a year (${hr(E.hourly.median)} an hour) in ${PAY_PERIOD}, its latest release as of November 2026.`,
  tierIndex: 0,
  jobKeywords: ["journeyman", "wireman", "electrician"],
  image: "crew-on-lift",
  pay: [pay(E, 1, false)],
  body: [
    { type: "h2", text: "What does a journeyman electrician do day to day?" },
    {
      type: "p",
      text: "On a commercial or industrial project, the journeyman is the person who turns the drawings into installed work. A day runs from the morning huddle to bending and running conduit, pulling wire, setting gear and terminating it, then testing what was built.",
    },
    {
      type: "p",
      text: "The mix changes with the phase of the job. Early on it is underground and deck work, then overhead racks and cable tray, then switchgear, panels and devices, then testing and the [punch list](/glossary#punch-list).",
    },
    {
      type: "p",
      text: "A journeyman also leads apprentices and answers to an [electrical foreman](/careers/electrical-foreman).",
    },

    { type: "h2", text: "How much does a journeyman electrician make?" },
    {
      type: "p",
      text: `The Bureau of Labor Statistics does not publish a journeyman-only wage. It counts journeymen inside its Electricians occupation (SOC ${E.soc}), where the national median was ${usd(E.annual.median)} a year, or ${hr(E.hourly.median)} an hour, in ${PAY_PERIOD}, the latest release.[^6][^2]`,
    },
    {
      type: "stats",
      items: [
        { value: usd(E.annual.median), label: `median pay, ${PAY_PERIOD}`, source: 6 },
        { value: "821,000", label: "electrician jobs in 2025", source: 6 },
        { value: "9%", label: "projected growth, 2025 to 2035", source: 6 },
        { value: "72,700", label: "projected openings a year", source: 6 },
      ],
    },
    {
      type: "p",
      text: `The lowest-paid 10 percent of electricians earned ${usd(E.annual.p10)} or less, and the highest-paid 10 percent earned ${usd(E.annual.p90)} or more.[^6] Electrical contractors employ 66 percent of electricians, and the median in that industry was $61,570.[^6]`,
    },
    payTable([{ w: E, source: 1 }]),
    {
      type: "p",
      text: "Use these national numbers to compare, not as a quote. Take-home pay moves with your market, overtime, per diem on travel jobs, and whether the project pays union scale or [prevailing wage](/glossary#prevailing-wage). For state numbers, see [electrician salary by state](/blog/electrician-salary-by-state).",
    },

    { type: "h2", text: "What license and certifications does a journeyman electrician need?" },
    {
      type: "p",
      text: "Most states require electricians to pass a test and be licensed, and the requirements vary by state.[^6] The rule that matters is the one where the job is. Two examples:",
    },
    {
      type: "ul",
      items: [
        "**Texas.** Anyone who does electrical work must be licensed. The journeyman license takes 8,000 hours of on-the-job training under a master electrician and a passed exam. You can sit the exam at 7,000 hours, and the license renews every year.[^3]",
        "**California.** Electricians who work for a C-10 electrical contractor must hold state certification.[^4]",
      ],
    },
    {
      type: "p",
      text: "Postings also commonly ask for OSHA 10 or OSHA 30 and NFPA 70E electrical safety training. The employer or project owner decides which.",
    },

    { type: "h2", text: "What skills get a journeyman electrician hired?" },
    {
      type: "ul",
      items: [
        "**Conduit work you can prove.** [EMT](/glossary#emt) and rigid, by hand and with a bender, in racks that look right.",
        "**Terminations and testing.** Gear, panels, motors and controls, with a meter in your hand.",
        "**Reading drawings.** One-lines, panel schedules and details, without waiting to be told.",
        "**Safe habits.** A clean record and real [lockout/tagout](/glossary#lockout-tagout) discipline.",
      ],
    },
    {
      type: "p",
      text: "Project type matters as much as years, so say whether you have done data center, hospital or industrial work.",
    },

    { type: "h2", text: "What is the career path for a journeyman electrician?" },
    {
      type: "p",
      text: "Most electricians learn the trade in a 4- or 5-year apprenticeship, with about 2,000 hours of paid on-the-job training each year.[^6] From there the field path runs to lead, [electrical foreman](/careers/electrical-foreman) and [electrical superintendent](/careers/electrical-superintendent).",
    },
    {
      type: "p",
      text: "The office path starts in [estimating](/careers/electrical-estimator) or a project engineer seat and leads toward project management. Some electricians stay on the tools and specialize in controls, medium voltage, testing or service.",
    },
    {
      type: "p",
      text: `Staying on the tools is a real career. The top 10 percent of electricians earn ${usd(E.annual.p90)} or more, which is above the ${usd(C.annual.median)} median for cost estimators.[^1][^5]`,
    },

    { type: "h2", text: "How do recruiters hire journeyman electricians?" },
    {
      type: "p",
      text: "Contractors bring in recruiters when a project needs proven people faster than their own network can supply them: a ramp-up, a travel job, a specialty scope. The hiring contractor pays the recruiting firm's fee. ECRN is free for the electrician.",
    },
    { type: "p", text: "When a recruiter from Delta Construction Partners calls, expect plain questions:" },
    {
      type: "ul",
      items: [
        "Which license do you hold, in which state, and is it current?",
        "What were your last three projects, and what did you personally install?",
        "Commercial, industrial or both? Any data center, health care or medium-voltage work?",
        "Will you travel, and what per diem makes it work?",
        "What do you make now, and what would it take to move?",
      ],
    },
    {
      type: "p",
      text: "If you are working and only curious, mark yourself open to the right move when you [join ECRN](/signup). Only Delta's recruiters see that.",
    },

    { type: "h2", text: "What is the referral reward for a journeyman electrician?" },
    {
      type: "p",
      text: `Field roles are Tier 1 on ECRN. Refer a journeyman, wireman or electrician who is hired through Delta Construction Partners and the reward is ${reward(0)}. The amount is an estimate, confirmed in writing before payout.`,
    },
    {
      type: "p",
      text: "It is paid after the person is placed and completes the guarantee period, typically 90 days. There is no cap on how many people you can refer. The full terms are on the [referral rewards](/referral-rewards) page.",
    },
    {
      type: "cta",
      title: "Know a good electrician?",
      text: `Refer them with a name and a phone number. If Delta places them, you earn ${reward(0)}.`,
      href: "/signup",
      label: "Refer on ECRN",
    },
  ],
  faqs: [
    {
      q: "How much does a journeyman electrician make an hour?",
      a: `BLS does not publish a journeyman-only wage. For all electricians (SOC ${E.soc}), the national median was ${hr(E.hourly.median)} an hour in ${PAY_PERIOD}, and the middle half earned between ${hr(E.hourly.p25)} and ${hr(E.hourly.p75)} an hour.`,
    },
    {
      q: "Is a journeyman electrician the same as a wireman?",
      a: "On most job sites, yes. Wireman, or inside wireman, is the union's name for an electrician who works on building power, lighting and controls, and journeyman is the skill level. Texas also issues a separate Residential Wireman license.",
    },
    {
      q: "How long does it take to become a journeyman electrician?",
      a: "Usually four to five years. BLS says most electricians learn the trade in a 4- or 5-year apprenticeship, and each state sets its own license rule. Texas, for example, requires 8,000 hours of on-the-job training under a master electrician plus a passed exam.",
    },
    {
      q: "Can I use my journeyman license in another state?",
      a: "Not automatically. Each state sets its own license rules, so ask the board in the state where the job is whether it recognizes your license or expects a new exam.",
    },
    {
      q: "What is the referral reward for a journeyman electrician on ECRN?",
      a: `${TIERS[0].amount} per hire. The amount is an estimate that Delta Construction Partners confirms in writing, and it is paid after your referral is placed and completes the guarantee period, typically 90 days.`,
    },
  ],
  sources: [wageSource(1, E), oewsSource(2), tdlrJourneymanSource(3), californiaSource(4), wageSource(5, C), oohSource(6, "electricians")],
  relatedPosts: [
    "electrician-salary-by-state",
    "electrician-shortage-statistics",
    "data-center-construction-electrical-jobs",
    "electrical-construction-resume-guide",
  ],
  relatedRoles: ["electrical-foreman", "electrical-estimator", "electrical-superintendent"],
  updatedAt: UPDATED,
};

// ─────────────────────────────────────────────────────────────────────
// 2. Electrical foreman
// ─────────────────────────────────────────────────────────────────────

const foreman: RoleEntry = {
  slug: "electrical-foreman",
  title: "Electrical Foreman",
  plural: "electrical foremen",
  heading: "Electrical foreman: role, pay and how to move up",
  metaTitle: "Electrical Foreman: Pay, Duties and Career Path | ECRN",
  description:
    "What an electrical foreman does, what BLS data says the job pays (May 2025), the license and skills contractors expect, and the path to superintendent.",
  summary: "Runs a crew: plans the day, orders material, keeps people safe and the work on pace.",
  answer: `An electrical foreman runs a crew of electricians on a project: planning each day's work, lining up material, and keeping the crew safe, productive and building it right. BLS has no electrical-only figure, but its closest occupation, first-line supervisors of construction trades, had a median wage of ${usd(S.annual.median)} a year in ${PAY_PERIOD}.`,
  tierIndex: 1,
  jobKeywords: ["foreman"],
  image: "foreman-plans",
  pay: [pay(S, 1, true)],
  body: [
    { type: "h2", text: "What does an electrical foreman do on a project?" },
    {
      type: "p",
      text: "The foreman is where the plan meets the crew. Before the shift you look at the drawings and the schedule, decide who does what, and make sure material, tools and lifts will be where they are needed.",
    },
    {
      type: "p",
      text: "Crew size varies. A working foreman may lead three or four people and stay on the tools most of the day. On a large job a foreman runs a bigger crew and answers to a [general foreman](/glossary#general-foreman) or the [superintendent](/careers/electrical-superintendent).",
    },
    {
      type: "ul",
      items: [
        "Daily task plan and the pre-task safety talk",
        "Material and tool requests two or three days ahead",
        "Layout, quality checks and inspections",
        "Timecards, daily reports and installed quantities, so the office knows how the job is doing on labor",
        "Writing up questions for the engineer ([RFIs](/glossary#rfi)) and extra work, so it gets priced",
      ],
    },

    { type: "h2", text: "How much does an electrical foreman make?" },
    {
      type: "p",
      text: `BLS has no "electrical foreman" occupation. The honest proxy is First-Line Supervisors of Construction Trades and Extraction Workers (SOC ${S.soc}), which covers foremen and supervisors in every construction trade. O*NET lists construction foreman and electrical supervisor among its job titles.[^5]`,
    },
    {
      type: "p",
      text: `Its national median was ${usd(S.annual.median)} a year, or ${hr(S.hourly.median)} an hour, in ${PAY_PERIOD}, the latest release.[^1][^3] The median for electricians was ${usd(E.annual.median)}.[^2] The gap, about ${usd(Math.round((S.annual.median - E.annual.median) / 100) * 100)} a year, is a fair first estimate of what the step up is worth nationally.`,
    },
    payTable([
      { w: S, source: 1 },
      { w: E, source: 2 },
    ]),
    {
      type: "p",
      text: "Real offers depend on how foremen are paid where you work. Union agreements usually set foreman pay as a premium over journeyman scale. Open-shop contractors negotiate it person by person, often with a truck and a bonus tied to how the job finishes.",
    },

    { type: "h2", text: "What license and certifications does an electrical foreman need?" },
    {
      type: "p",
      text: "Contractors do not hire foremen on a foreman license. They hire on the electrician's license for the state where the job is, plus proof that you have run work.",
    },
    {
      type: "p",
      text: "License rules differ by state. In Texas, for example, anyone doing electrical work must be licensed, and the journeyman license takes 8,000 hours of on-the-job training under a master electrician and a passed exam.[^4] The [journeyman electrician](/careers/journeyman-electrician) page covers licensing in more detail.",
    },
    {
      type: "p",
      text: "Postings for foremen commonly ask for OSHA 30 and NFPA 70E electrical safety training, as the employer or project owner requires.",
    },

    { type: "h2", text: "What skills get an electrical foreman hired?" },
    {
      type: "p",
      text: "Contractors hire foremen for one thing: steady production without injuries or rework. The skills behind it:",
    },
    {
      type: "ul",
      items: [
        "**Planning.** Looking three days ahead, so the crew never stands around waiting for material or a lift.",
        "**Reading the whole set.** The electrical drawings, plus enough of the structural and mechanical sheets to see a clash before it is built.",
        "**Teaching.** Getting good work out of apprentices and new hires.",
        "**Paperwork on time.** Timecards, dailies, quantities and tickets for extra work.",
        "**A level head.** With other trades, inspectors and the general contractor.",
      ],
    },

    { type: "h2", text: "What is the career path into and out of the foreman role?" },
    {
      type: "p",
      text: "Almost every foreman starts as a strong [journeyman electrician](/careers/journeyman-electrician) who was handed a small crew or a punch list and handled it well.",
    },
    {
      type: "p",
      text: "From foreman, the field path runs to general foreman and then electrical superintendent, where you run the whole site instead of one crew. The two jobs are compared in [electrical foreman vs superintendent](/blog/electrical-foreman-vs-superintendent).",
    },
    {
      type: "p",
      text: "Foremen also move into the office. People who like the numbers move into [estimating](/careers/electrical-estimator). People who like running the job become assistant project managers and then [project managers](/careers/electrical-project-manager).",
    },

    { type: "h2", text: "How are electrical foremen hired through recruiters?" },
    {
      type: "p",
      text: "Good foremen are usually working, so contractors seldom find them with a job ad. They find them through people: former coworkers, superintendents, and recruiters who keep track of who ran which job.",
    },
    {
      type: "p",
      text: "A recruiter at Delta Construction Partners will want specifics before introducing you to a contractor:",
    },
    {
      type: "ul",
      items: [
        "What size crew have you run, and for how long?",
        "What kind of projects: tenant fit-out, ground-up commercial, industrial, data center, health care?",
        "How did your last job finish on labor hours?",
        "Are you open to travel, or local work only?",
        "What is your pay now, including truck, per diem and bonus?",
      ],
    },
    {
      type: "p",
      text: "If you are employed and only want to hear about a better seat, mark yourself open to the right move when you [join ECRN](/signup). Only Delta's recruiters see it.",
    },

    { type: "h2", text: "What is the ECRN referral reward for an electrical foreman?" },
    {
      type: "p",
      text: `Foremen are Tier 2, field leadership: ${reward(1)} for each person you refer who is hired through Delta Construction Partners. The amount is an estimate, confirmed in writing before payout.`,
    },
    {
      type: "p",
      text: "It is paid after the foreman is placed and completes the guarantee period, typically 90 days. If two people refer the same foreman, the first verified referral on record keeps ownership. See [referral rewards](/referral-rewards) for the terms.",
    },
    {
      type: "cta",
      title: "Worked with a foreman worth following?",
      text: `Refer them with a name and a phone number. If Delta places them, you earn ${reward(1)}.`,
      href: "/signup",
      label: "Refer a foreman",
    },
  ],
  faqs: [
    {
      q: "How much do electrical foremen make?",
      a: `BLS does not track electrical foremen separately. Its closest occupation, first-line supervisors of construction trades and extraction workers (SOC ${S.soc}), had a national median of ${usd(S.annual.median)} a year, or ${hr(S.hourly.median)} an hour, in ${PAY_PERIOD}. The top 10 percent earned ${usd(S.annual.p90)} or more.`,
    },
    {
      q: "What is the difference between a foreman and a general foreman?",
      a: "A foreman runs one crew. A general foreman runs several foremen and their crews on a larger job and reports to the superintendent.",
    },
    {
      q: "Do I need a license to be an electrical foreman?",
      a: "You need the electrician license the state requires for the work, and the rules differ by state. In Texas, for example, anyone doing electrical work must hold a state license. Employers commonly add OSHA 30 and NFPA 70E training.",
    },
    {
      q: "What is the referral reward for an electrical foreman on ECRN?",
      a: `${TIERS[1].amount} per hire. The amount is an estimate that Delta Construction Partners confirms in writing, and it is paid after the foreman is placed and completes the guarantee period, typically 90 days.`,
    },
  ],
  sources: [wageSource(1, S), wageSource(2, E), oewsSource(3), tdlrJourneymanSource(4), supervisorProfileSource(5)],
  relatedPosts: [
    "electrical-foreman-vs-superintendent",
    "electrical-construction-resume-guide",
    "how-construction-referral-bonuses-work",
    "how-to-refer-someone-for-a-construction-job",
  ],
  relatedRoles: ["journeyman-electrician", "electrical-superintendent", "electrical-project-manager"],
  updatedAt: UPDATED,
};

// ─────────────────────────────────────────────────────────────────────
// 3. Electrical superintendent
// ─────────────────────────────────────────────────────────────────────

const superintendent: RoleEntry = {
  slug: "electrical-superintendent",
  title: "Electrical Superintendent",
  plural: "electrical superintendents",
  heading: "Electrical superintendent: role, pay and open jobs",
  metaTitle: "Electrical Superintendent: Pay, Role and Open Jobs | ECRN",
  description:
    "What an electrical superintendent does, the two BLS occupations that bracket the pay (May 2025), what contractors look for, and how these roles get filled.",
  summary: "Owns the field on a project: manpower, schedule, safety and quality, through the foremen.",
  answer: `An electrical superintendent runs all of an electrical contractor's field work on a project, or across several: manpower, schedule, safety, quality and coordination with the general contractor. BLS has no superintendent occupation, and its two closest, first-line construction supervisors and construction managers, had median wages of ${usd(S.annual.median)} and ${usd(M.annual.median)} a year in ${PAY_PERIOD}.`,
  tierIndex: 1,
  jobKeywords: ["superintendent"],
  image: "tower-crane-skyline",
  pay: [pay(S, 1, true), pay(M, 2, true)],
  body: [
    { type: "h2", text: "What does an electrical superintendent do day to day?" },
    {
      type: "p",
      text: "The superintendent owns the field. Foremen plan the day for their crews. The superintendent plans the weeks ahead for the whole job: how many electricians, in which areas, in what order, with what material and equipment.",
    },
    {
      type: "p",
      text: "A day usually starts with a walk of the site and a check-in with each foreman. Then come coordination meetings with the general contractor and the other trades, manpower calls with the office, and problem solving: a late gear delivery, a design change, an area that is not ready.",
    },
    {
      type: "p",
      text: "On a large data center, hospital or plant, one superintendent directs several general foremen and a very large crew. At a smaller contractor, one superintendent covers several jobs at once and spends much of the week in a truck.",
    },
    {
      type: "ul",
      items: [
        "Manpower plan and look-ahead schedule",
        "Site safety and incident follow-up",
        "Sequencing with the general contractor and other trades",
        "Quality walks, inspections and turnover to [commissioning](/glossary#commissioning)",
        "Labor tracking with the [project manager](/careers/electrical-project-manager)",
      ],
    },

    { type: "h2", text: "How much does an electrical superintendent make?" },
    {
      type: "p",
      text: `BLS does not publish a wage for electrical superintendents, and the job straddles two of its occupations. O*NET lists "site superintendent" among the titles under first-line supervisors of construction trades (SOC ${S.soc}), and "construction superintendent" and "general superintendent" under construction managers (SOC ${M.soc}).[^3][^4]`,
    },
    {
      type: "p",
      text: `In ${PAY_PERIOD}, the latest release, the national median was ${usd(S.annual.median)} a year for the supervisor occupation and ${usd(M.annual.median)} for construction managers.[^1][^2][^5] The top 10 percent of construction managers earned ${usd(M.annual.p90)} or more.[^2][^6]`,
    },
    payTable([
      { w: S, source: 1 },
      { w: M, source: 2 },
    ]),
    {
      type: "p",
      text: "Neither figure is specific to electrical work. Read them as a bracket: a superintendent running one mid-size job sits nearer the first, and a general superintendent on large projects nearer the second. Per diem on travel jobs, a vehicle and completion bonuses are negotiated on top.",
    },

    { type: "h2", text: "What license and certifications does an electrical superintendent need?" },
    {
      type: "p",
      text: "Experience is the real credential: years of running work as a foreman or general foreman on projects like the one being staffed. Many superintendents hold a journeyman or master license because they came up through the trade, and some contractors require it. License rules differ by state.",
    },
    {
      type: "p",
      text: "A degree is not the usual route. O*NET rates the supervisor occupation as needing on-the-job experience, vocational training or an associate's degree.[^3]",
    },
    {
      type: "p",
      text: "Postings commonly ask for OSHA 30 and NFPA 70E training. Project owners can add their own site requirements, especially on data center, industrial and government work.",
    },

    { type: "h2", text: "What skills get an electrical superintendent hired?" },
    {
      type: "p",
      text: "Contractors hire superintendents on track record. The questions are always the same: how big, how complex, and how did it finish?",
    },
    {
      type: "ul",
      items: [
        "**Manpower planning.** Staffing the job up and back down without waste.",
        "**Schedule sense.** Reading the general contractor's schedule and seeing where electrical will get squeezed.",
        "**Building foremen.** Superintendents are judged by the foremen they develop.",
        "**Safety leadership.** The kind that holds up on a bad day.",
        "**Field technology.** Scheduling tools, model-based layout ([BIM](/glossary#bim)) and planning for [prefabrication](/glossary#prefabrication).",
        "**Commercial sense.** Knowing what a change costs before agreeing to it.",
      ],
    },

    { type: "h2", text: "What is the career path to electrical superintendent and beyond?" },
    {
      type: "p",
      text: "The usual path is [journeyman electrician](/careers/journeyman-electrician), [electrical foreman](/careers/electrical-foreman), general foreman, then superintendent. The jump from foreman is the big one: you stop directing electricians and start directing the people who direct them.",
    },
    {
      type: "p",
      text: "Beyond the role, the next steps are general superintendent and director of field operations. For some it leads to vice president of operations, at the [executive level](/careers/electrical-construction-executive).",
    },

    { type: "h2", text: "How are electrical superintendents hired through recruiters?" },
    {
      type: "p",
      text: "Superintendent searches are quiet. The strongest candidates are running a job right now, and a contractor often cannot advertise the seat without unsettling its own people. Many of these roles are filled through recruiters and referrals, not applications.",
    },
    { type: "p", text: "Expect a recruiter at Delta Construction Partners to ask:" },
    {
      type: "ul",
      items: [
        "What were your last three projects, their electrical contract values and peak manpower?",
        "How many foremen and general foremen reported to you?",
        "How did each job finish on labor and schedule, and why?",
        "Will you relocate or travel, and on what rotation?",
        "What is your full package today: base, bonus, truck, per diem?",
      ],
    },
    {
      type: "p",
      text: "If you are employed, say so. On ECRN you can mark yourself open to the right move, which only Delta's recruiters see. There is more in [how to job search confidentially](/blog/how-to-job-search-confidentially).",
    },

    { type: "h2", text: "What is the referral reward for an electrical superintendent?" },
    {
      type: "p",
      text: `Superintendents are Tier 2, field leadership. If you refer one who is hired through Delta Construction Partners, the reward is ${reward(1)}. That figure is an estimate, and Delta confirms the amount in writing before payout.`,
    },
    {
      type: "p",
      text: "Payment comes after the superintendent is placed and completes the guarantee period, typically 90 days. The [referral rewards](/referral-rewards) page has the full terms.",
    },
    {
      type: "cta",
      title: "Know a superintendent who is ready for a bigger job?",
      text: `A name and a phone number is enough to refer them. If Delta places them, you earn ${reward(1)}.`,
      href: "/signup",
      label: "Refer a superintendent",
    },
  ],
  faqs: [
    {
      q: "How much does an electrical superintendent make?",
      a: `BLS has no electrical superintendent occupation. Its two closest are first-line supervisors of construction trades, with a median of ${usd(S.annual.median)} a year in ${PAY_PERIOD}, and construction managers, with a median of ${usd(M.annual.median)}. Which one fits depends on the size of the projects you run.`,
    },
    {
      q: "What is the difference between an electrical foreman and a superintendent?",
      a: "A foreman runs a crew and plans its day. A superintendent runs the whole electrical site through foremen and general foremen, and plans manpower, schedule and safety for the weeks ahead.",
    },
    {
      q: "Do electrical superintendents need a degree?",
      a: "Usually not. Most come up through the trade as electricians and foremen, and contractors hire on project track record. O*NET rates the related supervisor occupation as needing on-the-job experience, vocational training or an associate's degree.",
    },
    {
      q: "What is the referral reward for an electrical superintendent on ECRN?",
      a: `${TIERS[1].amount} per hire. The amount is an estimate, confirmed in writing by Delta Construction Partners, and paid after the superintendent is placed and completes the guarantee period, typically 90 days.`,
    },
  ],
  sources: [wageSource(1, S), wageSource(2, M), supervisorProfileSource(3), managerProfileSource(4), oewsSource(5), oohSource(6, "managers")],
  relatedPosts: [
    "electrical-foreman-vs-superintendent",
    "data-center-construction-electrical-jobs",
    "how-to-job-search-confidentially",
    "are-construction-recruiters-worth-it",
  ],
  relatedRoles: ["electrical-foreman", "electrical-project-manager", "electrical-construction-executive"],
  updatedAt: UPDATED,
};

// ─────────────────────────────────────────────────────────────────────
// 4. Electrical estimator
// ─────────────────────────────────────────────────────────────────────

const estimator: RoleEntry = {
  slug: "electrical-estimator",
  title: "Electrical Estimator",
  plural: "electrical estimators",
  heading: "Electrical estimator: role, salary and open jobs",
  metaTitle: "Electrical Estimator: Salary, Skills and Open Jobs | ECRN",
  description:
    "What an electrical estimator does from takeoff to bid day, BLS salary data for cost estimators (May 2025), the software and skills that get you hired.",
  summary: "Prices the work before it is won: takeoff, labor, material, risk and the final number.",
  answer: `An electrical estimator works out what a project will cost an electrical contractor to build, by counting every fixture, device and foot of conduit and wire on the drawings and pricing the material, labor and risk. BLS groups the job under cost estimators, whose median wage was ${usd(C.annual.median)} a year in ${PAY_PERIOD}.`,
  tierIndex: 2,
  jobKeywords: ["estimator", "estimating", "preconstruction"],
  image: "estimating-desk",
  pay: [pay(C, 1, true)],
  body: [
    { type: "h2", text: "What does an electrical estimator do day to day?" },
    {
      type: "p",
      text: "An estimator's product is a number the company can win with and still make money on. It starts with the bid documents: drawings, specifications and addenda. You read all of them, including the sheets that are not electrical.",
    },
    {
      type: "p",
      text: "Then comes the [takeoff](/glossary#takeoff): counting fixtures, devices, panels and gear, and measuring conduit and wire runs, usually on screen. Estimating software turns those quantities into material cost and labor hours. You add supplier quotes for gear and lighting, subcontractor prices, equipment, and job costs such as supervision and temporary power.",
    },
    {
      type: "p",
      text: "The last day is judgment: how hard the site is, how complete the drawings are, how much the company wants the job. The estimator, the chief estimator and often an owner settle the final number, and the [bid](/glossary#bid) goes out.",
    },
    {
      type: "p",
      text: "After a win, the estimator hands the job to the [project manager](/careers/electrical-project-manager) with the assumptions spelled out, and often prices [change orders](/glossary#change-order) for the life of the project.",
    },

    { type: "h2", text: "How much does an electrical estimator make?" },
    {
      type: "p",
      text: `BLS has no electrical-only estimator occupation. It publishes Cost Estimators (SOC ${C.soc}), which covers estimators in every industry and not only electrical contracting. The national median was ${usd(C.annual.median)} a year in ${PAY_PERIOD}, the latest release.[^1][^2]`,
    },
    {
      type: "p",
      text: `The lowest-paid 10 percent earned ${usd(C.annual.p10)} or less, and the highest-paid 10 percent earned ${usd(C.annual.p90)} or more.[^3] Specialty trade contractors, the BLS group that includes electrical contractors, employ 33 percent of cost estimators, and the median there was $80,330.[^3]`,
    },
    payTable([{ w: C, source: 1 }]),
    {
      type: "p",
      text: "Where you land depends mostly on the size and type of work you price: takeoff on small commercial jobs toward the lower half, and carrying a hospital, plant or data center bid alone, or leading [design-build](/glossary#design-build) pricing, toward the top.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "One caution on the outlook",
      text: "BLS projects employment of cost estimators to decline 3 percent from 2025 to 2035, because estimating software lets fewer people price the same work. It still expects about 17,600 openings a year as estimators retire or move on.[^3]",
    },

    { type: "h2", text: "What does an electrical estimator need to qualify?" },
    {
      type: "p",
      text: "Contractors do not ask estimators for a license. They ask for proof that you can price work accurately. There are two common ways in.",
    },
    {
      type: "ul",
      items: [
        "**From the field.** Electricians and foremen who know how the work goes in, and learn the pricing side.",
        "**From school.** Construction management or engineering graduates who start as junior estimators or project engineers.",
      ],
    },
    {
      type: "p",
      text: "BLS says cost estimators typically need a bachelor's degree, although people with several years of construction experience sometimes qualify without one.[^3]",
    },
    {
      type: "p",
      text: "The tools are estimating programs built for electrical contractors, such as Accubid, McCormick and ConEst, plus on-screen takeoff, spreadsheets, and enough [BIM](/glossary#bim) to pull quantities from a model. Postings usually name the software the company runs.",
    },

    { type: "h2", text: "What skills get an electrical estimator hired?" },
    {
      type: "ul",
      items: [
        "**Accurate takeoff at speed.** Bid day does not move.",
        "**Labor hours you can defend.** Knowing when the book number is wrong for this job.",
        "**Scope reading.** Finding the gaps between the drawings and the specifications before they become your cost.",
        "**Code knowledge.** Knowing the National Electrical Code well enough to catch what the drawings left out.",
        "**Clean handoffs.** So the project team builds what was priced.",
      ],
    },

    { type: "h2", text: "What is the career path for an electrical estimator?" },
    {
      type: "p",
      text: "The ladder runs from junior estimator to estimator, senior estimator and chief estimator, then director or vice president of preconstruction. At the top the job is less about counting and more about choosing which work to chase. That is an [executive role](/careers/electrical-construction-executive).",
    },
    {
      type: "p",
      text: "Estimators often move sideways into project management, because they already know the budget line by line.",
    },
    {
      type: "p",
      text: "Coming from the field? [Journeyman electricians](/careers/journeyman-electrician) and [foremen](/careers/electrical-foreman) who are good with drawings and numbers are a natural fit.",
    },

    { type: "h2", text: "How are electrical estimators hired through recruiters?" },
    {
      type: "p",
      text: "Estimating departments are small. When a senior estimator leaves, the company bids less work until the seat is filled, which is why contractors turn to recruiters.",
    },
    { type: "p", text: "A recruiter at Delta Construction Partners will ask:" },
    {
      type: "ul",
      items: [
        "What size and type of projects have you bid on your own?",
        "How much did you bid last year, and how much of it was won?",
        "Hard bid, negotiated, design-build or [design-assist](/glossary#design-assist)?",
        "Which estimating software do you use every day?",
        "What is your pay now, and is any of it tied to work won?",
      ],
    },
    {
      type: "p",
      text: "Bring a simple bid list: project, size, your role and the result. Leave out anything confidential.",
    },

    { type: "h2", text: "What is the referral reward for an electrical estimator?" },
    {
      type: "p",
      text: `Estimators at every level are Tier 3, office positions. The reward for referring one who is hired through Delta Construction Partners is ${reward(2)}. It is an estimate, and the amount is confirmed in writing before payout.`,
    },
    {
      type: "p",
      text: "Delta pays it after the estimator is placed and completes the guarantee period, typically 90 days. See [referral rewards](/referral-rewards) for how it works.",
    },
    {
      type: "cta",
      title: "Know an estimator who hits the number?",
      text: `Refer them with a name and a phone number. If Delta places them, you earn ${reward(2)}.`,
      href: "/signup",
      label: "Refer an estimator",
    },
  ],
  faqs: [
    {
      q: "How much does an electrical estimator make?",
      a: `BLS publishes one figure for cost estimators in all industries (SOC ${C.soc}): a national median of ${usd(C.annual.median)} a year in ${PAY_PERIOD}, with the top 10 percent at ${usd(C.annual.p90)} or more.`,
    },
    {
      q: "Do you need to be an electrician to become an electrical estimator?",
      a: "No, but it helps. Many estimators come from the field and already know how the work is installed. Others start with a construction management or engineering degree and learn installation on the job.",
    },
    {
      q: "What is the difference between an estimator and a project manager?",
      a: "The estimator prices the job before it is won. The project manager runs the job after it is won and is responsible for finishing it at or under that price. At small contractors one person may do both.",
    },
    {
      q: "What is the referral reward for an electrical estimator on ECRN?",
      a: `${TIERS[2].amount} per hire, for estimators at any level. The amount is an estimate, confirmed in writing by Delta Construction Partners, and paid after the estimator is placed and completes the guarantee period, typically 90 days.`,
    },
  ],
  sources: [wageSource(1, C), oewsSource(2), oohSource(3, "estimators")],
  relatedPosts: [
    "recruiter-vs-job-board-vs-referral-network",
    "electrical-construction-resume-guide",
    "are-construction-recruiters-worth-it",
    "electrical-project-manager-salary",
  ],
  relatedRoles: ["electrical-project-manager", "electrical-foreman", "electrical-construction-executive"],
  updatedAt: UPDATED,
};

// ─────────────────────────────────────────────────────────────────────
// 5. Electrical project manager
// ─────────────────────────────────────────────────────────────────────

const projectManager: RoleEntry = {
  slug: "electrical-project-manager",
  title: "Electrical Project Manager",
  plural: "electrical project managers",
  heading: "Electrical project manager: role, salary and open jobs",
  metaTitle: "Electrical Project Manager: Salary, Role & Jobs | ECRN",
  description:
    "What an electrical project manager does, BLS salary data for construction managers (May 2025), the field and degree routes in, and how contractors hire PMs.",
  summary: "Owns the contract and the money: budget, buyout, schedule, billing and change orders.",
  answer: `An electrical project manager runs the business side of an electrical contractor's projects: contract, budget, schedule, purchasing, billing and change orders, alongside the superintendent who runs the field. BLS counts the job under construction managers, whose median wage was ${usd(M.annual.median)} a year in ${PAY_PERIOD}.`,
  tierIndex: 2,
  jobKeywords: ["project manager"],
  image: "site-office-plans",
  pay: [pay(M, 1, true)],
  body: [
    { type: "h2", text: "What does an electrical project manager do day to day?" },
    {
      type: "p",
      text: "A project manager is responsible for the job making money. The estimate becomes a budget, the budget becomes a plan, and every week you find out whether reality agrees.",
    },
    {
      type: "ul",
      items: [
        "**Buyout.** Purchase orders for switchgear, lighting and other major packages, and tracking deliveries. Long-lead gear often decides the schedule.",
        "**Paper.** [Submittals](/glossary#submittal), RFIs, meeting minutes and the schedule.",
        "**Money.** Monthly billing, cost reports, labor tracking and cash flow.",
        "**Changes.** Pricing and negotiating [change orders](/glossary#change-order), and getting them signed before the work is done.",
        "**People.** The customer, the general contractor, the engineer, suppliers, and your own superintendent and foremen.",
      ],
    },
    {
      type: "p",
      text: "A PM may run a single large project for years, or many small ones at once.",
    },

    { type: "h2", text: "How much does an electrical project manager make?" },
    {
      type: "p",
      text: `BLS has no electrical project manager occupation. The closest is Construction Managers (SOC ${M.soc}), which covers managers across all types of construction. Its national median was ${usd(M.annual.median)} a year in ${PAY_PERIOD}, the latest release.[^1][^4]`,
    },
    {
      type: "p",
      text: `The lowest-paid 10 percent earned ${usd(M.annual.p10)} or less, and the highest-paid 10 percent earned ${usd(M.annual.p90)} or more.[^5] At specialty trade contractors, the BLS group that includes electrical contractors, the median was $104,100.[^5]`,
    },
    payTable([{ w: M, source: 1 }]),
    {
      type: "p",
      text: "That spread roughly follows career stage, from assistant project managers to senior project managers and project executives. BLS notes that construction managers may also earn bonuses.[^5] Ask how yours is calculated, when it is paid, and what it was in a bad year.",
    },
    {
      type: "p",
      text: "Demand is growing: BLS projects employment of construction managers to rise 9 percent from 2025 to 2035, much faster than average, with about 49,700 openings a year.[^5] The [electrical project manager salary](/blog/electrical-project-manager-salary) guide breaks the pay numbers down further.",
    },

    { type: "h2", text: "What education and certifications does an electrical project manager need?" },
    {
      type: "p",
      text: "There are two routes. One runs from the field: electrician, foreman, assistant project manager, project manager. The other runs from a construction management or engineering degree through a [project engineer](/glossary#project-engineer) seat.",
    },
    {
      type: "p",
      text: "BLS says construction managers typically need a bachelor's degree, and that large firms may prefer candidates with both construction experience and a construction-related degree.[^5] The Department of Labor's My Next Move profile adds that almost all positions require extensive construction experience, and that smaller projects are run with less formal education.[^2]",
    },
    {
      type: "p",
      text: "BLS notes that some states require construction managers to be licensed, so check the state where you work.[^5] Postings commonly ask for OSHA 30, and some ask for a project management credential. Project history carries more weight than either.",
    },

    { type: "h2", text: "What skills get an electrical project manager hired?" },
    {
      type: "ul",
      items: [
        "**Cost control.** Knowing where every job stands on labor and material this week, without being asked.",
        "**Change order discipline.** Documenting, pricing and collecting for extra work.",
        "**Contract reading.** Knowing what was signed, especially notice deadlines and payment terms.",
        "**Procurement.** Seeing a late delivery months before it hurts.",
        "**Repeat customers.** A customer who asks for you again is the best reference a PM has.",
      ],
    },

    { type: "h2", text: "What is the career path for an electrical project manager?" },
    {
      type: "p",
      text: "The ladder runs from project engineer or assistant project manager to project manager, senior project manager, then project executive or operations manager, and on to [vice president](/careers/electrical-construction-executive).",
    },
    {
      type: "p",
      text: "People arrive from two directions: [foremen](/careers/electrical-foreman) and superintendents who want to move inside, and [estimators](/careers/electrical-estimator) who want to run the work they price.",
    },
    {
      type: "p",
      text: `Moving from the field to project management is not automatically a raise. The top 10 percent of construction supervisors earn ${usd(S.annual.p90)} or more, above the median for construction managers.[^3] People make the move for the longer runway, not the first paycheck.`,
    },

    { type: "h2", text: "How are electrical project managers hired through recruiters?" },
    {
      type: "p",
      text: "Contractors lean on recruiters for project managers because a good one is already employed, already busy and not reading job boards.",
    },
    { type: "p", text: "A recruiter at Delta Construction Partners will ask:" },
    {
      type: "ul",
      items: [
        "What were your largest projects by electrical contract value, and what was your role on each?",
        "How many projects, and how much volume, do you carry at once?",
        "How did your last three jobs finish against the budgeted margin?",
        "Which software do you run projects in?",
        "Why would you leave, and what would make you stay?",
      ],
    },
    {
      type: "p",
      text: "On ECRN you can mark yourself open to the right move, which only Delta's recruiters see. See also [how to job search confidentially](/blog/how-to-job-search-confidentially).",
    },

    { type: "h2", text: "What is the referral reward for an electrical project manager?" },
    {
      type: "p",
      text: `Project managers at every level are Tier 3, office positions: ${reward(2)} when someone you refer is hired through Delta Construction Partners. The figure is an estimate, and Delta confirms the amount in writing.`,
    },
    {
      type: "p",
      text: "You are paid after the project manager is placed and completes the guarantee period, typically 90 days. The terms are on the [referral rewards](/referral-rewards) page.",
    },
    {
      type: "cta",
      title: "Know a project manager who brings jobs in on budget?",
      text: `Refer them with a name and a phone number. If Delta places them, you earn ${reward(2)}.`,
      href: "/signup",
      label: "Refer a project manager",
    },
  ],
  faqs: [
    {
      q: "How much does an electrical project manager make?",
      a: `BLS has no electrical-only figure. For construction managers (SOC ${M.soc}), the national median was ${usd(M.annual.median)} a year in ${PAY_PERIOD}. The lowest-paid 10 percent earned ${usd(M.annual.p10)} or less and the highest-paid 10 percent earned ${usd(M.annual.p90)} or more.`,
    },
    {
      q: "Do you need a degree to be an electrical project manager?",
      a: "Not always. The Department of Labor's My Next Move profile of construction managers says almost all positions require extensive construction experience, with formal education ranging from a bachelor's degree for the biggest projects to a high school diploma for smaller ones.",
    },
    {
      q: "What is the difference between an electrical project manager and a superintendent?",
      a: "The project manager owns the contract, budget, purchasing and billing. The superintendent owns the field: manpower, schedule, safety and quality. They run the job together.",
    },
    {
      q: "What is the referral reward for an electrical project manager on ECRN?",
      a: `${TIERS[2].amount} per hire, for project managers at any level. The amount is an estimate, confirmed in writing by Delta Construction Partners, and paid after the person is placed and completes the guarantee period, typically 90 days.`,
    },
  ],
  sources: [wageSource(1, M), managerProfileSource(2), wageSource(3, S), oewsSource(4), oohSource(5, "managers")],
  relatedPosts: [
    "electrical-project-manager-salary",
    "how-to-job-search-confidentially",
    "recruiter-vs-job-board-vs-referral-network",
    "electrical-construction-resume-guide",
  ],
  relatedRoles: ["electrical-estimator", "electrical-superintendent", "electrical-construction-executive"],
  updatedAt: UPDATED,
};

// ─────────────────────────────────────────────────────────────────────
// 6. Electrical construction executive
// ─────────────────────────────────────────────────────────────────────

const executive: RoleEntry = {
  slug: "electrical-construction-executive",
  title: "Electrical Construction Executive",
  plural: "electrical construction executives",
  heading: "Electrical construction executive roles: VP, COO and CEO",
  metaTitle: "Electrical Construction Executive Jobs: VP, COO, CEO | ECRN",
  description:
    "What vice presidents, COOs and CEOs do at electrical contractors, BLS pay data for executives (May 2025), how people reach these roles and how they are filled.",
  summary: "Runs the contractor as a business: strategy, profit, key customers and the leadership team.",
  answer: `Electrical construction executives, such as vice presidents, chief operating officers and chief executives, run an electrical contractor as a business: strategy, profit and loss, key customers, risk and the leadership team. Across all industries, BLS reported a median wage of ${usd(X.annual.median)} a year for chief executives and ${usd(G.annual.median)} for general and operations managers in ${PAY_PERIOD}.`,
  tierIndex: 3,
  jobKeywords: ["vice president", "vp", "president", "chief executive", "chief operating", "ceo", "executive", "director"],
  image: "office-overlook-night",
  pay: [pay(X, 1, true), pay(G, 2, true)],
  body: [
    { type: "h2", text: "What do electrical construction executives do?" },
    {
      type: "p",
      text: "Titles vary with company size, so look at what the person is accountable for.",
    },
    {
      type: "table",
      head: ["Title", "Accountable for"],
      rows: [
        ["Vice president of operations", "Every project and project manager in a region or division, and the margin across them"],
        ["Vice president of preconstruction", "Which work to pursue, the final bid numbers and the estimating team"],
        ["Chief operating officer", "The whole operation: field, project management, safety, purchasing and prefabrication"],
        ["Chief executive officer or president", "Strategy, ownership, banking and bonding relationships, senior hires and the largest customers"],
      ],
    },
    {
      type: "p",
      text: "Day to day, the work is decisions made from numbers: backlog, job cost reports, cash, safety results and staffing. Executives decide which markets to enter, which jobs to walk away from and who gets promoted.",
    },

    { type: "h2", text: "How much do electrical construction executives make?" },
    {
      type: "p",
      text: `BLS has no occupation for electrical contractor executives, so the best public figures are two all-industry occupations. Chief Executives (SOC ${X.soc}) had a national median of ${usd(X.annual.median)} a year in ${PAY_PERIOD}.[^1][^6] General and Operations Managers (SOC ${G.soc}), the closer match for many vice president and operations roles, had a median of ${usd(G.annual.median)}.[^2][^6]`,
    },
    payTable([
      { w: X, source: 1 },
      { w: G, source: 2 },
    ]),
    {
      type: "p",
      text: `Both occupations cover every industry and every size of organization, which is why the ranges are so wide: from ${usd(X.annual.p10)} to ${usd(X.annual.p90)} for chief executives at the 10th and 90th percentiles.[^1] ${PAY_PERIOD} is the latest release.[^5]`,
    },
    {
      type: "p",
      text: "At this level, salary is one line of the offer. Compare the whole package: bonus plan, profit sharing, vehicle, and any ownership or long-term incentive. Get it in writing.",
    },

    { type: "h2", text: "What background do electrical construction executives need?" },
    {
      type: "p",
      text: "No license or degree makes someone an executive, though BLS notes that top executives typically have at least a bachelor's degree and considerable work experience.[^6] Owners and boards hire on results: the size of the business or division you have run, its margin, its safety record, and the people who followed you.",
    },
    {
      type: "p",
      text: "The common routes are through [project management](/careers/electrical-project-manager), through [estimating](/careers/electrical-estimator) and preconstruction, or through the field as a [superintendent](/careers/electrical-superintendent) and director of field operations.",
    },
    {
      type: "p",
      text: "Licensing matters at the company level. In Texas, an electrical contractor must employ a licensed master electrician of record, and must name a new one within 30 business days if that person leaves.[^3] California classifies electrical contractors under its C-10 license.[^4]",
    },

    { type: "h2", text: "What skills get an executive hired by an electrical contractor?" },
    {
      type: "ul",
      items: [
        "**Profit and loss ownership.** A division or company you ran, with numbers you can explain.",
        "**Risk judgment.** Contract terms, job selection, and knowing when not to bid.",
        "**Building leaders.** Project managers, superintendents and estimators who grew under you.",
        "**Customer relationships.** The kind that produce negotiated and repeat work.",
        "**Operational discipline.** Safety, [prefabrication](/glossary#prefabrication), purchasing and labor productivity run as systems.",
      ],
    },

    { type: "h2", text: "What is the path into an executive role, and what comes after?" },
    {
      type: "p",
      text: "Most people reach the executive level by running bigger and bigger pieces of the same business: a project, then a group of projects, then a division. The step that matters is the first one with full profit and loss responsibility.",
    },
    {
      type: "p",
      text: "After that, the moves are a larger scope, a larger contractor, or ownership. In founder-owned and family-owned contractors, succession is often the reason an executive seat opens.",
    },

    { type: "h2", text: "How are electrical construction executives hired?" },
    {
      type: "p",
      text: "Executive roles are rarely advertised. They are filled through the owner's network or through a recruiter running a [confidential search](/glossary#confidential-search), often a [retained search](/glossary#retained-search). Neither the company nor the candidate wants the search known.",
    },
    { type: "p", text: "A senior recruiter at Delta Construction Partners will go deeper than a resume:" },
    {
      type: "ul",
      items: [
        "What revenue, headcount and margin were you accountable for?",
        "What did the business look like when you took it over, and when you left?",
        "Have you managed through a bad job or a down cycle, and what did you do?",
        "What would the right role look like: scope, location, equity?",
      ],
    },
    {
      type: "p",
      text: "On ECRN, an employed executive can mark themselves open to the right move, and only Delta's recruiters see it. Your current employer is never contacted.",
    },

    { type: "h2", text: "What is the referral reward for an executive hire?" },
    {
      type: "p",
      text: `Executive leadership is Tier 4, the top tier: ${reward(3)} when a vice president, chief operating officer or chief executive you refer is hired through Delta Construction Partners. The amount is an estimate, confirmed in writing before payout.`,
    },
    {
      type: "p",
      text: "It is paid after the executive is placed and completes the guarantee period, typically 90 days. Read the terms on the [referral rewards](/referral-rewards) page.",
    },
    {
      type: "cta",
      title: "Know a leader who should be running more?",
      text: `Refer them quietly with a name and a phone number. If Delta places them, you earn ${reward(3)}.`,
      href: "/signup",
      label: "Refer an executive",
    },
  ],
  faqs: [
    {
      q: "How much do electrical construction executives make?",
      a: `There is no public figure specific to electrical contractors. Across all industries, BLS reported a median of ${usd(X.annual.median)} a year for chief executives and ${usd(G.annual.median)} for general and operations managers in ${PAY_PERIOD}. Bonus, profit sharing and ownership are negotiated on top.`,
    },
    {
      q: "Which titles count as executive roles at an electrical contractor?",
      a: "Vice president, chief operating officer, chief executive officer and president, along with senior leaders who run a division or region. On ECRN these are Tier 4, executive leadership.",
    },
    {
      q: "Are executive jobs in electrical construction posted publicly?",
      a: "Rarely. Most are filled through networks and confidential searches, because neither the company nor the candidate wants the search known. That is why a referral from someone trusted carries weight at this level.",
    },
    {
      q: "How do I refer an executive on ECRN?",
      a: "Enter their name and phone number in your ECRN account, or pick them from your phone's contacts. Refer people you actually know, and Delta's recruiters take it from there.",
    },
    {
      q: "What is the referral reward for an executive hire on ECRN?",
      a: `${TIERS[3].amount} per hire, the top tier. The amount is an estimate, confirmed in writing by Delta Construction Partners, and paid after the executive is placed and completes the guarantee period, typically 90 days.`,
    },
  ],
  sources: [
    wageSource(1, X),
    wageSource(2, G),
    {
      id: 3,
      publisher: "Texas Department of Licensing and Regulation",
      title: "Apply for a New Electrical Contractor License",
      url: "https://www.tdlr.texas.gov/electricians/apply/businesses/contractor-elec.htm",
      accessed: READ,
      note: "A Texas electrical contractor must employ a licensed master electrician of record and designate a new one within thirty business days if that person leaves.",
    },
    californiaSource(4),
    oewsSource(5),
    oohSource(6, "executives"),
  ],
  relatedPosts: [
    "how-to-job-search-confidentially",
    "are-construction-recruiters-worth-it",
    "recruiter-vs-job-board-vs-referral-network",
    "is-ecrn-legit",
  ],
  relatedRoles: ["electrical-project-manager", "electrical-estimator", "electrical-superintendent"],
  updatedAt: UPDATED,
};

/** Career pages, in career-path order (field → leadership → office → executive). */
export const ROLES: RoleEntry[] = [journeyman, foreman, superintendent, estimator, projectManager, executive];

export function getRole(slug: string): RoleEntry | undefined {
  return ROLES.find((r) => r.slug === slug);
}

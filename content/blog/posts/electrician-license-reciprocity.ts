import type { BlogPost } from "@/lib/blog/types";

export const electricianLicenseReciprocity: BlogPost = {
  slug: "electrician-license-reciprocity",
  title: "Electrician license reciprocity: moving your license to a new state",
  metaTitle: "Electrician License Reciprocity: State Examples | ECRN",
  description:
    "Reciprocity lets some electricians get licensed in a new state without retesting. Agreements from Texas and Minnesota, and a checklist for moving.",
  category: "licensing",
  targetQuery: "electrician license reciprocity",
  secondaryQueries: [
    "electrician reciprocity by state",
    "transfer electrician license to another state",
    "Texas electrician reciprocity states",
    "Minnesota electrician license reciprocity",
    "does California have electrician reciprocity",
    "journeyman license reciprocity",
  ],
  answer:
    "Electrician license reciprocity is an agreement that lets an electrician licensed in one state get the same license in another without retaking the exam, usually after holding the original license, earned by exam, for at least a year. Agreements are state by state and license by license: Texas accepts journeyman licenses from ten states, while California requires its own exam even if you hold another state's license.",
  keyTakeaways: [
    "Reciprocity covers specific license types between specific states: Texas and Minnesota accept different lists, and neither lists the other.",
    "Texas accepts journeyman licenses from 10 states and master licenses from 9; Minnesota accepts journeyworker licenses from 9 states and master licenses from 4.",
    "Both require that you passed a state-level exam and held the license for at least a year.",
    "California has no reciprocity route: out-of-state electricians must pass its certification exam before working for a C-10 contractor.",
    "Agreements change, so confirm with the board before you accept a job that depends on a transfer.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-license-reciprocity",
  body: [
    { type: "h2", text: "What is electrician license reciprocity?" },
    {
      type: "p",
      text: "Reciprocity is an agreement under which one state's board licenses an electrician who is already licensed in another state, usually without a new exam. Minnesota puts it plainly: applicants “may obtain a Minnesota journeyworker electrician license without examination if they obtained their journeyworker electrician license by examination” in a state on its list.[^1]",
    },
    {
      type: "p",
      text: "It is not a national license. You still apply to the new state, pay its fees and follow its renewal rules. Minnesota, for example, requires reciprocity licensees to meet all of its continuing education and renewal requirements.[^1]",
    },
    { type: "h2", text: "Which states have electrician reciprocity agreements?" },
    {
      type: "p",
      text: "Each state board publishes its own list, and the lists differ. Here are two, as published on November 20, 2026.",
    },
    {
      type: "table",
      caption: "Reciprocity lists from two state boards, November 2026",
      head: ["Board", "Journeyman licenses accepted from", "Master licenses accepted from"],
      rows: [
        [
          "Texas, TDLR[^2]",
          "Alabama, Alaska, Arkansas, Idaho, Iowa, Nebraska, New Mexico, Oklahoma, South Dakota, Wyoming",
          "Alabama, Arkansas, Iowa (Class A), Louisiana and Mississippi (state contractor's license), Nebraska, North Carolina (master or unlimited electrical contractor), Ohio, Tennessee (electrical contractor)",
        ],
        [
          "Minnesota, DLI[^1]",
          "Alaska, Arkansas, Colorado, Iowa, Montana, Nebraska, North Dakota, South Dakota, Wyoming",
          "Iowa, Nebraska, North Dakota, South Dakota",
        ],
      ],
      note: "Agreements change. Confirm the current list with the board before you rely on it.",
    },
    {
      type: "p",
      text: "Read the lists closely. Colorado is on Minnesota's journeyworker list but not on Texas's, Oklahoma is on Texas's but not Minnesota's, and neither state lists the other.[^1][^2] Texas says it has no reciprocal agreements for any license type other than master and journeyman electrician.[^2]",
    },
    {
      type: "p",
      text: "Minnesota also lets holders of the equivalent of a Minnesota master license in its listed journeyworker states obtain a Minnesota journeyworker license under the agreements.[^1]",
    },
    { type: "h2", text: "What do you need to qualify for reciprocity?" },
    {
      type: "p",
      text: "For a journeyman license, Texas wants proof that you passed the other state's exam, held that license for at least a year and have at least 8,000 hours under a master electrician. The application fee is $30, and TDLR contacts your state to confirm your exam, your license and your standing.[^2] Our [Texas electrician license guide](/blog/how-to-get-an-electrician-license-in-texas) covers the rest of the Texas process.",
    },
    {
      type: "p",
      text: "For a master license, Texas adds 12,000 hours, two years as a journeyman (one year for Alabama, Iowa, Mississippi, Nebraska, Ohio and Tennessee) and a letter of good standing showing you passed the statewide exam, with a $45 fee. Louisiana applicants must be Louisiana residents.[^2]",
    },
    {
      type: "p",
      text: "Minnesota requires a license earned by exam at the state level, not one obtained through an agreement with a city or other political subdivision, held for at least one year and current and in good standing. You must not have failed the same or a higher class of Minnesota exam, and you pay a $50 application and examination fee, then the license fee once approved.[^1]",
    },
    {
      type: "p",
      text: "The pattern across both: an exam-based state license, at least a year of holding it, and a clean record.",
    },
    { type: "h2", text: "What happens if your new state has no agreement with yours?" },
    {
      type: "p",
      text: "You test. California requires electricians who work for C-10 contractors to be certified, and DIR says out-of-state electricians “need to be certified before they can start working in California, there is no grace period.” Another state's license makes you eligible to sit for the exam.[^3] Our [California electrician license guide](/blog/how-to-get-an-electrician-license-in-california) walks through it.",
    },
    {
      type: "p",
      text: "Florida works differently because its journeyman licenses are local. DBPR tells out-of-state journeymen to contact the county licensing office where they plan to work.[^4] Inside Florida, counties and cities must recognize a journeyman license issued by another Florida county or city.[^5] Our [Florida electrician license guide](/blog/how-to-get-an-electrician-license-in-florida) covers both levels.",
    },
    {
      type: "p",
      text: "For electrical contractors, Florida offers endorsement: 10 years licensed in another state with a similar scope, or a passed exam DBPR rates as substantially similar to Florida's plus Florida's experience rule. DBPR says the review can take several months.[^4]",
    },
    {
      type: "p",
      text: "Business licenses are a separate question. Texas has no path for transferring an electrical contracting business license.[^6]",
    },
    { type: "h2", text: "How do you move your electrician license to another state?" },
    {
      type: "p",
      text: "Before you apply to [open electrical jobs](/jobs) in another state, work through this list.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Find the board and the local office",
          text: "Look up the new state's licensing board, then ask whether the county or city also licenses electricians. In Florida, journeyman licenses come from counties and cities, not the state.[^4]",
        },
        {
          title: "Match your exact license type",
          text: "Agreements name license types. Texas has none beyond journeyman and master electrician, and its master agreement with Iowa covers Class A licenses only.[^2]",
        },
        {
          title: "Request a letter of good standing",
          text: "Texas requires master applicants to get one from their home state, showing they passed the statewide exam, and wants it in the same envelope as the rest of the application.[^2] Ask early.",
        },
        {
          title: "Gather proof of your hours",
          text: "Keep W-2s, pay records and letters from employers. Florida's contractor endorsement asks for W-2 forms, employer-signed verification forms and job lists,[^4] and California's exam application needs a Social Security employment history report.[^3]",
        },
        {
          title: "Keep your home license active",
          text: "Minnesota requires your original license to be current and in good standing,[^1] and Florida's 10-year endorsement route needs a license that was current within the last two years.[^4]",
        },
        {
          title: "Budget time and fees",
          text: "Application fees run from $30 for a Texas journeyman[^2] to $492 for a Florida contractor endorsement, and Florida says its review can take several months.[^4]",
        },
        {
          title: "Do not start work early",
          text: "Texas and California both say there is no grace period: hold the license or certification before you do any electrical work.[^6][^3]",
        },
      ],
    },
    {
      type: "p",
      text: "If the move is for a job, our guide to [relocating for a construction job](/blog/relocating-for-a-construction-job) covers the rest of the move.",
    },
    {
      type: "p",
      text: "If it is a traveling assignment, read how [traveling electrician per diem](/blog/traveling-electrician-per-diem) works before you sign.",
    },
    { type: "h2", text: "When should you just take the new state's exam?" },
    {
      type: "p",
      text: "When your license will not qualify. Texas requires that you passed the other state's exam, and Minnesota rules out licenses obtained through an agreement with a city or other political subdivision, so a license you got without a state exam may not carry over.[^1][^2]",
    },
    {
      type: "p",
      text: "Also when your state is not on the list, or when you have already failed the new state's exam: Minnesota disqualifies anyone who failed the same or a higher class of its exam.[^1]",
    },
    {
      type: "p",
      text: "License levels do not line up neatly between states either. Our [journeyman vs master electrician](/blog/journeyman-vs-master-electrician) comparison shows how Texas, Minnesota and Florida each handle the two levels.",
    },
    {
      type: "cta",
      title: "Planning a move for work?",
      text: "Browse open electrical construction jobs, and check which license each one requires before you apply.",
      href: "/jobs",
      label: "See open jobs",
    },
  ],
  faqs: [
    {
      q: "Do electrician licenses transfer between states?",
      a: "Only where the two states have an agreement covering your license type, or where the new state offers another route such as endorsement. Otherwise you apply and test in the new state.",
    },
    {
      q: "Which states have electrician reciprocity with Texas?",
      a: "For journeyman licenses: Alabama, Alaska, Arkansas, Idaho, Iowa, Nebraska, New Mexico, Oklahoma, South Dakota and Wyoming. For master licenses, nine states, including Alabama, Ohio and Tennessee, as listed by TDLR in November 2026.",
    },
    {
      q: "Does California have electrician reciprocity?",
      a: "No. Out-of-state electricians must pass California's certification exam before working for a C-10 contractor; another state's license only makes you eligible to sit for the test.",
    },
    {
      q: "How long do I need to hold my license before applying for reciprocity?",
      a: "Texas and Minnesota both require at least one year holding the license in the original state, and both require that you earned it by passing a state exam.",
    },
    {
      q: "Can I work while my reciprocity application is pending?",
      a: "Not in Texas or California, which both say there is no grace period. Get the license or certification in hand before your first day of electrical work, and check the rules in your new state.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Electrical license reciprocity",
      publisher: "Minnesota Department of Labor and Industry",
      url: "https://www.dli.mn.gov/workers/electrician-or-electrical-installer/electrical-license-reciprocity",
      accessed: "2026-11-20",
      note: "Journeyworker license without examination for licenses obtained by exam in Alaska, Arkansas, Colorado, Iowa, Montana, Nebraska, North Dakota, South Dakota and Wyoming (master-equivalent holders from these states may also get the journeyworker license). Master license without examination from Iowa, North Dakota, South Dakota and Nebraska. Requirements: not failed the same or greater Minnesota exam; license obtained by exam at the state level, not through an agreement with a city or other political subdivision; held at least one year; current and in good standing; $50 application and examination fee, then the license fee; must then meet Minnesota CE and renewal requirements.",
    },
    {
      id: 2,
      title: "Transfer Your Out-of-State Electrician License to Texas",
      publisher: "Texas Department of Licensing and Regulation",
      url: "https://www.tdlr.texas.gov/electricians/out-of-state.htm",
      accessed: "2026-11-20",
      note: "Master reciprocity: Alabama, Arkansas, Iowa (Class A only), Louisiana and Mississippi (state contractor's license), Nebraska, North Carolina, Ohio, Tennessee. Journeyman reciprocity: Alabama, Alaska, Arkansas, Idaho, Iowa, Nebraska, New Mexico, Oklahoma, South Dakota, Wyoming. No agreements for other license types. Journeyman: passed that state's exam, held one year, 8,000 hours, $30, TDLR confirms with the state. Master: passed statewide exam, held one year, 12,000 hours, journeyman two years (one for AL, IA, MS, NE, OH, TN), letter of good standing in one envelope, $45; Louisiana residents only.",
    },
    {
      id: 3,
      title: "Electrical Certification FAQs",
      publisher: "California Department of Industrial Relations, Labor Commissioner's Office, Electrician Certification Unit",
      url: "https://dir.ca.gov/DLSE/ECU/ECU_FAQ.htm",
      accessed: "2026-11-20",
      note: "Certification required for electricians working for C-10 contractors. Out-of-state electricians “need to be certified before they can start working in California, there is no grace period.” A license from another state makes you eligible to sit for the test. Applications must include a Social Security Administration employment history report.",
    },
    {
      id: 4,
      title: "Electrical Contractors: FAQs",
      publisher: "Florida Department of Business and Professional Regulation, Electrical Contractors' Licensing Board",
      url: "https://www2.myfloridalicense.com/electrical-contractors/faqs/",
      accessed: "2026-11-20",
      note: "DBPR does not license or regulate journeymen; out-of-state journeymen must contact the local county licensing office. Endorsement for contractors: 10 years licensed in another state with a similar scope and current within the last two years, or a substantially similar exam plus the experience required by s. 489.511; the review may take several months; experience evidence includes W-2 forms, employer verification forms and job lists. Endorsement application fee $492.",
    },
    {
      id: 5,
      title: "Florida Statutes, section 489.5335: Journeyman; reciprocity; standards (2026)",
      publisher: "The Florida Senate",
      url: "https://m.flsenate.gov/statutes/489.5335",
      accessed: "2026-11-20",
      note: "Subsection (2): counties and municipalities must recognize a person as a journeyman in the electrical and alarm system trades if the person was issued a journeyman license in such trade by a county or municipality in the state.",
    },
    {
      id: 6,
      title: "Electrical Safety and Licensing Frequently Asked Questions",
      publisher: "Texas Department of Licensing and Regulation",
      url: "https://www.tdlr.texas.gov/electricians/elecfaq.htm",
      accessed: "2026-11-20",
      note: "Q1.5.1: anyone performing electrical work must obtain a license before performing the work; there is no grace period. Q5.2: Texas does not have a path for transferring electrical contracting business licenses.",
    },
  ],
  related: [
    "relocating-for-a-construction-job",
    "traveling-electrician-per-diem",
    "how-to-get-an-electrician-license-in-texas",
    "journeyman-vs-master-electrician",
  ],
  moneyPage: { href: "/jobs", label: "Browse open electrical construction jobs" },
};

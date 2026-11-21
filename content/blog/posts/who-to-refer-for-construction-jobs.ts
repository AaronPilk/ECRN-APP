import type { BlogPost } from "@/lib/blog/types";

export const whoToReferForConstructionJobs: BlogPost = {
  slug: "who-to-refer-for-construction-jobs",
  title: "Who to refer for a construction job, and who to leave off the list",
  metaTitle: "Who to Refer for a Construction Job, and Who Not To | ECRN",
  description:
    "Who makes a strong construction referral: the traits contractors check, signs someone is ready to move up, the ECRN tier for each role, and who to skip.",
  category: "referrals",
  targetQuery: "who to refer for a construction job",
  secondaryQueries: [
    "who should I refer for a job",
    "what makes a good job referral",
    "how to tell if someone is ready to be a foreman",
    "construction referral reward tiers",
    "should I refer a friend for a job",
    "who not to refer for a job",
  ],
  answer:
    "Refer people whose work you have seen: reliable, licensed for the role, safe on the job and honest about what they want next, with supervisors who will vouch for them. Leave off anyone who has not agreed to it, anyone you cannot speak for, and anyone who cannot clear the role's basic checks, such as a valid license or a drug test.",
  keyTakeaways: [
    "Contractors screen for the basics first: in the 2026 AGC and NCCER survey, half said available candidates lacked needed skills, certificates or licenses.",
    "Reliability is the next filter: 42% of firms said new hires fail to show up or quit shortly after starting.",
    "Someone is ready for the next level when they already do part of it: running a small crew, owning the look-ahead, pricing a change order.",
    "On ECRN the role sets the reward: up to $2,500 for field, $5,000 for field leadership, $7,500 for office and $10,000 for executive roles, all estimates.",
    "Never refer someone who has not said yes. Ask first, then submit.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-who-to-refer",
  body: [
    {
      type: "p",
      text: "A referral puts your name next to someone else's. The mechanics, from what to collect to what happens after you submit, are in [how to refer someone for a construction job](/blog/how-to-refer-someone-for-a-construction-job). This page is about the harder question: who has earned your name.",
    },
    { type: "h2", text: "What makes someone a strong referral?" },
    {
      type: "p",
      text: "Contractors are short of qualified people, not people. In the 2026 AGC and NCCER workforce survey, half of respondents said available candidates were not qualified because they lacked needed skills, certificates or licenses. Forty-two percent said new hires fail to show up or quit shortly after starting, 36% cited missing credentials such as a driver's license, work permit or clean background check, and 30% said candidates could not pass a drug test.[^1]",
    },
    {
      type: "table",
      caption: "What contractors and recruiters check, and how you would know",
      head: ["Trait", "What it looks like", "How you would know"],
      rows: [
        ["Reliability", "On time, every day, through the end of the job", "You worked beside them through a hard stretch"],
        ["Licenses and credentials", "A current license for the state, plus the cards the role asks for", "They have told you, or you have seen them"],
        ["Safety", "Follows [lockout/tagout](/glossary#lockout-tagout) and does not cut corners", "You never had to tell them twice"],
        ["Leadership", "Others ask them how to do it, and crews run smoother with them", "You have seen them run a crew, a punch list or a shift"],
        ["Honest goals", "Knows what they want next and why", "They told you, without being sold on it"],
        ["References", "Two or three supervisors who will say yes", "They can name them without thinking"],
      ],
    },
    {
      type: "p",
      text: "Scarcity does not lower the bar. Electricians were the hardest craft to hire in the same survey, with 81% of firms that had electrician openings reporting difficulty, yet the most common reason firms gave for hard-to-fill jobs was still candidates without the skills, certificates or licenses.[^1]",
    },
    {
      type: "p",
      text: "Done right, referrals hold up. In a Federal Reserve Bank of New York study of one large U.S. company, referred candidates were more likely to be hired and referred workers stayed longer.[^2] It was not a construction study, so take it as a direction, not a promise.",
    },
    { type: "h2", text: "How do you know someone is ready for the next level?" },
    {
      type: "p",
      text: "They already do part of the next job. A journeyman ready for foreman has led a small crew or a punch list and handled the paperwork. A foreman ready for superintendent has run more than one crew and owned the look-ahead. The jump from foreman is the big one, so read [electrical foreman vs superintendent](/blog/electrical-foreman-vs-superintendent) before you pitch anyone as a superintendent.",
    },
    {
      type: "table",
      head: ["Moving to", "Signs they are ready", "Signs to wait"],
      rows: [
        [
          "[Foreman](/careers/electrical-foreman)",
          "Has led a small crew, reads the full drawing set, turns in time and daily reports on time",
          "Has never planned anyone's day but their own",
        ],
        [
          "[Superintendent](/careers/electrical-superintendent)",
          "Has run several crews or worked as a general foreman, and plans manpower weeks ahead",
          "Has run one crew on one type of job",
        ],
        [
          "[Estimator](/careers/electrical-estimator)",
          "Does takeoffs without being asked and knows how the work goes in",
          "Wants to stay out of the office",
        ],
        [
          "[Project manager](/careers/electrical-project-manager)",
          "Has priced change orders, tracked a budget or run a small job's money",
          "Has never owned a number",
        ],
        [
          "[Executive](/careers/electrical-construction-executive)",
          "Has run a division or a group of projects with profit and loss responsibility",
          "Has run single projects only",
        ],
      ],
    },
    {
      type: "p",
      text: "When in doubt, refer someone for the level they hold today and tell the recruiter what you think they are ready for. Overselling costs you credibility, and it costs the person too: in the 2026 survey, 83% of firms reported some turnover among new field hires in their first 90 days, most often blamed on a mismatch between what workers expected and the reality of the work.[^1]",
    },
    { type: "h2", text: "Which roles fall in which ECRN reward tier?" },
    {
      type: "table",
      head: ["Tier", "Roles", "Reward per hire (estimate)"],
      rows: [
        ["Tier 1, field positions", "Wiremen, journeymen, electricians", "Up to $2,500"],
        ["Tier 2, field leadership", "Foremen, superintendents, field professionals", "Up to $5,000"],
        ["Tier 3, office positions", "Estimators and project managers at all levels", "Up to $7,500"],
        ["Tier 4, executive leadership", "CEOs, COOs, vice presidents", "Up to $10,000"],
      ],
      note: "Amounts are estimates, confirmed in writing by Delta Construction Partners before payout. A reward is paid after the person is placed with a Delta client and completes the guarantee period, typically 90 days. There is no cap on the number of referrals.",
    },
    {
      type: "p",
      text: "The amount for each role is shown in the app as an estimate, and the full program terms are on the [referral rewards page](/referral-rewards). A placement that ends inside the guarantee period pays nothing, which is one more reason to refer people who fit, not just people who are available.",
    },
    { type: "h2", text: "Who should you not refer?" },
    {
      type: "ul",
      items: [
        "**Anyone who has not said yes.** ECRN's [terms](/terms) say to refer only people you actually know and to submit only information you are allowed to share.",
        "**People you have never worked with.** A name from a group chat is not a referral unless you say plainly that you cannot speak to their work.",
        "**Someone who cannot clear the basics.** If the role needs a license they do not hold, or a driver's license, drug test or background check they cannot pass, the referral stalls on the first call.[^1]",
        "**Someone who wants out, but not this.** If they want local work and the role travels, expect the kind of mismatch contractors blame for early quits in the first 90 days.[^1]",
        "**Your own crew, without thinking it through.** It is their career and their call, and it is also your standing with your employer.",
        "**A fit for your own company.** If your employer has the role open and pays a referral bonus, start there.",
      ],
    },
    { type: "h2", text: "How do you start the conversation?" },
    {
      type: "p",
      text: "Ask before you submit, every time, and make it easy to say no. Our guide on [how to ask someone if they are open to a new job](/blog/how-to-ask-someone-if-theyre-open-to-a-new-job) has wording that works even with people who are happy where they are. The short version:",
    },
    {
      type: "ol",
      items: [
        "Lead with what you saw: “You ran that hospital job well.”",
        "Name the level, not a promise: “Delta Construction Partners recruits foremen for contractors. Worth a call?”",
        "Say who will call, and that it stays confidential.",
        "Tell them you may earn a referral reward if they are hired. It keeps things straight between you.",
        "Take no for an answer, and keep the friendship.",
      ],
    },
    {
      type: "cta",
      title: "See what each referral can pay",
      text: "Four tiers, up to $10,000 per hire, paid after the guarantee period. See the roles in each tier and the full terms.",
      href: "/referral-rewards",
      label: "See referral rewards",
    },
  ],
  faqs: [
    {
      q: "What makes a good job referral?",
      a: "Someone whose work you have seen, who holds the license and credentials the role needs, shows up every day, and has agreed to be referred. A short, honest note about what you saw makes the referral usable.",
    },
    {
      q: "Should I refer a friend I have never worked with?",
      a: "Only if you can speak to their work, or you tell the recruiter plainly that you cannot. Recruiters weigh your word by how well you know the person.",
    },
    {
      q: "How much is a referral worth on ECRN?",
      a: "Up to $2,500 for field positions, $5,000 for field leadership, $7,500 for office positions and $10,000 for executive leadership, per hire. Amounts are estimates, confirmed in writing and paid after the guarantee period, typically 90 days.",
    },
    {
      q: "Can I refer someone for a job above their current level?",
      a: "Yes, if they already do part of that job, such as a journeyman who has run a small crew. Tell the recruiter what you have seen and let them judge the fit.",
    },
    {
      q: "Can I refer someone who works for my company?",
      a: "You can if they agree, but think it through: it is their decision, and it affects your standing with your employer. If your own company has the right role open, its referral program may be the better route.",
    },
    {
      q: "What happens if my referral does not work out?",
      a: "No placement means no payout, and a placement that ends before the guarantee period is complete pays nothing. You can keep referring, because there is no cap.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "2026 Workforce Survey Analysis",
      publisher: "Associated General Contractors of America and NCCER",
      url: "https://www.agc.org/sites/default/files/users/user21902/2026%20Workforce%20Survey%20Analysis%20(4).pdf",
      accessed: "2026-11-20",
      note: "Survey of 1,830 respondents, July and August 2026. 50 percent say available candidates lack needed skills, certificates or licenses; 42 percent say new hires fail to show up or quit shortly after starting; 36 percent cite missing credentials such as a driver's license, work permit or clean background check; 30 percent cite failed drug tests; 81 percent of firms with electrician openings report difficulty filling them; 83 percent report some turnover among new field employees in the first 90 days, most often attributed to a mismatch between expectations and the realities of construction work.",
    },
    {
      id: 2,
      title: "Do Informal Referrals Lead to Better Matches? Evidence from a Firm's Employee Referral System (Staff Report 568)",
      publisher: "Federal Reserve Bank of New York",
      url: "https://www.newyorkfed.org/research/staff_reports/sr568.html",
      accessed: "2026-11-20",
      note: "Abstract: in data from a single U.S. corporation, referred candidates are more likely to be hired and referred workers have longer tenure. Published in the Journal of Labor Economics, January 2016.",
    },
  ],
  related: [
    "how-to-refer-someone-for-a-construction-job",
    "how-to-ask-someone-if-theyre-open-to-a-new-job",
    "how-construction-referral-bonuses-work",
    "are-referral-bonuses-taxable",
  ],
  moneyPage: { href: "/referral-rewards", label: "See ECRN referral rewards" },
};

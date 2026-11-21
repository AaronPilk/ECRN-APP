import type { BlogPost } from "@/lib/blog/types";

export const areConstructionRecruitersWorthIt: BlogPost = {
  slug: "are-construction-recruiters-worth-it",
  title: "Are construction recruiters worth it for electrical contractors?",
  metaTitle: "Are Construction Recruiters Worth It? Honest Answer | ECRN",
  description:
    "Fees, guarantees, poaching and bad past experiences: a straight look at when a construction recruiter pays for itself, and when a contractor should skip one.",
  category: "employers",
  targetQuery: "are construction recruiters worth it",
  secondaryQueries: [
    "construction recruiter fees",
    "contingency vs retained search construction",
    "do recruiters guarantee placements",
    "should I use a recruiter to hire a superintendent",
    "electrical contractor recruiting firm",
    "construction headhunter worth the fee",
  ],
  answer:
    "Construction recruiters are worth it when a seat is hard to fill, costly to leave empty, and the people who could fill it are employed and not answering job ads, which is often the case for electrical foremen, superintendents, estimators and project managers. They are not worth it for roles you can fill within a few weeks from your own network, your own referral bonus or a job post.",
  keyTakeaways: [
    "Contingency recruiters are paid only if you hire their candidate. Retained firms work exclusively and are paid in stages.",
    "SHRM reported in 2016 that contingency fees usually run 20% to 25% of first-year cash compensation and retained fees about 33%. Treat those as dated reference points and get current quotes.",
    "The cost of waiting is real: in the 2026 AGC and NCCER survey, 42% of respondents said worker shortages had delayed projects.",
    "Get four things in writing: the fee and what it is calculated on, the guarantee and its remedy, an off-limits clause covering your employees, and how long the firm owns a candidate.",
    "Skip the recruiter when your own people can refer someone, when a post draws qualified applicants, or when you cannot move fast.",
  ],
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  author: "ecrn-team",
  cover: "cover-recruiters-worth-it",
  body: [
    { type: "h2", text: "Is the recruiting fee too high?" },
    {
      type: "p",
      text: "It depends on which fee, and on what the empty seat is costing you. There are two common structures:",
    },
    {
      type: "table",
      head: ["What to compare", "Contingency", "Retained"],
      rows: [
        ["When you pay", "Only when you hire the firm's candidate.[^2]", "In stages: at the start, at an agreed milestone, and at hire.[^2]"],
        ["Exclusivity", "Usually none. Several firms may work the same role.[^1]", "Exclusive to one firm.[^1]"],
        ["Typical use", "Skilled trades through senior managers.[^1]", "Executives and leadership roles where a miss is expensive.[^1]"],
        ["Reference fee (SHRM, 2016)", "20% to 25% of first-year cash compensation.[^1]", "About 33% of annual salary, bonus and signing bonus.[^1]"],
      ],
      note: "The percentages come from a 2016 SHRM article covering all industries. Use them as a sanity check, not a quote.",
    },
    {
      type: "p",
      text: "As an illustration, SHRM's 20% to 25% range applied to a $120,000 hire is $24,000 to $30,000.[^1] Ask what the fee is calculated on (base salary only, or salary plus bonus and vehicle allowance), when it is invoiced, and what happens to it if the hire leaves.",
    },
    {
      type: "p",
      text: "Then weigh it against the empty seat, not against zero. SHRM's 2025 benchmarking put the median time to fill a position at about a month and a half across all industries.[^3] In construction, the 2026 AGC and NCCER survey found 82% of respondents had salaried openings, 87% of those called them as hard or harder to fill than a year earlier, and 42% said worker shortages had delayed projects.[^4]",
    },
    {
      type: "stats",
      items: [
        { value: "298,000", label: "Open construction jobs at the end of September 2026 (BLS JOLTS, preliminary)", source: 5 },
        { value: "42%", label: "Survey respondents whose projects were delayed by worker shortages (AGC and NCCER, 2026)", source: 4 },
        { value: "349,000", label: "Net new workers construction needs in 2026 (ABC estimate)", source: 6 },
      ],
    },
    {
      type: "p",
      text: "The cost of a bad hire is harder to pin down. The percentages quoted around the internet rarely trace back to a study we could open, so we are not repeating them. Do your own arithmetic: fee, salary paid, rework, schedule slip, and the crew members who quit while the wrong superintendent ran the job.",
    },
    { type: "h2", text: "Can't we just post the job ourselves?" },
    {
      type: "p",
      text: "Yes, and for some roles you should. A job post reaches people who are looking, and you will not be alone: BLS counted 298,000 open construction jobs at the end of September 2026, a preliminary figure, up from 206,000 a year earlier.[^5]",
    },
    {
      type: "p",
      text: "The foreman or project manager you want is often employed, mid-project and not reading job boards. Half of the AGC respondents said the candidates who are available lack needed skills, certificates or licenses.[^4] A recruiter earns the fee by reaching people who would never apply, and by doing it without your name on a public ad when the search is sensitive. Our comparison of [recruiters, job boards and referral networks](/blog/recruiter-vs-job-board-vs-referral-network) covers when each one wins.",
    },
    { type: "h2", text: "Don't recruiters just send unqualified people?" },
    {
      type: "p",
      text: "Some do. Contingency firms are paid only on a hire, which rewards speed. Indeed's employer guide notes that many of them match resumes to keywords in your job description, which delivers volume without any promise of fit.[^2]",
    },
    {
      type: "p",
      text: "The fix is specialization and a tight brief. A recruiter who places electrical superintendents every month knows a 15 kV service from a tenant fit-out. Give them the project type, contract size, crew size, delivery method, software and pay range. After the first two resumes, say exactly what was wrong, and if the third misses the same way, stop.",
    },
    { type: "h2", text: "Will a recruiter poach our people later?" },
    {
      type: "p",
      text: "It is a fair worry, and it is handled by contract. SHRM notes that most search firms are contractually barred from recruiting from existing or past clients for a period of time.[^1] Ask for that off-limits clause in writing: which of your entities it covers, whether it protects every employee or only the people the firm placed, and how long it lasts after your last engagement. It should also stop the firm from recruiting the person it placed with you once the guarantee has run out.",
    },
    {
      type: "p",
      text: "No clause, no deal. Be realistic, though: one firm's promise does nothing about every other recruiter calling your foremen. That is a retention problem, not a vendor problem.",
    },
    { type: "h2", text: "What happens if the hire does not work out?" },
    {
      type: "p",
      text: "Recruiting agreements commonly include a guarantee period. Indeed's employer guide describes a common version: if the new hire leaves before a date you and the recruiter agreed on, the firm replaces the candidate.[^2] Other agreements give a credit or partial refund instead, so ask which you are getting.",
    },
    {
      type: "p",
      text: "Read the conditions before you sign. Ask how long the guarantee runs, whether the remedy is a replacement, a credit or a refund, whether it restarts for the replacement, and what voids it, such as a late payment, a changed job or a layoff for lack of work.",
    },
    { type: "h2", text: "We tried a recruiter once and it went badly. Why would it be different?" },
    {
      type: "p",
      text: "Because “a recruiter” is not one thing. Bad experiences often trace to one of four causes: a generalist firm on a specialist role, several contingency firms racing each other with the same resumes, a vague brief, or slow feedback from your side while the candidate took another offer.",
    },
    {
      type: "p",
      text: "Change the setup instead of repeating it. Use one firm that works your trade, exclusive for a fixed window. Agree how many candidates you will see and by when, and commit to feedback within two days and interviews within a week. Then judge the firm on its first shortlist.",
    },
    { type: "h2", text: "When should you not use a recruiter?" },
    {
      type: "ul",
      items: [
        "Your own crew can refer someone. Run your own bonus first; see [how construction referral bonuses work](/blog/how-construction-referral-bonuses-work).",
        "A job post draws qualified applicants, which can happen for entry-level roles in a slow local market.",
        "You cannot interview within a week or decide within two. The candidate will be gone and you will blame the recruiter.",
        "The pay is under market. A recruiter cannot fix a short offer, only tell you sooner.",
        "You need labor for one project, not a permanent hire. That is a staffing or subcontract question.",
        "You have an in-house recruiter with a real network in electrical construction.",
      ],
    },
    { type: "h2", text: "What should you ask a recruiting firm before signing?" },
    {
      type: "ol",
      items: [
        "How many electrical construction placements at this level did you make in the last 12 months?",
        "What is the fee, what compensation is it calculated on, and when is it due?",
        "What is the guarantee period, what is the remedy, and what voids it?",
        "Will you put an off-limits clause covering our employees in the agreement, and for how long?",
        "Is the search exclusive, and what do we get for that?",
        "Who does the search, and how do they find people beyond job boards?",
        "How long do you claim a candidate you have sent us?",
        "What do you need from us to move fast?",
      ],
    },
    { type: "h2", text: "Where does ECRN fit?" },
    {
      type: "p",
      text: "ECRN is the Electrical Construction Referral Network, powered by [Delta Construction Partners](https://deltaconstructionpartners.com), a construction recruiting firm that has been recruiting since 2008 and has 30+ recruiters. Members refer electricians, foremen, estimators and project managers they know, and Delta's recruiters vet candidates before a contractor sees them.",
    },
    {
      type: "p",
      text: "This page does not quote Delta's fees or guarantee terms. Request them when you [tell Delta what you are hiring for](/hire), and put the questions above to Delta the same way you would to any firm.",
    },
    {
      type: "cta",
      title: "Hiring electrical construction talent?",
      text: "Tell Delta Construction Partners the role, location, project type and pay range. A recruiter will reach out.",
      href: "/hire",
      label: "Submit a hiring need",
    },
  ],
  faqs: [
    {
      q: "How much do construction recruiters charge?",
      a: "Fees are usually a percentage of the new hire's first-year compensation. A 2016 SHRM article put contingency fees at 20% to 25% of first-year cash compensation and retained search at about 33%, across all industries, so ask each firm for its current terms.",
    },
    {
      q: "What is the difference between contingency and retained search?",
      a: "A contingency recruiter is paid only if you hire their candidate, and you can usually use several firms at once. A retained firm works exclusively and is paid in stages: at the start, at a milestone and at hire.",
    },
    {
      q: "Do recruiters guarantee their placements?",
      a: "Agreements commonly include a guarantee period during which the firm replaces the hire, or gives a credit or refund, if the person leaves. The length and conditions vary, so read what voids it before you sign.",
    },
    {
      q: "Can a recruiter take my employees after working for me?",
      a: "A reputable firm will agree in writing not to recruit from your company for a set period. Ask for that off-limits clause and check which employees and entities it covers.",
    },
    {
      q: "When is it cheaper to hire without a recruiter?",
      a: "When your own employees can refer someone, when a job post draws qualified applicants, or when you have an in-house recruiter with contacts in the trade. A recruiter pays off on hard-to-fill roles where the right people are already employed.",
    },
    {
      q: "Does Delta Construction Partners recruit for electrical contractors?",
      a: "Yes. Delta Construction Partners has been recruiting in construction since 2008, has 30+ recruiters, and focuses on electrical construction through ECRN. Contractors can submit a hiring need on the ECRN employer page.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "How to Work Effectively with an Executive Search Firm",
      publisher: "SHRM",
      url: "https://www.shrm.org/topics-tools/news/talent-acquisition/how-to-work-effectively-executive-search-firm",
      accessed: "2026-11-20",
      note: "Published July 18, 2016. Contingency recruiters are paid only if they fill the role, cover roles from skilled labor to senior managers, and usually earn 20% to 25% of first-year cash compensation; retained searches are usually exclusive, with a standard fee of about 33% of annual salary, bonus and signing bonus; most search firms are contractually precluded from recruiting from existing or past clients for a period of time.",
    },
    {
      id: 2,
      title: "Contingency and Retained Recruiting: Differences and Considerations",
      publisher: "Indeed for Employers",
      url: "https://www.indeed.com/hire/c/info/contingency-retained-recruiting",
      accessed: "2026-11-20",
      note: "Contingency firms are not paid until their candidate is hired and often match resumes to keywords in the job description; retained firms are paid in three parts (retainer, agreed milestone, hire) and offer a replacement guarantee if the hire leaves before an agreed date.",
    },
    {
      id: 3,
      title: "2025 Recruiting Executives Benchmarking: Insights to Maximize Recruitment",
      publisher: "SHRM",
      url: "https://www.shrm.org/content/dam/en/shrm/research/2025-recruiting-benchmarking-report.pdf",
      accessed: "2026-11-20",
      note: "Survey of 2,371 SHRM members, January 9 to March 3, 2025, all industries. Median time-to-fill of about a month and a half for executive and nonexecutive positions, measured from requisition opened to offer accepted.",
    },
    {
      id: 4,
      title: "Construction Workforce Shortages Remain Acute Despite 'Soft' Market Conditions As Data Centers Strain Labor Supply, Survey Finds",
      publisher: "Associated General Contractors of America and NCCER",
      url: "https://www.agc.org/news/2026/09/03/construction-workforce-shortages-remain-acute-despite-soft-market-conditions-data-centers-strain",
      accessed: "2026-11-20",
      note: "2026 Workforce Survey, fielded July and August 2026, 1,830 respondents. 82% have openings for salaried positions; 87% of firms with salaried openings say they are as hard or harder to fill than a year ago; 42% report projects delayed by worker shortages; half say available candidates lack needed skills, certificates or licenses.",
    },
    {
      id: 5,
      title: "Job Openings and Labor Turnover Survey, Table 1: Job openings levels and rates by industry and region, seasonally adjusted (September 2026)",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/news.release/jolts.t01.htm",
      accessed: "2026-11-20",
      note: "Construction job openings: 298,000 on the last business day of September 2026 (preliminary), against 206,000 in September 2025.",
    },
    {
      id: 6,
      title: "ABC: Construction Industry Must Attract 349,000 Workers in 2026 Despite Macroeconomic Headwinds",
      publisher: "Associated Builders and Contractors",
      url: "https://www.abc.org/News-Media/News-Releases/abc-construction-industry-must-attract-349000-workers-in-2026-despite-macroeconomic-headwinds",
      accessed: "2026-11-20",
      note: "Published January 15, 2026. ABC's model estimates the construction industry needs 349,000 net new workers in 2026 to meet demand. All of construction, not electrical only.",
    },
  ],
  related: [
    "recruiter-vs-job-board-vs-referral-network",
    "how-construction-referral-bonuses-work",
    "electrician-shortage-statistics",
    "electrical-project-manager-salary",
  ],
  moneyPage: { href: "/hire", label: "Hire electrical construction talent through ECRN" },
};

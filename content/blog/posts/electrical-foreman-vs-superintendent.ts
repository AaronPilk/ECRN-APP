import type { BlogPost } from "@/lib/blog/types";

export const electricalForemanVsSuperintendent: BlogPost = {
  slug: "electrical-foreman-vs-superintendent",
  title: "Electrical foreman vs superintendent: roles, pay and career path",
  metaTitle: "Foreman vs Superintendent: Electrical Roles and Pay | ECRN",
  description:
    "A foreman runs a crew. A superintendent runs the job. Compare scope, reporting lines, planning, paperwork and BLS pay data for both electrical field roles.",
  category: "careers",
  targetQuery: "foreman vs superintendent",
  secondaryQueries: [
    "electrical foreman vs superintendent",
    "difference between foreman and superintendent",
    "general foreman vs superintendent",
    "electrical superintendent salary",
    "electrical foreman salary",
    "how to become an electrical superintendent",
  ],
  answer:
    "A foreman runs one crew and the work in front of it; a superintendent runs the whole electrical job, usually through several foremen, and plans the manpower and sequence ahead of them. BLS has no code for either title: first-line supervisors of construction trades, the group that covers both, had a median wage of $79,920 a year in May 2025.",
  keyTakeaways: [
    "Foreman: leads one crew, often still on the tools, and answers for today's installation, safety and quality.",
    "Superintendent: the contractor's senior field lead on a project, responsible for every crew, the sequence and the manpower.",
    "A general foreman sits between the two and runs several foremen on larger jobs.",
    "BLS pay data: first-line supervisors of construction trades (SOC 47-1011) had a median of $79,920 and a 90th percentile of $128,260 in May 2025.",
    "Both roles are Tier 2 on ECRN: a referral reward of up to $5,000 per hire.",
  ],
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  author: "ecrn-team",
  cover: "cover-foreman-superintendent",
  body: [
    { type: "h2", text: "What is the difference between a foreman and a superintendent?" },
    {
      type: "p",
      text: "Scope. A foreman is responsible for a crew: the people, the task and the hours in front of them. A superintendent is responsible for the job: every crew on it, the order the work happens in, and whether the electrical contractor hits the schedule the general contractor is holding it to.",
    },
    {
      type: "p",
      text: "Titles are not regulated: a small shop may call its only field lead a superintendent. This page describes the usual split at a mid-size or large electrical contractor.",
    },
    { type: "h2", text: "What does an electrical foreman do?" },
    {
      type: "p",
      text: "A foreman turns the plan into installed work. The federal occupation description for first-line construction supervisors lists the core tasks: read drawings and specifications, assign work, inspect progress for safety and quality, estimate and order material, and coordinate with other activity on site.[^1]",
    },
    {
      type: "p",
      text: "In electrical work that means laying out the day, keeping apprentices productive and safe, catching conflicts with other trades before the conduit is in, and turning in time and daily reports. The [electrical foreman career page](/careers/electrical-foreman) covers what contractors look for.",
    },
    { type: "h2", text: "What does an electrical superintendent do?" },
    {
      type: "p",
      text: "A superintendent runs the field side of a project, or several, through foremen. The work is planning and clearing obstacles: manpower by week, the look-ahead schedule, deliveries, coordination meetings with the general contractor, safety planning, and quality before the inspector sees it.",
    },
    {
      type: "p",
      text: "The superintendent is the project manager's counterpart: the project manager owns the contract, budget and billing, and the superintendent owns the labor plan and how the work gets built. See the [electrical superintendent career page](/careers/electrical-superintendent).",
    },
    { type: "h2", text: "How do foreman, general foreman and superintendent compare?" },
    {
      type: "table",
      head: ["Area", "Foreman", "General foreman", "Superintendent"],
      rows: [
        ["Scope", "One crew and its tasks", "Several crews, each with a foreman", "The whole electrical scope, sometimes several projects"],
        [
          "Crew size",
          "One crew. One union sheet raises foreman pay at seven or more workers.[^3]",
          "Several foremen. The same sheet raises pay at five or more.[^3]",
          "Every crew on the job",
        ],
        ["Reports to", "General foreman or superintendent", "Superintendent", "Project manager or operations manager"],
        ["Plans for", "Today and this week", "The next few weeks", "The whole schedule, mobilization to closeout"],
        ["Paperwork", "Time, daily reports, material requests, safety talks", "Crew time, quantities, manpower requests", "Look-ahead schedules, manpower plans, change documentation"],
        ["On the tools", "Often, part of the day", "Rarely", "No"],
        ["Usual background", "Journeyman with proven installs", "Foreman who has run larger crews", "Years as foreman or general foreman"],
      ],
      note: "Typical split. Titles and spans vary by firm, market and labor agreement.",
    },
    { type: "h2", text: "Where does a general foreman fit?" },
    {
      type: "p",
      text: "On a job too big for one crew, a general foreman runs the foremen and reports to the superintendent. Union agreements write the ladder into the wage sheet. IBEW Local 340's inside agreement for the Sacramento area, effective June 1, 2026, pays a foreman 110% of the journeyman rate with six or fewer workers and 115% with seven or more, and a general foreman 125% or 130% depending on the number of foremen.[^3]",
    },
    {
      type: "p",
      text: "With a journeyman rate of $53.70 an hour, that is $59.07 to $61.76 for a foreman and $67.13 to $69.81 for a general foreman.[^3] In Los Angeles, IBEW Local 11's sheet for the first half of 2026 set foreman pay at 1.126 times journeyman and general foreman pay at 1.252 times: $65.00, $73.19 and $81.38 an hour.[^4]",
    },
    { type: "h2", text: "How much do electrical foremen and superintendents make?" },
    {
      type: "p",
      text: "The Bureau of Labor Statistics (BLS) does not publish a wage for either title. It groups field supervisors as **first-line supervisors of construction trades and extraction workers** (SOC 47-1011), which covers foremen and superintendents in every trade, plus mining and drilling.[^1] That group had a median wage of $79,920 a year, or $38.42 an hour, in May 2025, with the top 10% above $128,260.[^5]",
    },
    {
      type: "p",
      text: "Under the federal coding rules, someone who supervises 80% or more of the time is a first-line supervisor, a working foreman below that line is counted with the electricians, and someone who mainly plans and directs resources is a manager.[^2] So the field ladder is spread across three BLS occupations.",
    },
    {
      type: "table",
      caption: "The three BLS occupations that cover the electrical field ladder, May 2025",
      head: ["BLS occupation", "Who lands here", "Median annual wage", "90th percentile"],
      rows: [
        ["Electricians (47-2111)", "Journeymen, apprentices and working foremen", "$63,190", "$108,510"],
        ["First-line supervisors of construction trades (47-1011)", "Foremen, general foremen and many superintendents", "$79,920", "$128,260"],
        ["Construction managers (11-9021)", "Superintendents who mainly plan and direct, and project managers", "$114,990", "$189,440"],
      ],
      note: "Sources: BLS Occupational Employment and Wage Statistics, May 2025.[^5][^6][^7] All industries and trades. The middle column is our reading of the coding rules.[^2]",
    },
    {
      type: "p",
      text: "For electrical contractors specifically, the last industry tables BLS published as web pages (May 2023) counted 71,850 first-line supervisors, about 7% of the industry's workforce, at a median of $39.78 an hour and a mean of $91,290 a year.[^8]",
    },
    {
      type: "p",
      text: "Superintendent titles show up in both higher groups: the federal occupation database lists Site Superintendent under first-line supervisors, and Construction Superintendent, General Superintendent and Job Superintendent under construction managers.[^1][^9] For the office side, see [electrical project manager salary](/blog/electrical-project-manager-salary).",
    },
    { type: "h2", text: "How do you move from foreman to superintendent?" },
    {
      type: "steps",
      items: [
        {
          title: "Run more than one crew",
          text: "Ask for general foreman work, or the area of the job with the most moving parts. A superintendent directs foremen, so you need to have done it.",
        },
        {
          title: "Own the look-ahead",
          text: "Write the plan for your area before you are asked: manpower, material, inspections, and what you need from other trades.",
        },
        {
          title: "Learn the labor budget",
          text: "Ask the project manager for the estimated hours on your scope and track your crews against them every week.",
        },
        {
          title: "Document everything",
          text: "Daily reports, photos and signed change tickets get extra work paid for and earn the project manager's trust.",
        },
        {
          title: "Say it out loud, or move",
          text: "Tell your superintendent and operations manager what you want and ask what is missing. If the seat is not coming, you can [search confidentially](/blog/how-to-job-search-confidentially) while you keep working.",
        },
      ],
    },
    { type: "h2", text: "Which role fits you, and when should you stay a foreman?" },
    {
      type: "p",
      text: "The superintendent job is not a foreman job with more pay. The tools go away, the phone does not stop, and you answer for things you do not control: late drawings, other trades, weather. In the federal occupation survey, 63% of first-line construction supervisors reported a typical work week of more than 40 hours.[^1]",
    },
    {
      type: "ul",
      items: [
        "**Stay a foreman or general foreman if** you like building, want to see finished work each day, and would rather lead a crew you know than manage through others. On the union sheets above, the premium is written down and paid by the hour, overtime included.[^3]",
        "**Move to superintendent if** you like planning further ahead than this week, can hold a hard conversation with a general contractor, and want the path to general superintendent or operations.",
      ],
    },
    {
      type: "p",
      text: "Timing favors both. First-line construction supervisors had a median age of 46.4 in 2025, against 39.6 for electricians, and 28% were 55 or older.[^10] Federal projections show about 67,000 openings a year for them from 2025 to 2035.[^1] Journeyman pay by state is in our [electrician salary by state](/blog/electrician-salary-by-state) table.",
    },
    { type: "h2", text: "How do referral rewards work for foremen and superintendents?" },
    {
      type: "p",
      text: "On ECRN, foremen and superintendents are both Tier 2, field leadership. Refer someone who is placed in one of those roles with a Delta Construction Partners client and the reward is up to $5,000. The amount is an estimate, confirmed in writing before payout, and it is paid after the guarantee period, typically 90 days.",
    },
    {
      type: "cta",
      title: "Ready to run the job, not just the crew?",
      text: "See what electrical contractors expect from a superintendent and how to position your foreman experience for the step up.",
      href: "/careers/electrical-superintendent",
      label: "Electrical superintendent careers",
    },
  ],
  faqs: [
    {
      q: "Is a superintendent higher than a foreman?",
      a: "Yes. A foreman leads one crew and reports to a general foreman or superintendent. The superintendent answers for every crew the electrical contractor has on the project.",
    },
    {
      q: "What is a general foreman?",
      a: "A general foreman runs several foremen on a job too large for one crew and reports to the superintendent. In IBEW Local 340's 2026 inside agreement, for example, a general foreman is paid 125% or 130% of the journeyman rate, depending on the number of foremen.",
    },
    {
      q: "How much does an electrical foreman make?",
      a: "BLS has no foreman-specific figure. First-line supervisors of construction trades had a median wage of $79,920 a year in May 2025. On union sheets the foreman rate is a set premium over journeyman pay: 10% to 15% in IBEW Local 340's 2026 agreement, for example.",
    },
    {
      q: "How much does an electrical superintendent make?",
      a: "Superintendents are split between two BLS groups: first-line supervisors of construction trades (median $79,920, top 10% above $128,260) and construction managers (median $114,990), both as of May 2025. Which fits depends on how much of the job is planning rather than direct supervision.",
    },
    {
      q: "Do foremen still work with the tools?",
      a: "Many do, especially on small crews. BLS only counts someone as a first-line supervisor if 80% or more of their time is supervision. A working foreman below that line is counted as an electrician.",
    },
    {
      q: "What is the ECRN referral reward for a foreman or superintendent?",
      a: "Both are Tier 2, field leadership: up to $5,000 per hire. The amount is an estimate confirmed in writing, and it is paid after the person is placed with a Delta Construction Partners client and completes the guarantee period, typically 90 days.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Summary Report: First-Line Supervisors of Construction Trades and Extraction Workers (47-1011.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/summary/47-1011.00",
      accessed: "2026-11-20",
      note: "Definition and task list (read specifications, assign work, inspect progress, estimate and order materials, coordinate). Reported job titles include Construction Foreman, Electrical Supervisor, Site Superintendent and Coal Mine Production Foreman. Work context: 63% of respondents reported a typical work week of more than 40 hours. Projected job openings, 2025 to 2035: 67,000 a year (BLS projections).",
    },
    {
      id: 2,
      title: "2018 SOC User Guide: Classification Principles and Coding Guidelines",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/soc/2018/soc_2018_class_prin_cod_guide.pdf",
      accessed: "2026-11-20",
      note: "Coding guideline 5: workers in construction and similar groups who spend 80% or more of their time supervising are coded as first-line supervisors; those who spend less are coded with the workers they supervise. Principle 3: workers primarily engaged in planning and directing resources are classified as managers. Principle 7: apprentices are classified with the occupation they are training for.",
    },
    {
      id: 3,
      title: "Local 340 Inside Wireman's Wage and Fringe Changes, effective June 1, 2026",
      publisher: "IBEW Local 340",
      url: "https://www.ibewlocal340.org/wp-content/uploads/2026/06/6-1-2026_LU-340-Inside-Wireman-Wages.pdf",
      accessed: "2026-11-20",
      note: "Journeyman wireman $53.70 an hour. Foreman with 6 or fewer: 110%, $59.07. Foreman with 7 or more: 115%, $61.76. General foreman with 4 or fewer foremen: 125%, $67.13. General foreman with 5 or more foremen: 130%, $69.81. Overtime and double-time rates listed for each.",
    },
    {
      id: 4,
      title: "IBEW Local 11 Inside Wiremen's Agreement: rates effective January 26, 2026 through June 30, 2026",
      publisher: "Southern California IBEW-NECA (labor relations bulletin)",
      url: "https://www.scibew-neca.org/html/11-inside-wiremen-20260126.pdf",
      accessed: "2026-11-20",
      note: "Journeyman $65.00; foreman (1.126 x journeyman) $73.19; general foreman (1.252 x journeyman) $81.38. The sheet expired June 30, 2026, so current rates will differ.",
    },
    {
      id: 5,
      title: "Local Wages: First-Line Supervisors of Construction Trades and Extraction Workers (47-1011.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/localwages/47-1011.00?st=TX",
      accessed: "2026-11-20",
      note: "BLS OEWS May 2025 data, read from the CSV export. U.S. annual wages: 10th $53,280, 25th $63,400, median $79,920, 75th $101,460, 90th $128,260. Median hourly $38.42.",
    },
    {
      id: 6,
      title: "Occupational Outlook Handbook: Electricians",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm",
      accessed: "2026-11-20",
      note: "SOC 47-2111, May 2025: median $63,190 a year; highest 10% earned more than $108,510.",
    },
    {
      id: 7,
      title: "Occupational Outlook Handbook: Construction Managers",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/management/construction-managers.htm",
      accessed: "2026-11-20",
      note: "SOC 11-9021, May 2025: median $114,990 a year; highest 10% earned more than $189,440.",
    },
    {
      id: 8,
      title: "May 2023 National Industry-Specific Occupational Employment and Wage Estimates: NAICS 238210, Electrical Contractors and Other Wiring Installation Contractors",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/oes/2023/may/naics5_238210.htm",
      accessed: "2026-11-20",
      note: "May 2023 data, the latest industry cut available as a web page. First-line supervisors of construction trades and extraction workers: employment 71,850 (6.87% of industry employment), median hourly $39.78, annual mean $91,290.",
    },
    {
      id: 9,
      title: "Summary Report: Construction Managers (11-9021.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/summary/11-9021.00",
      accessed: "2026-11-20",
      note: "Reported job titles include Construction Superintendent, General Superintendent, Job Superintendent and Construction Foreman.",
    },
    {
      id: 10,
      title: "Employed people by detailed occupation and age (Table 11b)",
      publisher: "U.S. Bureau of Labor Statistics, Current Population Survey",
      url: "https://www.bls.gov/cps/cpsaat11b.htm",
      accessed: "2026-11-20",
      note: "2025 annual averages (11 months, excluding October). Median age: first-line supervisors of construction trades and extraction workers 46.4; electricians 39.6. Supervisors aged 55 and over: 219,000 of 788,000, which is 28% by our calculation.",
    },
  ],
  related: ["electrical-project-manager-salary", "electrician-salary-by-state", "how-to-job-search-confidentially", "electrician-shortage-statistics"],
  moneyPage: { href: "/careers/electrical-superintendent", label: "Electrical superintendent careers" },
};

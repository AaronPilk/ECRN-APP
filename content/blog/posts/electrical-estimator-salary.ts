import type { BlogPost } from "@/lib/blog/types";

export const electricalEstimatorSalary: BlogPost = {
  slug: "electrical-estimator-salary",
  title: "Electrical estimator salary: what estimators earn in 2026",
  metaTitle: "Electrical Estimator Salary: 2026 Pay by Percentile | ECRN",
  description:
    "Electrical estimators fall under BLS cost estimators: a $78,740 median in May 2025, $80,330 at specialty contractors. Percentiles, PM pay and what moves it.",
  category: "pay",
  targetQuery: "electrical estimator salary",
  secondaryQueries: [
    "how much do electrical estimators make",
    "senior electrical estimator salary",
    "chief estimator salary electrical contractor",
    "electrical estimator hourly rate",
    "estimator vs project manager salary",
    "do estimators get overtime",
  ],
  answer:
    "BLS has no electrical estimator occupation, so the closest benchmark is cost estimators (SOC 13-1051): a national median of $78,740 a year in May 2025, and $80,330 at specialty trade contractors, the group that includes electrical firms. The middle half earned $61,150 to $101,850 and the top 10% more than $130,820, but BLS does not split pay by junior, senior or chief estimator.",
  keyTakeaways: [
    "BLS proxy: cost estimators (SOC 13-1051), median $78,740 a year or $37.86 an hour in May 2025.",
    "Specialty trade contractors, which include electrical firms, paid a median of $80,330; heavy and civil contractors paid $99,910.",
    "Percentiles: 25th $61,150, 75th $101,850, 90th $130,820. BLS publishes no pay by estimator level.",
    "Construction managers, the closest BLS group for project managers, had a median about $36,000 higher, at $114,990.",
    "Estimators at every level are ECRN Tier 3: a referral reward of up to $7,500 per hire.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-estimator-salary",
  body: [
    { type: "h2", text: "How much does an electrical estimator make?" },
    {
      type: "p",
      text: "The Bureau of Labor Statistics (BLS) does not publish a wage for electrical estimators. The closest occupation is **cost estimators** (SOC 13-1051), which covers estimators in every industry, from body shops and factories to general and specialty contractors. Their median annual wage was $78,740, or $37.86 an hour, in May 2025.[^1]",
    },
    {
      type: "p",
      text: "Narrow it to the trade and the number moves a little. Specialty trade contractors, the BLS group that includes electrical contractors, employ 33% of cost estimators and paid them a median of $80,330.[^1]",
    },
    {
      type: "stats",
      items: [
        { value: "$78,740", label: "Median annual wage, cost estimators, U.S., May 2025", source: 1 },
        { value: "$80,330", label: "Median at specialty trade contractors", source: 1 },
        { value: "$130,820", label: "90th percentile annual wage", source: 2 },
        { value: "17,600", label: "Projected openings a year, 2025 to 2035", source: 1 },
      ],
    },
    {
      type: "p",
      text: "The [electrical estimator career page](/careers/electrical-estimator) covers the job itself, from takeoff to bid day. This page sticks to pay.",
    },
    { type: "h2", text: "What do electrical estimators earn at each percentile?" },
    {
      type: "table",
      caption: "Wages for cost estimators (SOC 13-1051), United States, May 2025",
      head: ["Percentile", "Annual wage", "Hourly wage"],
      rows: [
        ["10th", "$48,530", "$23.33"],
        ["25th", "$61,150", "$29.40"],
        ["50th (median)", "$78,740", "$37.86"],
        ["75th", "$101,850", "$48.97"],
        ["90th", "$130,820", "$62.90"],
      ],
      note: "Source: BLS Occupational Employment and Wage Statistics, May 2025, read from the Department of Labor's O-NET wage tables.[^2] All industries. Owners and the self-employed are not surveyed, and overtime and nonproduction bonuses are excluded.[^3]",
    },
    {
      type: "p",
      text: "BLS does not publish pay by title level, so there is no federal number for a junior, senior or chief estimator. Use the spread to place an offer, not as a ladder: where you land depends on what you are trusted to price alone.",
    },
    {
      type: "p",
      text: "If you are new to the office side, our guide on [how to become an electrical estimator](/blog/how-to-become-an-electrical-estimator) covers the routes in from the field and from school.",
    },
    { type: "h2", text: "Do electrical contractors pay estimators more than general contractors?" },
    {
      type: "p",
      text: "Not by the federal numbers. In May 2025, cost estimators at specialty trade contractors earned a median a little below those at building contractors, and well below heavy and civil construction.[^1]",
    },
    {
      type: "table",
      caption: "Median annual wage for cost estimators by industry, May 2025",
      head: ["Industry", "Median annual wage", "Share of estimator jobs"],
      rows: [
        ["Heavy and civil engineering construction", "$99,910", "5%"],
        ["Construction of buildings", "$84,610", "15%"],
        ["Specialty trade contractors (includes electrical)", "$80,330", "33%"],
        ["Manufacturing", "$75,940", "12%"],
        ["Automotive repair and maintenance", "$64,800", "9%"],
      ],
      note: "Source: BLS Occupational Outlook Handbook, cost estimators.[^1] Shares are of the 226,400 cost estimator jobs in 2025.",
    },
    {
      type: "p",
      text: "For electrical contractors alone, the last industry tables BLS published as web pages, for May 2023, counted 15,020 cost estimators with a median of $37.99 an hour, about $79,000 for a 2,080-hour year, and a mean of $83,900.[^4] The May 2025 version sits in a BLS data tool we could not open, so treat those figures as two years old.",
    },
    { type: "h2", text: "What moves an electrical estimator's pay?" },
    {
      type: "ul",
      items: [
        "**What you price alone.** Takeoff for someone else's bid is a different job from owning the number on a hospital or data center. Ask what size and type of work the seat carries before you compare offers.",
        "**Department level.** Senior and chief estimators review other people's numbers and decide which work to chase. Expect the title to matter less than the size of the bids you sign off.",
        "**Software and speed.** BLS projects a 3% decline in cost estimator jobs from 2025 to 2035 because estimating software lets fewer people price the same work.[^1] Fast, accurate takeoff on screen is now the baseline, not a bonus.",
        "**Bid results.** Some contractors tie part of an estimator's pay to work won. BLS leaves nonproduction bonuses out of its wage data, so a hit-rate bonus is in none of the figures here.[^3] Get the formula in writing.",
        "**Location.** In Florida, for example, the state median was $74,990, with Orlando at $76,390 and Tampa at $78,740.[^2]",
      ],
    },
    {
      type: "p",
      text: "Show the bids on paper. Our [construction resume guide](/blog/electrical-construction-resume-guide) has an example of listing bid volume and jobs won without giving away anything confidential.",
    },
    { type: "h2", text: "How does estimator pay compare with project manager pay?" },
    {
      type: "p",
      text: "Project managers earn more on paper. Construction managers, the BLS occupation that covers most project managers, had a median of $114,990 in May 2025, against $78,740 for cost estimators.[^5][^1] The gap narrows at specialty trade contractors, where the medians were $104,100 and $80,330.",
    },
    {
      type: "table",
      caption: "Estimator vs project manager pay, using the closest BLS occupations",
      head: ["Measure", "Cost estimators", "Construction managers"],
      rows: [
        ["Median, all industries, May 2025", "$78,740", "$114,990"],
        ["Median, specialty trade contractors, May 2025", "$80,330", "$104,100"],
        ["Median hourly, electrical contractors, May 2023", "$37.99", "$50.54"],
        ["Mean annual, electrical contractors, May 2023", "$83,900", "$118,590"],
      ],
      note: "Sources: BLS Occupational Outlook Handbook and May 2023 industry tables.[^1][^5][^4]",
    },
    {
      type: "p",
      text: "The difference pays for carrying the job after it is won: budget, billing, change orders and the client. Our [electrical project manager salary](/blog/electrical-project-manager-salary) guide breaks down PM pay by market and level, so it is not repeated here.",
    },
    {
      type: "p",
      text: "If you are weighing a move from estimating to project management, compare the whole package, including bonus, vehicle and expected hours, not the base salary alone.",
    },
    { type: "h2", text: "Are electrical estimators paid overtime?" },
    {
      type: "p",
      text: "It depends on how the job is classified, not on the title. Federal law requires time and a half after 40 hours in a workweek for employees who are not exempt. Salaried office employees can be exempt if their duties pass the federal tests and they earn at least $684 a week, and the Labor Department says job titles do not determine exempt status.[^6]",
    },
    {
      type: "p",
      text: "BLS notes that some cost estimators work more than 40 hours a week.[^1] If bid weeks run long and the job is salaried, count those hours when you compare offers.",
    },
    { type: "h2", text: "Is demand for estimators pushing pay up?" },
    {
      type: "p",
      text: "In the 2026 workforce survey by the Associated General Contractors of America (AGC) and NCCER, 82% of construction firms had salaried openings, and 87% of those firms said the positions were as hard or harder to fill than a year earlier. More than eight in ten said they raised base pay for craft and salaried workers at least as much as the year before.[^7]",
    },
    {
      type: "p",
      text: "That covers construction as a whole, not estimators alone, and BLS still projects a small decline in estimator jobs. Use it as context when you talk numbers, and see our guide on [how to negotiate salary in construction](/blog/how-to-negotiate-salary-in-construction).",
    },
    { type: "h2", text: "How do referral rewards work for estimator roles?" },
    {
      type: "p",
      text: "On ECRN, estimators at every level are Tier 3, office positions. Refer someone who is placed in one of those roles with a Delta Construction Partners client and the reward is up to $7,500. The amount is an estimate, confirmed in writing before payout, and it is paid after the guarantee period, typically 90 days. See [referral rewards](/referral-rewards) for the details.",
    },
    {
      type: "cta",
      title: "Ready for a bigger estimating seat?",
      text: "See what electrical contractors look for in an estimator, from takeoff speed to the bids you have carried alone.",
      href: "/careers/electrical-estimator",
      label: "Electrical estimator careers",
    },
  ],
  faqs: [
    {
      q: "How much does an electrical estimator make an hour?",
      a: "BLS has no electrical-only figure. For cost estimators in all industries, the median was $37.86 an hour in May 2025, and the middle half earned between $29.40 and $48.97 an hour.",
    },
    {
      q: "Do senior electrical estimators make six figures?",
      a: "The top quarter of cost estimators did: they earned more than $101,850 in May 2025, and the top 10% more than $130,820, before nonproduction bonuses. BLS does not publish pay by title, so ask what the seat paid last time.",
    },
    {
      q: "Do estimators make more than project managers?",
      a: "Usually not. Construction managers, the closest BLS group for project managers, had a median of $114,990 in May 2025, against $78,740 for cost estimators.",
    },
    {
      q: "Do you need a degree to be an electrical estimator?",
      a: "Not always. BLS says cost estimators typically need a bachelor's degree, but workers with several years of construction experience sometimes qualify in that industry without one.",
    },
    {
      q: "What is the ECRN referral reward for an estimator?",
      a: "Estimators at every level are Tier 3, office positions: up to $7,500 per hire. The amount is an estimate confirmed in writing, paid after the person is placed with a Delta Construction Partners client and completes the guarantee period, typically 90 days.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Occupational Outlook Handbook: Cost Estimators",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/business-and-financial/cost-estimators.htm",
      accessed: "2026-11-20",
      note: "Page last modified August 27, 2026. SOC 13-1051, May 2025: median $78,740 a year ($37.86 an hour). 226,400 jobs in 2025; largest employers: specialty trade contractors 33%, construction of buildings 15%, manufacturing 12%, automotive repair 9%, heavy and civil 5%. Medians by industry: heavy and civil $99,910, construction of buildings $84,610, specialty trade contractors $80,330, manufacturing $75,940, automotive repair $64,800. Projected decline of 3% from 2025 to 2035 because software lets fewer estimators do the same work; about 17,600 openings a year. Some work more than 40 hours a week. Typically a bachelor's degree, though construction experience sometimes substitutes.",
    },
    {
      id: 2,
      title: "Local Wages: Cost Estimators (13-1051.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/localwages/13-1051.00?st=FL",
      accessed: "2026-11-20",
      note: "BLS OEWS 2025 wage data. U.S. annual: 10th $48,530, 25th $61,150, median $78,740, 75th $101,850, 90th $130,820. U.S. hourly: $23.33, $29.40, $37.86, $48.97, $62.90. Florida median $74,990; Orlando-Kissimmee-Sanford $76,390; Tampa-St. Petersburg-Clearwater $78,740.",
    },
    {
      id: 3,
      title: "Technical Notes for May 2025 OEWS Estimates",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/oes/2025/may/oes_tec.htm",
      accessed: "2026-11-20",
      note: "Wages are straight-time gross pay. Production bonuses are included; overtime, shift differentials, nonproduction bonuses and employer cost of benefits are excluded. The self-employed and owners of unincorporated firms are not surveyed.",
    },
    {
      id: 4,
      title: "May 2023 National Industry-Specific Occupational Employment and Wage Estimates: NAICS 238210, Electrical Contractors and Other Wiring Installation Contractors",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/oes/2023/may/naics5_238210.htm",
      accessed: "2026-11-20",
      note: "Latest industry cut available as a web page (last modified April 3, 2024). Cost estimators: employment 15,020, median hourly $37.99, annual mean $83,900. Construction managers: median hourly $50.54, annual mean $118,590. The $79,000 figure is our arithmetic ($37.99 x 2,080 hours, rounded).",
    },
    {
      id: 5,
      title: "Occupational Outlook Handbook: Construction Managers",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/management/construction-managers.htm",
      accessed: "2026-11-20",
      note: "SOC 11-9021, May 2025: median $114,990 a year. Median at specialty trade contractors $104,100. The roughly $36,000 gap with cost estimators is our arithmetic.",
    },
    {
      id: 6,
      title: "Fact Sheet #17A: Exemption for Executive, Administrative, Professional, Computer and Outside Sales Employees Under the FLSA",
      publisher: "U.S. Department of Labor, Wage and Hour Division",
      url: "https://www.dol.gov/agencies/whd/fact-sheets/17a-overtime",
      accessed: "2026-11-20",
      note: "Most employees must receive at least time and one-half for hours over 40 in a workweek. Exempt employees generally must meet duties tests and be paid on a salary basis of at least $684 a week. Job titles do not determine exempt status.",
    },
    {
      id: 7,
      title: "Construction Workforce Shortages Remain Acute Despite 'Soft' Market Conditions As Data Centers Strain Labor Supply, Survey Finds",
      publisher: "Associated General Contractors of America",
      url: "https://www.agc.org/news/2026/09/03/construction-workforce-shortages-remain-acute-despite-soft-market-conditions-data-centers-strain",
      accessed: "2026-11-20",
      note: "AGC and NCCER 2026 Workforce Survey, July and August 2026, 1,830 respondents. 82% have openings for salaried positions; of firms with salaried openings, 87% say they are as hard or harder to fill than a year ago. More than eight in 10 firms increased base pay for hourly craft and salaried workers as much as or more than a year earlier.",
    },
  ],
  related: [
    "electrical-project-manager-salary",
    "how-to-become-an-electrical-estimator",
    "electrical-construction-resume-guide",
    "how-to-negotiate-salary-in-construction",
  ],
  moneyPage: { href: "/careers/electrical-estimator", label: "Electrical estimator careers" },
};

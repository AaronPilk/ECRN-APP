import type { BlogPost } from "@/lib/blog/types";

export const relocatingForAConstructionJob: BlogPost = {
  slug: "relocating-for-a-construction-job",
  title: "Relocating for a construction job: when the move pays off",
  metaTitle: "Relocating for a Construction Job: Packages and Taxes | ECRN",
  description:
    "Should you move for a construction job? What relocation packages cover, how cost of living changes an offer, 2026 IRS rules on moving costs, and a checklist.",
  category: "job-search",
  targetQuery: "relocating for a construction job",
  secondaryQueries: [
    "relocation package construction job",
    "should I relocate for a job",
    "are moving expenses tax deductible in 2026",
    "is relocation reimbursement taxable",
    "how to negotiate a relocation package",
  ],
  answer:
    "Relocating for a construction job pays off when the offer still comes out ahead after the new area's cost of living, the tax on any relocation money and the risk that the work dries up. Under current federal law, employer moving reimbursements are taxable and the moving deduction is gone, except for active-duty military and certain intelligence community employees.",
  keyTakeaways: [
    "Relocation help can be a lump sum, a reimbursement, a company-managed move or a mix. Read the repayment clause before you sign.",
    "Moving reimbursements are taxable income, and the moving deduction now applies only to active-duty military and certain intelligence community employees.",
    "In 2024, BEA put California's price level at 110.7 and Arkansas's at 86.9, against a national 100.",
    "A single project with no backlog behind it can leave you in a new city with no work.",
    "Negotiate every piece before you accept, in writing, including who pays the tax.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-relocation",
  body: [
    { type: "h2", text: "Should you relocate for a construction job?" },
    {
      type: "p",
      text: "Move when the job gives you something you can't get at home: a step up in title, steady work on a long backlog, or a market that pays your trade more even after the cost of living. Don't move for a raise the new city's rent will eat, or for one project with nothing lined up behind it.",
    },
    {
      type: "p",
      text: "You have room to ask for help with the move. BLS counted 298,000 construction job openings in September 2026, a preliminary figure, against 206,000 a year earlier.[^1] A contractor that can't fill a role locally has a reason to pay to bring you in. Start by comparing [open electrical construction jobs](/jobs) in the markets you would consider.",
    },
    { type: "h2", text: "What does a relocation package usually include?" },
    {
      type: "p",
      text: "There is no standard package. Each employer builds its own, so ask about each piece:",
    },
    {
      type: "table",
      caption: "Common pieces of a relocation package",
      head: ["Piece", "What it covers", "What to check"],
      rows: [
        ["Lump sum", "A set amount you spend as you choose", "Paid before or after the move, and the tax on it"],
        ["Reimbursement", "Receipts for movers, a truck, travel", "The cap, and what counts"],
        ["Managed move", "The company hires and pays the movers", "Weight or distance limits, and storage"],
        ["Temporary housing", "A furnished place for the first weeks", "How long, and what happens if your home hasn't sold"],
        ["House-hunting trip", "Travel to find a place before the move", "How many days, and who can come"],
        ["Home sale or lease help", "Agent fees, closing costs, lease-break penalties", "Caps, and whether the tax is covered"],
        ["Tax gross-up", "Extra pay to cover the tax on relocation money", "Federal only, or state and payroll taxes too"],
        ["Repayment clause", "What you owe back if you leave early", "How long it lasts and whether it shrinks"],
      ],
    },
    {
      type: "p",
      text: "For a picture of a complete package, look at the rules the federal government uses to move its own employees. They cover a house-hunting trip, selling and buying a home, property management, a miscellaneous expense allowance and the taxes on relocation expenses,[^2] along with shipping household goods.[^3]",
    },
    { type: "h2", text: "Are relocation reimbursements taxable in 2026?" },
    {
      type: "p",
      text: "Yes, for almost everyone. The deduction for moving expenses has been disallowed for tax years beginning after December 31, 2017, and Public Law 119-21, the One, Big, Beautiful Bill Act, made that permanent.[^5] The same law permanently ended the tax-free treatment of employer moving reimbursements. In the words of the IRS's 2026 employer guide: “P.L. 119-21 permanently eliminates the exclusion for qualified moving expense reimbursements from your employee's income.”[^4]",
    },
    {
      type: "p",
      text: "The exceptions are narrow: members of the Armed Forces on active duty who move under a military order because of a permanent change of station, and, for moves in 2026 or later, employees or new appointees of the intelligence community who relocate for a change in assignment.[^6][^7] Everyone else should plan on relocation money counting as taxable income.[^4]",
    },
    {
      type: "p",
      text: "So a package is not the same as money in your pocket. Unless the company also pays the tax on it, often called a gross-up, part of it goes to taxes.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "Not tax advice",
      text: "This is general information about federal tax rules as published on irs.gov in November 2026. State rules differ. Ask a tax professional before you sign a relocation agreement.",
    },
    { type: "h2", text: "How does cost of living change a relocation offer?" },
    {
      type: "p",
      text: "Compare what the money buys, not the number on the letter. The Bureau of Economic Analysis publishes regional price parities: each state's price level against a national average of 100. In 2024 California was highest at 110.7, then Hawaii at 110.0 and New Jersey at 108.8. Arkansas was lowest at 86.9, then Mississippi at 87.0 and Iowa and Oklahoma at 87.8.[^9]",
    },
    {
      type: "p",
      text: "Rent is where the spread is widest: BEA's price parity for housing rents ran from 154.3 in California to 54.2 in West Virginia.[^9]",
    },
    {
      type: "p",
      text: "To compare two offers, divide the new salary by the new state's parity and multiply by your current state's parity. For example, $90,000 in a state at 110.7 buys about what $70,700 buys in a state at 87.0. BEA also publishes metro-area figures, which can differ from the state average, and plans to release 2025 figures on December 10, 2026.[^9]",
    },
    {
      type: "p",
      text: "Our [electrician salary by state](/blog/electrician-salary-by-state) table applies the same adjustment to electrician pay in every state.",
    },
    { type: "h2", text: "What should you check before you move?" },
    {
      type: "steps",
      items: [
        {
          title: "The work after this job",
          text: "Ask what the company has booked in that market and what happened to the last crew when its project finished. One project is not a career.",
        },
        {
          title: "The math after tax",
          text: "New pay, minus the change in cost of living, minus the tax on any relocation money. If it comes out close, it is not worth uprooting for.",
        },
        {
          title: "Housing",
          text: "Rent first. A lease you can break, or a month-to-month place, protects you if the job changes.",
        },
        {
          title: "Your license",
          text: "Find out whether your license carries over or you face a new exam. Our guide to [electrician license reciprocity](/blog/electrician-license-reciprocity) explains how it works.",
        },
        {
          title: "Family",
          text: "Schools, a partner's job, child care, and who you can call when something goes wrong.",
        },
        {
          title: "A trial run on per diem",
          text: "Starting on [traveling per diem](/blog/traveling-electrician-per-diem) before you move can look like a free trial. But the IRS treats a job that requires you to move, kept if your work is satisfactory during a probationary period, as indefinite, which changes how travel money is taxed.[^8]",
        },
        {
          title: "The repayment clause",
          text: "How long you must stay, whether the amount shrinks month by month, and whether you owe anything if they let you go.",
        },
      ],
    },
    { type: "h2", text: "How do you negotiate a relocation package?" },
    {
      type: "p",
      text: "Ask after the offer and before you accept, when the company wants you most. Ask for pieces, not just a bigger number:",
    },
    {
      type: "ul",
      items: [
        "**A gross-up**, so the package covers its own tax. Even federal agencies are authorized to pay allowances meant to cover “substantially all” of the added tax on a relocation.[^3]",
        "**Temporary housing** long enough to find a place, with an extension if your home hasn't sold.",
        "**A start date** that lets you finish your current job without paying for two homes for long.",
        "**A repayment clause that shrinks** month by month, and none if they end your employment.",
        "**Trips home** in the first months if your family follows later.",
      ],
    },
    {
      type: "p",
      text: "Keep the ask plain: “I want this job and I'm ready to move. To make it work, I need help with the move itself: temporary housing until I find a place, and the tax on the relocation money covered. Can we add that to the offer?”",
    },
    {
      type: "p",
      text: "Get every piece in the written offer before you resign. Our guide on [how to negotiate salary in construction](/blog/how-to-negotiate-salary-in-construction) has more scripts.",
    },
    { type: "h2", text: "When should you not move?" },
    {
      type: "ul",
      items: [
        "The job is a single project with no backlog behind it.",
        "The raise disappears once you adjust for prices.",
        "You would carry two homes for months with no housing help.",
        "A travel job would give you the same experience without moving your family.",
        "Your license won't carry over for months, and you would work below your level until it does.",
      ],
    },
    {
      type: "cta",
      title: "Compare jobs in other markets",
      text: "Browse open electrical construction roles by city, then ask what relocation help comes with each one.",
      href: "/jobs",
      label: "Browse open jobs",
    },
  ],
  faqs: [
    {
      q: "Are moving expenses tax deductible in 2026?",
      a: "Only for members of the Armed Forces on active duty who move under a military order because of a permanent change of station, and for employees or new appointees of the intelligence community who move for a change in assignment. For everyone else the deduction is permanently disallowed.",
    },
    {
      q: "Is a relocation reimbursement from my employer taxable?",
      a: "Yes, for most people. Public Law 119-21 permanently eliminated the exclusion for qualified moving expense reimbursements, so relocation money counts as taxable income. Ask whether your employer will gross it up, and check with a tax professional.",
    },
    {
      q: "What does a construction relocation package include?",
      a: "It depends on the employer. The usual pieces are a lump sum or reimbursement for the move, temporary housing, a house-hunting trip, help selling a home or breaking a lease, sometimes a tax gross-up, and a repayment clause to read carefully.",
    },
    {
      q: "How do I compare salaries in two different states?",
      a: "Adjust for prices. Divide the new offer by the new state's BEA regional price parity and multiply by your current state's parity. In 2024 the parities ran from 86.9 in Arkansas to 110.7 in California.",
    },
    {
      q: "Should I take a relocation package that has to be paid back?",
      a: "It can be fine if the term is short and the amount shrinks over time. Ask how long you must stay and whether you owe anything if they let you go, and get the answers in writing.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Job Openings and Labor Turnover Survey, Table 1: Job openings levels and rates by industry and region, seasonally adjusted",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/news.release/jolts.t01.htm",
      accessed: "2026-11-20",
      note: "Construction job openings: 298,000 in September 2026 (preliminary), against 206,000 in September 2025.",
    },
    {
      id: 2,
      title: "Supplemental Guide to the Federal Travel Regulation, Version 1.0 (July 16, 2026)",
      publisher: "U.S. General Services Administration",
      url: "https://www.gsa.gov/system/files/FTR%20Supplemental%20Guidancev1.pdf",
      accessed: "2026-11-20",
      note: "Chapter 302 relocation allowances for federal employees include parts on house-hunting trip expenses, residence transactions, relocation services companies, home marketing incentive payments, property management services, miscellaneous expenses and taxes on relocation expenses.",
    },
    {
      id: 3,
      title: "Reimbursable relocation expenses and rates",
      publisher: "U.S. General Services Administration",
      url: "https://www.gsa.gov/policy-regulations/policy/employee-relocation-management-policy/reimbursable-relocation-expenses-and-rates",
      accessed: "2026-11-20",
      note: "Last updated October 15, 2026. Agencies are authorized to pay a Withholding Tax Allowance and a Relocation Income Tax Allowance to cover “substantially all” of the increased tax liability. Household goods transportation rate table for November 1, 2026 to October 31, 2027.",
    },
    {
      id: 4,
      title: "Publication 15 (2026), (Circular E), Employer's Tax Guide",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/publications/p15",
      accessed: "2026-11-20",
      note: "What's New: “P.L. 119-21 permanently eliminates the exclusion for qualified moving expense reimbursements from your employee's income.” The exclusion remains for active-duty members of the Armed Forces moving because of a permanent change of station due to a military order, and is extended to employees or new appointees of the intelligence community who move for a change in assignment that requires relocation.",
    },
    {
      id: 5,
      title: "Notice 2026-10",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/pub/irs-drop/n-26-10.pdf",
      accessed: "2026-11-20",
      note: "Section 70113(a) of the OBBBA made permanent the disallowance of the deduction for moving expenses, except to the extent section 217(g) applies, for taxable years beginning after December 31, 2017; section 70113(b) brought certain members of the intelligence community within section 217(g).",
    },
    {
      id: 6,
      title: "Topic no. 455, Moving expenses for members of the Armed Forces and the Intelligence Community",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/taxtopics/tc455",
      accessed: "2026-11-20",
      note: "Page last reviewed October 16, 2026. Active-duty members of the Armed Forces may deduct unreimbursed or exclude reimbursed moving expenses for a move due to a military order and incident to a permanent change of station. Employees or new appointees of the intelligence community moving in 2026 or later may be treated the same way.",
    },
    {
      id: 7,
      title: "Instructions for Form 3903 (2026), Moving Expenses",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/instructions/i3903",
      accessed: "2026-11-20",
      note: "Page last reviewed November 9, 2026. You can deduct moving expenses only if you are a member of the Armed Forces on active duty moving under a military order because of a permanent change of station, or a member of the intelligence community who moves pursuant to a change in assignment that requires relocation.",
    },
    {
      id: 8,
      title: "Publication 463 (2025), Travel, Gift, and Car Expenses",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/publications/p463",
      accessed: "2026-11-20",
      note: "Chapter 1: if you take a job that requires you to move, with the understanding that you will keep the job if your work is satisfactory during a probationary period, the job is indefinite.",
    },
    {
      id: 9,
      title: "Regional Price Parities by State and Metro Area",
      publisher: "U.S. Bureau of Economic Analysis",
      url: "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area",
      accessed: "2026-11-20",
      note: "2024 data, current release February 19, 2026; next release December 10, 2026. Highest state price parities: California 110.7, Hawaii 110.0, New Jersey 108.8. Lowest: Arkansas 86.9, Mississippi 87.0, Iowa 87.8, Oklahoma 87.8. Housing rents: California 154.3 (highest), West Virginia 54.2 (lowest).",
    },
  ],
  related: [
    "traveling-electrician-per-diem",
    "how-to-negotiate-salary-in-construction",
    "electrician-salary-by-state",
    "electrician-license-reciprocity",
  ],
  moneyPage: { href: "/jobs", label: "Browse open electrical construction jobs" },
};

import type { BlogPost } from "@/lib/blog/types";

export const assistantProjectManagerElectrical: BlogPost = {
  slug: "assistant-project-manager-electrical",
  title: "Assistant project manager in electrical construction: role and path",
  metaTitle: "Assistant Project Manager, Electrical: Duties and Pay | ECRN",
  description:
    "What an electrical assistant project manager does: submittals, RFIs, change orders, billing and procurement, who gets hired, pay proxies and the path to PM.",
  category: "careers",
  targetQuery: "assistant project manager electrical",
  secondaryQueries: [
    "electrical assistant project manager",
    "assistant project manager construction duties",
    "electrical assistant project manager salary",
    "APM to project manager",
    "assistant project manager vs project engineer",
    "electrical APM job description",
  ],
  answer:
    "An assistant project manager (APM) at an electrical contractor runs the paperwork and tracking behind a project under a project manager: submittals, RFIs, change order pricing, billing support and procurement tracking. It is the usual training seat for future electrical project managers, filled by construction management and engineering graduates, project engineers and field leaders moving into the office.",
  keyTakeaways: [
    "APMs handle submittals, RFIs, change order logs and pricing, pay application backup and delivery tracking.",
    "Common hires: construction management or engineering graduates, project engineers, and foremen moving inside.",
    "BLS says new construction managers usually start as assistants under an experienced manager for up to a year, sometimes several.",
    "BLS has no APM pay figure; the closest proxies are project management specialists and the lower range of construction managers.",
    "Promotion comes from owning outcomes: a budget, a customer conversation and a small job run end to end.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-assistant-pm",
  body: [
    { type: "h2", text: "What does an assistant project manager do at an electrical contractor?" },
    {
      type: "p",
      text: "The APM keeps the paperwork and tracking moving, so the project manager can manage the money and the customer and the field can keep building. On a big project an APM may own one building or system; at a smaller contractor, one APM may support a PM across several jobs.",
    },
    {
      type: "ul",
      items: [
        "**Submittals.** Building the [submittal](/glossary#submittal) log from the specifications, collecting product data and shop drawings, sending them for review and tracking approvals so gear can be released.",
        "**RFIs.** Writing questions to the engineer when drawings conflict or leave something out, and logging the answers so the field builds the current design.",
        "**Change orders.** Logging changes, pricing them with labor units and supplier quotes, and chasing signatures before the work is done.",
        "**Billing support.** Updating the schedule of values and percent complete for the monthly pay application, and collecting lien waivers and backup.",
        "**Procurement tracking.** Purchase orders, release dates and deliveries for gear, fixtures and other long-lead items.",
        "**Records and closeout.** Meeting minutes, logs, warranties, operation and maintenance manuals and as-builts.",
      ],
    },
    {
      type: "p",
      text: "AIA calls its G702 application for payment and G703 continuation sheet the industry standard for monthly payment, and the forms tie each line of the schedule of values to work completed, stored materials, retainage and change orders.[^1] Subcontractor billings roll up into that package, so an APM who keeps the electrical schedule of values clean helps the whole job get paid on time.",
    },
    { type: "h2", text: "Who gets hired as an electrical assistant project manager?" },
    {
      type: "ul",
      items: [
        "**Construction management and engineering graduates**, often after an internship. BLS notes that students in internships and co-op programs can gain construction experience that way.[^2]",
        "**Project engineers** ready for more of the money side. Our [project engineer vs project manager](/blog/project-engineer-vs-project-manager) guide compares the roles.",
        "**Foremen and superintendents** moving inside, who bring labor knowledge a graduate has to learn on the job.",
        "**Estimators and purchasing staff** who already know pricing and suppliers.",
      ],
    },
    {
      type: "p",
      text: "BLS lists a bachelor's degree in construction, business or engineering as typical for construction managers, and says large firms may prefer candidates with both construction experience and a construction-related degree.[^2]",
    },
    { type: "h2", text: "What skills and software does an electrical APM need?" },
    {
      type: "p",
      text: "Organization comes first: logs that are current every Friday, and nothing waiting on you. After that, the skill is reading specifications and drawings well enough to catch a wrong submittal, price a change from labor units and quotes, and write an RFI the engineer can answer in one pass.",
    },
    {
      type: "p",
      text: "On software, the Department of Labor's O-NET database flags Procore and Microsoft Excel as in-demand technologies for construction managers, meaning they often appear in job postings, and lists Oracle Primavera for scheduling.[^3] Learn the document control and billing tools your employer runs, and you will be useful in your first month.",
    },
    { type: "h2", text: "How long do people usually stay in the APM role?" },
    {
      type: "p",
      text: "We found no published figure for electrical APMs, and it varies widely by contractor. The closest federal description: BLS says new construction managers are typically hired as assistants and work under an experienced manager for up to a year, though at some firms that training lasts several years.[^2]",
    },
    {
      type: "p",
      text: "In practice the timing depends on the size of the jobs, how fast the company is growing, and how quickly you show you can own outcomes rather than track them.",
    },
    { type: "h2", text: "How much does an electrical assistant project manager make?" },
    {
      type: "p",
      text: "BLS publishes no APM figure, so here are the closest proxies and what each one stands for:",
    },
    {
      type: "table",
      caption: "Proxies for APM pay, not APM salaries",
      head: ["Proxy", "Why it is close", "Pay"],
      rows: [
        [
          "Construction managers (SOC 11-9021), 10th to 25th percentile, U.S., May 2025",
          "BLS says new construction managers usually start as assistants",
          "$69,690 to $88,550 a year[^4]",
        ],
        [
          "Project management specialists (SOC 13-1082), all industries, May 2025",
          "They coordinate a project's budget, schedule and other details",
          "Median $102,320 a year[^2]",
        ],
        [
          "Project management specialists at electrical contractors (NAICS 238210), May 2023",
          "The same occupation inside electrical firms",
          "Mean $98,560 a year; median $44.37 an hour[^5]",
        ],
      ],
      note: "BLS codes jobs by the work performed, not the title. The project management specialist figures cover every experience level, not only assistants.",
    },
    {
      type: "p",
      text: "Read these as a range, not a quote. A graduate APM at a small contractor and a former superintendent working as an APM on a data center will be paid very differently.",
    },
    {
      type: "p",
      text: "Our [electrical project manager salary](/blog/electrical-project-manager-salary) guide covers what the next step pays, by state and type of contractor.",
    },
    { type: "h2", text: "How do you get promoted from APM to project manager?" },
    {
      type: "steps",
      items: [
        {
          title: "Own a budget",
          text: "Ask to forecast one cost code, then one system, then the job. Learn why labor fades and where buyout savings come from.",
        },
        {
          title: "Lead something with the customer",
          text: "Take the lead on a change negotiation or the monthly billing review with the general contractor.",
        },
        {
          title: "Earn the field's trust",
          text: "Walk the job every week. A PM the superintendent trusts gets better information and a better forecast.",
        },
        {
          title: "Run a small job end to end",
          text: "A tenant improvement or service project: contract review, buyout, billing and closeout, with your PM as backup instead of lead.",
        },
        {
          title: "Make your case with numbers",
          text: "Before your review, list what you owned: changes priced and collected, submittals released on time, billing cycles with no rejections.",
        },
      ],
    },
    {
      type: "p",
      text: "The full route, including the PMP and CCM credentials, is in [how to become an electrical project manager](/blog/how-to-become-an-electrical-project-manager).",
    },
    { type: "h2", text: "What are the downsides of the APM seat?" },
    {
      type: "ul",
      items: [
        "**It can become a holding pattern.** If you only process paper and never own a decision, the assistant title can stick.",
        "**Pay can trail the field.** The top 10% of first-line construction supervisors earned more than $128,260 in May 2025, so a strong foreman may take a cut to move inside.[^6]",
        "**Month-end pressure.** Billing deadlines, closeout documents and submittal turnarounds tend to land together.",
        "**Two sets of customers.** You answer to the PM, but the field depends on you too.",
      ],
    },
    {
      type: "p",
      text: "On ECRN, office positions, which the program lists as estimators and project managers at all levels, are Tier 3: up to $7,500 when someone you refer is placed with a Delta Construction Partners client. The amount is an estimate, confirmed in writing, and paid after the guarantee period, typically 90 days.",
    },
    {
      type: "cta",
      title: "Planning your path to project manager?",
      text: "See what electrical contractors expect from a project manager and how these roles get filled.",
      href: "/careers/electrical-project-manager",
      label: "Electrical project manager careers",
    },
  ],
  faqs: [
    {
      q: "What does an assistant project manager do in electrical construction?",
      a: "An APM handles submittals, RFIs, change order logs and pricing, billing support and procurement tracking under a project manager, so the PM can manage the budget and customer and the field can keep building.",
    },
    {
      q: "Is an assistant project manager the same as a project engineer?",
      a: "Not exactly, and titles vary by contractor. A project engineer usually focuses on documents and technical coordination, while an APM takes on more of the money side, such as change pricing and billing, on the way to project manager.",
    },
    {
      q: "How much does an electrical assistant project manager make?",
      a: "BLS publishes no APM figure. As proxies, construction managers at the 10th to 25th percentile earned $69,690 to $88,550 in May 2025, and project management specialists at electrical contractors averaged $98,560 in May 2023.",
    },
    {
      q: "How long does it take to go from APM to project manager?",
      a: "It varies by contractor and project size. BLS says new construction managers typically train under an experienced manager for up to a year, and at some firms for several years.",
    },
    {
      q: "Do you need a degree to be an assistant project manager?",
      a: "Not always. BLS lists a bachelor's degree as typical for construction managers and says large firms may prefer both construction experience and a related degree, but contractors also move foremen and superintendents into the office.",
    },
    {
      q: "Is there an ECRN referral reward for project management roles?",
      a: "Yes. Office positions, which ECRN lists as estimators and project managers at all levels, are Tier 3: up to $7,500 per hire, confirmed in writing and paid after the person is placed with a Delta Construction Partners client and completes the guarantee period, typically 90 days.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Payment Forms Every General Contractor Needs on a Project: G702 and G703 Pay Apps",
      publisher: "AIA Contract Documents",
      url: "https://learn.aiacontracts.com/articles/gc-pay-apps-g702-and-g703/",
      accessed: "2026-11-20",
      note: "G702 (Application and Certificate for Payment) and G703 (Continuation Sheet) are described as the industry standard for monthly payment releases, connected to the schedule of values, percentage of completion, stored materials, retainage and change orders, with subcontractor pay applications tied back to the same schedule of values.",
    },
    {
      id: 2,
      title: "Occupational Outlook Handbook: Construction Managers",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/management/construction-managers.htm",
      accessed: "2026-11-20",
      note: "Page last modified August 27, 2026. New construction managers are typically hired as assistants and work under an experienced manager for up to 1 year, sometimes several years. Typical education: bachelor's degree in construction, business or engineering; large firms may prefer both construction experience and a construction-related degree; students gain experience through internships and cooperative education. Similar occupations: project management specialists coordinate a project's budget, schedule, staffing and other details, 2025 median pay $102,320.",
    },
    {
      id: 3,
      title: "Summary Report: Construction Managers (11-9021.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/summary/11-9021.00",
      accessed: "2026-11-20",
      note: "Software skills: Procore software and Microsoft Excel are marked as in-demand hot technologies (requirements frequently included in employer job postings); Oracle Primavera Enterprise Project Portfolio Management is listed under project management software.",
    },
    {
      id: 4,
      title: "Local Wages: Construction Managers (11-9021.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/localwages/11-9021.00",
      accessed: "2026-11-20",
      note: "BLS OEWS May 2025 national data: 10th percentile $69,690, 25th percentile $88,550.",
    },
    {
      id: 5,
      title: "May 2023 National Industry-Specific Occupational Employment and Wage Estimates: NAICS 238210, Electrical Contractors and Other Wiring Installation Contractors",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/oes/2023/may/naics5_238210.htm",
      accessed: "2026-11-20",
      note: "May 2023 data, the latest industry cut available as a web page. Project management specialists (13-1082): employment 26,240, median hourly wage $44.37, annual mean wage $98,560.",
    },
    {
      id: 6,
      title: "Local Wages: First-Line Supervisors of Construction Trades and Extraction Workers (47-1011.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/localwages/47-1011.00",
      accessed: "2026-11-20",
      note: "BLS OEWS May 2025 national data: 90th percentile $128,260.",
    },
  ],
  related: [
    "how-to-become-an-electrical-project-manager",
    "project-engineer-vs-project-manager",
    "electrical-project-manager-salary",
    "electrical-project-manager-job-description",
  ],
  moneyPage: { href: "/careers/electrical-project-manager", label: "Electrical project manager careers" },
};

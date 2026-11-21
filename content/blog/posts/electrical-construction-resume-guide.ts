import type { BlogPost } from "@/lib/blog/types";

export const electricalConstructionResumeGuide: BlogPost = {
  slug: "electrical-construction-resume-guide",
  title: "Electrician resume guide, from journeyman to project manager",
  metaTitle: "Electrician Resume Guide: Journeyman to PM Examples | ECRN",
  description:
    "What electrical construction recruiters look for first, how to write project entries, which licenses to list, and weak versus strong bullets for five roles.",
  category: "job-search",
  targetQuery: "electrician resume",
  secondaryQueries: [
    "electrical foreman resume",
    "electrical project manager resume",
    "electrical superintendent resume",
    "electrical estimator resume",
    "journeyman electrician resume examples",
    "what to put on an electrician resume",
  ],
  answer:
    "A strong electrician, foreman or electrical project manager resume puts your license, your current title, the type and size of projects you have built, and the size of crew you ran in the top third of page one. Everything after that is proof, written as project entries with value, scope, crew size, voltage and systems, and schedule and safety results.",
  keyTakeaways: [
    "Recruiters skim first: a 2018 Ladders eye-tracking study put the initial resume screen at about 7 seconds, so the top third of page one decides the rest.",
    "Lead with license, title, project types, largest project and crew size. Drop the objective statement.",
    "Write project entries, not job descriptions: type, value or size, your scope, crew, voltage and systems, and the outcome.",
    "List OSHA 10-hour or 30-hour cards as training, because OSHA says its Outreach courses are not certifications.",
    "One page for most field roles, two for leadership and office roles, in a plain single-column layout.",
  ],
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  author: "ecrn-team",
  cover: "cover-resume",
  body: [
    { type: "h2", text: "What do electrical construction recruiters look for in the first ten seconds?" },
    {
      type: "p",
      text: "One answer: can this person do this job on this kind of project? A 2018 eye-tracking study by the job site Ladders, which was not specific to construction, found the initial resume screen lasts about 7.4 seconds, and that simple layouts with clear section headings held attention best.[^1] In electrical construction that first pass checks five things:",
    },
    {
      type: "ol",
      items: [
        "**License and state.** BLS notes that most states require electricians to be licensed and that requirements vary by state, so a recruiter needs yours before anything else.[^2]",
        "**Current title and contractor.** Journeyman, foreman, general foreman, superintendent, estimator, project manager.",
        "**Project type.** Data center, healthcare, industrial, commercial, multifamily, utility or service.",
        "**Scale.** Largest project by contract value, megawatts or square feet, and the size of the crew you ran.",
        "**Stability.** Start and end dates, with months, for each employer.",
      ],
    },
    { type: "h2", text: "What resume structure works best?" },
    {
      type: "table",
      head: ["Section", "What goes in it", "Notes"],
      rows: [
        ["Header", "Name, city and state, personal cell, personal email.", "No street address. No company email."],
        ["Summary", "Two or three lines: title, years, license, project types, largest project, crew size.", "Replaces the objective statement."],
        ["Licenses and training", "License type, state and expiry; cards and training with dates.", "Above experience for field roles."],
        ["Experience", "Employer, title, dates, then projects under each employer.", "Most recent first."],
        ["Selected projects", "Four to eight entries in the format below.", "The core of the resume."],
        ["Skills and tools", "Software, equipment, systems, languages.", "Only what you could be tested on."],
        ["Education", "Apprenticeship program, degree if any.", "One or two lines."],
      ],
    },
    { type: "h2", text: "How do you write a project entry?" },
    {
      type: "p",
      text: "Use the same six fields every time so a recruiter can compare your jobs at a glance.",
    },
    {
      type: "ul",
      items: [
        "**Project type and location:** hospital tower, 200,000 square feet, Tampa.",
        "**Contract value or size:** the electrical contract, not the building cost. Megawatts for data centers and solar.",
        "**Your scope:** what you personally ran, not what the company built.",
        "**Crew size:** peak headcount, and how many foremen reported to you.",
        "**Voltage classes and systems:** 15 kV, 480 V, generators, UPS, fire alarm, lighting control, low voltage.",
        "**Outcome:** schedule, hours worked without a recordable injury, change orders captured, rework avoided.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "A filled-in entry (illustrative)",
      text: "Data center, phase 2, Mesa, Arizona. $38M electrical contract. General foreman over 9 foremen and 85 electricians at peak. Scope: two 34.5 kV services, 12 unit substations, 16 UPS modules and overhead busway in 4 halls. Turned over 3 weeks early with no recordable injuries.",
    },
    {
      type: "p",
      text: "Only use numbers you can defend in an interview. If your employer treats contract values as confidential, use a range, megawatts or square feet instead.",
    },
    { type: "h2", text: "Which licenses and certifications should you list?" },
    {
      type: "p",
      text: "List what a contractor can verify, with the state and the date. In the 2026 AGC and NCCER workforce survey, half of respondents said available candidates lack needed skills, certificates or licenses, so put yours where they cannot be missed.[^5]",
    },
    {
      type: "ul",
      items: [
        "State journeyman or master electrician license, with state and expiry. Add a contractor or qualifier license if you hold one.",
        "OSHA 10-hour or 30-hour Construction card. OSHA calls these course completion cards from a voluntary program, not certifications, and says the 30-hour class suits supervisors. Write “OSHA 30-hour Construction, 2024”, not “OSHA certified”.[^3]",
        "NFPA 70E electrical safety training, with the date. OSHA lists 70E as a national consensus standard, not a regulation, but employers commonly ask for it.[^4]",
        "First aid, CPR and AED, plus aerial lift, forklift and other equipment tickets.",
        "Completed apprenticeship, NCCER credentials, and manufacturer or medium-voltage termination training.",
        "For office roles: PMP, estimating software such as Accubid or McCormick, scheduling in P6 or Microsoft Project, and Procore or Bluebeam.",
      ],
    },
    {
      type: "p",
      text: "Name them and stop. Requirements differ by state and employer, so confirm anything you are unsure of with your licensing board, not a blog.",
    },
    { type: "h2", text: "What do strong electrician, foreman and project manager resume bullets look like?" },
    {
      type: "table",
      caption: "Illustrative examples. Use your own projects and numbers.",
      head: ["Role", "Weak", "Strong"],
      rows: [
        [
          "[Journeyman electrician](/careers/journeyman-electrician)",
          "Installed conduit and pulled wire on commercial jobs.",
          "Ran 4-inch rigid and pulled 500 kcmil feeders for a 4,000 A service; terminated and torqued two switchboards with no failed insulation tests.",
        ],
        [
          "[Foreman](/careers/electrical-foreman)",
          "Supervised crew and ensured safety.",
          "Led 12 electricians on a 3-story medical office building; finished rough-in 8 working days ahead of schedule with no lost-time injuries.",
        ],
        [
          "[Superintendent](/careers/electrical-superintendent)",
          "Responsible for field operations.",
          "Ran the field on a $22M hospital expansion, 65 electricians at peak under 7 foremen; energized the new 15 kV service in a 6-hour planned outage.",
        ],
        [
          "[Estimator](/careers/electrical-estimator)",
          "Prepared estimates for various projects.",
          "Estimated $140M of healthcare and commercial work across 31 bids in Accubid; won 8; awarded jobs finished within 2% of estimated cost.",
        ],
        [
          "[Project manager](/careers/electrical-project-manager)",
          "Managed projects from start to finish.",
          "Managed a $31M electrical package on a 12 MW data center expansion; held 14% gross margin against a 12% bid and closed $2.6M in change orders.",
        ],
      ],
    },
    {
      type: "p",
      text: "The pattern is the same at every level: a number for size, a number for people, and a result.",
    },
    { type: "h2", text: "What are the most common resume mistakes?" },
    {
      type: "ul",
      items: [
        "A duty list copied from a job posting, with no projects.",
        "No license line, or a license with no state.",
        "Cluttered layouts, multiple columns and long sentences, which did worst in the Ladders study.[^1]",
        "A work email or company cell in the header.",
        "Pricing, customer contacts or drawings you have no right to share.",
        "Years without months, which reads like a hidden gap.",
        "Typos in gear names and voltages. An electrician reads those the way an editor reads spelling.",
      ],
    },
    { type: "h2", text: "How long should it be, and in what format?" },
    {
      type: "p",
      text: "One page for apprentices, journeymen and most foremen. Two pages for general foremen, superintendents, estimators, project managers and executives, with a separate project list if you need one. Use a single column, standard section headings and a plain font, and send a PDF unless the recruiter asks for Word.",
    },
    { type: "h2", text: "What do you do about gaps and short stints?" },
    {
      type: "p",
      text: "Put the reason on the line in a few words, because silence gets filled in for you. “Project completed”, “layoff at end of project”, “company closed” and “family leave” are all normal in construction. Short stints tied to projects ending are expected in the field: group them under one heading such as “Traveling journeyman, various contractors” and list the projects beneath.",
    },
    {
      type: "p",
      text: "A gap you can explain in one sentence is rarely a problem. A pattern of leaving mid-project is, so have the reason ready and a reference who will back it up.",
    },
    { type: "h2", text: "Where should you send it?" },
    {
      type: "p",
      text: "ECRN members can upload a resume or build one in their profile, then apply to open roles or refer people they know. [Create a free ECRN account](/signup) to start. ECRN is powered by Delta Construction Partners, a construction recruiting firm that has been recruiting since 2008.",
    },
    {
      type: "p",
      text: "If you are employed and looking quietly, read [how to job search confidentially](/blog/how-to-job-search-confidentially) before you upload a resume anywhere.",
    },
    {
      type: "p",
      text: "If you are aiming at mission-critical work, see what contractors expect in [data center electrical jobs](/blog/data-center-construction-electrical-jobs) and shape your project entries to match.",
    },
    {
      type: "cta",
      title: "Put your resume in front of electrical construction recruiters",
      text: "Upload it or build one in your ECRN profile. Joining is free, and Delta Construction Partners' recruiters take it from there.",
      href: "/signup",
      label: "Join ECRN free",
    },
  ],
  faqs: [
    {
      q: "How long should an electrician resume be?",
      a: "One page for apprentices, journeymen and most foremen. Two pages is fine for general foremen, superintendents, estimators and project managers who need room for a project list.",
    },
    {
      q: "What should an electrical project manager resume include?",
      a: "Project entries that show contract value, project type, team size, schedule performance, margin or cost results and change orders, plus the software you use. Add a PMP or an electrical license if you hold one.",
    },
    {
      q: "Is an OSHA 30 card a certification?",
      a: "No. OSHA describes its 10-hour and 30-hour Outreach classes as voluntary training that ends in a course completion card, not a certification. List it as OSHA 30-hour Construction with the year.",
    },
    {
      q: "What should an electrical foreman put on a resume?",
      a: "Your license, crew size, the types and sizes of projects you ran, and results on schedule, safety and rework. Use project entries with numbers instead of a list of duties.",
    },
    {
      q: "Should I include contract values on my resume?",
      a: "Yes, when you can, because project size is one of the first things a recruiter checks. If your employer treats values as confidential, use a range, megawatts or square feet.",
    },
    {
      q: "How do I explain a gap in construction work on a resume?",
      a: "Put a short reason on the line, such as layoff at end of project or family leave. Project-based gaps are normal in construction, and a one-sentence explanation is usually enough.",
    },
    {
      q: "Can I build a resume on ECRN?",
      a: "Yes. ECRN members can upload an existing resume or build one in their profile, then use it to apply to open roles.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Eye tracking study shows recruiters look at resumes for 7 seconds",
      publisher: "HR Dive",
      url: "https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/",
      accessed: "2026-11-20",
      note: "Published November 8, 2018, reporting the Ladders 2018 Eye-Tracking Study: average initial resume screen of 7.4 seconds; simple layouts with clear sections and headings performed best; cluttered layouts, multiple columns and long sentences performed worst. All industries, not construction specific.",
    },
    {
      id: 2,
      title: "Occupational Outlook Handbook: Electricians (How to Become an Electrician)",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm",
      accessed: "2026-11-20",
      note: "Most states require electricians to pass a test and be licensed; requirements vary by state.",
    },
    {
      id: 3,
      title: "Outreach Training Program (OSHA 10-Hour and 30-Hour Cards)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/training/outreach",
      accessed: "2026-11-20",
      note: "The program is voluntary; students receive a course completion card; none of the courses is considered a certification; the 30-hour class is more appropriate for supervisors or workers with some safety responsibility.",
    },
    {
      id: 4,
      title: "Electrical: Standards",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/electrical/standards",
      accessed: "2026-11-20",
      note: "Lists NFPA 70E, Standard for Electrical Safety in the Workplace, under national consensus standards, with the note that these are not OSHA regulations.",
    },
    {
      id: 5,
      title: "Construction Workforce Shortages Remain Acute Despite 'Soft' Market Conditions As Data Centers Strain Labor Supply, Survey Finds",
      publisher: "Associated General Contractors of America and NCCER",
      url: "https://www.agc.org/news/2026/09/03/construction-workforce-shortages-remain-acute-despite-soft-market-conditions-data-centers-strain",
      accessed: "2026-11-20",
      note: "2026 Workforce Survey, fielded July and August 2026, 1,830 respondents. Half of respondents report that available candidates are not qualified because they lack needed skills, certificates or licenses.",
    },
  ],
  related: [
    "how-to-job-search-confidentially",
    "recruiter-vs-job-board-vs-referral-network",
    "electrical-foreman-vs-superintendent",
    "data-center-construction-electrical-jobs",
  ],
  moneyPage: { href: "/signup", label: "Join ECRN free" },
};

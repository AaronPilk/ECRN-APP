import type { BlogPost } from "@/lib/blog/types";

export const howToBecomeAnElectricalForeman: BlogPost = {
  slug: "how-to-become-an-electrical-foreman",
  title: "How to become an electrical foreman: from journeyman to crew lead",
  metaTitle: "How to Become an Electrical Foreman, Step by Step | ECRN",
  description:
    "What contractors want in a new electrical foreman: running a crew, reading the schedule, paperwork, safety, asking for the role and your first 90 days.",
  category: "careers",
  targetQuery: "how to become an electrical foreman",
  secondaryQueries: [
    "journeyman to foreman",
    "electrical foreman requirements",
    "first time foreman tips",
    "how to ask for a foreman position",
    "electrical foreman training",
    "OSHA 30 for foremen",
  ],
  answer:
    "Electrical foremen are usually licensed journeymen who have shown they can run a small crew safely, read the drawings and schedule, order material ahead and keep the paperwork current, usually by handling a punch list or a small area first. You become one by asking for that work, doing it well, and making it easy for your superintendent to hand you more.",
  keyTakeaways: [
    "Contractors promote journeymen who already plan ahead, teach apprentices and keep their area safe and on pace.",
    "Running a crew means planning the day, the week and the material, not just working faster.",
    "OSHA's 30-hour Outreach class is voluntary and not a certification, but OSHA says it suits supervisors, and states, cities or employers may require it.",
    "Ask for the role with specifics: what you have already run, and what you want to run next.",
    "Use the first 90 days to learn your crew, own your paperwork and earn the superintendent's trust.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-become-foreman",
  body: [
    { type: "h2", text: "What does it take to become an electrical foreman?" },
    {
      type: "p",
      text: "A license, a record of clean work, and proof that you can lead people. The usual starting point is a licensed journeyman: BLS says most electricians learn the trade in a 4- or 5-year apprenticeship, and that experienced electricians may advance to supervisor.[^1]",
    },
    {
      type: "p",
      text: "The [electrical foreman career page](/careers/electrical-foreman) covers the role, the pay data and what recruiters ask. This guide covers the step up: what gets you picked, what changes, and how to handle your first months.",
    },
    { type: "h2", text: "What do contractors look for when they promote a journeyman?" },
    {
      type: "p",
      text: "Superintendents promote the journeyman they already lean on. The signs they watch for:",
    },
    {
      type: "ul",
      items: [
        "**You plan without being told.** You know what material, tools and lifts your area needs tomorrow.",
        "**Apprentices get better around you.** You are the person a new hire gets paired with.",
        "**Your work passes the first time.** Built to the drawings, with no rework at inspection.",
        "**You stay level with other trades.** You settle a clash on the spot instead of escalating every one.",
        "**You speak up early.** You flag a problem while it is still cheap to fix.",
      ],
    },
    { type: "h2", text: "What changes when you run a crew?" },
    {
      type: "p",
      text: "Your job moves from doing the work to setting it up. The federal task list for construction supervisors reads like a foreman's day: read blueprints to plan the work, assign tasks, inspect progress for safety and specifications, estimate material and labor needs, order materials, train workers and record production data.[^2]",
    },
    {
      type: "table",
      head: ["Area", "As a journeyman", "As a foreman"],
      rows: [
        ["Planning horizon", "Today's task", "Today, this week and the next delivery"],
        ["Drawings", "Your sheet and detail", "The full set, the schedule and the other trades' work"],
        ["Material", "Ask for what you need", "Order it ahead and track deliveries"],
        ["People", "Work alongside an apprentice", "Assign, teach and correct a whole crew"],
        ["Paper", "Your timecard", "Timecards, daily reports, quantities, safety forms, change tickets"],
        ["Answer for", "Your own work", "The crew's safety, quality and hours"],
      ],
      note: "Typical split. A working foreman on a small crew may still spend much of the day on the tools.",
    },
    { type: "h2", text: "How should a foreman read the schedule and drawings?" },
    {
      type: "p",
      text: "Start from the general contractor's schedule and the look-ahead for your area, then work backward: what has to be roughed in before walls close, which inspections are coming, and when gear and fixtures land. Material that arrives after the crew needs it means a crew standing around.",
    },
    {
      type: "p",
      text: "On the drawings, read past the electrical sheets. Check reflected ceiling plans, structural framing and mechanical layouts for conflicts with your runs before you install, and write questions up early as [RFIs](/glossary#rfi), with a marked-up sketch or a photo.",
    },
    { type: "h2", text: "What paperwork does an electrical foreman handle?" },
    {
      type: "ul",
      items: [
        "**Timecards by cost code**, so the project manager can see hours against the budget.",
        "**Daily reports**: crew size, work done, delays, deliveries, inspections and weather.",
        "**Installed quantities**, where the company tracks productivity.",
        "**Material requests**, early enough for the supplier to deliver.",
        "**Change and time-and-material tickets**, signed by the customer's representative the same day.",
        "**Safety records**: pre-task plans, toolbox talks and incident reports.",
      ],
    },
    {
      type: "p",
      text: "Paper is how the office knows whether the job is making money. Late or vague paperwork is one of the quickest ways for a new foreman to lose the seat.",
    },
    { type: "h2", text: "What does safety leadership look like for a new foreman?" },
    {
      type: "p",
      text: "The crew works to the standard you allow. In the Department of Labor's O-NET survey of construction supervisors, 78% reported very high responsibility for the health and safety of other workers.[^2] Run the pre-task plan before work starts, enforce lockout/tagout every time, and stop work you are not sure about.",
    },
    {
      type: "p",
      text: "Plan on an OSHA 30-hour card. OSHA says its Outreach classes are voluntary and are not a certification, that states, cities or employers may require them, and that the 30-hour class suits supervisors and workers with safety responsibility.[^3] The two cards are compared in [OSHA 10 vs OSHA 30](/blog/osha-10-vs-osha-30).",
    },
    {
      type: "p",
      text: "Leadership training helps too. NCCER's Fundamentals of Crew Leadership is a 22.5-hour module written for recently promoted crew leaders, covering leadership styles, communication, delegation, safety, planning, scheduling and estimating.[^4]",
    },
    { type: "h2", text: "How do you ask for a foreman position?" },
    {
      type: "p",
      text: "Ask your superintendent or general foreman directly, and be specific. Point to what you have already run, such as a punch list, a floor or a small crew while the foreman was out, then ask what they need to see before you get a crew of your own.",
    },
    {
      type: "p",
      text: "If the answer is not yet, ask for a smaller piece: lead on an area, a short service job or a shift. If the seat is not coming where you are, a foreman role elsewhere is a normal next step. Put crew sizes and results on your resume the way our [electrical resume guide](/blog/electrical-construction-resume-guide) shows.",
    },
    {
      type: "p",
      text: "Expect the interview to dig into crew size, safety and how you handle problems. Our [electrical foreman interview questions](/blog/electrical-foreman-interview-questions) cover the usual ones.",
    },
    { type: "h2", text: "What should you do in your first 90 days as a foreman?" },
    {
      type: "steps",
      items: [
        {
          title: "Days 1 to 30: learn the job and the crew",
          text: "Walk the job with the superintendent, read the full drawing set and the schedule, and learn what each person on your crew does best. Get the paperwork right from the first day.",
        },
        {
          title: "Days 31 to 60: plan further ahead",
          text: "Run your own look-ahead for material and manpower. If the company shares the labor budget for your area, track your hours against it every week.",
        },
        {
          title: "Days 61 to 90: show you can be left alone",
          text: "Solve problems before they reach the superintendent, and when you do bring one up, bring options with it. Ask for honest feedback at the 90-day mark.",
        },
      ],
    },
    { type: "h2", text: "How much more does an electrical foreman make?" },
    {
      type: "p",
      text: "BLS has no foreman-only figure. Its proxy, first-line supervisors of construction trades, had a median wage of $79,920 in May 2025, against $63,190 for electricians.[^5][^1] Union agreements write the premium down: IBEW Local 340's Sacramento-area inside agreement, effective June 1, 2026, pays a foreman 110% or 115% of the $53.70 journeyman rate, depending on crew size.[^6]",
    },
    {
      type: "p",
      text: "The [electrical foreman salary](/blog/electrical-foreman-salary) guide goes deeper on the numbers.",
    },
    { type: "h2", text: "When should you stay a journeyman?" },
    {
      type: "p",
      text: "When you would rather be on the tools all day, dislike paperwork, or the premium where you work does not cover the extra hours. In the federal survey, 63% of construction supervisors reported a typical work week of more than 40 hours.[^2]",
    },
    {
      type: "p",
      text: "For those who move up, the next steps are general foreman and superintendent, compared in [electrical foreman vs superintendent](/blog/electrical-foreman-vs-superintendent).",
    },
    {
      type: "p",
      text: "On ECRN, foremen are Tier 2, field leadership. Refer a foreman who is placed with a Delta Construction Partners client and the reward is up to $5,000, an estimate confirmed in writing and paid after the guarantee period, typically 90 days.",
    },
    {
      type: "cta",
      title: "Ready to run a crew?",
      text: "See what electrical contractors look for in a foreman and how these roles get filled.",
      href: "/careers/electrical-foreman",
      label: "Electrical foreman careers",
    },
  ],
  faqs: [
    {
      q: "How long does it take to become an electrical foreman?",
      a: "There is no set time. Foremen are usually licensed journeymen first, which BLS says usually means a 4- or 5-year apprenticeship, and then show they can lead small crews before getting their own.",
    },
    {
      q: "Do you need a special license to be an electrical foreman?",
      a: "Usually not a separate foreman license. Contractors hire on the electrician license the state requires for the work, plus a record of running work, and license rules vary by state.",
    },
    {
      q: "Is OSHA 30 required to be a foreman?",
      a: "Not by federal law. OSHA describes its Outreach classes as voluntary training, but states, cities or employers may require them, and OSHA says the 30-hour class suits supervisors.",
    },
    {
      q: "What makes a good first-time foreman?",
      a: "Planning ahead, clear communication with the crew and the superintendent, paperwork done the same day, and holding the safety standard even when the schedule is tight.",
    },
    {
      q: "How much more does a foreman make than a journeyman?",
      a: "It depends on the market and the agreement. IBEW Local 340's 2026 inside agreement pays foremen 110% or 115% of the journeyman rate, and nationally BLS's supervisor proxy had a median of $79,920 against $63,190 for electricians in May 2025.",
    },
    {
      q: "What is the ECRN referral reward for an electrical foreman?",
      a: "Foremen are Tier 2, field leadership: up to $5,000 per hire. The amount is an estimate confirmed in writing and paid after the person is placed with a Delta Construction Partners client and completes the guarantee period, typically 90 days.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Occupational Outlook Handbook: Electricians",
      publisher: "U.S. Bureau of Labor Statistics",
      url: "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm",
      accessed: "2026-11-20",
      note: "Most electricians learn in a 4- or 5-year apprenticeship; electricians may find opportunities to advance to supervisor or to other roles in project management. SOC 47-2111 median pay $63,190 a year, May 2025.",
    },
    {
      id: 2,
      title: "Summary Report: First-Line Supervisors of Construction Trades and Extraction Workers (47-1011.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/summary/47-1011.00",
      accessed: "2026-11-20",
      note: "Tasks: read specifications such as blueprints, assign work, inspect work progress for safety and specifications, estimate material or worker requirements, order materials, train workers, record production data. Work context: 78% reported very high responsibility for the health and safety of other workers; 63% reported a typical work week of more than 40 hours.",
    },
    {
      id: 3,
      title: "Outreach Training Program (OSHA 10-Hour and 30-Hour Cards)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/training/outreach",
      accessed: "2026-11-20",
      note: "The 10-hour and 30-hour classes are voluntary and are not a certification; states, cities or employers may require them; the 30-hour class suits supervisors and workers with some safety responsibility.",
    },
    {
      id: 4,
      title: "Fundamentals of Crew Leadership",
      publisher: "NCCER",
      url: "https://www.nccer.org/craft-catalog/fundamentals-of-crew-leadership/",
      accessed: "2026-11-20",
      note: "Module 46101, 4th edition (2022), 22.5 recommended hours. Designed for the recently promoted crew leader; covers leadership styles, communication, delegating, problem solving, jobsite safety and the crew leader's role in it, project planning, scheduling and estimating.",
    },
    {
      id: 5,
      title: "Local Wages: First-Line Supervisors of Construction Trades and Extraction Workers (47-1011.00)",
      publisher: "O*NET OnLine, U.S. Department of Labor",
      url: "https://www.onetonline.org/link/localwages/47-1011.00",
      accessed: "2026-11-20",
      note: "BLS OEWS May 2025 national data: median annual wage $79,920.",
    },
    {
      id: 6,
      title: "Local 340 Inside Wireman's Wage and Fringe Changes, effective June 1, 2026",
      publisher: "IBEW Local 340",
      url: "https://www.ibewlocal340.org/wp-content/uploads/2026/06/6-1-2026_LU-340-Inside-Wireman-Wages.pdf",
      accessed: "2026-11-20",
      note: "Journeyman wireman $53.70 an hour. Foreman with 6 or fewer workers 110%; with 7 or more, 115%.",
    },
  ],
  related: [
    "electrical-foreman-salary",
    "electrical-foreman-vs-superintendent",
    "electrical-foreman-interview-questions",
    "osha-10-vs-osha-30",
  ],
  moneyPage: { href: "/careers/electrical-foreman", label: "Electrical foreman careers" },
};

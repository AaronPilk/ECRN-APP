import type { BlogPost } from "@/lib/blog/types";

export const osha10VsOsha30: BlogPost = {
  slug: "osha-10-vs-osha-30",
  title: "OSHA 10 vs OSHA 30: which card electricians and foremen need",
  metaTitle: "OSHA 10 vs OSHA 30 for Electricians and Foremen | ECRN",
  description:
    "OSHA 10 vs OSHA 30 for electricians and supervisors: what each class covers, why neither is a certification, where the law requires one, and how to spot fakes.",
  category: "licensing",
  targetQuery: "OSHA 10 vs OSHA 30",
  secondaryQueries: [
    "OSHA 30 for electricians",
    "do electricians need OSHA 10 or OSHA 30",
    "is OSHA 30 a certification",
    "do OSHA cards expire",
    "how to tell if an OSHA card is fake",
    "OSHA 30 vs NFPA 70E",
  ],
  answer:
    "OSHA 10 is a 10-hour class that gives workers awareness of common job hazards, while OSHA 30 is a 30-hour class that OSHA calls more appropriate for supervisors and workers with safety responsibility, so a foreman should hold the 30. Neither card is a certification or license, and OSHA does not require either one, although some states, cities and employers do.",
  keyTakeaways: [
    "OSHA 10 covers common job hazards for workers. OSHA 30 goes deeper and adds safety management topics aimed at supervisors.",
    "Both end in a course completion card, not a certification, and neither one replaces your employer's duty to train you on the hazards of your job.",
    "New York State, New York City and Nevada are three places where the law requires the training for some or all construction work.",
    "Real cards come only from OSHA-authorized trainers or OSHA's listed online providers, and a real 10-hour class takes at least two days.",
    "An OSHA card is not training for energized electrical work. NFPA 70E, a separate consensus standard, covers that ground.",
  ],
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  author: "ecrn-team",
  cover: "cover-osha-cards",
  body: [
    { type: "h2", text: "What is the difference between OSHA 10 and OSHA 30?" },
    {
      type: "p",
      text: "Both cards come out of OSHA's Outreach Training Program, and both classes are taught by OSHA-authorized trainers. The difference is depth and audience. OSHA describes the 10-hour class as awareness of common job-related hazards, and the 30-hour class as “more appropriate for supervisors or workers with some safety responsibility.”[^1]",
    },
    {
      type: "table",
      caption: "OSHA 10 vs OSHA 30, construction industry classes",
      head: ["What differs", "OSHA 10", "OSHA 30"],
      rows: [
        ["Who it is for", "Workers who need awareness of common hazards[^1]", "Supervisors and workers with some safety responsibility[^1]"],
        [
          "Required topics",
          "6 hours: Introduction to OSHA, the Focus Four hazards, PPE and health hazards[^2]",
          "14 hours: adds Managing Safety and Health and Stairways and Ladders, with more time on the Focus Four, PPE and health hazards[^2]",
        ],
        ["Electrocution", "At least 30 minutes, inside a 4-hour Focus Four block[^2]", "At least 30 minutes, inside a 6-hour Focus Four block[^2]"],
        ["Electives", "2 hours, at least two topics[^2]", "12 hours, at least six topics[^2]"],
        ["Shortest schedule allowed", "Two days[^3]", "Four days[^3]"],
        ["What you receive", "A course completion card with no expiration date[^4]", "A course completion card with no expiration date[^4]"],
        ["Certification or license?", "No[^4]", "No[^4]"],
      ],
      note: "The Focus Four are falls, electrocution, struck-by and caught-in or between hazards. Topic hours are from OSHA's construction procedures effective October 1, 2024. The day minimums follow from OSHA's limit of 7.5 contact hours a day.",
    },

    { type: "h2", text: "Which card does an electrician or electrical foreman need?" },
    {
      type: "p",
      text: "If you work on the tools and nobody requires more, the 10-hour class covers the hazard awareness OSHA intends for workers, in two days instead of four.[^3] If you run a crew or carry safety responsibility, OSHA's own description points to the 30. Its required topics include two hours on managing safety and health, which can cover job-site inspections, accident investigations, how to run safety meetings and supervisory communication.[^2] That is the daily work of an [electrical foreman](/careers/electrical-foreman).",
    },
    {
      type: "p",
      text: "The rule that decides is the one where you work: a state or city law, the contract, or the employer's policy. If you are a journeyman who wants to run work, take the 30 before anyone asks for it. A trainer can also turn a 10-hour class into a 30-hour card by adding 20 hours, as long as the same trainer teaches both parts, everything is finished within 180 days of the start, and you hand back the 10-hour card.[^3]",
    },
    {
      type: "p",
      text: "If a foreman interview is coming up, expect safety questions and prepare with these [electrical foreman interview questions](/blog/electrical-foreman-interview-questions).",
    },

    { type: "h2", text: "Is an OSHA 10 or OSHA 30 card a certification?" },
    {
      type: "p",
      text: "No. OSHA's FAQ says an OSHA card “is not considered a certification or license,” and the program page says none of its courses is considered a certification.[^4][^1] The program is voluntary and does not meet the training requirements of any OSHA standard, so your employer still has to train you on the specific hazards of your job.[^4]",
    },
    {
      type: "p",
      text: "On a resume, write “OSHA 30-hour Construction, 2025”, not “OSHA certified”. The [electrician resume guide](/blog/electrical-construction-resume-guide) shows where training belongs on the page.",
    },

    { type: "h2", text: "Where is an OSHA 10 or OSHA 30 card required by law?" },
    {
      type: "p",
      text: "Federal OSHA does not require either card.[^1] Some states and cities do. Three examples, each taken from that government's own pages:",
    },
    {
      type: "ul",
      items: [
        "**New York State.** Public work contracts worth $250,000 or more must require every laborer, worker and mechanic on the site to complete an OSHA construction safety course of at least 10 hours before doing any work.[^5] The state Labor Department applies the rule to workers owed prevailing wage, wants proof attached to the certified payroll, and does not require renewal.[^6]",
        "**New York City.** Local Law 196 of 2017 requires workers on sites that need a site safety professional to hold a Site Safety Training card: 40 hours of training for workers and 62 hours for the supervisor card. An OSHA 30 card less than five years old counts for 30 of the 40 hours, and SST cards expire after five years.[^7]",
        "**Nevada.** Construction workers must get an OSHA 10 card, and supervisors an OSHA 30 card, within 15 days of being hired, and the employer must suspend or terminate anyone who does not present one in time.[^8] Since June 10, 2015, the cards do not expire for work on Nevada construction sites.[^9]",
      ],
    },
    {
      type: "p",
      text: "Other states, cities, project owners and contracts set their own rules. Before you start somewhere new, ask what the site requires, and check with the state labor department if the job is public work.",
    },

    { type: "h2", text: "How do you get a legitimate OSHA card?" },
    {
      type: "steps",
      items: [
        {
          title: "Choose an authorized trainer",
          text: "Only OSHA-authorized trainers may teach these classes and issue cards.[^10] Ask to see the trainer's current authorized trainer card, which shows their name, the card's expiration date and the organization that authorized them.[^4]",
        },
        {
          title: "Or use a listed online provider",
          text: "Self-paced online classes may only be run by OSHA-authorized online providers.[^3] OSHA publishes the list and says it cannot validate training offered by anyone else.[^11]",
        },
        {
          title: "Plan for the hours",
          text: "Trainers may teach no more than 7.5 contact hours a day, so a 10-hour class takes at least two days and a 30-hour class at least four. Breaks, meals and tests do not count toward the hours.[^3]",
        },
        {
          title: "Collect your card",
          text: "Trainers must get your card to you within 90 days of the class ending. A plastic card has a QR code on the back with contact details for the education center that processed it, which can verify the card.[^4]",
        },
        {
          title: "Keep your own record",
          text: "OSHA keeps no class records. Trainers keep them for five years, and a replacement card is possible only through the original trainer, within five years of the class, and only once per class.[^1][^4]",
        },
      ],
    },

    { type: "h2", text: "How can you spot a fake OSHA card or a scam class?" },
    {
      type: "p",
      text: "OSHA says fraud around these courses has increased over the past several years.[^10] The warning signs:",
    },
    {
      type: "ul",
      items: [
        "**A same-day card.** The 7.5-hour daily limit makes a one-day 10-hour class impossible.[^3]",
        "**“OSHA certified” or “OSHA approved.”** OSHA's rules bar trainers from advertising either one, from using the OSHA or Labor Department logo, and from calling a class “OSHA compliant.”[^3]",
        "**A job guarantee.** OSHA warns that taking the course does not guarantee employment.[^10]",
        "**A national card lookup site.** OSHA does not run or recognize any national database for verifying cards.[^4] Nevada keeps its own registry for cards issued there since 2020.[^8]",
        "**An online class from an unlisted provider.** Check the name against OSHA's list before you pay.[^11]",
      ],
    },
    {
      type: "p",
      text: "If you run into fraud, email OSHA's Outreach office at outreach@dol.gov or contact the Labor Department's Office of Inspector General.[^4][^10]",
    },

    { type: "h2", text: "How do OSHA 10 and OSHA 30 relate to NFPA 70E training?" },
    {
      type: "p",
      text: "They cover different ground. OSHA 10 and 30 are broad construction hazard classes, and electrocution gets at least 30 minutes in each.[^2] [NFPA 70E](/glossary#nfpa-70e), the Standard for Electrical Safety in the Workplace, is a national consensus standard, and OSHA lists it with a note that such standards are not OSHA regulations.[^12]",
    },
    {
      type: "p",
      text: "OSHA does not enforce 70E, but in a 2004 interpretation letter it said it may use 70E to support citations under its own standards.[^13] A 2024 OSHA guide says OSHA's standards follow 70E without ever incorporating it by reference. The same guide describes what 70E sets out: approach boundaries for shock, an arc flash boundary, categories of arc-rated protective equipment, and an electrically safe work condition, meaning disconnected, locked or tagged out, and tested for absence of voltage.[^14]",
    },
    {
      type: "p",
      text: "That is the training that matters when a panel is open, and no OSHA card stands in for it. For how energized-work rules show up on large projects, see [data center electrical jobs](/blog/data-center-construction-electrical-jobs).",
    },
    {
      type: "callout",
      tone: "tip",
      title: "How to list your safety training",
      text: "Name the class and the year for each one, then your license: “OSHA 30-hour Construction, 2025. NFPA 70E training, 2026.” Leave out the word “certified.”",
    },
    {
      type: "cta",
      title: "Moving up to foreman?",
      text: "See what electrical foremen do, what BLS data says the job pays, and how contractors hire for it.",
      href: "/careers/electrical-foreman",
      label: "Electrical foreman guide",
    },
  ],
  faqs: [
    {
      q: "Is OSHA 30 better than OSHA 10?",
      a: "It is longer and goes deeper, with topics aimed at supervisors. If you lead a crew or have safety duties, OSHA describes the 30-hour class as the better fit. If you work on the tools, the 10-hour class covers the awareness OSHA intends for workers, unless a law, contract or employer asks for more.",
    },
    {
      q: "Do OSHA 10 and OSHA 30 cards expire?",
      a: "OSHA's construction cards have no expiration date. Other rules can set limits: New York City's Site Safety Training card expires after five years, and employers can require refresher training.",
    },
    {
      q: "Can I take OSHA 30 online?",
      a: "Yes, through a provider on OSHA's list of authorized online Outreach providers. OSHA says it cannot validate online training offered by anyone else.",
    },
    {
      q: "How long does it take to get an OSHA card after the class?",
      a: "Trainers must issue cards within 90 days of the class ending. If yours has not arrived by then, contact the trainer or online provider first, then OSHA's Outreach office.",
    },
    {
      q: "Is OSHA 30 the same as NFPA 70E training?",
      a: "No. OSHA 30 is a general construction safety class. NFPA 70E is a consensus standard for electrical safety on or near energized equipment, and training on it is a separate course.",
    },
    {
      q: "Can I upgrade an OSHA 10 card to an OSHA 30?",
      a: "Yes, if the same trainer adds 20 hours, all of the training is finished within 180 days of the start, and you return the 10-hour card.",
    },
  ],
  sources: [
    {
      id: 1,
      title: "Outreach Training Program (OSHA 10-Hour and 30-Hour Cards)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/training/outreach",
      accessed: "2026-11-20",
      note: "The 10-hour class gives workers awareness of common job-related hazards; the 30-hour class is more appropriate for supervisors or workers with some safety responsibility. The program is voluntary, does not meet the training requirements of any OSHA standard, is not an OSHA requirement although some states and municipalities require it, and none of its courses is considered a certification. OSHA keeps no class records; cards cannot be issued for training completed more than five years ago.",
    },
    {
      id: 2,
      title: "Outreach Training Program: Construction Industry Procedures (effective October 1, 2024)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/sites/default/files/OTP_Construction_Procedures_2024.pdf",
      accessed: "2026-11-20",
      note: "Section IV: the 10-hour class has 6 required hours (Introduction to OSHA 1 hour, Focus Four 4 hours with falls at least 1.5 hours and electrocution, struck-by and caught-in or between at least 30 minutes each, PPE 30 minutes, health hazards 30 minutes), 2 elective hours across at least two topics and 2 optional hours. The 30-hour class has 14 required hours (adding Managing Safety and Health 2 hours and Stairways and Ladders 1 hour; Focus Four 6 hours; PPE and health hazards 2 hours each) and 12 elective hours across at least six topics. Managing Safety and Health may cover job-site inspections, accident investigations, how to conduct safety meetings and supervisory communication.",
    },
    {
      id: 3,
      title: "Outreach Training Program Requirements (effective October 1, 2024)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/sites/default/files/OTP_Requirements_2024.pdf",
      accessed: "2026-11-20",
      note: "Maximum of 7.5 student contact hours per day, so 10-hour classes take at least two calendar days and 30-hour classes at least four; breaks, meals and tests are not contact hours. Only OSHA-authorized online providers may run asynchronous classes. A 10-hour student can get a 30-hour card with 20 more hours from the same trainer, all within 180 calendar days, after returning the 10-hour card. Advertising may not use the words certify or license, may not claim OSHA approval, may not use OSHA or Labor Department logos, and may not call training OSHA compliant.",
    },
    {
      id: 4,
      title: "OSHA Outreach Training Program Frequently Asked Questions",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/training/outreach/faq",
      accessed: "2026-11-20",
      note: "An OSHA card is not a certification or license; outreach training meets no OSHA training requirement and employers must train workers on the specific hazards of their jobs; students should ask to see the trainer's current authorized trainer card; OSHA does not verify individual cards or operate any national verification database; plastic cards carry a QR code; cards must be issued within 90 days; one replacement per class within five years; construction cards have no expiration date; fraud reports go to outreach@dol.gov.",
    },
    {
      id: 5,
      title: "New York Labor Law Section 220-h: OSHA construction safety and health course",
      publisher: "New York State Senate",
      url: "https://www.nysenate.gov/legislation/laws/LAB/220-H",
      accessed: "2026-11-20",
      note: "Public work contracts with a total cost of at least $250,000 must require all laborers, workers and mechanics on the public work site to complete an OSHA-approved construction safety and health course of at least ten hours before performing any work on the project.",
    },
    {
      id: 6,
      title: "Provisions of Law: OSHA 10 Compliance",
      publisher: "New York State Department of Labor",
      url: "https://dol.ny.gov/provisions-law",
      accessed: "2026-11-20",
      note: "The OSHA 10 requirement applies only to workers on public work contracts who must be paid prevailing wage under Article 8; proof of completion is attached to the first certified payroll and to later payrolls listing new employees; New York State does not require renewal, while New York City requires renewal every five years.",
    },
    {
      id: 7,
      title: "Site Safety Training (SST) Frequently Asked Questions",
      publisher: "New York City Department of Buildings",
      url: "https://www.nyc.gov/site/buildings/safety/sst-frequently-asked-questions.page",
      accessed: "2026-11-20",
      note: "Local Law 196 of 2017 requires construction personnel on jobsites that require a site safety professional to hold an SST card: 40 hours of training for workers and 62 hours for the Supervisor SST card. With an OSHA 30 card less than five years old, a worker needs 8 hours of fall prevention and 2 hours of drug and alcohol awareness for the 40. SST cards expire after five years.",
    },
    {
      id: 8,
      title: "10 & 30 Hour OSHA Cards for the Construction Industry in Nevada",
      publisher: "Nevada Department of Business and Industry, Division of Industrial Relations",
      url: "https://www.nv1030.org/industries/construction/",
      accessed: "2026-11-20",
      note: "Quotes NRS 618.983 and 618.987: a construction worker must obtain an OSHA-10 completion card, and a supervisory employee an OSHA-30 card, within 15 days of being hired, or the employer must suspend or terminate them. Cards issued in Nevada after January 1, 2020 must be entered by the trainer into a state verification database.",
    },
    {
      id: 9,
      title: "OSHA 10-Hour Construction Training",
      publisher: "Nevada Safety Consultation and Training Section (SCATS)",
      url: "https://www.4safenv.state.nv.us/training/10-30-hour-osha-training/osha-10-hour-construction-training/",
      accessed: "2026-11-20",
      note: "Nevada's requirement took effect January 1, 2010; federal OSHA does not require the training; as of June 10, 2015, the 10- and 30-hour construction cards do not expire for work on Nevada construction sites.",
    },
    {
      id: 10,
      title: "The Facts About Obtaining an OSHA Card",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/training/oshacardfacts",
      accessed: "2026-11-20",
      note: "Fraud related to the 10- and 30-hour courses has increased over the past several years; only OSHA-authorized trainers may teach the courses and issue cards; taking the course does not guarantee employment; fraud can be reported to the Labor Department's Office of Inspector General.",
    },
    {
      id: 11,
      title: "OSHA-Authorized Online Outreach Training Providers",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/training/outreach/training-providers",
      accessed: "2026-11-20",
      note: "The current list of authorized online providers for construction 10-hour and 30-hour classes; OSHA cannot validate training offered by vendors not on the list.",
    },
    {
      id: 12,
      title: "Electrical: Standards",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/electrical/standards",
      accessed: "2026-11-20",
      note: "Lists NFPA 70E, Standard for Electrical Safety in the Workplace, under national consensus standards, with the note that these are not OSHA regulations.",
    },
    {
      id: 13,
      title: "OSHA does not enforce NFPA 70E, although it may use NFPA 70E to support citations relating to certain OSHA standards (letter of November 4, 2004)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/laws-regs/standardinterpretations/2004-11-04-0",
      accessed: "2026-11-20",
      note: "OSHA does not enforce NFPA 70E; it enforces its own electrical standards and may use 70E to support citations, for example under 29 CFR 1910.335.",
    },
    {
      id: 14,
      title: "Protecting Employees from Electric-Arc Flash Hazards (OSHA 4472, 2024)",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/sites/default/files/publications/OSHA4472.pdf",
      accessed: "2026-11-20",
      note: "OSHA standards follow NFPA 70E but OSHA has never incorporated it by reference. Describes 70E's limited and restricted approach boundaries for shock, the arc flash boundary, four categories of arc-rated PPE, and its definition of an electrically safe work condition: disconnected, locked or tagged out, and tested to verify the absence of voltage.",
    },
  ],
  related: [
    "electrical-foreman-interview-questions",
    "electrical-construction-resume-guide",
    "data-center-construction-electrical-jobs",
    "how-to-become-an-electrical-foreman",
  ],
  moneyPage: { href: "/careers/electrical-foreman", label: "Electrical foreman career guide" },
};

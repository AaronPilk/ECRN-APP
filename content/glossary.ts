import type { BlogSource } from "@/lib/blog/types";
import type { GlossaryTerm } from "@/lib/careers/types";

/** YYYY-MM-DD the glossary was last edited. */
export const GLOSSARY_UPDATED_AT = "2026-11-20";

/**
 * Only definitions that state a legal rule or a license rule carry a source.
 * Everything else is plain trade usage with no code sections or thresholds.
 */
export const GLOSSARY_SOURCES: BlogSource[] = [
  {
    id: 1,
    publisher: "U.S. Department of Labor, Wage and Hour Division",
    title: "Davis-Bacon and Related Acts",
    url: "https://www.dol.gov/agencies/whd/government-contracts/construction",
    accessed: "2026-11-20",
    note: "Coverage of federally funded or assisted construction contracts in excess of $2,000, and the duty to pay no less than locally prevailing wages and fringe benefits.",
  },
  {
    id: 2,
    publisher: "Texas Department of Licensing and Regulation",
    title: "Apply for a New Journeyman Electrician License",
    url: "https://www.tdlr.texas.gov/electricians/apply/individuals/journeyman-electrician.htm",
    accessed: "2026-11-20",
    note: "A Texas journeyman works under the general supervision of a master electrician; the page also lists Residential Wireman among the Texas license types.",
  },
  {
    id: 3,
    publisher: "U.S. Bureau of Labor Statistics",
    title: "Occupational Outlook Handbook: Electricians",
    url: "https://www.bls.gov/ooh/construction-and-extraction/electricians.htm",
    accessed: "2026-11-20",
    note: "Most electricians learn the trade in a 4- or 5-year apprenticeship with about 2,000 hours of paid on-the-job training a year; after it they are journey workers who may work on their own, subject to state or local licensing.",
  },
  {
    id: 4,
    publisher: "Occupational Safety and Health Administration",
    title: "Outreach Training Program (OSHA 10-Hour and 30-Hour Cards)",
    url: "https://www.osha.gov/training/outreach",
    accessed: "2026-11-20",
    note: "Who the 10-hour and 30-hour classes are for, and that the program is voluntary, is not a certification, and may be required by states, municipalities or others.",
  },
];

/** Electrical construction terms, A to Z. */
export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "ahj",
    term: "AHJ (authority having jurisdiction)",
    definition:
      "The office or person with the power to enforce the code and approve an installation, usually the local building department and its electrical inspector. When the drawings and the inspector disagree, the AHJ decides.",
  },
  {
    slug: "apprentice",
    term: "Apprentice",
    definition:
      "An electrician in training who is paid to work under experienced electricians while completing classroom instruction. Most electricians learn the trade in a 4- or 5-year apprenticeship.",
    href: "/careers/journeyman-electrician",
    source: 3,
  },
  {
    slug: "arc-flash",
    term: "Arc flash",
    definition:
      "A sudden release of heat and light when electrical current jumps through the air between conductors or to ground. It can cause severe burns, which is why work on energized equipment calls for a hazard assessment, rated protective clothing and safe work practices.",
  },
  {
    slug: "as-builts",
    term: "As-builts",
    aka: ["as-built drawings", "record drawings"],
    definition:
      "Drawings marked up to show how the work was actually installed, including every change from the design. The contractor turns them over to the owner at the end of the job.",
  },
  {
    slug: "bid",
    term: "Bid",
    definition:
      "A contractor's priced offer to build a defined scope of work. In a hard bid the lowest qualified price usually wins; in negotiated work, price is one factor among several.",
    href: "/careers/electrical-estimator",
  },
  {
    slug: "bim",
    term: "BIM (building information modeling)",
    definition:
      "A 3D digital model of the building that each trade draws its work into, so clashes between conduit, duct, pipe and steel are found on screen before anything is installed. Electrical contractors also use the model for layout and prefabrication.",
  },
  {
    slug: "branch-circuit",
    term: "Branch circuit",
    definition:
      "The last leg of wiring, from the final breaker or fuse in a panel to the lights, receptacles or equipment it serves.",
  },
  {
    slug: "busway",
    term: "Busway",
    aka: ["bus duct"],
    definition:
      "A factory-made enclosure with copper or aluminum bars inside that carries large amounts of power, used in place of large conduit and wire. It is common in data centers, plants and high-rises because loads can tap off along its length.",
  },
  {
    slug: "cable-tray",
    term: "Cable tray",
    definition:
      "An open metal support, shaped like a ladder or a trough, that carries many cables along one route. It is faster to install and easier to add to than a separate conduit for each cable.",
  },
  {
    slug: "change-order",
    term: "Change order",
    definition:
      "A written, signed change to the contract that adds or removes work and adjusts the price, the schedule or both. Extra work done without one is work the contractor may not get paid for.",
    href: "/careers/electrical-project-manager",
  },
  {
    slug: "commissioning",
    term: "Commissioning",
    aka: ["Cx"],
    definition:
      "The process of testing installed systems to prove they work as designed before the owner takes over. For electrical work it covers equipment, settings and how systems respond together, often witnessed by a commissioning agent.",
  },
  {
    slug: "conduit",
    term: "Conduit",
    definition:
      "Tubing that protects and routes electrical wire, made of steel, aluminum or plastic. Electricians cut, bend and connect it, then pull the wire through.",
  },
  {
    slug: "confidential-search",
    term: "Confidential search",
    definition:
      "A hiring search run so that the public, and often the company's own staff, do not know the role is open or who is being considered. It is common for executive roles and for replacing someone who is still in the seat.",
    href: "/blog/how-to-job-search-confidentially",
  },
  {
    slug: "contingency-search",
    term: "Contingency search",
    definition:
      "A recruiting arrangement in which the employer pays the recruiting firm a fee only if it hires a candidate the firm presented. It is common for field, estimating and project management roles.",
    href: "/blog/are-construction-recruiters-worth-it",
  },
  {
    slug: "design-assist",
    term: "Design-assist",
    definition:
      "A delivery method in which the electrical contractor joins the project early to help the engineer finish the design, advising on cost, constructability and equipment. The engineer still owns the design.",
  },
  {
    slug: "design-build",
    term: "Design-build",
    definition:
      "A delivery method in which one team is responsible for both the design and the construction under a single contract. A design-build electrical contractor engineers the electrical system as well as installing it.",
  },
  {
    slug: "emt",
    term: "EMT (electrical metallic tubing)",
    aka: ["thin-wall conduit"],
    definition:
      "Thin-wall metal conduit joined with fittings instead of threads. It is light, easy to bend and widely used inside commercial buildings.",
  },
  {
    slug: "estimator",
    term: "Estimator",
    definition:
      "The person who works out what a project will cost the contractor to build, by taking quantities off the drawings and pricing the material, labor and risk.",
    href: "/careers/electrical-estimator",
  },
  {
    slug: "feeder",
    term: "Feeder",
    definition:
      "The conductors that carry power from the service or a distribution point to a panel or other downstream equipment. Feeders supply panels; branch circuits supply the loads.",
  },
  {
    slug: "foreman",
    term: "Foreman",
    definition:
      "The lead electrician in charge of a crew, responsible for planning the day's work and for the crew's safety, quality and production.",
    href: "/careers/electrical-foreman",
  },
  {
    slug: "general-contractor",
    term: "General contractor (GC)",
    definition:
      "The company that holds the contract with the owner for the whole building and hires a subcontractor for each trade, including the electrical contractor.",
  },
  {
    slug: "general-foreman",
    term: "General foreman",
    definition:
      "A supervisor who directs several foremen and their crews on a larger project and reports to the superintendent.",
    href: "/blog/electrical-foreman-vs-superintendent",
  },
  {
    slug: "generator",
    term: "Generator",
    definition:
      "An engine-driven machine that produces electricity on site. In buildings it supplies standby or emergency power through a transfer switch when utility power is lost.",
  },
  {
    slug: "gmp",
    term: "GMP (guaranteed maximum price)",
    definition:
      "A contract in which the contractor is paid its costs plus a fee, up to an agreed ceiling. Costs above the ceiling are the contractor's problem unless the scope changes.",
  },
  {
    slug: "grounding-and-bonding",
    term: "Grounding and bonding",
    definition:
      "Grounding connects an electrical system to the earth. Bonding connects metal parts to each other so they stay at the same voltage and a fault has a clear path back to trip the breaker.",
  },
  {
    slug: "guarantee-period",
    term: "Guarantee period",
    definition:
      "The length of time a placed candidate must stay in the job before a recruiting fee, or a referral reward tied to it, counts as earned. On ECRN it is typically 90 days from the start date.",
    href: "/referral-rewards",
  },
  {
    slug: "ibew",
    term: "IBEW",
    aka: ["International Brotherhood of Electrical Workers"],
    definition:
      "The International Brotherhood of Electrical Workers, the labor union that represents electricians and other electrical workers in the United States and Canada.",
  },
  {
    slug: "jatc",
    term: "JATC (joint apprenticeship and training committee)",
    definition:
      "A local electrical apprenticeship program run jointly by the IBEW local union and the area's NECA contractors. It selects, places and trains apprentices.",
  },
  {
    slug: "journeyman",
    term: "Journeyman electrician",
    aka: ["journeyman", "journeyman wireman"],
    definition:
      "An electrician who has finished an apprenticeship or the required hours and, where the state licenses the trade, passed the journeyman exam. A journeyman works without direct supervision and oversees apprentices.",
    href: "/careers/journeyman-electrician",
    source: 3,
  },
  {
    slug: "lockout-tagout",
    term: "Lockout/tagout (LOTO)",
    definition:
      "The procedure of shutting equipment off, locking its energy source in the off position and tagging it, so it cannot be re-energized while someone is working on it.",
  },
  {
    slug: "low-voltage",
    term: "Low voltage",
    definition:
      "In power distribution, the ordinary building voltages that panels, lighting and motors run on, as opposed to medium voltage. On job sites the term also means limited-energy systems such as fire alarm, data, security and controls.",
  },
  {
    slug: "master-electrician",
    term: "Master electrician",
    definition:
      "The license level above journeyman in states and cities that have one. In Texas, for example, a journeyman works under the general supervision of a master electrician.",
    source: 2,
  },
  {
    slug: "mcc",
    term: "MCC (motor control center)",
    definition:
      "A lineup of cabinets that groups the starters, drives and protective devices for many motors in one place. MCCs are standard in plants, water facilities and large mechanical rooms.",
  },
  {
    slug: "medium-voltage",
    term: "Medium voltage",
    aka: ["MV"],
    definition:
      "Power distribution above the voltages used inside most buildings and below utility transmission: the range that feeds campuses, plants and data centers. The exact limits depend on the standard, and the cable, terminations and switching call for specific training.",
  },
  {
    slug: "nec",
    term: "NEC (National Electrical Code)",
    aka: ["NFPA 70"],
    definition:
      "The model code for safe electrical installation in the United States, published by the National Fire Protection Association as NFPA 70. States and cities adopt it, sometimes with amendments, and inspectors enforce the adopted edition.",
  },
  {
    slug: "neca",
    term: "NECA",
    aka: ["National Electrical Contractors Association"],
    definition:
      "The National Electrical Contractors Association, the trade association for electrical contractors. Its chapters negotiate labor agreements with IBEW locals and co-sponsor apprenticeship training.",
  },
  {
    slug: "nfpa-70e",
    term: "NFPA 70E",
    definition:
      "The National Fire Protection Association's standard for electrical safety in the workplace. It covers how to work safely on or near energized equipment, including protection from shock and arc flash.",
  },
  {
    slug: "osha-10-and-30",
    term: "OSHA 10 and OSHA 30",
    definition:
      "The 10-hour and 30-hour classes in OSHA's Outreach Training Program: the 10-hour class covers common job hazards for workers, and the 30-hour class is aimed at supervisors and workers with some safety responsibility. OSHA calls the program voluntary and not a certification, although some states, cities and employers require the card.",
    source: 4,
  },
  {
    slug: "panelboard",
    term: "Panelboard",
    aka: ["panel"],
    definition:
      "A cabinet of breakers or fuses that divides a feeder into branch circuits and protects each one. It is what most people mean by the electrical panel.",
  },
  {
    slug: "per-diem",
    term: "Per diem",
    definition:
      "A daily allowance paid to cover lodging and meals when a job is away from home. How it is taxed depends on how it is set up, so ask the employer and a tax professional.",
  },
  {
    slug: "placement",
    term: "Placement",
    definition:
      "A hire made through a recruiting firm: the candidate the firm presented accepts the job and starts work. On ECRN, a referral reward depends on a placement with a Delta Construction Partners client.",
    href: "/how-it-works",
  },
  {
    slug: "prefabrication",
    term: "Prefabrication",
    aka: ["prefab"],
    definition:
      "Building assemblies such as conduit racks, wired boxes and equipment skids in a shop, then shipping them to the site to install. It moves labor to a controlled setting and shortens time on site.",
  },
  {
    slug: "prevailing-wage",
    term: "Prevailing wage",
    definition:
      "The hourly wage and benefit rate that must be paid to each trade on public works projects, set for the local area. On federally funded or assisted construction contracts over $2,000, the Davis-Bacon and Related Acts require at least the locally prevailing wages and fringe benefits.",
    source: 1,
  },
  {
    slug: "project-engineer",
    term: "Project engineer",
    definition:
      "An early-career office role on the project team that handles submittals, RFIs, document control and purchasing support under a project manager. It is a common first step toward project management.",
    href: "/careers/electrical-project-manager",
  },
  {
    slug: "project-manager",
    term: "Project manager",
    aka: ["PM"],
    definition:
      "The person responsible for a project's contract, budget, schedule, purchasing, billing and change orders, and for the job making money.",
    href: "/careers/electrical-project-manager",
  },
  {
    slug: "punch-list",
    term: "Punch list",
    definition:
      "The list of small unfinished or incorrect items found near the end of a project. The contractor completes it before the job is closed out.",
  },
  {
    slug: "referral-reward",
    term: "Referral reward",
    aka: ["referral bonus"],
    definition:
      "Money paid to a person for referring someone who is then hired. ECRN's rewards are estimates of up to $10,000 per hire, confirmed in writing and paid after the referred person is placed and completes the guarantee period.",
    href: "/referral-rewards",
  },
  {
    slug: "retained-search",
    term: "Retained search",
    definition:
      "A recruiting arrangement in which the employer pays the search firm part of its fee up front to work on a role exclusively. It is used mostly for executive and hard-to-fill positions.",
    href: "/careers/electrical-construction-executive",
  },
  {
    slug: "rfi",
    term: "RFI (request for information)",
    definition:
      "A formal written question from the contractor to the design team when the drawings or specifications are unclear, incomplete or in conflict. The answer becomes part of the project record.",
  },
  {
    slug: "rigid-conduit",
    term: "Rigid conduit",
    aka: ["rigid", "RMC", "rigid metal conduit"],
    definition:
      "Heavy-wall threaded metal conduit, the strongest type in common use. It is chosen where conduit is exposed to physical damage or weather.",
  },
  {
    slug: "subcontractor",
    term: "Subcontractor",
    definition:
      "A company hired by the general contractor to perform one trade's part of the project. The electrical contractor is usually a subcontractor.",
  },
  {
    slug: "submittal",
    term: "Submittal",
    definition:
      "Product data, shop drawings or samples the contractor sends to the design team for review before ordering or installing. Approved submittals confirm that the gear, fixtures and devices match the design.",
  },
  {
    slug: "superintendent",
    term: "Superintendent",
    definition:
      "The person in charge of all of a contractor's field work on a project: manpower, schedule, safety and quality, working through general foremen and foremen.",
    href: "/careers/electrical-superintendent",
  },
  {
    slug: "switchboard",
    term: "Switchboard",
    definition:
      "A large floor-standing assembly that takes incoming power and divides it into feeders through breakers or fused switches. It is common as the main distribution equipment in commercial buildings.",
  },
  {
    slug: "switchgear",
    term: "Switchgear",
    definition:
      "Heavy-duty assemblies of breakers, switches and protective devices that control and protect power at the service or in medium-voltage distribution. It is built so breakers can be operated, tested and maintained.",
  },
  {
    slug: "takeoff",
    term: "Takeoff",
    definition:
      "Counting and measuring everything on the drawings, such as fixtures, devices, gear and feet of conduit and wire, so it can be priced. Takeoff is the first step of an estimate.",
    href: "/careers/electrical-estimator",
  },
  {
    slug: "transformer",
    term: "Transformer",
    definition:
      "Equipment that changes voltage from one level to another, for example stepping utility voltage down to the voltage a building uses.",
  },
  {
    slug: "ups",
    term: "UPS (uninterruptible power supply)",
    definition:
      "A battery-backed system that keeps critical equipment running without a break when normal power is lost, long enough for generators to start or for a safe shutdown. Large UPS systems are central to data center electrical work.",
    href: "/blog/data-center-construction-electrical-jobs",
  },
  {
    slug: "wireman",
    term: "Wireman",
    aka: ["inside wireman"],
    definition:
      "Another name for an electrician who installs building power, lighting and control systems; inside wireman is the IBEW's term for it. Texas also issues a separate Residential Wireman license.",
    href: "/careers/journeyman-electrician",
    source: 2,
  },
];

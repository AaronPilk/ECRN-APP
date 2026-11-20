import type { Profile } from "@/types";

/** Answers collected by the "Build my resume" questions. */
export interface ResumeAnswers {
  headline?: string;
  years?: string;
  strengths?: string[];
  strengthNote?: string;
  jobs?: { company?: string; title?: string; years?: string; highlights?: string }[];
  school?: string;
  degree?: string;
  certifications?: string;
  software?: string[];
  references?: { name?: string; relationship?: string; phone?: string }[];
}

export interface GeneratedResume {
  name: string;
  contact: string[];
  headline: string;
  summary: string;
  experience: { title: string; company: string; years: string; bullets: string[] }[];
  education: string[];
  certifications: string[];
  skills: string[];
  references: string[];
}

const splitList = (s?: string) =>
  (s ?? "")
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

const toBullets = (s?: string) =>
  (s ?? "")
    .split(/\n|•|(?<=\.)\s+(?=[A-Z])/)
    .map((x) => x.replace(/^[-*\s]+/, "").trim())
    .filter((x) => x.length > 2);

/** Deterministic resume from the answers (always works, no AI needed). */
export function templateResume(a: ResumeAnswers, p: Pick<Profile, "firstName" | "lastName" | "email" | "phone" | "locationCity" | "locationState" | "discipline" | "yearsExperience">): GeneratedResume {
  const headline = a.headline || p.discipline || "Construction professional";
  const years = a.years || p.yearsExperience || "";
  const strengths = [...(a.strengths ?? []), a.strengthNote].filter(Boolean) as string[];
  const summary = [
    `${headline}${years ? ` with ${years} years of experience` : ""} in electrical and commercial construction.`,
    strengths.length ? `Known for ${strengths.slice(0, 3).join(", ").toLowerCase()}.` : "",
    a.software?.length ? `Proficient in ${a.software.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    name: [p.firstName, p.lastName].filter(Boolean).join(" "),
    contact: [p.phone, p.email, [p.locationCity, p.locationState].filter(Boolean).join(", ")].filter(Boolean) as string[],
    headline,
    summary,
    experience: (a.jobs ?? [])
      .filter((j) => j.company || j.title)
      .map((j) => ({ title: j.title ?? "", company: j.company ?? "", years: j.years ?? "", bullets: toBullets(j.highlights) })),
    education: [[a.degree, a.school].filter(Boolean).join(", ")].filter(Boolean),
    certifications: splitList(a.certifications),
    skills: [...(a.software ?? []), ...(a.strengths ?? [])],
    references: (a.references ?? [])
      .filter((r) => r.name)
      .map((r) => [r.name, r.relationship, r.phone].filter(Boolean).join(" · ")),
  };
}

/**
 * Generate the resume. If ANTHROPIC_API_KEY is configured, Claude polishes the
 * summary and bullets (facts only from the answers); otherwise the template is used.
 */
export async function generateResume(a: ResumeAnswers, p: Profile): Promise<{ resume: GeneratedResume; usedAi: boolean }> {
  const base = templateResume(a, p);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { resume: base, usedAi: false };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ECRN_AI_MODEL || "claude-sonnet-5-5",
        max_tokens: 1500,
        system:
          "You write concise, professional resumes for electrical construction professionals. Use ONLY facts in the input. Never invent employers, dates, numbers, schools, or certifications. Return JSON only.",
        messages: [
          {
            role: "user",
            content: `Polish this resume draft. Return JSON with keys "summary" (2-3 sentences) and "experience" (same array order; each item {"bullets": string[]} with 2-4 strong, factual bullets rewritten from the given highlights). Draft:\n${JSON.stringify(base)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { resume: base, usedAi: false };
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = body.content?.find((c) => c.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      summary?: string;
      experience?: { bullets?: string[] }[];
    };
    return {
      resume: {
        ...base,
        summary: json.summary?.trim() || base.summary,
        experience: base.experience.map((e, i) => ({
          ...e,
          bullets: json.experience?.[i]?.bullets?.filter((b) => typeof b === "string" && b.trim()).slice(0, 5) ?? e.bullets,
        })),
      },
      usedAi: true,
    };
  } catch {
    return { resume: base, usedAi: false };
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { ResumeAnswers } from "@/lib/resume";
import { saveResumeBuilderAction } from "@/app/(app)/candidate/resume/actions";

const STRENGTHS = [
  "Leading field crews",
  "Owner & GC relationships",
  "Budget & P&L control",
  "Schedule recovery",
  "Estimating accuracy",
  "Safety record",
  "Preconstruction",
  "Problem solving",
];

const SOFTWARE = ["Procore", "Bluebeam", "AutoCAD", "Revit", "Accubid", "McCormick", "MS Project", "Primavera P6", "Excel"];

type Section = "role" | "strengths" | "experience" | "education" | "references";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "role", label: "Role" },
  { id: "strengths", label: "Strengths" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "references", label: "References" },
];

/** Five short screens; answers autosave so members can stop anytime. */
export function ResumeBuilder({ initial }: { initial: ResumeAnswers }) {
  const router = useRouter();
  const [a, setA] = useState<ResumeAnswers>({
    ...initial,
    jobs: initial.jobs?.length ? initial.jobs : [{}],
    references: initial.references?.length ? initial.references : [{}],
  });
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialAnswers = useRef(a);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saves = useRef<Promise<unknown>>(Promise.resolve());
  const saveRevision = useRef(0);
  const generationInProgress = useRef(false);

  // Debounced autosave.
  useEffect(() => {
    // Skip the untouched draft, including React's development effect replay.
    if (a === initialAnswers.current) return;
    if (generationInProgress.current) return;
    const revision = ++saveRevision.current;
    setSaving("saving");
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      const save = saves.current.catch(() => {}).then(() => saveResumeBuilderAction(a));
      saves.current = save;
      void save.then((r) => {
        if (revision !== saveRevision.current || generationInProgress.current) return;
        setSaving(r.ok ? "saved" : "idle");
        setError(r.ok ? null : r.error ?? "Couldn't save your answers.");
      }).catch(() => {
        if (revision !== saveRevision.current || generationInProgress.current) return;
        setSaving("idle");
        setError("Couldn't save your answers. Check your connection and try again.");
      });
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [a]);

  const section = SECTIONS[idx].id;
  const set = (patch: Partial<ResumeAnswers>) => setA((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key: "strengths" | "software", v: string) =>
    setA((prev) => {
      const list = prev[key] ?? [];
      return { ...prev, [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] };
    });

  async function generate() {
    if (generationInProgress.current) return;
    generationInProgress.current = true;
    saveRevision.current += 1;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setGenerating(true);
    setError(null);
    try {
      // Complete queued autosaves before generation so an older answer snapshot
      // cannot overwrite the generated resume after it has been saved.
      await saves.current.catch(() => {});
      const r = await saveResumeBuilderAction(a, { generate: true });
      if (!r.ok) { setError(r.error ?? "Couldn't build it."); return; }
      setSaving("saved");
      router.push("/candidate/resume?built=1");
    } catch {
      setError("Couldn't build your resume. Check your connection and try again.");
    } finally {
      generationInProgress.current = false;
      setGenerating(false);
    }
  }

  return (
    <fieldset disabled={generating} aria-label="Resume builder" className="min-w-0 space-y-5 pb-32">
      {/* Section tabs */}
      <div className="flex gap-1.5 overflow-x-auto -mx-[22px] px-[22px] pb-1">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIdx(i)}
            className={cn(
              "shrink-0 h-[34px] px-3.5 rounded-full text-[13.5px] font-medium border",
              i === idx ? "bg-ecrn-green-text text-white border-ecrn-green-text" : "bg-white text-ecrn-secondary border-ecrn-line"
            )}
          >
            {i < idx && <Check className="inline w-3.5 h-3.5 -mt-0.5 mr-1" />}
            {s.label}
          </button>
        ))}
      </div>

      <div key={section} className="animate-slide-up space-y-4">
        {section === "role" && (
          <>
            <Q title="What's your title?" />
            <Field value={a.headline} onChange={(v) => set({ headline: v })} placeholder="e.g. Senior Electrical Project Manager" />
            <Q title="Years of experience" />
            <Field value={a.years} onChange={(v) => set({ years: v })} placeholder="e.g. 12" inputMode="numeric" />
          </>
        )}

        {section === "strengths" && (
          <>
            <Q title="What are you strongest at?" sub="Pick up to three." />
            <div className="flex flex-wrap gap-2">
              {STRENGTHS.map((s) => (
                <Pill key={s} on={a.strengths?.includes(s)} onClick={() => toggleIn("strengths", s)}>
                  {s}
                </Pill>
              ))}
            </div>
            <Field value={a.strengthNote} onChange={(v) => set({ strengthNote: v })} placeholder="Anything else? (optional)" />
            <Q title="Software you use" />
            <div className="flex flex-wrap gap-2">
              {SOFTWARE.map((s) => (
                <Pill key={s} on={a.software?.includes(s)} onClick={() => toggleIn("software", s)}>
                  {s}
                </Pill>
              ))}
            </div>
          </>
        )}

        {section === "experience" && (
          <>
            <Q title="Where have you worked?" sub="Most recent first. Two or three is plenty." />
            {(a.jobs ?? []).map((j, i) => (
              <div key={i} className="group-surface p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="t-eyebrow">Job {i + 1}</span>
                  {(a.jobs?.length ?? 0) > 1 && (
                    <button type="button" aria-label="Remove job" onClick={() => set({ jobs: a.jobs!.filter((_, k) => k !== i) })}>
                      <Trash2 className="w-4 h-4 text-ecrn-secondary" />
                    </button>
                  )}
                </div>
                <Field value={j.company} onChange={(v) => set({ jobs: a.jobs!.map((x, k) => (k === i ? { ...x, company: v } : x)) })} placeholder="Company" />
                <Field value={j.title} onChange={(v) => set({ jobs: a.jobs!.map((x, k) => (k === i ? { ...x, title: v } : x)) })} placeholder="Your title" />
                <Field value={j.years} onChange={(v) => set({ jobs: a.jobs!.map((x, k) => (k === i ? { ...x, years: v } : x)) })} placeholder="Years, e.g. 2019 – present" />
                <textarea
                  value={j.highlights ?? ""}
                  onChange={(e) => set({ jobs: a.jobs!.map((x, k) => (k === i ? { ...x, highlights: e.target.value } : x)) })}
                  rows={3}
                  placeholder="Biggest projects, team size, dollar values, wins…"
                  className="w-full px-4 py-3 rounded-[14px] bg-ecrn-paper border border-ecrn-line text-[16px] outline-none focus:border-ecrn-green"
                />
              </div>
            ))}
            {(a.jobs?.length ?? 0) < 4 && (
              <button type="button" onClick={() => set({ jobs: [...(a.jobs ?? []), {}] })} className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-ecrn-green-text">
                <Plus className="w-4 h-4" /> Add another job
              </button>
            )}
          </>
        )}

        {section === "education" && (
          <>
            <Q title="Where did you go to school?" />
            <Field value={a.school} onChange={(v) => set({ school: v })} placeholder="School or trade program" />
            <Field value={a.degree} onChange={(v) => set({ degree: v })} placeholder="Degree or program (e.g. BS Electrical Engineering)" />
            <Q title="Licenses & certifications" />
            <Field value={a.certifications} onChange={(v) => set({ certifications: v })} placeholder="e.g. Master Electrician, PE, OSHA 30, PMP" />
          </>
        )}

        {section === "references" && (
          <>
            <Q title="Who would recommend you?" sub="Optional. Delta only contacts them with your OK." />
            {(a.references ?? []).map((r, i) => (
              <div key={i} className="group-surface p-4 space-y-2.5">
                <Field value={r.name} onChange={(v) => set({ references: a.references!.map((x, k) => (k === i ? { ...x, name: v } : x)) })} placeholder="Name" />
                <Field value={r.relationship} onChange={(v) => set({ references: a.references!.map((x, k) => (k === i ? { ...x, relationship: v } : x)) })} placeholder="How you know them (e.g. former PM at…)" />
                <Field value={r.phone} onChange={(v) => set({ references: a.references!.map((x, k) => (k === i ? { ...x, phone: v } : x)) })} placeholder="Phone" inputMode="tel" />
              </div>
            ))}
            {(a.references?.length ?? 0) < 3 && (
              <button type="button" onClick={() => set({ references: [...(a.references ?? []), {}] })} className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-ecrn-green-text">
                <Plus className="w-4 h-4" /> Add a reference
              </button>
            )}
          </>
        )}
      </div>

      {error && <p className="text-[13.5px] text-red-700">{error}</p>}

      <div className="fixed lg:static inset-x-0 bottom-[calc(64px+max(env(safe-area-inset-bottom),0.75rem))] z-30 bg-ecrn-paper border-t border-ecrn-line lg:border-0">
        <div className="max-w-3xl mx-auto px-[22px] py-3 flex items-center gap-3">
          <span className="text-[12px] text-ecrn-secondary w-16">{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}</span>
          {idx < SECTIONS.length - 1 ? (
            <Button className="flex-1" onClick={() => setIdx(idx + 1)}>
              Next: {SECTIONS[idx + 1].label}
            </Button>
          ) : (
            <Button className="flex-1" onClick={generate} loading={generating}>
              Build my resume
            </Button>
          )}
        </div>
      </div>
    </fieldset>
  );
}

function Q({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="font-display text-[22px] leading-[25px] font-semibold text-ecrn-ink">{title}</h2>
      {sub && <p className="mt-1 text-[14px] text-ecrn-secondary">{sub}</p>}
    </div>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: "numeric" | "tel";
}) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-ecrn-line text-[16px] outline-none focus:border-ecrn-green"
    />
  );
}

function Pill({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[42px] px-4 rounded-full border text-[14.5px] font-medium",
        on ? "bg-ecrn-green-text text-white border-ecrn-green-text" : "bg-white text-ecrn-ink border-ecrn-line"
      )}
    >
      {on && <Check className="inline w-4 h-4 -mt-0.5 mr-1" />}
      {children}
    </button>
  );
}

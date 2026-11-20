"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, FileUp, LocateFixed, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CitySearch, getCurrentPosition, nearestCity } from "@/components/jobs/CitySearch";
import { completeOnboardingAction } from "@/app/(auth)/onboarding/actions";

/**
 * One-question-per-screen onboarding. Single-choice answers advance on tap;
 * the path branches on what the member is here for, so referral partners
 * finish in two taps and job seekers in about seven.
 */

type Intent = "job" | "open" | "refer" | "both";

export interface QuizAnswers {
  intent?: Intent;
  discipline?: string;
  connection?: string;
  years_experience?: string;
  location_city?: string;
  location_state?: string;
  location_lat?: number;
  location_lng?: number;
  relocation?: "yes" | "maybe" | "no";
  move_motivators?: string[];
  current_employer?: string;
  resume_path?: string;
  resume_choice?: "upload" | "build" | "skip";
}

type StepId = "intent" | "discipline" | "connection" | "years" | "location" | "relocation" | "motivators" | "resume";

const SEEKER = (i?: Intent) => i === "job" || i === "open" || i === "both";

function stepsFor(a: QuizAnswers): StepId[] {
  if (!a.intent) return ["intent"];
  if (a.intent === "refer") return ["intent", "connection"];
  const s: StepId[] = ["intent", "discipline", "years", "location", "relocation"];
  if (a.intent === "open") s.push("motivators");
  s.push("resume");
  return s;
}

const INTENTS: { v: Intent; title: string; body: string }[] = [
  { v: "job", title: "I'm looking for work", body: "Find my next role in electrical construction." },
  { v: "open", title: "I have a job, but I'm open to the right move", body: "Private. Only Delta recruiters see this." },
  { v: "refer", title: "I want to refer people and earn", body: "$1,000–$10,000 when Delta places someone you know." },
  { v: "both", title: "Both", body: "Find a role and refer people." },
];

const DISCIPLINES = [
  "Electrical Engineer",
  "Project Manager",
  "Estimator",
  "Superintendent",
  "Foreman / Electrician",
  "Executive (VP / C-suite)",
];

const CONNECTIONS = [
  "I work in construction",
  "I'm a recruiter or in HR",
  "I have friends in the trades",
  "Just here to refer friends and earn",
];

const YEARS = ["0–2", "3–5", "6–10", "11–15", "16–20", "20+"];

const MOTIVATORS = [
  "Higher pay",
  "A bigger title",
  "Better projects",
  "Better leadership",
  "Work-life balance",
  "Closer to home",
  "More stability",
];

const STORAGE_KEY = "ecrn_onboarding_v1";

export function OnboardingQuiz({ userId, firstName }: { userId: string; firstName: string | null }) {
  const router = useRouter();
  const [a, setA] = useState<QuizAnswers>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resume where they left off if the app was closed mid-quiz.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved?.userId === userId && saved.a) {
        setA(saved.a);
        setStepIdx(Math.min(saved.stepIdx ?? 0, stepsFor(saved.a).length - 1));
      }
    } catch {}
  }, [userId]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, a, stepIdx }));
    } catch {}
  }, [a, stepIdx, userId]);

  const steps = useMemo(() => stepsFor(a), [a]);
  const step = steps[stepIdx] ?? "intent";
  const total = a.intent ? steps.length : 7;
  const progress = Math.round(((stepIdx + 1) / total) * 100);

  async function finish(final: QuizAnswers) {
    setBusy(true);
    setError(null);
    const res = await completeOnboardingAction(final);
    if (res.error) {
      setBusy(false);
      setError(res.error);
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    router.replace(res.home ?? "/");
  }

  /** Save an answer, flash the selection, then move on (or finish). */
  function answer(patch: Partial<QuizAnswers>, flash?: string) {
    const next = { ...a, ...patch };
    setA(next);
    setPicked(flash ?? null);
    setShowOther(false);
    setOther("");
    const nextSteps = stepsFor(next);
    const nextIdx = nextSteps.indexOf(step) + 1;
    setTimeout(() => {
      setPicked(null);
      if (nextIdx >= nextSteps.length) void finish(next);
      else setStepIdx(nextIdx);
    }, flash ? 220 : 0);
  }

  function back() {
    setError(null);
    setShowOther(false);
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  async function useLocation() {
    setError(null);
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const city = await nearestCity(pos.lat, pos.lng).catch(() => null);
      answer({
        location_lat: pos.lat,
        location_lng: pos.lng,
        location_city: city?.name,
        location_state: city?.state,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  async function uploadResume(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is over 10 MB. Try a PDF export.");
      return;
    }
    setBusy(true);
    const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/resume-${Date.now()}.${ext || "pdf"}`;
    const { error: upErr } = await getSupabaseBrowserClient()
      .storage.from("resumes")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) {
      setBusy(false);
      setError("Upload failed. You can skip and add it from your profile.");
      return;
    }
    await finish({ ...a, resume_path: path, resume_choice: "upload" });
  }

  return (
    <div className="min-h-[calc(100dvh-140px)] flex flex-col">
      {/* Progress + back */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={back}
          disabled={stepIdx === 0 || busy}
          aria-label="Back"
          className={cn("w-9 h-9 -ml-2 rounded-full grid place-items-center", stepIdx === 0 && "invisible")}
        >
          <ArrowLeft className="w-5 h-5 text-ecrn-ink" />
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-ecrn-line overflow-hidden">
          <div className="h-full bg-ecrn-green transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-mono text-[11px] text-ecrn-secondary w-10 text-right">
          {stepIdx + 1}/{total}
        </span>
      </div>

      <div key={step} className="animate-slide-up flex-1">
        {step === "intent" && (
          <Question
            eyebrow={`Welcome${firstName ? `, ${firstName}` : ""}`}
            title="What brings you to ECRN?"
          >
            {INTENTS.map((o) => (
              <Option key={o.v} selected={picked === o.v || (!picked && a.intent === o.v)} onClick={() => answer({ intent: o.v }, o.v)}>
                <span className="block text-[16px] font-semibold text-ecrn-ink">{o.title}</span>
                <span className="block mt-0.5 text-[13.5px] text-ecrn-secondary">
                  {o.v === "open" && <Lock className="inline w-3.5 h-3.5 -mt-0.5 mr-1 text-cobalt" />}
                  {o.body}
                </span>
              </Option>
            ))}
          </Question>
        )}

        {step === "discipline" && (
          <Question title="What do you do?" sub="Pick the closest fit.">
            <div className="grid grid-cols-2 gap-2.5">
              {DISCIPLINES.map((d) => (
                <Chip key={d} selected={picked === d || (!picked && a.discipline === d)} onClick={() => answer({ discipline: d }, d)}>
                  {d}
                </Chip>
              ))}
              <Chip selected={showOther} onClick={() => setShowOther(true)} className="col-span-2">
                Something else
              </Chip>
            </div>
            {showOther && (
              <TextAndGo
                value={other}
                onChange={setOther}
                placeholder="e.g. Low voltage PM"
                onGo={() => other.trim() && answer({ discipline: other.trim() })}
              />
            )}
          </Question>
        )}

        {step === "connection" && (
          <Question title="What's your connection to construction?" sub="Helps Delta know who you can introduce.">
            {CONNECTIONS.map((c) => (
              <Option key={c} selected={picked === c || (!picked && a.connection === c)} onClick={() => answer({ connection: c }, c)}>
                <span className="block text-[16px] font-medium text-ecrn-ink">{c}</span>
              </Option>
            ))}
          </Question>
        )}

        {step === "years" && (
          <Question title="How many years of experience do you have?">
            <div className="grid grid-cols-3 gap-2.5">
              {YEARS.map((y) => (
                <Chip key={y} big selected={picked === y || (!picked && a.years_experience === y)} onClick={() => answer({ years_experience: y }, y)}>
                  {y}
                </Chip>
              ))}
            </div>
          </Question>
        )}

        {step === "location" && (
          <Question title="Where are you based?" sub="We'll show the closest roles first.">
            <button
              type="button"
              onClick={useLocation}
              disabled={locating}
              className="w-full h-[56px] rounded-[15px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action font-semibold text-[16px] inline-flex items-center justify-center gap-2"
            >
              <LocateFixed className={cn("w-5 h-5", locating && "animate-spin")} />
              {locating ? "Finding you…" : "Use my current location"}
            </button>
            <div className="flex items-center gap-3 my-4 text-[12px] text-ecrn-secondary">
              <span className="h-px flex-1 bg-ecrn-line" /> or <span className="h-px flex-1 bg-ecrn-line" />
            </div>
            <CitySearch
              placeholder="Type your city"
              onPick={(p) =>
                answer({ location_city: p.name, location_state: p.state, location_lat: p.lat, location_lng: p.lng })
              }
            />
          </Question>
        )}

        {step === "relocation" && (
          <Question
            title="Open to relocating?"
            sub={a.location_city ? `You're near ${a.location_city}, ${a.location_state}.` : undefined}
          >
            {(
              [
                ["yes", "Yes, I'd move"],
                ["maybe", "For the right role"],
                ["no", "No, I'm staying put"],
              ] as const
            ).map(([v, label]) => (
              <Option key={v} selected={picked === v || (!picked && a.relocation === v)} onClick={() => answer({ relocation: v }, v)}>
                <span className="block text-[16px] font-medium text-ecrn-ink">{label}</span>
              </Option>
            ))}
          </Question>
        )}

        {step === "motivators" && (
          <Question
            title="What would make a move worth it?"
            sub="Pick any. Your current employer will never see this."
          >
            <div className="flex flex-wrap gap-2">
              {MOTIVATORS.map((m) => {
                const on = a.move_motivators?.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setA({
                        ...a,
                        move_motivators: on ? a.move_motivators!.filter((x) => x !== m) : [...(a.move_motivators ?? []), m],
                      })
                    }
                    className={cn(
                      "h-[44px] px-4 rounded-full border text-[15px] font-medium transition-colors",
                      on ? "bg-ecrn-green-text text-white border-ecrn-green-text" : "bg-white text-ecrn-ink border-ecrn-line"
                    )}
                  >
                    {on && <Check className="inline w-4 h-4 -mt-0.5 mr-1" />}
                    {m}
                  </button>
                );
              })}
            </div>
            <label className="block mt-5">
              <span className="flex items-center gap-1.5 text-[13px] text-ecrn-secondary">
                <Lock className="w-3.5 h-3.5 text-cobalt" /> Current employer (optional, private to Delta)
              </span>
              <input
                value={a.current_employer ?? ""}
                onChange={(e) => setA({ ...a, current_employer: e.target.value })}
                placeholder="Company name"
                className="mt-1.5 w-full h-[52px] px-4 rounded-[14px] bg-white border border-ecrn-line text-[16px] outline-none focus:border-ecrn-green"
              />
            </label>
            <button
              type="button"
              onClick={() => answer({})}
              className="mt-5 w-full h-[52px] rounded-[15px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action font-semibold text-[16px]"
            >
              {a.move_motivators?.length || a.current_employer ? "Continue" : "Skip"}
            </button>
          </Question>
        )}

        {step === "resume" && (
          <Question title="Last step: your resume" sub="Recruiters move fastest when it's on file. You can always add it later.">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])}
            />
            <Option onClick={() => fileRef.current?.click()} selected={false} disabled={busy}>
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-ecrn-action-surface grid place-items-center shrink-0">
                  <FileUp className="w-5 h-5 text-ecrn-green-text" />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold text-ecrn-ink">Upload my resume</span>
                  <span className="block text-[13px] text-ecrn-secondary">PDF, Word, or a photo. Up to 10 MB.</span>
                </span>
              </span>
            </Option>
            <Option onClick={() => answer({ resume_choice: "build" }, "build")} selected={picked === "build"} disabled={busy}>
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-ecrn-reward-tint grid place-items-center shrink-0">
                  <Sparkles className="w-5 h-5 text-cobalt" />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold text-ecrn-ink">Build one with us</span>
                  <span className="block text-[13px] text-ecrn-secondary">Answer a few questions in your profile, whenever you like.</span>
                </span>
              </span>
            </Option>
            <button
              type="button"
              disabled={busy}
              onClick={() => answer({ resume_choice: "skip" })}
              className="w-full py-3 text-[15px] font-medium text-ecrn-secondary"
            >
              Skip for now
            </button>
          </Question>
        )}
      </div>

      {error && <p className="mt-4 text-[14px] text-red-700">{error}</p>}
      {busy && <p className="mt-4 text-[14px] text-ecrn-secondary">Setting up your account…</p>}

      {step === "intent" && (
        <p className="mt-6 text-center text-[13px] text-ecrn-secondary">
          Hiring?{" "}
          <Link href="/hire" className="font-medium text-ecrn-green-text">
            Tell Delta what you need
          </Link>
        </p>
      )}
    </div>
  );
}

function Question({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      {eyebrow && <p className="t-eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-[30px] leading-[33px] font-semibold tracking-[-0.03em] text-ecrn-ink">{title}</h1>
      {sub && <p className="mt-2 text-[15px] text-ecrn-secondary">{sub}</p>}
      <div className="mt-6 space-y-2.5">{children}</div>
    </div>
  );
}

function Option({
  children,
  selected,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left rounded-[16px] border px-4 py-4 transition-all active:scale-[0.99]",
        selected ? "border-ecrn-green bg-ecrn-action-surface shadow-glow" : "border-ecrn-line bg-white"
      )}
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  selected,
  onClick,
  className,
  big,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  className?: string;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[14px] border px-3 text-[15px] font-medium transition-all active:scale-[0.98]",
        big ? "h-[60px] font-display text-[18px]" : "min-h-[56px] py-2",
        selected ? "border-ecrn-green bg-ecrn-action-surface text-ecrn-green-text shadow-glow" : "border-ecrn-line bg-white text-ecrn-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

function TextAndGo({
  value,
  onChange,
  onGo,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onGo: () => void;
  placeholder: string;
}) {
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onGo();
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-[52px] px-4 rounded-[14px] bg-white border border-ecrn-line text-[16px] outline-none focus:border-ecrn-green"
      />
      <button type="submit" className="h-[52px] px-5 rounded-[14px] bg-ecrn-green-text text-white font-semibold">
        Next
      </button>
    </form>
  );
}

export { SEEKER };

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Building2, Check, ChevronRight, CircleCheck, ClipboardList, FileText, HardHat, Lock, MapPin, Plus, Search, UserRound, Users, Zap } from "lucide-react";
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
  const [restored, setRestored] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const locationRequest = useRef(0);

  // Resume where they left off if the app was closed mid-quiz.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved?.userId === userId && saved.a) {
        setA(saved.a);
        setStepIdx(Math.min(saved.stepIdx ?? 0, stepsFor(saved.a).length - 1));
      }
    } catch {}
    setRestored(true);
  }, [userId]);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, a, stepIdx }));
    } catch {}
  }, [a, stepIdx, userId, restored]);

  const steps = useMemo(() => stepsFor(a), [a]);
  const step = steps[stepIdx] ?? "intent";
  const total = a.intent ? steps.length : 7;
  const progress = Math.round(((stepIdx + 1) / total) * 100);

  async function finish(final: QuizAnswers) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await completeOnboardingAction(final);
      if (res.error) { setError(res.error); return; }
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      router.replace(res.home ?? "/");
    } catch {
      setError("Couldn't save your profile. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  /** Advance immediately; an artificial delay made rapid taps queue stale steps. */
  function answer(patch: Partial<QuizAnswers>, _flash?: string) {
    if (busy || submitting.current) return;
    locationRequest.current += 1;
    setLocating(false);
    const next = { ...a, ...patch };
    setA(next);
    setPicked(null);
    setShowOther(false);
    setOther("");
    const nextSteps = stepsFor(next);
    const nextIdx = nextSteps.indexOf(step) + 1;
    if (nextIdx >= nextSteps.length) void finish(next);
    else setStepIdx(nextIdx);
  }

  function back() {
    locationRequest.current += 1;
    setLocating(false);
    setError(null);
    setShowOther(false);
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  async function useLocation() {
    const request = ++locationRequest.current;
    setError(null);
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const city = await nearestCity(pos.lat, pos.lng).catch(() => null);
      if (request !== locationRequest.current) return;
      answer({
        location_lat: pos.lat,
        location_lng: pos.lng,
        location_city: city?.name,
        location_state: city?.state,
      });
    } catch (e) {
      if (request === locationRequest.current) setError((e as Error).message);
    } finally {
      if (request === locationRequest.current) setLocating(false);
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
    try {
      const { error: upErr } = await getSupabaseBrowserClient()
        .storage.from("resumes")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) {
        setError("Upload failed. You can skip and add it from your profile.");
        return;
      }
      await finish({ ...a, resume_path: path, resume_choice: "upload" });
    } catch {
      setError("Upload failed. Check your connection, or skip and add it from your profile.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const seg = Math.max(total, 1);

  return (
    <div className="min-h-[calc(100dvh-140px)] flex flex-col">
      {/* Segmented progress + back */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={back}
          disabled={stepIdx === 0 || busy}
          aria-label="Back"
          className={cn("w-8 h-8 -ml-1.5 rounded-full grid place-items-center", stepIdx === 0 && "hidden")}
        >
          <ArrowLeft className="w-5 h-5 text-ecrn-ink" />
        </button>
        <div className="flex-1 flex gap-1.5" aria-hidden>
          {Array.from({ length: seg }).map((_, k) => (
            <span
              key={k}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-colors",
                k < stepIdx ? "bg-ecrn-green" : k === stepIdx ? "bg-ecrn-green-text" : "bg-ecrn-line"
              )}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-ecrn-ink w-10 text-right">
          {stepIdx + 1} / {total}
        </span>
      </div>

      <div key={step} className="animate-slide-up flex-1">
        {step === "intent" && (
          <Question eyebrow={`Welcome${firstName ? `, ${firstName}` : ""}`} title="What brings you to ECRN?">
            <div className="group-surface">
              {INTENTS.filter((o) => o.v === "job" || o.v === "open").map((o) => (
                <RowButton
                  key={o.v}
                  icon={o.v === "job" ? <Search className="w-4 h-4 text-ecrn-green-text" /> : <Lock className="w-4 h-4 text-cobalt" />}
                  iconBg={o.v === "job" ? "bg-ecrn-action-surface" : "bg-delta-surface"}
                  title={o.v === "job" ? "I'm looking for work" : "I'm open to the right move"}
                  body={o.v === "job" ? "Find my next role in electrical construction." : "I have a job. Only Delta recruiters can see this."}
                  selected={picked === o.v}
                  onClick={() => answer({ intent: o.v }, o.v)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => answer({ intent: "refer" }, "refer")}
              className={cn(
                "relative w-full overflow-hidden rounded-[18px] text-left text-white px-4 py-4 transition-transform active:scale-[0.99]",
                picked === "refer" && "ring-2 ring-ecrn-green"
              )}
              style={{ background: "linear-gradient(110deg,#063889 0%,#0655CE 55%,#0A100C 100%)" }}
            >
              <span
                className="absolute inset-y-0 right-0 w-1/2 bg-[url('/brand/ecrn-conduit.jpg')] bg-cover bg-right opacity-60 [mask-image:linear-gradient(90deg,transparent,black_60%)]"
                aria-hidden
              />
              <span className="relative block text-[14px] font-medium">I want to refer people and earn</span>
              <span className="relative block t-money text-[34px] leading-[40px] font-medium text-ecrn-reward-dark">$1,000–$10,000</span>
              <span className="relative block text-[12px] text-white/80">Estimated per eligible placement</span>
              <span className="absolute right-4 top-4 w-7 h-7 rounded-full border border-white/60 grid place-items-center">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <div className="group-surface">
              <RowButton
                icon={<Users className="w-4 h-4 text-ecrn-green-text" />}
                iconBg="bg-ecrn-action-surface"
                title="I'd like to do both"
                body="Find a role and refer people."
                selected={picked === "both"}
                onClick={() => answer({ intent: "both" }, "both")}
              />
            </div>
          </Question>
        )}

        {step === "discipline" && (
          <Question title="What do you do?" sub="Pick the closest fit.">
            <div className="group-surface">
              {DISCIPLINES.map((d) => {
                const on = picked === d || (!picked && a.discipline === d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => answer({ discipline: d }, d)}
                    className={cn(
                      "relative w-full flex items-center gap-3 px-3.5 min-h-[52px] border-b border-ecrn-line last:border-0 text-left",
                      on && "bg-ecrn-action-surface"
                    )}
                  >
                    {on && <span className="absolute left-0 inset-y-0 w-[3px] bg-ecrn-green" />}
                    <span className={cn("w-8 h-8 rounded-full grid place-items-center border", on ? "bg-ecrn-selected border-ecrn-selected" : "border-ecrn-line")}>
                      <DisciplineIcon name={d} />
                    </span>
                    <span className="flex-1 text-[15.5px] font-medium text-ecrn-ink">{d}</span>
                    {on ? <CircleCheck className="w-5 h-5 text-ecrn-green-text" /> : <ChevronRight className="w-4 h-4 text-ecrn-secondary" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowOther(true)}
                className="w-full flex items-center gap-3 px-3.5 min-h-[52px] text-left"
              >
                <span className="w-8 h-8 rounded-full grid place-items-center border border-ecrn-line">
                  <UserRound className="w-4 h-4 text-ecrn-secondary" />
                </span>
                <span className="flex-1 text-[15.5px] font-medium text-ecrn-ink">Something else</span>
                <ChevronRight className="w-4 h-4 text-ecrn-secondary" />
              </button>
            </div>
            {showOther && (
              <TextAndGo value={other} onChange={setOther} placeholder="e.g. Low voltage PM" onGo={() => other.trim() && answer({ discipline: other.trim() })} />
            )}
          </Question>
        )}

        {step === "connection" && (
          <Question title="What's your connection to construction?" sub="Helps Delta know who you can introduce.">
            <div className="group-surface">
              {CONNECTIONS.map((c) => (
                <RowButton key={c} title={c} selected={picked === c} onClick={() => answer({ connection: c }, c)} />
              ))}
            </div>
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
            <div className="group-surface">
              <MapArt className="h-[130px]" />
              <div className="p-2.5">
                <button
                  type="button"
                  onClick={useLocation}
                  disabled={locating}
                  className="w-full h-[48px] rounded-[14px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action font-semibold text-[15.5px] inline-flex items-center justify-center gap-2"
                >
                  <MapPin className={cn("w-5 h-5", locating && "animate-pulse")} />
                  {locating ? "Finding you…" : "Use my current location"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 my-1 text-[12px] text-ecrn-secondary">
              <span className="h-px flex-1 bg-ecrn-line" /> or <span className="h-px flex-1 bg-ecrn-line" />
            </div>
            <CitySearch
              placeholder="Type your city"
              onPick={(p) => answer({ location_city: p.name, location_state: p.state, location_lat: p.lat, location_lng: p.lng })}
            />
          </Question>
        )}

        {step === "relocation" && (
          <Question title="Open to relocating?">
            {a.location_city && (
              <div className="relative overflow-hidden rounded-[16px] border border-ecrn-line bg-[#EAF3EC] px-4 py-3">
                <MapArt className="absolute inset-y-0 right-0 w-[45%] opacity-80" small />
                <p className="relative text-[12px] text-ecrn-secondary">Approximate location</p>
                <p className="relative mt-0.5 flex items-center gap-1 font-display text-[18px] font-semibold text-ecrn-ink">
                  <MapPin className="w-4 h-4" /> {a.location_city}, {a.location_state}
                </p>
              </div>
            )}
            {(
              [
                ["yes", "Yes, I'd move"],
                ["maybe", "For the right role"],
                ["no", "No, I'm staying put"],
              ] as const
            ).map(([v, label]) => {
              const on = picked === v || (!picked && a.relocation === v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => answer({ relocation: v }, v)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-[14px] border px-4 min-h-[54px] text-left transition-colors",
                    on ? "border-ecrn-green bg-ecrn-action-surface" : "border-ecrn-line bg-white"
                  )}
                >
                  <span className="text-[16px] font-medium text-ecrn-ink">{label}</span>
                  {on ? <CircleCheck className="w-5 h-5 text-ecrn-green-text" /> : <span className="w-5 h-5 rounded-full border-2 border-ecrn-line" />}
                </button>
              );
            })}
          </Question>
        )}

        {step === "motivators" && (
          <Question title="What would make a move worth it?" sub="Choose as many as you like. Your current employer will never see these preferences.">
            <div className="grid grid-cols-2 gap-2">
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
                      "flex items-center gap-2 h-[46px] px-3 rounded-[12px] border text-[14.5px] text-left transition-colors",
                      on ? "border-ecrn-green bg-ecrn-action-surface text-ecrn-ink" : "border-ecrn-line bg-white text-ecrn-ink"
                    )}
                  >
                    <span className={cn("w-4 h-4 rounded-[4px] border grid place-items-center shrink-0", on ? "bg-ecrn-green-text border-ecrn-green-text" : "border-ecrn-secondary/50")}>
                      {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-ecrn-line pt-4 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[14.5px] font-semibold text-ecrn-ink">Current employer</span>
                <span className="text-[12px] text-ecrn-secondary">Optional</span>
              </div>
              <input
                value={a.current_employer ?? ""}
                onChange={(e) => setA({ ...a, current_employer: e.target.value })}
                placeholder="Company name"
                className="mt-2 w-full h-[50px] px-4 rounded-[12px] bg-white border border-ecrn-line text-[16px] outline-none focus:border-ecrn-green"
              />
              <p className="mt-1.5 flex items-center gap-1 text-[12px] text-cobalt">
                <Lock className="w-3.5 h-3.5" /> Private to Delta
              </p>
            </div>
            <button
              type="button"
              onClick={() => answer({})}
              className="mt-2 w-full h-[50px] rounded-[15px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action font-semibold text-[16px] inline-flex items-center justify-center gap-1.5"
            >
              {a.move_motivators?.length || a.current_employer ? "Continue" : "Skip"} <ArrowRight className="w-4 h-4" />
            </button>
          </Question>
        )}

        {step === "resume" && (
          <Question title="Your résumé" sub="Delta recruiters can move faster with a résumé on file. You can always add it later.">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])}
            />
            <div className="rounded-[18px] border border-ecrn-line bg-gradient-to-b from-[#EEF5EF] to-[#E3EFE6] p-4 text-center">
              <PaperArt />
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="mt-3 w-full h-[48px] rounded-[14px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action font-semibold text-[15.5px] inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Upload my résumé
              </button>
              <p className="mt-2 text-[12px] text-ecrn-secondary">PDF, Word, or a photo · Up to 10 MB</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => answer({ resume_choice: "build" }, "build")}
              className="w-full flex items-center gap-3 rounded-[16px] border border-[#CFE0F7] bg-delta-surface px-4 py-3.5 text-left"
            >
              <span className="w-9 h-9 rounded-[10px] bg-white grid place-items-center shrink-0">
                <FileText className="w-4 h-4 text-cobalt" />
              </span>
              <span className="flex-1">
                <span className="block text-[15.5px] font-semibold text-navy">Build one with Delta</span>
                <span className="block text-[12.5px] text-navy/75">Answer a few questions in your profile, whenever you like.</span>
              </span>
              <ChevronRight className="w-4 h-4 text-cobalt" />
            </button>
            <button type="button" disabled={busy} onClick={() => answer({ resume_choice: "skip" })} className="w-full py-3 text-[15px] font-medium text-ecrn-secondary">
              Skip for now
            </button>
          </Question>
        )}
      </div>

      {error && <p className="mt-4 text-[14px] text-red-700">{error}</p>}
      {busy && <p className="mt-4 text-[14px] text-ecrn-secondary">Setting up your account…</p>}

      {step === "intent" && (
        <p className="mt-6 text-center text-[13.5px] text-ecrn-secondary">
          Hiring?{" "}
          <Link href="/hire" className="font-medium text-cobalt">
            Tell Delta what you need ↗
          </Link>
        </p>
      )}
    </div>
  );
}

function RowButton({
  icon,
  iconBg,
  title,
  body,
  selected,
  onClick,
}: {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  body?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-ecrn-line last:border-0 transition-colors active:bg-ecrn-paper",
        selected && "bg-ecrn-action-surface"
      )}
    >
      {icon && <span className={cn("w-9 h-9 rounded-full grid place-items-center shrink-0", iconBg)}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[15.5px] font-semibold text-ecrn-ink">{title}</span>
        {body && <span className="block mt-0.5 text-[13px] text-ecrn-secondary">{body}</span>}
      </span>
      {selected ? <CircleCheck className="w-5 h-5 text-ecrn-green-text" /> : <ChevronRight className="w-4 h-4 text-ecrn-secondary" />}
    </button>
  );
}

function DisciplineIcon({ name }: { name: string }) {
  const cls = "w-4 h-4 text-ecrn-secondary";
  if (name.startsWith("Electrical")) return <Zap className={cls} />;
  if (name.startsWith("Project")) return <ClipboardList className={cls} />;
  if (name.startsWith("Estimator")) return <FileText className={cls} />;
  if (name.startsWith("Superintendent")) return <Building2 className={cls} />;
  if (name.startsWith("Foreman")) return <HardHat className={cls} />;
  if (name.startsWith("Executive")) return <Briefcase className={cls} />;
  return <UserRound className={cls} />;
}

/** Simple illustrated street map with a location pin (no map service needed). */
function MapArt({ className, small }: { className?: string; small?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#E6EEE7]", className)} aria-hidden>
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(#DCE6DE 2px, transparent 2px), linear-gradient(90deg, #DCE6DE 2px, transparent 2px)", backgroundSize: "42px 42px" }} />
      <div className="absolute -left-10 top-[58%] w-[150%] h-[14px] bg-white/95 -rotate-[28deg]" />
      <div className="absolute left-[30%] -top-6 w-[12px] h-[160%] bg-white/95 rotate-[18deg]" />
      <div className="absolute left-[62%] -top-6 w-[16px] h-[160%] bg-white/95 rotate-[32deg]" />
      <div className="absolute left-[12%] top-[18%] w-12 h-8 rounded bg-[#D3E0D6]" />
      <div className="absolute right-[10%] bottom-[16%] w-14 h-9 rounded bg-[#D3E0D6]" />
      <div className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ecrn-green/20 grid place-items-center", small ? "w-9 h-9" : "w-16 h-16")}>
        <span className={cn("rounded-full bg-ecrn-green border-2 border-white shadow", small ? "w-3 h-3" : "w-4 h-4")} />
      </div>
    </div>
  );
}

function PaperArt() {
  return (
    <div className="relative mx-auto h-[112px] w-[120px]" aria-hidden>
      <div className="absolute left-3 top-4 h-[92px] w-[72px] rotate-[-8deg] rounded-[6px] bg-[#DCE7DE] shadow" />
      <div className="absolute left-7 top-2 h-[96px] w-[76px] rounded-[6px] bg-white shadow-float p-2.5">
        <div className="h-1.5 w-8 rounded bg-ecrn-secondary/50" />
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} className="mt-2 h-1 rounded bg-ecrn-line" style={{ width: `${90 - k * 9}%` }} />
        ))}
      </div>
      <div className="absolute right-4 top-0 h-6 w-2.5 rounded-full border-2 border-ecrn-secondary/60" />
    </div>
  );
}


function Question({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      {eyebrow && <p className="t-eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-[32px] leading-[35px] font-semibold tracking-[-0.035em] text-ecrn-ink">{title}</h1>
      {sub && <p className="mt-2 text-[15px] text-ecrn-secondary">{sub}</p>}
      <div className="mt-5 space-y-3">{children}</div>
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

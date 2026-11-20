import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeltaMark } from "@/components/ui/DeltaLockup";
import { getJobById } from "@/lib/data/repository";
import { getCurrentProfile } from "@/lib/auth/session";
import { isHighPriority, jobLocation, jobPayout, jobSalary } from "@/lib/jobs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage(props: PageProps) {
  const { id } = await props.params;
  const [job, profile] = await Promise.all([getJobById(id), getCurrentProfile()]);
  if (!job) notFound();
  const backHref = profile?.role === "candidate" ? "/candidate/jobs" : "/jobs";
  const payout = jobPayout(job);
  const salary = jobSalary(job);
  const salaryExtra = salary?.match(/\+\s*(.*)$/)?.[1];
  const salaryMain = salary?.replace(/\s*\+.*$/, "");

  return (
    <div className="pb-40 lg:pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: "linear-gradient(160deg,#0A100C 0%,#00244B 55%,#063889 100%)" }}>
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(180deg, black, transparent 85%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-3xl mx-auto px-[22px] pt-4 pb-7">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-3.5 py-2 text-[14px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> All open roles
          </Link>
          <div className="mt-16">
            {isHighPriority(job) && (
              <p className="font-mono text-[11px] text-[#91F9B3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ecrn-green" />
                {job.urgency === "critical" ? "Urgent" : "High priority"}
              </p>
            )}
            <h1 className="t-role mt-2">{job.title}</h1>
            <p className="mt-3 text-[14px] text-white/85 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {jobLocation(job)}
              {job.jobType ? ` · ${job.jobType}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-[22px] pt-4 space-y-5">
        <div className="rounded-[16px] bg-delta-surface px-4 py-3 flex items-start gap-3">
          <DeltaMark className="h-5 mt-0.5" />
          <div>
            <div className="text-[14px] font-semibold text-navy">Delta Construction Partners</div>
            <div className="text-[12.5px] text-navy/75">
              Recruiting for {job.isCompanyPublic && job.companyName ? job.companyName : "a confidential client"}
            </div>
          </div>
        </div>

        <div className="rounded-[16px] overflow-hidden border border-ecrn-line">
          <div className="bg-white/70 px-4 py-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-[12.5px] text-ecrn-secondary">Annual salary</div>
              <div className="t-money text-[22px] font-semibold text-ecrn-ink">{salaryMain ?? "Competitive"}</div>
            </div>
            {salaryExtra && <div className="text-[12.5px] text-ecrn-secondary pb-1">+ {salaryExtra}</div>}
          </div>
          {payout && (
            <div className="reward-panel px-4 py-3 flex items-center justify-between text-white">
              <div>
                <div className="text-[12.5px] text-white/80">Estimated referral payout</div>
                <div className="t-money text-[22px] font-semibold text-ecrn-reward-dark">{payout}</div>
              </div>
              <span className="w-9 h-9 rounded-full bg-white/15 grid place-items-center">
                <Users className="w-4 h-4" />
              </span>
            </div>
          )}
        </div>

        {job.description && (
          <section>
            <h2 className="t-section !text-[20px]">About the role</h2>
            <p className="mt-2 text-[15px] leading-[22px] text-ecrn-secondary whitespace-pre-line">{job.description}</p>
          </section>
        )}
        {job.requirements && (
          <section>
            <h2 className="t-section !text-[20px]">Requirements</h2>
            <p className="mt-2 text-[15px] leading-[22px] text-ecrn-secondary whitespace-pre-line">{job.requirements}</p>
          </section>
        )}
      </div>

      {/* Actions docked above the tab bar */}
      <div className="fixed lg:static inset-x-0 bottom-[calc(64px+max(env(safe-area-inset-bottom),0.75rem))] z-30 bg-ecrn-paper/95 backdrop-blur border-t border-ecrn-line lg:border-0 lg:bg-transparent">
        <div className="max-w-3xl mx-auto px-[14px] lg:px-[22px] py-3 grid grid-cols-2 gap-2">
          <Link href={`/candidate/apply?jobId=${job.id}`}>
            <Button variant="deep" fullWidth>
              Apply directly
            </Button>
          </Link>
          <Link href={`/referrals/new?jobId=${job.id}`}>
            <Button fullWidth>
              <UserPlus className="w-4 h-4" /> Refer someone
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

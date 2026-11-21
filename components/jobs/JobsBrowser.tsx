"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, LocateFixed, MapPin, X } from "lucide-react";
import type { Job } from "@/types";
import { cn } from "@/lib/utils/cn";
import { isHighPriority, jobLocation, jobPayout, jobSalary, milesBetween } from "@/lib/jobs";
import { CitySearch, getCurrentPosition, nearestCity } from "./CitySearch";

interface Origin {
  lat: number;
  lng: number;
  label: string;
  source: "gps" | "city" | "profile";
}

/**
 * Open jobs with "near me": sort by distance from the user's location,
 * a searched city (for people planning a move), or their saved profile city.
 *
 * variant="app"  (default) the member app: page title, compact rows.
 * variant="site" the public website: the page supplies the hero and <h1>;
 *                this renders the controls, a section heading and cards
 *                with 44 px tap targets. Same data and sorting either way.
 */
export function JobsBrowser({
  jobs,
  detailBase,
  showReferral = true,
  initialOrigin,
  heading = "Open jobs",
  intro,
  variant = "app",
}: {
  heading?: string;
  intro?: string;
  jobs: Job[];
  detailBase: string;
  showReferral?: boolean;
  initialOrigin?: { lat: number; lng: number; label: string } | null;
  variant?: "app" | "site";
}) {
  const [origin, setOrigin] = useState<Origin | null>(initialOrigin ? { ...initialOrigin, source: "profile" } : null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const locationRequest = useRef(0);

  const rows = useMemo(() => {
    const withDist = jobs.map((j) => ({
      job: j,
      miles:
        origin && j.locationLat != null && j.locationLng != null
          ? milesBetween(origin.lat, origin.lng, j.locationLat, j.locationLng)
          : null,
    }));
    if (origin) withDist.sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9));
    return withDist;
  }, [jobs, origin]);

  // Featured card: closest high-priority role when a location is set, else first high-priority.
  const featured = rows.find((r) => isHighPriority(r.job)) ?? null;
  const rest = rows.filter((r) => r !== featured);

  async function useMyLocation() {
    const request = ++locationRequest.current;
    setError(null);
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      if (request !== locationRequest.current) return;
      // Sorting needs coordinates only; don't hold up the results while the
      // optional city-name lookup makes another network round trip.
      setOrigin({ ...pos, label: "your location", source: "gps" });
      setLocating(false);
      setSearching(false);
      const city = await nearestCity(pos.lat, pos.lng).catch(() => null);
      if (city && request === locationRequest.current) {
        setOrigin({ ...pos, label: `${city.name}, ${city.state}`, source: "gps" });
      }
    } catch (e) {
      if (request === locationRequest.current) {
        setError((e as Error).message);
        setSearching(true);
      }
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  }

  const states = new Set(jobs.map((j) => j.locationState).filter(Boolean));
  const subtitle =
    origin
      ? `Closest to ${origin.label}`
      : `${jobs.length} open role${jobs.length === 1 ? "" : "s"}${states.size === 1 ? ` across ${stateName([...states][0]!)}` : ""}`;

  // Picking a city or clearing cancels any GPS lookup still in flight.
  const pickCity = (p: { lat: number; lng: number; name: string; state: string }) => {
    locationRequest.current += 1;
    setLocating(false);
    setOrigin({ lat: p.lat, lng: p.lng, label: `${p.name}, ${p.state}`, source: "city" });
    setSearching(false);
    setError(null);
  };
  const clearOrigin = () => {
    locationRequest.current += 1;
    setLocating(false);
    setOrigin(null);
    setError(null);
  };

  if (variant === "site") {
    return (
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="jobs-list-title" className="inner-h2-sm">
              Roles hiring now
            </h2>
            <p className="mt-2 text-[15px] text-ecrn-secondary" aria-live="polite">
              {subtitle}
            </p>
          </div>

          {/* Location controls */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={useMyLocation} disabled={locating} aria-pressed={origin?.source === "gps"} className="inner-pill-btn">
              <LocateFixed aria-hidden className={cn("h-4 w-4", locating && "motion-safe:animate-spin")} />
              {locating ? "Finding you…" : "Near me"}
            </button>
            <button
              type="button"
              onClick={() => setSearching((s) => !s)}
              aria-pressed={origin?.source === "city"}
              aria-expanded={searching}
              className="inner-pill-btn max-w-full"
            >
              <MapPin aria-hidden className="h-4 w-4 shrink-0" />
              <span className="truncate">{origin?.source === "city" ? origin.label : "Search a city"}</span>
            </button>
            {origin && (
              <button type="button" aria-label="Clear location" onClick={clearOrigin} className="inner-pill-btn inner-pill-btn-icon">
                <X aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {searching && (
          <div className="mt-4 max-w-xl">
            <CitySearch autoFocus placeholder="City you live in or want to move to" onPick={pickCity} />
          </div>
        )}
        {error && (
          <p role="status" className="mt-3 text-[14px] leading-snug text-amber-800">
            {error}
          </p>
        )}

        {jobs.length === 0 && (
          <div className="site-card mt-8 rounded-[20px] p-6 text-[16px] text-ecrn-secondary">No open roles right now. Check back soon.</div>
        )}

        {featured && (
          <Link
            href={`${detailBase}/${featured.job.id}`}
            className="site-lift mt-8 block rounded-[24px] text-white shadow-[0_24px_48px_-30px_rgba(0,36,75,0.7)]"
            style={{
              background:
                "radial-gradient(80% 100% at 100% 0%, rgba(6,85,206,0.32) 0%, transparent 60%), linear-gradient(150deg,#14231B 0%,#0A100C 58%,#0F2B1D 100%)",
            }}
          >
            <div className="p-5 sm:p-7">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[13px] font-semibold text-[#91F9B3]">
                <span aria-hidden className="site-live-dot" />
                {featured.job.urgency === "critical" ? "Urgent" : "High priority"}
                {featured.miles != null && <span className="font-medium tabular-nums text-white/70">· {formatMiles(featured.miles)}</span>}
              </p>
              <h3 className="mt-3 text-balance font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[28px]">{featured.job.title}</h3>
              <p className="mt-2.5 flex items-start gap-1.5 text-[15px] leading-snug text-white/[0.84]">
                <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {jobLocation(featured.job)}
                  {featured.job.jobType ? ` · ${featured.job.jobType}` : ""}
                </span>
              </p>
              {jobSalary(featured.job) && <p className="mt-1 pl-[1.375rem] text-[15px] font-medium tabular-nums text-white/90">{jobSalary(featured.job)}</p>}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-7">
              {showReferral && jobPayout(featured.job) ? (
                <span className="text-[14px] leading-snug text-white/75">
                  Estimated referral reward{" "}
                  <span className="whitespace-nowrap font-display text-[15px] font-semibold tabular-nums text-[#BCDFFF]">{jobPayout(featured.job)}</span>
                </span>
              ) : (
                <span className="text-[14px] text-white/75">See the role</span>
              )}
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ecrn-green text-ecrn-action-ink">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <ul className={cn("grid gap-3 md:grid-cols-2", featured ? "mt-3" : "mt-8")} aria-label={featured ? "More roles" : "Roles"}>
            {rest.map(({ job, miles }) => {
              const salary = jobSalary(job);
              const payout = jobPayout(job);
              return (
                <li key={job.id}>
                  <Link href={`${detailBase}/${job.id}`} className="site-card site-lift flex h-full items-start justify-between gap-4 rounded-[20px] p-5">
                    <span className="block min-w-0">
                      <h3 className="text-balance font-display text-[18px] font-semibold leading-snug tracking-[-0.015em] text-ecrn-ink">{job.title}</h3>
                      <span className="mt-1.5 flex items-start gap-1.5 text-[14.5px] leading-snug text-ecrn-secondary">
                        <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {jobLocation(job)}
                          {salary ? ` · ${salary}` : ""}
                        </span>
                      </span>
                      {showReferral && payout && (
                        <span className="mt-3 inline-flex rounded-full bg-delta-surface px-3 py-1 font-display text-[13px] font-medium text-cobalt">
                          Referral reward <span className="ml-1 font-semibold tabular-nums">{payout}</span>
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-3">
                      <span
                        aria-hidden
                        className="grid h-10 w-10 place-items-center rounded-full bg-ecrn-paper text-ecrn-ink shadow-[inset_0_0_0_1px_#D9DFD8]"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                      {miles != null && <span className="font-display text-[13px] font-medium tabular-nums text-ecrn-secondary">{formatMiles(miles)}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {jobs.length > 0 && showReferral && (
          <p className="mt-5 text-[13.5px] leading-relaxed text-ecrn-secondary">
            Referral rewards are estimates, confirmed in writing by Delta Construction Partners before payout.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="t-eyebrow mb-2">Opportunities</p>
        <h1 className="t-page">{heading}</h1>
        <p className="mt-2 text-[15px] text-ecrn-secondary">{intro && !origin ? intro : subtitle}</p>
      </div>

      {/* Location controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className={cn(
              "h-[44px] px-3.5 rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 border",
              origin?.source === "gps"
                ? "bg-ecrn-green-text text-white border-ecrn-green-text"
                : "bg-ecrn-action-surface text-ecrn-green-text border-[#A7E9C4]"
            )}
          >
            <LocateFixed className={cn("w-4 h-4", locating && "animate-spin")} />
            {locating ? "Finding you…" : "Near me"}
          </button>
          <button
            type="button"
            onClick={() => setSearching((s) => !s)}
            className={cn(
              "h-[44px] px-3.5 rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 border",
              origin?.source === "city" ? "bg-ecrn-green-text text-white border-ecrn-green-text" : "bg-white text-ecrn-ink border-ecrn-line"
            )}
          >
            <MapPin className="w-4 h-4" />
            {origin?.source === "city" ? origin.label : "Search a city"}
          </button>
          {origin && (
            <button
              type="button"
              aria-label="Clear location"
              onClick={clearOrigin}
              className="h-[44px] w-[44px] rounded-full grid place-items-center border border-ecrn-line bg-white"
            >
              <X className="w-4 h-4 text-ecrn-secondary" />
            </button>
          )}
        </div>
        {searching && <CitySearch autoFocus placeholder="City you live in or want to move to" onPick={pickCity} />}
        {error && <p className="text-[13px] text-amber-700">{error}</p>}
      </div>

      {jobs.length === 0 && (
        <div className="group-surface p-6 text-center text-ecrn-secondary">No open roles right now. Check back soon.</div>
      )}

      {featured && (
        <Link
          href={`${detailBase}/${featured.job.id}`}
          className="block rounded-[22px] overflow-hidden text-white shadow-pass"
          style={{ background: "linear-gradient(150deg,#14231B 0%,#0A100C 60%,#0F2B1D 100%)" }}
        >
          <div className="p-5">
            <p className="font-mono text-[11px] text-[#91F9B3] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ecrn-green" /> High priority
              {featured.miles != null && <span className="text-white/60">· {formatMiles(featured.miles)}</span>}
            </p>
            <h2 className="font-display mt-2 text-[24px] leading-[26px] font-semibold tracking-tight">{featured.job.title}</h2>
            <p className="mt-2 text-[13.5px] text-white/80">
              {jobLocation(featured.job)}
              {featured.job.jobType ? ` · ${featured.job.jobType}` : ""}
            </p>
            {jobSalary(featured.job) && <p className="text-[13.5px] text-white/90 mt-0.5">{jobSalary(featured.job)}</p>}
          </div>
          {showReferral && jobPayout(featured.job) && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <span className="text-[12.5px] text-white/70">Estimated referral reward</span>
              <span className="flex items-center gap-3">
                <span className="t-money text-[15px] text-ecrn-reward-dark">{jobPayout(featured.job)}</span>
                <span className="w-7 h-7 rounded-full bg-ecrn-green text-ecrn-action-ink grid place-items-center">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </span>
            </div>
          )}
        </Link>
      )}

      {rest.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="t-section">{featured ? "More roles" : "Roles"}</h2>
            <span className="t-eyebrow">{rest.length} open</span>
          </div>
          <ul className="mt-1 divide-y divide-ecrn-line">
            {rest.map(({ job, miles }) => (
              <li key={job.id}>
                <Link href={`${detailBase}/${job.id}`} className="block py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[17px] font-semibold leading-snug text-ecrn-ink">{job.title}</h3>
                    {miles != null && <span className="t-eyebrow shrink-0 pt-1">{formatMiles(miles)}</span>}
                  </div>
                  <p className="t-meta mt-0.5">
                    {jobLocation(job)}
                    {jobSalary(job) ? ` · ${jobSalary(job)}` : ""}
                  </p>
                  {showReferral && jobPayout(job) && (
                    <p className="mt-0.5 text-[12.5px] text-cobalt">
                      Est. referral reward <span className="font-semibold">{jobPayout(job)}</span>
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatMiles(m: number): string {
  if (m < 1) return "< 1 mi";
  return `${Math.round(m).toLocaleString("en-US")} mi`;
}

const STATES: Record<string, string> = {
  FL: "Florida", GA: "Georgia", TX: "Texas", NC: "North Carolina", SC: "South Carolina", AL: "Alabama",
  TN: "Tennessee", CA: "California", NY: "New York", AZ: "Arizona", CO: "Colorado", VA: "Virginia",
};
function stateName(s: string) {
  return STATES[s] ?? s;
}

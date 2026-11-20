"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
 */
export function JobsBrowser({
  jobs,
  detailBase,
  showReferral = true,
  initialOrigin,
}: {
  jobs: Job[];
  detailBase: string;
  showReferral?: boolean;
  initialOrigin?: { lat: number; lng: number; label: string } | null;
}) {
  const [origin, setOrigin] = useState<Origin | null>(initialOrigin ? { ...initialOrigin, source: "profile" } : null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

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
    setError(null);
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const city = await nearestCity(pos.lat, pos.lng).catch(() => null);
      setOrigin({ ...pos, label: city ? `${city.name}, ${city.state}` : "your location", source: "gps" });
      setSearching(false);
    } catch (e) {
      setError((e as Error).message);
      setSearching(true);
    } finally {
      setLocating(false);
    }
  }

  const states = new Set(jobs.map((j) => j.locationState).filter(Boolean));
  const subtitle =
    origin
      ? `Closest to ${origin.label}`
      : `${jobs.length} open role${jobs.length === 1 ? "" : "s"}${states.size === 1 ? ` across ${stateName([...states][0]!)}` : ""}`;

  return (
    <div className="space-y-5">
      <div>
        <p className="t-eyebrow mb-2">Opportunities</p>
        <h1 className="t-page">Open jobs</h1>
        <p className="mt-2 text-[15px] text-ecrn-secondary">{subtitle}</p>
      </div>

      {/* Location controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className={cn(
              "h-[40px] px-3.5 rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 border",
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
              "h-[40px] px-3.5 rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 border",
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
              onClick={() => { setOrigin(null); setError(null); }}
              className="h-[40px] w-[40px] rounded-full grid place-items-center border border-ecrn-line bg-white"
            >
              <X className="w-4 h-4 text-ecrn-secondary" />
            </button>
          )}
        </div>
        {searching && (
          <CitySearch
            autoFocus
            placeholder="City you live in or want to move to"
            onPick={(p) => {
              setOrigin({ lat: p.lat, lng: p.lng, label: `${p.name}, ${p.state}`, source: "city" });
              setSearching(false);
              setError(null);
            }}
          />
        )}
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

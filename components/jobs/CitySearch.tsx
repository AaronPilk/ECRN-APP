"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

export interface Place {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

/** US city autocomplete backed by the us_places table (Census Gazetteer). */
export function CitySearch({
  onPick,
  placeholder = "Search a city",
  autoFocus,
  className,
}: {
  onPick: (p: Place) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    const mine = ++seq.current;
    setError(null);
    if (term.length < 2 || term === selectedLabel) {
      setResults([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const { data, error: queryError } = await getSupabaseBrowserClient()
          .rpc("search_places", { q: term, lim: 6 })
          .abortSignal(controller.signal);
        if (controller.signal.aborted || mine !== seq.current) return;
        if (queryError) throw queryError;
        setResults((data as Place[]) ?? []);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted && mine === seq.current) {
          setResults([]);
          setError("City search couldn't connect. Please try again.");
        }
      }
    }, 160);
    return () => { clearTimeout(t); controller.abort(); };
  }, [q, selectedLabel]);

  function pick(place: Place) {
    const label = `${place.name}, ${place.state}`;
    seq.current += 1;
    setSelectedLabel(label);
    setQ(label);
    setOpen(false);
    onPick(place);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 h-[48px] px-3.5 rounded-[14px] bg-white border border-ecrn-line focus-within:border-ecrn-green focus-within:shadow-glow">
        <Search className="w-4 h-4 text-ecrn-secondary shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="search"
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent outline-none text-[16px] text-ecrn-ink placeholder:text-ecrn-secondary/70"
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              pick(results[0]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {q && (
          <button type="button" aria-label="Clear" onClick={() => { seq.current += 1; setQ(""); setSelectedLabel(""); setResults([]); setOpen(false); }} className="p-1 -mr-1">
            <X className="w-4 h-4 text-ecrn-secondary" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-40 mt-1.5 inset-x-0 group-surface shadow-float">
          {results.map((p) => (
            <li key={`${p.name}-${p.state}-${p.lat}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-[15px] hover:bg-ecrn-paper border-b border-ecrn-line last:border-0"
                onClick={() => pick(p)}
              >
                <span className="font-medium text-ecrn-ink">{p.name}</span>
                <span className="text-ecrn-secondary">, {p.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="status" className="mt-1 text-[13px] text-amber-700">{error}</p>}
    </div>
  );
}

/** One-shot browser/WebView geolocation. */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location isn't available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location is turned off for ECRN. Search a city instead, or allow location in Settings."
              : "Couldn't get your location. Try searching a city."
          )
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

export async function nearestCity(lat: number, lng: number): Promise<{ name: string; state: string } | null> {
  const { data } = await getSupabaseBrowserClient().rpc("nearest_place", { p_lat: lat, p_lng: lng });
  const row = (data as { name: string; state: string }[] | null)?.[0];
  return row ?? null;
}

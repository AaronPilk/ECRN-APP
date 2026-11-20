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
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      const { data } = await getSupabaseBrowserClient().rpc("search_places", { q: term, lim: 6 });
      if (mine === seq.current) {
        setResults((data as Place[]) ?? []);
        setOpen(true);
      }
    }, 160);
    return () => clearTimeout(t);
  }, [q]);

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
          className="flex-1 bg-transparent outline-none text-[16px] text-ecrn-ink placeholder:text-ecrn-secondary/70"
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              onPick(results[0]);
              setQ(`${results[0].name}, ${results[0].state}`);
              setOpen(false);
            }
          }}
        />
        {q && (
          <button type="button" aria-label="Clear" onClick={() => { setQ(""); setResults([]); }} className="p-1 -mr-1">
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
                onClick={() => {
                  onPick(p);
                  setQ(`${p.name}, ${p.state}`);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-ecrn-ink">{p.name}</span>
                <span className="text-ecrn-secondary">, {p.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
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

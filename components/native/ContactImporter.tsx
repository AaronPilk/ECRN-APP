"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Contacts } from "@capacitor-community/contacts";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { isNativeApp } from "@/lib/native/platform";
import {
  importContactsAction,
  type ImportedContact,
  type ImportSummary,
} from "@/app/(app)/referrals/actions";
import { BookUser, Check, Search, ShieldCheck } from "lucide-react";

interface Row extends ImportedContact {
  key: string;
  display: string;
}

type Stage = "intro" | "denied" | "unsupported" | "pick" | "done";

/* eslint-disable @typescript-eslint/no-explicit-any */
function webContactsSupported(): boolean {
  return typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
}

export function ContactImporter() {
  const [stage, setStage] = useState<Stage>("intro");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pending, startTransition] = useTransition();

  async function loadNative() {
    setLoading(true);
    try {
      const perm = await Contacts.requestPermissions();
      if (perm.contacts !== "granted" && perm.contacts !== "limited") {
        setStage("denied");
        return;
      }
      const { contacts } = await Contacts.getContacts({
        projection: { name: true, phones: true, emails: true, organization: true, postalAddresses: true },
      });
      const mapped: Row[] = [];
      for (const c of contacts) {
        const first = (c.name?.given ?? "").trim();
        const last = (c.name?.family ?? "").trim();
        const display = (c.name?.display ?? `${first} ${last}`).trim();
        const email = c.emails?.find((e) => e.address)?.address ?? null;
        const phone = c.phones?.find((p) => p.number)?.number ?? null;
        if (!display || (!email && !phone)) continue;
        const addr = c.postalAddresses?.find((a) => a.city || a.region);
        const [fallbackFirst, ...rest] = display.split(" ");
        mapped.push({
          key: c.contactId,
          display,
          firstName: first || fallbackFirst,
          lastName: last || rest.join(" "),
          email,
          phone,
          currentJobTitle: c.organization?.jobTitle ?? null,
          company: c.organization?.company ?? null,
          locationCity: addr?.city ?? null,
          locationState: addr?.region ?? null,
        });
      }
      mapped.sort((a, b) => a.display.localeCompare(b.display));
      setRows(mapped);
      setStage("pick");
    } catch {
      setStage("denied");
    } finally {
      setLoading(false);
    }
  }

  async function loadWeb() {
    setLoading(true);
    try {
      const picked: any[] = await (navigator as any).contacts.select(["name", "email", "tel"], { multiple: true });
      const mapped: Row[] = picked
        .map((c, i) => {
          const display = String(c.name?.[0] ?? "").trim();
          const [first, ...rest] = display.split(" ");
          return {
            key: `w${i}`,
            display,
            firstName: first ?? "",
            lastName: rest.join(" "),
            email: c.email?.[0] ?? null,
            phone: c.tel?.[0] ?? null,
          };
        })
        .filter((r) => r.display && (r.email || r.phone));
      setRows(mapped);
      setSelected(new Set(mapped.map((r) => r.key)));
      setStage("pick");
    } catch {
      setStage("intro");
    } finally {
      setLoading(false);
    }
  }

  function start() {
    if (isNativeApp()) void loadNative();
    else if (webContactsSupported()) void loadWeb();
    else setStage("unsupported");
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.display, r.email, r.phone, r.company, r.currentJobTitle].some((v) => v?.toLowerCase().includes(q))
    );
  }, [rows, query]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (isNativeApp()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }

  function submit() {
    const chosen = rows.filter((r) => selected.has(r.key));
    if (!chosen.length) return;
    startTransition(async () => {
      const result = await importContactsAction(
        chosen.map(({ key: _k, display: _d, ...c }) => c)
      );
      setSummary(result);
      setStage("done");
    });
  }

  if (stage === "done" && summary) {
    return (
      <Card className="p-7 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-ecrn-green/15 text-emerald-700 grid place-items-center">
          <Check className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ecrn-ink">
          {summary.created} new referral{summary.created === 1 ? "" : "s"} added
        </h2>
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          {summary.underReview > 0 && (
            <p>
              {summary.underReview} may already be in the ECRN network — our team will review.
            </p>
          )}
          {summary.skipped > 0 && <p>{summary.skipped} skipped (missing a name, email, or phone).</p>}
          {summary.errors.length > 0 && <p className="text-red-700">{summary.errors.length} couldn&apos;t be saved.</p>}
        </div>
        <Link href="/referrals" className="inline-block mt-6">
          <Button variant="dark">See my referrals</Button>
        </Link>
      </Card>
    );
  }

  if (stage === "pick") {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${rows.length} contacts`}
            className="pl-10"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{selected.size} selected</span>
          <button
            type="button"
            className="font-medium text-ecrn-ink"
            onClick={() =>
              setSelected((prev) => {
                const next = new Set(prev);
                const allOn = visible.every((r) => next.has(r.key));
                visible.forEach((r) => (allOn ? next.delete(r.key) : next.add(r.key)));
                return next;
              })
            }
          >
            {visible.length && visible.every((r) => selected.has(r.key)) ? "Clear" : "Select all"}
          </button>
        </div>

        <Card className="divide-y divide-slate-100 overflow-hidden">
          {visible.length === 0 && <p className="p-5 text-sm text-slate-500">No contacts match.</p>}
          {visible.map((r) => {
            const on = selected.has(r.key);
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => toggle(r.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50"
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-full border-2 grid place-items-center ${
                    on ? "bg-ecrn-green border-ecrn-green text-ecrn-black" : "border-slate-300"
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-ecrn-ink truncate">{r.display}</span>
                  <span className="block text-xs text-slate-500 truncate">
                    {[r.currentJobTitle, r.company].filter(Boolean).join(" · ") || r.email || r.phone}
                  </span>
                </span>
              </button>
            );
          })}
        </Card>

        <div className="sticky bottom-24 lg:bottom-4 pt-2">
          <Button variant="dark" size="lg" fullWidth disabled={!selected.size || pending} loading={pending} onClick={submit}>
            Refer {selected.size || ""} {selected.size === 1 ? "person" : "people"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-7">
      <div className="w-12 h-12 rounded-2xl bg-ecrn-black text-white grid place-items-center">
        <BookUser className="w-6 h-6" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-ecrn-ink">Refer from your contacts</h2>
      <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">
        Pick the electricians, PMs, estimators, and supers you know. Each one becomes a referral
        that&apos;s yours — if Delta places them, you can earn $1,000–$10,000.
      </p>
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
        Only the contacts you select are sent to ECRN. Nothing is uploaded until you tap Refer.
      </div>

      {stage === "denied" && (
        <p className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-sm text-amber-900">
          ECRN doesn&apos;t have access to your contacts. Turn it on in your phone&apos;s Settings → ECRN →
          Contacts, then try again.
        </p>
      )}
      {stage === "unsupported" && (
        <p className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
          Contact import works in the ECRN iPhone and Android app. On the web you can{" "}
          <Link href="/referrals/new" className="font-medium underline">
            add a referral by hand
          </Link>
          .
        </p>
      )}

      <Button variant="dark" size="lg" fullWidth className="mt-6" onClick={start} loading={loading}>
        Choose contacts
      </Button>
    </Card>
  );
}

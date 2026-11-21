"use client";

import { useCallback, useDeferredValue, useLayoutEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Contacts } from "@capacitor-community/contacts";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { BookUser, Check, ChevronLeft, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isNativeApp } from "@/lib/native/platform";
import { cn } from "@/lib/utils/cn";
import { importContactsAction, type ImportSummary } from "@/app/(app)/referrals/actions";
import { ContactList, type ContactRow as Row } from "./ContactList";

type Stage = "intro" | "denied" | "unsupported" | "pick" | "review" | "done";

const digits = (v?: string | null) => (v ?? "").replace(/\D/g, "");
const hasPhone = (r: Row) => digits(r.phone).length >= 10;
const hasName = (r: Row) => Boolean(r.firstName?.trim());
const isReady = (r: Row) => hasName(r) && hasPhone(r);

/* eslint-disable @typescript-eslint/no-explicit-any */
function webContactsSupported(): boolean {
  return typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
}

/** Prefer a mobile number — that's what recruiters text. */
function bestPhone(phones?: { number?: string | null; type?: string; label?: string | null }[]): string | null {
  if (!phones?.length) return null;
  const mobile = phones.find((p) => /mobile|cell|iphone/i.test(`${p.type ?? ""} ${p.label ?? ""}`) && p.number);
  return (mobile ?? phones.find((p) => p.number))?.number ?? null;
}

export function ContactImporter({ welcome }: { welcome?: boolean }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const searchQuery = useDeferredValue(query);

  useLayoutEffect(() => {
    // A review screen must start at its heading, not at the scroll offset of a
    // long contacts list. Do this before paint to prevent a visible jump.
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

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
        const display = (c.name?.display ?? `${first} ${last}`).trim() || c.organization?.company?.trim() || "";
        const email = c.emails?.find((e) => e.address)?.address ?? null;
        const phone = bestPhone(c.phones as any);
        if (!display || (!email && !phone)) continue;
        const addr = c.postalAddresses?.find((a) => a.city || a.region);
        const [fallbackFirst, ...rest] = display.split(" ");
        mapped.push({
          key: c.contactId,
          display,
          firstName: first || (c.name?.display ? fallbackFirst : ""),
          lastName: last || (c.name?.display ? rest.join(" ") : ""),
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
            display: display || String(c.tel?.[0] ?? c.email?.[0] ?? ""),
            firstName: first ?? "",
            lastName: rest.join(" "),
            email: c.email?.[0] ?? null,
            phone: c.tel?.[0] ?? null,
          };
        })
        .filter((r) => r.display);
      setRows(mapped);
      setSelected(new Set(mapped.map((r) => r.key)));
      // The web picker already is the selection step.
      setStage(mapped.length ? "review" : "intro");
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
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.display, r.email, r.phone, r.company, r.currentJobTitle].some((v) => v?.toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  const chosen = useMemo(() => rows.filter((r) => selected.has(r.key)), [rows, selected]);
  const notReady = chosen.filter((r) => !isReady(r));

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (isNativeApp()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }, []);

  function edit(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function submit() {
    if (!chosen.length || notReady.length) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        const result = await importContactsAction(chosen.map(({ key: _k, display: _d, ...c }) => c));
        setSummary(result);
        setStage("done");
      } catch {
        setSubmitError("We couldn't send the referrals. Check your connection and try again.");
      }
    });
  }

  // ── Done ──────────────────────────────────────────────────────────
  if (stage === "done" && summary) {
    return (
      <div className="group-surface p-7 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-ecrn-action-surface text-ecrn-green-text grid place-items-center">
          <Check className="w-7 h-7" />
        </div>
        <h2 className="mt-4 font-display text-[24px] font-semibold text-ecrn-ink">
          {summary.created} referral{summary.created === 1 ? "" : "s"} sent to Delta
        </h2>
        <div className="mt-3 space-y-1 text-[14px] text-ecrn-secondary">
          {summary.underReview > 0 && <p>{summary.underReview} may already be in the network. Delta will review.</p>}
          {summary.skipped > 0 && <p>{summary.skipped} skipped (missing a name or phone).</p>}
          {summary.errors.length > 0 && <p className="text-red-700">{summary.errors.length} couldn&apos;t be saved.</p>}
        </div>
        <div className="mt-6 grid gap-2">
          <Link href="/referrals">
            <Button fullWidth>See my referrals</Button>
          </Link>
          <button type="button" className="py-2 text-[14px] font-medium text-ecrn-green-text" onClick={() => { setSelected(new Set()); setStage("pick"); }}>
            Refer more people
          </button>
        </div>
      </div>
    );
  }

  // ── Review: fill in what's missing before anything is sent ────────
  if (stage === "review") {
    return (
      <div className="space-y-4 pb-28">
        <button type="button" onClick={() => setStage(rows.length > chosen.length || isNativeApp() ? "pick" : "intro")} className="inline-flex items-center gap-1 text-[14px] font-medium text-ecrn-green-text -ml-1">
          <ChevronLeft className="w-4 h-4" /> Back to contacts
        </button>
        <div>
          <h1 className="t-page !text-[32px] !leading-[35px]">Check the details</h1>
          <p className="mt-2 text-[14.5px] text-ecrn-secondary">
            Name and phone are required. Email and job title help Delta move faster.
          </p>
        </div>

        {notReady.length > 0 && (
          <div className="flex gap-2 rounded-[14px] bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            {notReady.length} {notReady.length === 1 ? "person needs" : "people need"} a name or phone number.
          </div>
        )}

        <ul className="space-y-3">
          {chosen.map((r) => {
            const nameMissing = !hasName(r);
            const phoneMissing = !hasPhone(r);
            return (
              <li key={r.key} className={cn("group-surface", (nameMissing || phoneMissing) && "border-amber-400")}>
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <span className="font-display text-[17px] font-semibold text-ecrn-ink truncate">{r.display}</span>
                  <button type="button" onClick={() => toggle(r.key)} className="text-[13px] text-ecrn-secondary shrink-0">
                    Remove
                  </button>
                </div>
                <ReviewField label="First name" value={r.firstName} missing={nameMissing} required onChange={(v) => edit(r.key, { firstName: v })} />
                <ReviewField label="Last name" value={r.lastName} onChange={(v) => edit(r.key, { lastName: v })} />
                <ReviewField label="Phone" type="tel" value={r.phone ?? ""} missing={phoneMissing} required onChange={(v) => edit(r.key, { phone: v })} />
                <ReviewField label="Email" type="email" value={r.email ?? ""} soft={!r.email} onChange={(v) => edit(r.key, { email: v })} />
                <ReviewField label="Job title" value={r.currentJobTitle ?? ""} soft={!r.currentJobTitle} onChange={(v) => edit(r.key, { currentJobTitle: v })} />
                <ReviewField label="Company" value={r.company ?? ""} onChange={(v) => edit(r.key, { company: v })} />
              </li>
            );
          })}
        </ul>

        {submitError && <p role="alert" className="text-[14px] text-red-700">{submitError}</p>}
        <div className="fixed lg:static inset-x-0 bottom-[calc(64px+max(env(safe-area-inset-bottom),0.75rem))] z-30 bg-ecrn-paper border-t border-ecrn-line lg:border-0">
          <div className="max-w-3xl mx-auto px-[22px] py-3">
            <Button fullWidth size="lg" disabled={!chosen.length || notReady.length > 0 || pending} loading={pending} onClick={submit}>
              {notReady.length > 0
                ? "Add the missing info"
                : `Send ${chosen.length} ${chosen.length === 1 ? "referral" : "referrals"} to Delta`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pick ──────────────────────────────────────────────────────────
  if (stage === "pick") {
    return (
      <div className="space-y-3 pb-28">
        <h1 className="t-page !text-[32px] !leading-[35px]">Who do you know?</h1>
        <div className="flex items-center gap-2 h-[48px] px-3.5 rounded-[14px] bg-white border border-ecrn-line">
          <Search className="w-4 h-4 text-ecrn-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${rows.length} contacts`}
            aria-label="Search contacts"
            className="min-w-0 flex-1 bg-transparent outline-none text-[16px]"
          />
        </div>
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="text-ecrn-secondary">{selected.size} selected</span>
          {query && visible.length > 0 && (
            <button
              type="button"
              className="font-medium text-ecrn-green-text"
              onClick={() =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  const allOn = visible.every((r) => next.has(r.key));
                  visible.forEach((r) => (allOn ? next.delete(r.key) : next.add(r.key)));
                  return next;
                })
              }
            >
              {visible.every((r) => selected.has(r.key)) ? "Clear these" : "Select these"}
            </button>
          )}
        </div>

        <ContactList rows={visible} selected={selected} onToggle={toggle} />

        <div className="fixed lg:static inset-x-0 bottom-[calc(64px+max(env(safe-area-inset-bottom),0.75rem))] z-30 bg-ecrn-paper border-t border-ecrn-line lg:border-0">
          <div className="max-w-3xl mx-auto px-[22px] py-3">
            <Button fullWidth size="lg" disabled={!selected.size} onClick={() => setStage("review")}>
              Review {selected.size || ""} {selected.size === 1 ? "person" : "people"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        {welcome && <p className="t-eyebrow mb-2">You&apos;re in</p>}
        <h1 className="t-page">{welcome ? "Start with your contacts" : "Refer from contacts"}</h1>
        <p className="mt-2 text-[15px] text-ecrn-secondary leading-relaxed">
          Pick the electricians, PMs, estimators, and supers you know. If Delta places one, you can earn $1,000–$10,000.
        </p>
      </div>
      <div className="flex items-start gap-2.5 rounded-[14px] bg-delta-surface px-4 py-3 text-[13.5px] text-navy">
        <ShieldCheck className="w-4 h-4 shrink-0 text-cobalt mt-0.5" />
        Only the people you select are sent. Nothing leaves your phone until you tap Send.
      </div>

      {stage === "denied" && (
        <p className="rounded-[14px] bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          ECRN doesn&apos;t have access to your contacts. Turn it on in Settings → ECRN → Contacts, then try again.
        </p>
      )}
      {stage === "unsupported" && (
        <p className="rounded-[14px] bg-white border border-ecrn-line px-4 py-3 text-[14px] text-ecrn-secondary">
          Contact import works in the ECRN iPhone and Android app. Here you can{" "}
          <Link href="/referrals/new" className="font-medium text-ecrn-green-text">
            add a referral by hand
          </Link>
          .
        </p>
      )}

      <Button size="lg" fullWidth onClick={start} loading={loading}>
        <BookUser className="w-5 h-5" /> Choose contacts
      </Button>
      {welcome && (
        <Link href="/dashboard" className="block text-center text-[14px] font-medium text-ecrn-secondary py-1">
          I&apos;ll do this later
        </Link>
      )}
    </div>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  type = "text",
  missing,
  required,
  soft,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  missing?: boolean;
  required?: boolean;
  soft?: boolean;
}) {
  return (
    <label className={cn("group-row min-h-[48px]", missing && "bg-amber-50/70")}>
      <span className={cn("text-[14px] shrink-0", missing ? "text-amber-800 font-medium" : "text-ecrn-secondary")}>
        {label}
        {required && " *"}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
        placeholder={missing ? "Required" : soft ? "Add if you know it" : ""}
        className="min-w-0 flex-1 text-right bg-transparent outline-none text-[16px] text-ecrn-ink placeholder:text-ecrn-secondary/60"
      />
    </label>
  );
}

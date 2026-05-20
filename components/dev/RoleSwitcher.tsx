"use client";

import { useState } from "react";
import { demoLoginAction } from "@/app/(auth)/actions";
import type { UserRole } from "@/types";
import { Shield, Users, Briefcase, ChevronUp, X } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: UserRole;
  currentEmail: string;
}

/**
 * Floating "View as" widget shown on every authenticated page in V1
 * (while we're on mock data). Lets you flip between Admin / Referral
 * Partner / Candidate without navigating to /login.
 *
 * Auto-hides once real Supabase auth is wired in — the parent renders
 * this only when NEXT_PUBLIC_SUPABASE_URL is unset.
 */
const ROLES: { key: "admin" | "referral_partner" | "candidate"; label: string; subtitle: string; icon: React.ReactNode }[] = [
  {
    key: "admin",
    label: "Admin",
    subtitle: "Delta operations view",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    key: "referral_partner",
    label: "Referral Partner",
    subtitle: "Network ambassador view",
    icon: <Users className="w-4 h-4" />,
  },
  {
    key: "candidate",
    label: "Job Seeker",
    subtitle: "Candidate view",
    icon: <Briefcase className="w-4 h-4" />,
  },
];

export function RoleSwitcher({ currentRole, currentEmail }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);

  const currentMeta = ROLES.find((r) => r.key === currentRole);
  // company_contact + edge cases fall through to a generic label
  const currentLabel = currentMeta?.label ?? currentRole.replace(/_/g, " ");

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Expanded panel */}
        {open && (
          <div className="w-72 bg-ecrn-black text-white rounded-2xl shadow-float border border-white/10 overflow-hidden animate-slide-up">
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-ecrn-green font-semibold">
                  Dev preview
                </div>
                <div className="text-xs text-white/60 mt-0.5 truncate max-w-[200px]">
                  Logged in as {currentEmail}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2">
              {ROLES.map((r) => {
                const isCurrent = r.key === currentRole;
                return (
                  <form key={r.key} action={demoLoginAction}>
                    <input type="hidden" name="role" value={r.key} />
                    <button
                      type="submit"
                      disabled={isCurrent}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isCurrent
                          ? "bg-ecrn-green/15 text-ecrn-green cursor-default"
                          : "text-white/85 hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg grid place-items-center ${
                          isCurrent
                            ? "bg-ecrn-green/20 text-ecrn-green"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{r.label}</div>
                        <div className="text-[11px] text-white/50">{r.subtitle}</div>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] uppercase tracking-wide font-bold text-ecrn-green">
                          Current
                        </span>
                      ) : (
                        <span className="text-white/40">→</span>
                      )}
                    </button>
                  </form>
                );
              })}
            </div>

            <div className="px-4 py-2.5 border-t border-white/10 text-[10px] text-white/40 leading-snug">
              Visible only while ECRN runs on mock data. Hides when Supabase is connected.
            </div>
          </div>
        )}

        {/* Trigger pill */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-ecrn-black text-white shadow-float border border-white/10 hover:bg-ecrn-ink transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-ecrn-green animate-pulse" />
          <span className="text-xs font-semibold">View as: {currentLabel}</span>
          <ChevronUp
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

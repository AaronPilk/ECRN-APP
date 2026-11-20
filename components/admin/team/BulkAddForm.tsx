"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { bulkAddStaffAction } from "@/app/(app)/admin/team/actions";
import { BULK_ADD_EXAMPLE, type BulkAddResult } from "./shared";

const ROLE_LABEL = { owner: "Owner", account_manager: "Account manager", recruiter: "Recruiter" } as const;

/**
 * Paste a list of people, one per line, to load the whole team at once
 * (before Bullhorn is connected). Collapsed until opened.
 */
export function BulkAddForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [result, setResult] = useState<BulkAddResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("people", text);
    startTransition(async () => {
      try {
        const res = await bulkAddStaffAction(formData);
        setResult(res);
        // Keep only the lines that still need fixing.
        setText(res.retryText);
      } catch (e) {
        unstable_rethrow(e); // e.g. signed out: let the redirect through
        setResult({ error: "Something went wrong. Nothing else was added; check the team list and try again.", added: [], skipped: [], retryText: text });
      }
    });
  };

  return (
    <details
      id="bulk"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group bg-white rounded-[16px] border border-ecrn-line scroll-mt-6"
    >
      <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-[16px] font-semibold text-ecrn-ink">Add several people at once</span>
          <span className="block mt-0.5 text-[12.5px] text-ecrn-secondary">Paste a list, one person per line. Everyone gets their own code and link.</span>
        </span>
        <ChevronDown className="w-5 h-5 shrink-0 text-ecrn-secondary transition-transform group-open:rotate-180" />
      </summary>

      <div className="px-5 pb-5 space-y-4">
        <div className="rounded-[14px] bg-ecrn-paper border border-ecrn-line px-4 py-3 text-[13px] text-ecrn-secondary leading-relaxed">
          <p>
            Format: <span className="font-mono text-[12.5px] text-ecrn-ink">First Last, email, role, account manager</span>
          </p>
          <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
            <li>Role is recruiter, account manager or owner. Leave it out for a recruiter.</li>
            <li>For the account manager, use their code, email or full name. They can be in the same list.</li>
            <li>Anyone already on the team (same email) is skipped, so pasting a list twice is safe.</li>
            <li>Columns copied from a spreadsheet work too.</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="bulk-people" className="sr-only">
            People to add, one per line
          </label>
          <Textarea
            id="bulk-people"
            name="people"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={BULK_ADD_EXAMPLE}
            spellCheck={false}
            className="font-mono text-[13.5px] leading-relaxed min-h-[180px]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" variant="deep" loading={pending} disabled={!text.trim()} className="h-10 px-5">
              Add everyone
            </Button>
            <span className="text-[12.5px] text-ecrn-secondary">Up to 200 lines at a time.</span>
          </div>
        </form>

        {result && (
          <div className="space-y-3" role="status" aria-live="polite">
            {result.error && <p className="rounded-[12px] bg-red-50 border border-red-200/70 text-red-800 px-3.5 py-2.5 text-[13.5px]">{result.error}</p>}

            {!result.error && (
              <p className="rounded-[12px] bg-ecrn-action-surface text-ecrn-green-text px-3.5 py-2.5 text-[13.5px] font-medium">
                {result.added.length} added, {result.skipped.length} skipped.
              </p>
            )}

            {result.added.length > 0 && (
              <div className="overflow-x-auto rounded-[14px] border border-ecrn-line">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-ecrn-paper text-[11.5px] uppercase tracking-wide text-ecrn-secondary">
                    <tr>
                      <th scope="col" className="px-3.5 py-2 font-medium">Added</th>
                      <th scope="col" className="px-3.5 py-2 font-medium">Role</th>
                      <th scope="col" className="px-3.5 py-2 font-medium">Account manager</th>
                      <th scope="col" className="px-3.5 py-2 font-medium">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ecrn-line">
                    {result.added.map((a) => (
                      <tr key={a.code}>
                        <td className="px-3.5 py-2 text-ecrn-ink">{a.name}</td>
                        <td className="px-3.5 py-2 text-ecrn-secondary">{ROLE_LABEL[a.role]}</td>
                        <td className="px-3.5 py-2 text-ecrn-secondary">{a.manager ?? "None"}</td>
                        <td className="px-3.5 py-2 font-mono text-ecrn-ink">{a.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.skipped.length > 0 && (
              <div className="rounded-[14px] border border-ecrn-line">
                <p className="px-3.5 pt-2.5 text-[11.5px] uppercase tracking-wide text-ecrn-secondary font-medium">Skipped</p>
                <ul className="px-3.5 pb-2.5 pt-1 divide-y divide-ecrn-line text-[13px]">
                  {result.skipped.map((s) => (
                    <li key={`${s.line}-${s.reason}`} className="py-1.5">
                      <span className="text-ecrn-secondary">Line {s.line}:</span> <span className="font-mono text-[12.5px] text-ecrn-ink break-all">{s.text}</span>
                      <span className="block text-amber-800">{s.reason}</span>
                    </li>
                  ))}
                </ul>
                {result.retryText && (
                  <p className="px-3.5 pb-3 text-[12.5px] text-ecrn-secondary">The lines that need fixing are back in the box above. Fix them and add again.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

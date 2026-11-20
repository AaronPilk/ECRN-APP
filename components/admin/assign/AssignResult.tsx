import { Notice } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/FormMessage";

const OUTCOMES: Record<string, { tone: "green" | "amber"; text: string }> = {
  ok: { tone: "green", text: "Assignment saved." },
  cleared: { tone: "green", text: "Assignment cleared. They are back in the queue." },
  no_manager: {
    tone: "amber",
    text: "Saved, but that recruiter has no account manager yet, so this still needs an owner.",
  },
};

/**
 * Feedback after <AssignControl /> saves. Pass the page's `?assigned=` and
 * `?error=` search params straight in.
 */
export function AssignResult({ assigned, error }: { assigned?: string; error?: string }) {
  const outcome = assigned ? OUTCOMES[assigned] : undefined;
  if (!outcome && !error) return null;
  return (
    <>
      {error && <FormMessage error={error} />}
      {outcome && <Notice tone={outcome.tone}>{outcome.text}</Notice>}
    </>
  );
}

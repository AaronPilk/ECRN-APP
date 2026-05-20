"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InviteLinkProps {
  inviteUrl: string;
}

/**
 * Sharable ambassador invite link with a one-tap copy button and
 * a native Share Sheet fallback on mobile.
 */
export function InviteLink({ inviteUrl }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // older browsers — fall back to a manual select
      const range = document.createRange();
      const el = document.getElementById("ecrn-invite-input");
      if (el) {
        range.selectNode(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Join me on ECRN",
          text: "Your network in construction has value. Join ECRN and start referring talent.",
          url: inviteUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <code
          id="ecrn-invite-input"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-ecrn-ink font-mono truncate"
        >
          {inviteUrl}
        </code>
        <Button
          type="button"
          variant={copied ? "primary" : "secondary"}
          size="md"
          onClick={copy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </Button>
      </div>
      <Button type="button" variant="dark" size="md" fullWidth onClick={share}>
        <Share2 className="w-4 h-4" /> Share invite
      </Button>
      <p className="text-xs text-slate-500 leading-relaxed">
        Anyone who signs up through your link gets attributed back to you — once they start
        referring, you&apos;ll see their activity reflected in your network growth.
      </p>
    </div>
  );
}

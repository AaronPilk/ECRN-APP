"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Small "copy to clipboard" control for URLs and header names. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked: the text is still selectable */
        }
      }}
      className="inline-flex items-center gap-1 h-7 px-2 rounded-[8px] border border-ecrn-line bg-white text-[12px] font-medium text-ecrn-secondary hover:text-ecrn-ink shrink-0"
      aria-label={`${label} to clipboard`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-ecrn-green-text" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

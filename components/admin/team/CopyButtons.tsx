"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { cn } from "@/lib/utils/cn";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure pages: fall back to a hidden text box.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

const buttonClass =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-[12px] border text-sm font-medium whitespace-nowrap transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ecrn-green focus-visible:ring-offset-2";

/** "Copy link", "Copy code" and "Print" for a team member's sign-up link. */
export function CopyButtons({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState<"link" | "code" | "failed" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = async (what: "link" | "code") => {
    const ok = await copyText(what === "link" ? link : code);
    setCopied(ok ? what : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy("link")}
          className={cn(buttonClass, "bg-ecrn-green-text text-white border-ecrn-green-text hover:brightness-110")}
        >
          {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === "link" ? "Link copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={() => copy("code")}
          className={cn(buttonClass, "bg-white text-ecrn-ink border-ecrn-line hover:bg-ecrn-paper")}
        >
          {copied === "code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === "code" ? "Code copied" : "Copy code"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className={cn(buttonClass, "bg-white text-ecrn-ink border-ecrn-line hover:bg-ecrn-paper")}
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
      <p className="mt-2 min-h-[18px] text-[12.5px] text-red-700" role="status" aria-live="polite">
        {copied === "failed" ? "Couldn't copy. Select the text and copy it by hand." : ""}
      </p>
    </div>
  );
}

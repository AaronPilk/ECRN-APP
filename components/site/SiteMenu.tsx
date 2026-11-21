"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { DELTA, PoweredByDelta } from "./Delta";
import { SiteLogo } from "./SiteLogo";
import { isCurrentPath, type NavItem } from "./SiteNav";
import { siteVars } from "./motion/vars";

const MORE: NavItem[] = [
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/glossary", label: "Glossary" },
  { href: "/support", label: "Support" },
];

/** How long the sheet takes to leave (matches the exit transition in site.css). */
const EXIT_MS = 230;

/**
 * Menu for phones and tablets: a full-height sheet from the right edge.
 * It is a modal <dialog>, so focus is trapped, Escape closes it and the page
 * behind is inert without any extra code. Enter and exit are CSS transitions
 * (interruptible); leaving is quicker than arriving.
 */
export function SiteMenu({ items, signedIn }: { items: NavItem[]; signedIn: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timer = useRef(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const finish = useCallback(() => {
    window.clearTimeout(timer.current);
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    document.documentElement.style.overflow = "";
  }, []);

  const show = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    window.clearTimeout(timer.current);
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    // Read layout once so the closed state is committed and the change below transitions.
    void dialog.offsetWidth;
    dialog.dataset.state = "open";
    setOpen(true);
  }, []);

  const hide = useCallback(
    (instant = false) => {
      const dialog = dialogRef.current;
      if (!dialog?.open) return;
      delete dialog.dataset.state;
      setOpen(false);
      window.clearTimeout(timer.current);
      if (instant) finish();
      else timer.current = window.setTimeout(finish, EXIT_MS);
    },
    [finish]
  );

  // A navigation always closes the sheet.
  useEffect(() => {
    hide(true);
  }, [pathname, hide]);

  useEffect(() => finish, [finish]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={show}
        className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full text-white transition-transform duration-150 ease-out active:scale-90"
      >
        <Menu aria-hidden className="h-6 w-6" strokeWidth={1.75} />
      </button>

      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-label="Menu"
        className="site-menu"
        onCancel={(e) => {
          e.preventDefault();
          hide();
        }}
        onClose={() => {
          setOpen(false);
          document.documentElement.style.overflow = "";
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) hide();
        }}
      >
        <div className="site-menu-panel">
          <div className="flex h-[var(--site-header-h)] shrink-0 items-center justify-between pl-4 pr-4 pt-[env(safe-area-inset-top)] sm:pl-7 sm:pr-8" style={{ boxSizing: "content-box" }}>
            <Link href="/" aria-label="ECRN home" onClick={() => hide()} className="flex h-11 items-center">
              <SiteLogo />
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => hide()}
              className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full text-white transition-transform duration-150 ease-out active:scale-90"
            >
              <X aria-hidden className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>

          <nav aria-label="Menu" className="px-4 pt-3 sm:px-7">
            <ul>
              {items.map((n, i) => (
                <li key={n.href} className="site-menu-item" style={siteVars({ i })}>
                  <Link href={n.href} onClick={() => hide()} aria-current={isCurrentPath(pathname, n.href) ? "page" : undefined} className="site-menu-link">
                    {n.label}
                    <ChevronRight aria-hidden className="h-5 w-5" />
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="site-menu-item mt-5 flex flex-wrap gap-x-6" style={siteVars({ i: items.length })}>
              {MORE.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => hide()} className="inline-flex min-h-[44px] items-center font-display text-[15px] text-white/[0.78] active:opacity-60">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-menu-item mt-auto px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-8 sm:px-7" style={siteVars({ i: items.length + 1 })}>
            <div className="rounded-[18px] bg-white/[0.05] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <PoweredByDelta variant="lockup" href="/about" />
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/[0.74]">
                A construction recruiting firm, recruiting since {DELTA.since}, with {DELTA.recruiters} recruiters working every referral.
              </p>
            </div>
            <div className="mt-4 grid gap-2.5">
              {signedIn ? (
                <Link href="/start" onClick={() => hide()} className="site-btn site-btn-primary flex">
                  Open dashboard <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link href="/signup" onClick={() => hide()} className="site-btn site-btn-primary flex">
                    Sign up free <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                  <Link href="/login" onClick={() => hide()} className="site-btn site-btn-ghost flex">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

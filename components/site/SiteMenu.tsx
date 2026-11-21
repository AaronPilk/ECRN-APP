"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronRight, Menu, X } from "lucide-react";
import { CoBrandLockup, DELTA, DeltaLogo } from "./Delta";
import { isCurrentPath, type NavItem } from "./SiteNav";
import { siteVars } from "./motion/vars";

const MORE: NavItem[] = [
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About ECRN" },
  { href: "/glossary", label: "Glossary" },
  { href: "/support", label: "Support" },
];

/** How long the sheet takes to leave (matches the exit transition in site.css). */
const EXIT_MS = 230;

/**
 * Menu for phones and tablets: a sheet that covers the screen on phones (a
 * side sheet from 420 px). Its top bar repeats the header exactly, lockup
 * and all, with the close button where the menu button was, so nothing
 * jumps when it opens. Below: every page as a large row, Delta's card with
 * one line and a link to its site, and the account actions pinned to the
 * bottom edge within thumb reach (above the iOS home bar).
 *
 * It is a modal <dialog>: focus is trapped, Escape closes it and the page
 * behind is inert without extra code. Enter and exit are CSS transitions
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

  const stagger = (i: number) => siteVars({ i });

  return (
    <div className="xl:hidden">
      <button type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="site-menu" onClick={show} className="site-menu-btn">
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
          // The backdrop is the dialog itself; any link inside closes the sheet too
          // (a link to the page you are on would not change the pathname).
          if (e.target === e.currentTarget || (e.target as Element).closest("a")) hide();
        }}
      >
        <div className="site-menu-panel">
          <div className="site-menu-top">
            <CoBrandLockup ecrnHref="/" deltaHref="/about" />
            <button type="button" aria-label="Close menu" onClick={() => hide()} className="site-menu-btn">
              <X aria-hidden className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>

          <div className="site-menu-scroll">
            <nav aria-label="Site">
              <ul>
                {items.map((n, i) => (
                  <li key={n.href} className="site-menu-item" style={stagger(i)}>
                    <Link href={n.href} aria-current={isCurrentPath(pathname, n.href) ? "page" : undefined} className="site-menu-link">
                      {n.label}
                      <ChevronRight aria-hidden className="h-5 w-5" />
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="site-menu-item site-menu-more" style={stagger(items.length)}>
                {MORE.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={isCurrentPath(pathname, n.href) ? "page" : undefined} className="site-menu-more-link">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section aria-label="Who is behind ECRN" className="site-menu-item site-menu-delta" style={stagger(items.length + 1)}>
              <p className="font-display text-[13px] font-medium text-white/[0.66]">ECRN is an initiative of</p>
              <DeltaLogo size={30} className="mt-3" />
              <p className="mt-4 text-[15px] leading-[1.55] text-white/[0.8]">
                Construction recruiting since {DELTA.since}, with {DELTA.recruiters} recruiters and national contractor relationships.
              </p>
              <a href={DELTA.url} target="_blank" rel="noopener" className="site-menu-delta-link">
                {DELTA.domain}
                <span className="sr-only"> (opens in a new tab)</span>
                <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />
              </a>
            </section>
          </div>

          <div className="site-menu-actions">
            {signedIn ? (
              <Link href="/start" className="site-btn site-btn-primary flex">
                Open dashboard <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="site-btn site-btn-ghost flex">
                  Log in
                </Link>
                <Link href="/signup" className="site-btn site-btn-primary flex">
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

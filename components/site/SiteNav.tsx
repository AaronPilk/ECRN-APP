"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cssScrollDriven, subscribeScroll } from "./motion/scroll";

export interface NavItem {
  href: string;
  label: string;
}

export function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop navigation (xl and up). Marks the section the visitor is in. */
export function SiteNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
      {items.map((n) => (
        <Link key={n.href} href={n.href} aria-current={isCurrentPath(pathname, n.href) ? "page" : undefined} className="site-nav-link inline-flex">
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Header glass on scroll, for browsers without CSS scroll timelines (where
 * they exist, site.css does this with no JavaScript). Marks the header with
 * data-js, then toggles data-scrolled from the shared scroll controller.
 * Renders nothing visible.
 */
export function HeaderState() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = ref.current?.closest("header");
    if (!header || cssScrollDriven()) return;

    let scrolled = window.scrollY > 12;
    let next = scrolled;
    header.toggleAttribute("data-scrolled", scrolled);
    header.dataset.js = "";
    const stop = subscribeScroll(
      header,
      {
        read(_vh, scrollY) {
          next = scrollY > 12;
        },
        write() {
          if (next === scrolled) return;
          scrolled = next;
          header.toggleAttribute("data-scrolled", scrolled);
        },
      },
      true
    );

    return () => {
      stop();
      delete header.dataset.js;
      header.removeAttribute("data-scrolled");
    };
  }, []);

  return <span ref={ref} hidden />;
}

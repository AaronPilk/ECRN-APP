"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "./nav-config";
import { iconMap } from "./icon-map";

interface MobileNavProps {
  items: NavItem[];
}

/** Rev 03 tab bar: green pill behind the active icon, deep-green label. */
export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  // Longest matching href wins (so /candidate/jobs doesn't also light up /candidate).
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ecrn-line pb-safe"
    >
      <ul
        className={cn(
          "items-center px-1 pt-1.5",
          // Admin has many sections: scroll sideways on phones instead of squeezing.
          items.length > 5 ? "flex overflow-x-auto [&>li]:shrink-0 [&>li]:w-[76px]" : "grid grid-flow-col auto-cols-fr"
        )}
      >
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 min-h-[48px]",
                  "text-[10.5px] font-medium transition-colors",
                  active ? "text-ecrn-green-text font-semibold" : "text-ecrn-secondary"
                )}
              >
                <TabContent item={item} active={active} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabContent({ item, active }: { item: NavItem; active: boolean }) {
  const { pending } = useLinkStatus();
  const Icon = iconMap[item.icon];
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "h-[26px] w-[44px] rounded-full grid place-items-center transition-colors",
          (active || pending) && "bg-ecrn-selected"
        )}
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ecrn-green-text border-t-transparent" />
        ) : (
          <Icon className={cn("w-[19px] h-[19px]", active ? "stroke-[2.1]" : "stroke-[1.7]")} />
        )}
      </span>
      <span>{item.label}</span>
      {pending && <span className="sr-only" role="status">Loading {item.label}…</span>}
    </>
  );
}

"use client";

import Link from "next/link";
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
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-ecrn-line pb-safe"
    >
      <ul className="grid grid-flow-col auto-cols-fr items-center px-1 pt-1.5">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
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
                <span
                  className={cn(
                    "h-[26px] w-[44px] rounded-full grid place-items-center transition-colors",
                    active && "bg-ecrn-selected"
                  )}
                >
                  <Icon className={cn("w-[19px] h-[19px]", active ? "stroke-[2.1]" : "stroke-[1.7]")} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

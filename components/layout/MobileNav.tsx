"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "./nav-config";

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "lg:hidden fixed bottom-0 inset-x-0 z-40",
        "glass border-t border-slate-200/60",
        "pb-safe"
      )}
    >
      <ul className="grid grid-flow-col auto-cols-fr items-center px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl mx-1",
                  "text-[10px] font-medium tracking-tight transition-colors",
                  active ? "text-ecrn-ink" : "text-slate-500 hover:text-ecrn-ink"
                )}
              >
                <Icon
                  className={cn(
                    "w-[22px] h-[22px]",
                    active && "stroke-[2.2]"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

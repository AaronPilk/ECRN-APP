"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/Logo";
import type { NavItem } from "./nav-config";
import { iconMap } from "./icon-map";

interface SidebarProps {
  items: NavItem[];
  user?: { firstName: string | null; lastName: string | null; email: string; role: string };
}

/** Desktop sidebar. Admin items are grouped under section headings. */
export function Sidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();
  // Longest matching href wins, so "/admin" doesn't light up on every admin page.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isAdmin = user?.role === "admin";

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-ecrn-line bg-white sticky top-0 h-screen">
      <div className="h-16 px-5 flex items-center justify-between border-b border-ecrn-line">
        <Link href={isAdmin ? "/admin" : "/dashboard"}>
          <Logo />
        </Link>
        {isAdmin && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cobalt">Admin</span>}
      </div>
      <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Primary">
        <ul className="space-y-0.5">
          {items.map((item, i) => {
            const Icon = iconMap[item.icon];
            const active = item.href === activeHref;
            const heading = item.section && item.section !== items[i - 1]?.section ? item.section : null;
            return (
              <li key={item.href}>
                {heading && <p className={cn("px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ecrn-secondary/80", i > 0 ? "pt-4" : "pt-1")}>{heading}</p>}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] font-medium transition-colors",
                    active ? "bg-ecrn-selected text-ecrn-green-text" : "text-ecrn-secondary hover:bg-ecrn-paper hover:text-ecrn-ink"
                  )}
                >
                  <Icon className="w-[17px] h-[17px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {user && (
        <div className="p-3 border-t border-ecrn-line">
          <Link href={isAdmin ? "/admin/settings" : "/profile"} className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-ecrn-paper transition-colors">
            <div className="w-9 h-9 rounded-full bg-ecrn-carbon text-white flex items-center justify-center text-[12px] font-semibold">
              {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ecrn-ink truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-ecrn-secondary truncate">{user.email}</div>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

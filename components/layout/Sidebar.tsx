"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/Logo";
import type { NavItem } from "./nav-config";

interface SidebarProps {
  items: NavItem[];
  user?: { firstName: string | null; lastName: string | null; email: string; role: string };
}

export function Sidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/70 bg-white">
      <div className="h-16 px-5 flex items-center border-b border-slate-200/70">
        <Logo />
      </div>
      <nav className="flex-1 p-3 overflow-y-auto" aria-label="Primary">
        <ul className="space-y-1">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                    active
                      ? "bg-ecrn-black text-white shadow-soft"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ecrn-ink"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {user && (
        <div className="p-3 border-t border-slate-200/70">
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-ecrn-black text-white flex items-center justify-center text-sm font-semibold">
              {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ecrn-ink truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

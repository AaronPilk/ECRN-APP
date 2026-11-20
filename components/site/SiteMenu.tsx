"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

/** Mobile menu for the public site. */
export function SiteMenu({ items, signedIn }: { items: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-11 h-11 -mr-2 grid place-items-center text-white"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 z-50 bg-ecrn-black border-t border-white/10 px-5 py-4 shadow-pass">
          <ul className="space-y-1">
            {items.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-3 text-[17px] text-white/90">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={signedIn ? "/start" : "/login"} onClick={() => setOpen(false)} className="block py-3 text-[17px] text-white/90">
                {signedIn ? "Open dashboard" : "Log in"}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

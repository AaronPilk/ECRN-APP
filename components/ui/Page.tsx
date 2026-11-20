import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Page wrapper with rev 03 gutters (22px on phones). */
export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn("mx-auto px-[22px] sm:px-6 pt-5 pb-8 space-y-6", wide ? "max-w-5xl" : "max-w-3xl", className)}>
      {children}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      {eyebrow && <p className="t-eyebrow mb-2">{eyebrow}</p>}
      <h1 className="t-page">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] text-ecrn-secondary">{subtitle}</p>}
      {children}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[14px] font-medium text-ecrn-green-text -ml-1 py-1">
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel,
  meta,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="t-section">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 rounded-full bg-ecrn-action-surface text-ecrn-green-text text-[13px] font-medium px-3 py-1"
        >
          {linkLabel ?? "View all"}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
      {meta && <span className="t-eyebrow">{meta}</span>}
    </div>
  );
}

/** Big dark earnings card with the illuminated conduit art. */
export function EarningsPass({
  label,
  amount,
  status,
  stats,
}: {
  label: string;
  amount: string;
  status?: string;
  stats?: { label: string; value: string | number }[];
}) {
  return (
    <div className="earnings-pass">
      <div className="relative px-5 pt-5 pb-6 min-h-[128px]">
        <Image
          src="/brand/ecrn-conduit.jpg"
          alt=""
          fill
          sizes="400px"
          className="object-cover object-right opacity-90 [mask-image:linear-gradient(90deg,transparent_10%,black_60%)]"
          priority
        />
        <div className="relative">
          <div className="text-[14px] text-white/85">{label}</div>
          <div className="t-money mt-1 text-[52px] leading-none font-medium text-ecrn-reward-dark">{amount}</div>
          {status && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FB6FF]" />
              {status}
            </div>
          )}
        </div>
      </div>
      {stats && stats.length > 0 && (
        <div className="relative reward-panel grid grid-flow-col auto-cols-fr divide-x divide-white/20 px-2 py-3">
          {stats.map((s) => (
            <div key={s.label} className="px-3">
              <div className="t-money text-[20px] font-medium text-white">{s.value}</div>
              <div className="text-[11.5px] text-white/75">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Dark navy/cobalt panel (lifetime rewards, application activity). */
export function NavyPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-[22px] text-white p-5 shadow-pass", className)}
      style={{ background: "linear-gradient(120deg, #00244B 0%, #063889 60%, #0655CE 100%)" }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="group-surface p-6 text-center">
      <p className="font-display text-[17px] font-semibold text-ecrn-ink">{title}</p>
      {body && <p className="mt-1 text-[14px] text-ecrn-secondary">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

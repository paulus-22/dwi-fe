import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Small shared pieces for the dashboard. Server-safe (no hooks). */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-panel-border bg-panel p-5 ${className}`}>
      {children}
    </section>
  );
}

export function PageTitle({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? <p className="text-xs tracking-[0.18em] text-admin-muted uppercase">{kicker}</p> : null}
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

type Variant = "primary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-admin-ink text-white hover:bg-black",
  ghost: "border border-panel-border bg-panel hover:bg-panel-hover",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-panel-border bg-panel p-4">
      <p className="text-xs tracking-wide text-admin-muted uppercase">{label}</p>
      <p className="mt-1 text-3xl font-medium tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-sm text-admin-muted">{sub}</p> : null}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  const cls =
    tone === "error" ? "border-danger/30 bg-danger-soft text-danger" : "border-gold-line bg-gold-soft text-gold-strong";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-[var(--radius-control)] border px-3 py-2 text-sm ${cls}`}>
      {children}
    </p>
  );
}

const TIME = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
const DATETIME = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export const formatTime = (iso: string) => TIME.format(new Date(iso));
export const formatDateTime = (iso: string) => DATETIME.format(new Date(iso));

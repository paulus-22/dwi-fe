import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

/** Small shared pieces for the dashboard. Server-safe (no hooks). */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-panel-border bg-panel p-5 shadow-[0_1px_2px_rgb(16_24_40/0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function PageTitle({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? <p className="text-xs font-medium tracking-wide text-admin-faint uppercase">{kicker}</p> : null}
        <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

/** One shared form-control style (inputs, selects, textareas). */
export const inputCls =
  "h-10 w-full rounded-[var(--radius-control)] border border-panel-border bg-white px-3 text-sm text-admin-ink shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-colors outline-none placeholder:text-admin-faint hover:border-[#cfd4dc] focus:border-accent focus:ring-3 focus:ring-accent/15 disabled:opacity-50";
export const textareaCls = `${inputCls} h-auto py-2`;

/** Button hierarchy: primary (accent) / secondary / ghost / danger. */
type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-[0_1px_2px_rgb(16_24_40/0.12)] hover:bg-accent-strong",
  secondary: "border border-panel-border bg-white text-admin-ink shadow-[0_1px_2px_rgb(16_24_40/0.04)] hover:bg-panel-hover",
  ghost: "text-admin-muted hover:bg-panel-hover hover:text-admin-ink",
  danger: "border border-danger/30 bg-white text-danger hover:bg-danger-soft",
};
const BUTTON_BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50";

export const buttonCls = (variant: Variant = "primary", className = "") =>
  `${BUTTON_BASE} ${VARIANTS[variant]} ${className}`;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={buttonCls(variant, className)} />;
}

/** A link that looks like a Button. */
export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={buttonCls(variant, className)} />;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-panel-border bg-panel p-4 shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
      <p className="text-xs font-medium tracking-wide text-admin-faint uppercase">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-sm text-admin-muted">{sub}</p> : null}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  const cls =
    tone === "error" ? "border-danger/30 bg-danger-soft text-danger" : "border-accent-line bg-accent-soft text-accent-strong";
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

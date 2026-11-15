import type { ButtonHTMLAttributes, ReactNode } from "react";

import { useApp } from "../state";

type Tone = "primary" | "ghost" | "ok" | "warn" | "bad" | "quiet";

const tones: Record<Tone, string> = {
  primary: "bg-peach text-peach-ink active:bg-peach-deep",
  ok: "bg-ok text-ok-deep active:brightness-90",
  warn: "bg-warn text-warn-deep active:brightness-90",
  bad: "bg-bad text-cream active:brightness-90",
  ghost: "border border-edge text-cream active:bg-panel-2",
  quiet: "text-cream-dim active:text-cream",
};

export function Button({
  tone = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 text-[length:calc(17px*var(--fs))] font-medium tracking-wide transition disabled:opacity-40 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SyncPill() {
  const { sync } = useApp();
  const label = !sync.online
    ? `Offline · ${sync.pending} antre`
    : sync.syncing
      ? "Sinkron…"
      : sync.pending > 0
        ? `${sync.pending} antre`
        : "Tersinkron";
  const dot = !sync.online ? "bg-warn" : sync.pending > 0 || sync.syncing ? "bg-peach" : "bg-ok";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1.5 text-[length:calc(12px*var(--fs))] text-cream-dim">
      <span className={`size-2 rounded-full ${dot} ${sync.syncing ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

export function Header({ title, right }: { title?: ReactNode; right?: ReactNode }) {
  const { pairing } = useApp();
  return (
    <header className="safe-top flex items-center justify-between gap-3 px-5 pb-3">
      <div className="min-w-0">
        <p className="kicker truncate text-peach">{pairing?.deviceName ?? "Scanner"}</p>
        <h1 className="truncate font-display text-[length:calc(28px*var(--fs))] leading-tight text-cream">
          {title ?? pairing?.event.coupleLine}
        </h1>
      </div>
      {right ?? <SyncPill />}
    </header>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[length:calc(12px*var(--fs))] tracking-wide ${className}`}>
      {children}
    </span>
  );
}

export function Icon({ name, className = "size-6" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

type IconName =
  | "scan" | "users" | "image" | "menu" | "check" | "x" | "alert" | "camera" | "keyboard"
  | "gift" | "pen" | "chevron" | "back" | "flip" | "tv" | "qr" | "refresh" | "wifi-off" | "up" | "down";

const paths: Record<IconName, ReactNode> = {
  scan: (<><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></>),
  users: (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4" /></>),
  image: (<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 19" /></>),
  menu: (<><path d="M4 7h16M4 12h16M4 17h10" /></>),
  check: (<path d="m5 12.5 4.2 4.2L19 7" />),
  x: (<path d="M6 6l12 12M18 6 6 18" />),
  alert: (<><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.2M12 17.2v.1" /></>),
  camera: (<><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" /><circle cx="12" cy="12.5" r="3.4" /></>),
  keyboard: (<><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></>),
  gift: (<><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9c-1.5-3-5-4-5-1.5S10 9 12 9Zm0 0c1.5-3 5-4 5-1.5S14 9 12 9Z" /></>),
  pen: (<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>),
  chevron: (<path d="m9 6 6 6-6 6" />),
  back: (<path d="m15 6-6 6 6 6" />),
  flip: (<><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5" /></>),
  tv: (<><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></>),
  qr: (<><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2" /></>),
  refresh: (<><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" /></>),
  "wifi-off": (<><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.2-2.6M10 6.1A15 15 0 0 1 22 9.5" /><path d="M12 20h.01" /></>),
  up: (<path d="m6 15 6-6 6 6" />),
  down: (<path d="m6 9 6 6 6-6" />),
};

"use client";

import { useSyncExternalStore } from "react";

import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Countdown for GENERIC events, styled by `--g-*` vars and `shape`:
 * sharp = hairline-divided serif numerals (corporate-classic),
 * soft = four rounded boxes inside a dark card (corporate-soft),
 * editorial = big bold sans digits between thin vertical rules.
 * Same tick/hydration approach as the wedding countdown, which is untouched.
 */

const tickEverySecond = (onTick: () => void) => {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
};
const currentSecond = () => Math.floor(Date.now() / 1000);
const noServerSnapshot = () => null;

export function GenericCountdown({ targetIso, dict, shape }: { targetIso: string; dict: Dictionary; shape: "sharp" | "soft" | "editorial" }) {
  const tick = useSyncExternalStore(tickEverySecond, currentSecond, noServerSnapshot);
  if (tick === null) return <div className="h-[84px]" aria-hidden="true" />;

  const diff = Math.floor(new Date(targetIso).getTime() / 1000) - tick;
  if (diff <= 0) return <p className={`text-center opacity-80 ${shape === "editorial" ? "" : "gt-serif italic"}`}>{dict.countdown.passed}</p>;

  const cells: Array<[number, string]> = [
    [Math.floor(diff / 86400), dict.countdown.days],
    [Math.floor((diff % 86400) / 3600), dict.countdown.hours],
    [Math.floor((diff % 3600) / 60), dict.countdown.minutes],
    [diff % 60, dict.countdown.seconds],
  ];
  const soft = shape === "soft";

  if (shape === "editorial") {
    return (
      <div role="timer" aria-live="off" className="grid grid-cols-4 border-y border-[var(--g-line)]">
        {cells.map(([value, label], i) => (
          <div key={label} className={`px-1 py-6 sm:px-6 sm:py-8 ${i > 0 ? "border-l border-[var(--g-line)]" : ""}`}>
            <div className="text-[clamp(30px,8vw,64px)] leading-none font-bold tracking-[-0.03em] text-[var(--g-navy)] tabular-nums">
              {String(value).padStart(2, "0")}
            </div>
            <div className="gt-mono mt-3 !text-[9px] text-[var(--g-muted)] sm:!text-[11px]">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="timer" aria-live="off" className={`grid grid-cols-4 ${soft ? "gap-[7px]" : "gap-2"}`}>
      {cells.map(([value, label], i) => (
        <div
          key={label}
          className={
            soft ? "rounded-[9px] border border-white/[0.16] px-0.5 py-2.5" : `px-[3px] py-3 ${i < 3 ? "border-r border-[#d4cdbf]" : ""}`
          }
        >
          <div className={`gt-serif tabular-nums ${soft ? "text-[25px] text-[var(--g-gold)]" : "text-[30px] text-[var(--g-navy)]"}`}>
            {String(value).padStart(2, "0")}
          </div>
          <div className={soft ? "text-[10px] text-white/90" : "mt-1 text-[8px] tracking-[0.16em] text-[#7d7b75] uppercase"}>{label}</div>
        </div>
      ))}
    </div>
  );
}

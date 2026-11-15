"use client";

import { useSyncExternalStore } from "react";

import type { Dictionary } from "@/i18n/dictionaries";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remainingUntil(target: number): Remaining | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

function subscribeToTick(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

const currentSecond = () => Math.floor(Date.now() / 1000);
// The server has no meaningful "now" for a countdown — rendering nothing
// server-side is what keeps hydration consistent.
const noServerSnapshot = () => null;

export function Countdown({
  targetIso,
  dict,
  tone = "olive",
}: {
  targetIso: string;
  dict: Dictionary;
  tone?: "olive" | "paper";
}) {
  const tick = useSyncExternalStore(subscribeToTick, currentSecond, noServerSnapshot);

  if (tick === null) return <div className="h-[92px]" aria-hidden="true" />;

  const remaining = remainingUntil(new Date(targetIso).getTime());
  const onOlive = tone === "olive";

  if (!remaining) {
    return (
      <p
        className={`text-center font-body text-[16px] italic ${
          onOlive ? "text-cream/80" : "text-ink-soft"
        }`}
      >
        {dict.countdown.passed}
      </p>
    );
  }

  const cells: Array<[number, string]> = [
    [remaining.days, dict.countdown.days],
    [remaining.hours, dict.countdown.hours],
    [remaining.minutes, dict.countdown.minutes],
    [remaining.seconds, dict.countdown.seconds],
  ];

  // Large serif numerals separated by hairlines — the spec rules out
  // digital-clock styling, so there are no boxes or pills here.
  return (
    <div className="flex items-start justify-center" role="timer" aria-live="off">
      {cells.map(([value, label], index) => (
        <div key={label} className="flex items-start">
          {index > 0 ? (
            <span
              className={`mx-1 mt-3 block h-10 w-px sm:mx-2 ${
                onOlive ? "bg-cream/20" : "bg-champagne"
              }`}
            />
          ) : null}
          <div className="w-[76px] text-center sm:w-[84px]">
            <span
              className={`display block text-[44px] leading-none tabular-nums sm:text-[52px] ${
                onOlive ? "text-cream" : "text-ink"
              }`}
            >
              {String(value).padStart(2, "0")}
            </span>
            <span
              className={`kicker mt-3 block ${onOlive ? "text-cream/70" : "text-ink-soft"}`}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

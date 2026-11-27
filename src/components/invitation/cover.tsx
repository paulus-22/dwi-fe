"use client";

import Link from "next/link";

import type { OrnamentSet } from "@/components/motif";

/**
 * The opening cover: a deep-olive envelope with the invitation card rising out
 * of it. Everything is CSS/SVG — the card, the flap, and the pocket are shapes,
 * not images, so they re-theme with the tokens.
 */
export function Cover({
  brideName,
  groomName,
  hashtag,
  dateLabel,
  guestName,
  greeting,
  salutation,
  kicker,
  openLabel,
  voucherHref,
  voucherLabel,
  opening,
  onOpen,
  ornaments,
}: {
  brideName: string;
  groomName: string;
  hashtag: string | null;
  dateLabel: string;
  guestName: string | null;
  greeting: string;
  salutation: string;
  kicker: string;
  openLabel: string;
  voucherHref?: string | null;
  voucherLabel?: string;
  opening: boolean;
  onOpen: () => void;
  ornaments: OrnamentSet;
}) {
  const { Backdrop, Crest, Spray } = ornaments;
  return (
    <div className="relative isolate flex h-dvh flex-col items-center justify-center overflow-hidden bg-olive-deep px-6">
      <Backdrop tone="olive" />
      {/* Corner foliage, tucked behind the envelope. */}
      <Spray
        className="float-slow pointer-events-none absolute -left-14 -top-6 opacity-80"
        width={185}
        height={250}
      />
      <Spray
        className="float-slower pointer-events-none absolute -right-14 -bottom-8 rotate-180 opacity-80"
        width={185}
        height={250}
        mirrored
      />

      <div
        className={`relative w-full max-w-[320px] transition-all duration-[1500ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          opening ? "-translate-y-10 scale-[1.06] opacity-0" : ""
        }`}
        style={{ transitionDelay: opening ? "700ms" : "0ms" }}
      >
        {/* The card, rising out of the envelope pocket. */}
        <div
          className="relative z-10 mx-auto w-[86%] bg-cream px-6 pb-16 pt-10 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{
            animation: "cover-card-rise 1600ms cubic-bezier(0.22,0.61,0.36,1) both 300ms",
            // Once the flap is out of the way the card draws itself upward.
            transform: opening ? "translateY(-13%)" : undefined,
            transitionDelay: opening ? "420ms" : "0ms",
          }}
        >
          <div className="flex justify-center">
            <Crest width={180} height={70} />
          </div>

          <p className="kicker mt-2 text-ink-soft">{kicker}</p>

          <p className="display names mt-4 [--names-size:38px] text-names-ink">{brideName}</p>
          <p className="my-1 font-body text-[15px] italic text-peach-ink">&amp;</p>
          <p className="display names [--names-size:38px] text-names-ink">{groomName}</p>

          <span className="mx-auto mt-5 block h-px w-12 bg-champagne" />
          <p className="mt-5 font-ui text-[11px] tracking-[0.24em] text-ink-soft">
            {dateLabel}
          </p>

          {hashtag ? (
            <p className="mt-3 font-body text-[13px] text-peach-ink">{hashtag}</p>
          ) : null}
        </div>

        {/*
          Envelope pocket. The back, the front panel and the flap are separate
          layers so the flap can rotate open about its top edge while the card
          slides up between the back and the front.
        */}
        <div className="relative z-20 -mt-10" style={{ perspective: "1100px" }}>
          {/* Back panel — always behind the card. */}
          <svg viewBox="0 0 320 190" className="block w-full" aria-hidden="true">
            <path d="M0,0 H320 V190 H0 Z" fill="var(--color-envelope-back)" />
          </svg>

          {/* Front panel — in front of the card, so the card appears to sit inside. */}
          <svg
            viewBox="0 0 320 190"
            className="absolute inset-0 z-20 block w-full"
            aria-hidden="true"
          >
            <path d="M0,190 L160,86 L320,190 Z" fill="var(--color-envelope-front)" />
            <path d="M0,190 L160,86 L320,190" fill="none" stroke="var(--color-envelope-edge)" strokeWidth="1" />
          </svg>

          {/* Flap — hinged along the top edge. */}
          <div
            className="absolute inset-0 z-30 origin-top transition-transform duration-[1100ms] ease-[cubic-bezier(0.33,0.9,0.4,1)]"
            style={{
              transform: opening ? "rotateX(-172deg)" : "rotateX(0deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <svg viewBox="0 0 320 190" className="block w-full" aria-hidden="true">
              <path d="M0,0 L160,112 L320,0 Z" fill="var(--color-olive-deep)" />
              <path d="M0,0 L160,112 L320,0" fill="none" stroke="var(--color-envelope-edge)" strokeWidth="1" />
            </svg>

            {/* Botanical seal, riding on the flap. */}
            <div
              className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
              style={{ opacity: opening ? 0 : 1 }}
            >
              <span className="flex size-16 items-center justify-center rounded-full border border-peach-line/40 bg-olive-deep/80">
                <Crest width={58} height={24} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Greeting and the open button. */}
      <div
        className={`relative z-40 mt-9 text-center transition-opacity duration-700 ${
          opening ? "opacity-0" : ""
        }`}
        style={{ animation: "cover-fade-in 900ms ease-out both 1200ms" }}
      >
        <p className="kicker text-cream/60">{salutation}</p>
        <p className="display mt-2 overflow-visible py-1 text-[24px] text-cream">
          {guestName ?? greeting}
        </p>

        <button
          type="button"
          onClick={onOpen}
          data-testid="open-invitation"
          className="mt-7 border border-champagne/70 px-9 py-3.5 font-ui text-[10px] uppercase tracking-[0.26em] text-cream transition-colors duration-300 hover:border-peach hover:bg-peach hover:text-peach-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
        >
          {openLabel}
        </button>

        {voucherHref && voucherLabel ? (
          <div className="relative z-40 mt-4">
            <Link
              href={voucherHref}
              className="inline-flex items-center gap-2 border border-peach/60 bg-peach px-5 py-2.5 font-ui text-[10px] uppercase tracking-[0.22em] text-peach-text transition-colors duration-300 hover:bg-transparent hover:text-peach"
            >
              <QrGlyph />
              {voucherLabel}
            </Link>
          </div>
        ) : null}

        {/* Quiet cue that there is more below once the envelope lifts. */}
        <span className="mx-auto mt-6 block h-8 w-px bg-gradient-to-b from-cream/40 to-transparent" />
      </div>
    </div>
  );
}

function QrGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5h2v2h-2zM12.5 9.5h2v2h-2zM9.5 12.5h2v2h-2zM12.5 12.5h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

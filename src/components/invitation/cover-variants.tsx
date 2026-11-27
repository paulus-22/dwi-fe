"use client";

import Link from "next/link";

import type { OrnamentSet } from "@/components/motif";

/**
 * Cover variants other than the envelope.
 *
 * Each takes the same props and owns its own opening gesture, because the way
 * an invitation opens is most of its first impression: an envelope is warm and
 * postal, an arch is formal and architectural, a card is quiet and modern.
 */

export type CoverVariantProps = {
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
};

/** Shared greeting + button block, so the variants stay consistent below the fold. */
function Greeting({
  salutation,
  guestName,
  greeting,
  openLabel,
  voucherHref,
  voucherLabel,
  opening,
  onOpen,
}: Pick<
  CoverVariantProps,
  "salutation" | "guestName" | "greeting" | "openLabel" | "voucherHref" | "voucherLabel" | "opening" | "onOpen"
>) {
  return (
    <div
      className={`relative z-40 mt-9 text-center transition-opacity duration-700 ${
        opening ? "opacity-0" : ""
      }`}
      style={{ animation: "cover-fade-in 900ms ease-out both 1000ms" }}
    >
      <p className="kicker text-cream/60">{salutation}</p>
      <p className="display mt-2 overflow-visible py-1 text-[24px] text-cream">{guestName ?? greeting}</p>

      <button
        type="button"
        onClick={onOpen}
        data-testid="open-invitation"
        className="mt-7 rounded-[--radius-control] border border-champagne/70 px-9 py-3.5 font-ui text-[10px] uppercase tracking-[0.26em] text-cream transition-colors duration-300 hover:border-peach hover:bg-peach hover:text-peach-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
      >
        {openLabel}
      </button>

      {voucherHref && voucherLabel ? (
        <div className="mt-4">
          <Link
            href={voucherHref}
            className="inline-flex items-center gap-2 rounded-[--radius-control] border border-peach/60 bg-peach px-5 py-2.5 font-ui text-[10px] uppercase tracking-[0.22em] text-peach-text transition-colors duration-300 hover:bg-transparent hover:text-peach"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="1.5" y="9.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9.5 9.5h2v2h-2zM12.5 9.5h2v2h-2zM9.5 12.5h2v2h-2zM12.5 12.5h2v2h-2z" fill="currentColor" />
            </svg>
            {voucherLabel}
          </Link>
        </div>
      ) : null}

      <span className="mx-auto mt-6 block h-8 w-px bg-gradient-to-b from-cream/40 to-transparent" />
    </div>
  );
}

/**
 * Arched window. The names sit inside a tall arch that lifts away on opening —
 * closer to a printed order of service than to a posted envelope.
 */
export function ArchCover(props: CoverVariantProps) {
  const { Backdrop, Crest, Spray } = props.ornaments;

  return (
    <div className="relative isolate flex h-dvh flex-col items-center justify-center overflow-hidden bg-olive-deep px-6">
      <Backdrop tone="olive" />
      <Spray
        className="float-slow pointer-events-none absolute -left-14 -top-6 opacity-70"
        width={185}
        height={250}
      />
      <Spray
        className="float-slower pointer-events-none absolute -right-14 -bottom-8 rotate-180 opacity-70"
        width={185}
        height={250}
        mirrored
      />

      <div
        className={`relative w-full max-w-[300px] transition-all duration-[1400ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          props.opening ? "-translate-y-8 scale-[1.04] opacity-0" : ""
        }`}
        style={{ animation: "cover-card-rise 1500ms cubic-bezier(0.22,0.61,0.36,1) both 200ms" }}
      >
        {/* The arch is a rounded-top rectangle, drawn rather than clipped so the
            border follows the curve. */}
        <div
          className="relative bg-cream px-7 pb-10 pt-14 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
          style={{ borderRadius: "150px 150px var(--radius-frame) var(--radius-frame)" }}
        >
          <span
            className="pointer-events-none absolute inset-3 border border-champagne"
            style={{ borderRadius: "138px 138px var(--radius-frame) var(--radius-frame)" }}
          />

          <div className="relative">
            <div className="flex justify-center">
              <Crest width={150} height={58} />
            </div>

            <p className="kicker mt-3 text-peach-ink">{props.kicker}</p>

            <p className="display names mt-5 [--names-size:36px] leading-tight text-names-ink">{props.brideName}</p>
            <p className="my-1 font-body text-[15px] italic text-peach-ink">&amp;</p>
            <p className="display names [--names-size:36px] leading-tight text-names-ink">{props.groomName}</p>

            <span className="mx-auto mt-5 block h-px w-12 bg-champagne" />
            <p className="mt-5 font-ui text-[11px] tracking-[0.24em] text-ink-soft">
              {props.dateLabel}
            </p>
            {props.hashtag ? (
              <p className="mt-3 font-body text-[13px] text-peach-ink">{props.hashtag}</p>
            ) : null}
          </div>
        </div>
      </div>

      <Greeting {...props} />
    </div>
  );
}

/**
 * Plain card. No frame, no envelope — the type does the work, which is the
 * point of the minimal themes.
 */
export function CardCover(props: CoverVariantProps) {
  const { Backdrop, Crest, Spray } = props.ornaments;

  return (
    <div className="relative isolate flex h-dvh flex-col items-center justify-center overflow-hidden bg-olive-deep px-8">
      <Backdrop tone="olive" />
      <Spray
        className="pointer-events-none absolute left-0 top-0 opacity-50"
        width={170}
        height={230}
      />
      <Spray
        className="pointer-events-none absolute bottom-0 right-0 rotate-180 opacity-50"
        width={170}
        height={230}
        mirrored
      />

      <div
        className={`relative w-full max-w-[320px] text-center transition-all duration-[1300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          props.opening ? "-translate-y-6 opacity-0" : ""
        }`}
        style={{ animation: "cover-fade-in 1100ms ease-out both 200ms" }}
      >
        <div className="flex justify-center">
          <Crest width={160} height={62} />
        </div>

        <p className="kicker mt-6 text-cream/60">{props.kicker}</p>

        <p className="display names mt-7 [--names-size:44px] leading-tight text-cream">{props.brideName}</p>
        <p className="my-2 font-body text-[16px] italic text-peach">&amp;</p>
        <p className="display names [--names-size:44px] leading-tight text-cream">{props.groomName}</p>

        <span className="mx-auto mt-8 block h-px w-16 bg-cream/30" />
        <p className="mt-6 font-ui text-[11px] tracking-[0.3em] text-cream/70">
          {props.dateLabel}
        </p>
        {props.hashtag ? (
          <p className="mt-4 font-ui text-[11px] tracking-[0.24em] text-peach">
            {props.hashtag}
          </p>
        ) : null}
      </div>

      <Greeting {...props} />
    </div>
  );
}

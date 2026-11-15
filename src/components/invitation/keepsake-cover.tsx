"use client";

import type { CoverVariantProps } from "./cover-variants";
import { NaturalPhoto } from "./natural-photo";
import { PhotoImage } from "./photo";

/**
 * Keepsake cover: an open envelope resting on a photograph.
 *
 * The couple's names sit over a full-bleed photo; below them an envelope has
 * already been opened, with a polaroid of the couple and a card addressed to
 * the guest tucked into the pocket, roses across the front and a wax seal
 * that is the way in. It is a sneak peek — the guest sees the couple before
 * opening anything — where the other covers keep everything sealed.
 *
 * Without a background photo it falls back to the theme's band and backdrop,
 * and without a portrait the card sits in the pocket alone, so an event with
 * no photos yet still opens on a finished design.
 */
export function KeepsakeCover(
  props: CoverVariantProps & { photoUrl: string | null; backgroundUrl: string | null },
) {
  const { Backdrop, Crest } = props.ornaments;
  const { opening, photoUrl, backgroundUrl } = props;
  const monogram = `${initial(props.brideName)}${initial(props.groomName)}`;

  return (
    <div
      className={`relative isolate flex h-dvh flex-col items-center overflow-hidden bg-olive-deep px-6 pb-7 pt-[max(3rem,9vh)] text-center transition-opacity duration-700 ${
        opening ? "opacity-0" : ""
      }`}
      // Hold the cover while the seal breaks and the photo lifts out.
      style={{ transitionDelay: opening ? "900ms" : "0ms" }}
    >
      {backgroundUrl ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <PhotoImage src={backgroundUrl} alt="" sizes="(max-width: 460px) 100vw, 460px" priority />
          {/*
            The scrim does two jobs: darkens the top so cream names read on any
            photo, and sinks the bottom into the band so the envelope sits on
            the theme's own colour rather than on whatever the photo has there.
          */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--color-olive-deep) 72%, transparent) 0%, color-mix(in srgb, var(--color-olive-deep) 25%, transparent) 34%, color-mix(in srgb, var(--color-olive-deep) 35%, transparent) 55%, var(--color-olive-deep) 88%)",
            }}
          />
        </div>
      ) : (
        <Backdrop tone="olive" />
      )}

      <div style={{ animation: "cover-fade-in 1000ms ease-out both 150ms" }}>
        <p className="kicker text-cream/80">{props.kicker}</p>
        <h1 className="mt-4 text-cream [text-shadow:0_2px_18px_rgba(0,0,0,0.35)] [text-wrap:balance]">
          <span className="display names [--names-size:40px]">
            {props.brideName}
            <span className="mx-2 font-body text-[0.5em] italic text-peach">&amp;</span>
            {props.groomName}
          </span>
        </h1>
        <p className="mt-4 font-ui text-[11px] tracking-[0.24em] text-cream/85">{props.dateLabel}</p>
      </div>

      {/* Read before the button, which only names its action. */}
      <p className="sr-only">
        {props.salutation} {props.guestName ?? props.greeting}
      </p>

      <button
        type="button"
        onClick={props.onOpen}
        data-testid="open-invitation"
        disabled={opening}
        aria-label={props.openLabel}
        className="group relative mt-auto w-full max-w-[330px] focus-visible:outline-none"
      >
        <Envelope
          opening={opening}
          photoUrl={photoUrl}
          guestName={props.guestName ?? props.greeting}
          salutation={props.salutation}
          monogram={monogram}
          Crest={Crest}
        />

        <span
          className="mt-5 inline-block border-b border-champagne/50 pb-1 font-ui text-[10px] uppercase tracking-[0.26em] text-cream transition-colors group-hover:border-peach group-hover:text-peach group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-champagne"
          style={{ animation: "cover-fade-in 900ms ease-out both 1300ms" }}
        >
          {props.openLabel}
        </span>
      </button>
    </div>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/*
 * The envelope, drawn on a 330 × 250 grid so every layer can be placed in the
 * same units. Back to front: flap standing open, envelope back, polaroid and
 * card (rising out of the pocket), the front pocket, roses, the seal.
 */
function Envelope({
  opening,
  photoUrl,
  guestName,
  salutation,
  monogram,
  Crest,
}: {
  opening: boolean;
  photoUrl: string | null;
  guestName: string;
  salutation: string;
  monogram: string;
  Crest: CoverVariantProps["ornaments"]["Crest"];
}) {
  const lift = "transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]";

  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: "330 / 250" }}>
      {/* Flap, open and standing up behind everything. */}
      <svg
        viewBox="0 0 330 92"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[2%] h-[34%] w-full"
        aria-hidden="true"
      >
        <path d="M0,92 L165,4 L330,92 Z" fill="var(--color-envelope-edge)" />
      </svg>

      {/* Envelope back. */}
      <div className="absolute inset-x-0 bottom-0 h-[64%] rounded-[3px] bg-envelope-back shadow-[0_22px_44px_rgba(0,0,0,0.4)]" />

      {/* The polaroid: the sneak peek. */}
      {photoUrl ? (
        <div
          className={`absolute left-[7%] top-[6%] w-[44%] ${lift}`}
          style={{
            transform: opening ? "translateY(-34%) rotate(-3deg)" : "rotate(-7deg)",
            transitionDelay: opening ? "250ms" : "0ms",
          }}
        >
          <div
            className="bg-petal p-[6%] pb-[18%] shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
            style={{ animation: "cover-card-rise 1400ms cubic-bezier(0.22,0.61,0.36,1) both 450ms" }}
          >
            {/* Takes the photo's own shape, so its edges are not trimmed off. */}
            <NaturalPhoto
              src={photoUrl}
              alt=""
              sizes="150px"
              fallbackRatio={4 / 5}
              minRatio={0.7}
              maxRatio={1.25}
              priority
              className="bg-petal-shade"
            />
          </div>
        </div>
      ) : null}

      {/* The card addressed to this guest. */}
      <div
        className={`absolute top-[17%] w-[46%] ${photoUrl ? "right-[6%]" : "left-1/2 -ml-[23%]"} ${lift}`}
        style={{
          transform: opening ? "translateY(-28%)" : photoUrl ? "rotate(3deg)" : undefined,
          transitionDelay: opening ? "350ms" : "0ms",
        }}
      >
        <div
          className="h-[118px] rounded-[2px] bg-olive-mid px-3.5 pt-3.5 text-left shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
          style={{ animation: "cover-card-rise 1400ms cubic-bezier(0.22,0.61,0.36,1) both 650ms" }}
        >
          <p className="font-ui text-[8px] uppercase leading-relaxed tracking-[0.18em] text-cream/70">
            {salutation}
          </p>
          {/*
            line-clamp hides overflow, and Parisienne's glyph box is 1.39em
            tall: at the names' usual 1.16 leading the tail of the g in
            "Undangan" was sliced off. 1.4 holds it; the size steps down a
            touch so two lines still clear the roses. Set inline, since
            `.names` sets its own line-height and would otherwise win.
          */}
          <p
            className="display names line-clamp-2 [--names-size:20px] text-cream"
            style={{ lineHeight: 1.4 }}
          >
            {guestName}
          </p>
        </div>
      </div>

      {/* Front pocket: covers the lower half of the polaroid and the card. */}
      <svg
        viewBox="0 0 330 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[64%] w-full drop-shadow-[0_-6px_10px_rgba(0,0,0,0.18)]"
        aria-hidden="true"
      >
        <path d="M0,22 L150,104 Q165,112 180,104 L330,22 V160 H0 Z" fill="var(--color-envelope-front)" />
        <path
          d="M0,22 L150,104 Q165,112 180,104 L330,22"
          fill="none"
          stroke="var(--color-champagne)"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      </svg>

      {/* Roses laid across the pocket, where the reference lays its lilies. */}
      <div className="pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2">
        <Crest width={210} height={82} />
      </div>

      {/* The seal. It breaks away first when the envelope is opened. */}
      <div
        className="absolute bottom-[7%] left-1/2 -translate-x-1/2 transition-[opacity,scale] duration-500 group-hover:scale-105"
        style={{ opacity: opening ? 0 : 1, scale: opening ? "1.3" : undefined }}
      >
        <WaxSeal monogram={monogram} />
      </div>
    </div>
  );
}

/**
 * A gold wax seal. The edge is a wobbled circle rather than a perfect one —
 * wax spreads unevenly — with a pressed inner ring and the couple's initials.
 */
function WaxSeal({ monogram }: { monogram: string }) {
  // 18 lobes around r≈30, alternating slightly in and out.
  const edge = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const r = i % 2 === 0 ? 31 : 29.2 + ((i * 7) % 3) * 0.4;
    return `${(32 + r * Math.cos(a)).toFixed(2)},${(32 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 64 64" width={74} height={74} aria-hidden="true" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]">
      <defs>
        <radialGradient id="keepsake-wax" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#f4e2a8" />
          <stop offset="45%" stopColor="var(--color-champagne)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--color-champagne) 55%, #3a2a08)" />
        </radialGradient>
      </defs>
      <polygon points={edge} fill="url(#keepsake-wax)" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.6" />
      <circle cx="32" cy="32.6" r="21" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="0.8" />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontSize="17"
        letterSpacing="0.5"
        fill="#5b4210"
        fillOpacity="0.85"
      >
        {monogram}
      </text>
    </svg>
  );
}

/**
 * Blush-rose ornament family.
 *
 * Drawn to sit with the printed card this theme mirrors: open garden roses in
 * blush over eucalyptus, with the foliage carrying as much of the arrangement
 * as the flowers. Softer and rounder than the `botanical` family, which leads
 * with white calla lilies.
 *
 * Colours resolve through the same tokens, so the family is interchangeable.
 */

import { useId } from "react";

type OrnamentProps = {
  className?: string;
  width?: number;
  height?: number;
  mirrored?: boolean;
};

type Placement = { x?: number; y?: number; scale?: number; rotate?: number };

const BLOOM = "var(--color-bloom)";
const BLOOM_MID = "var(--color-bloom-mid)";
const BLOOM_DEEP = "var(--color-bloom-deep)";
const BLOOM_PALE = "var(--color-bloom-pale)";
const LEAF = "var(--color-leaf)";
const LEAF_DEEP = "var(--color-leaf-deep)";
const LEAF_PALE = "var(--color-leaf-pale)";
const STEM = "var(--color-stem)";

/**
 * A garden rose seen face-on.
 *
 * Three rings of petals around a furled heart. The heart is what separates a
 * rose from a daisy at this scale, so it is drawn as nested spirals rather than
 * a dot: five even petals around a circle read as a flower, not this flower.
 */
function Rose({ x = 0, y = 0, scale = 1, rotate = 0 }: Placement) {
  const petal = "M0,2 C-12,-1 -17,-12 -11,-20 C-5,-27 5,-27 11,-20 C17,-12 12,-1 0,2 Z";
  const outer = [0, 51, 103, 154, 206, 257, 309];
  const mid = [26, 86, 146, 206, 266, 326];
  const inner = [10, 82, 154, 226, 298];

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {outer.map((a) => (
        <path key={`o${a}`} d={petal} fill={BLOOM_PALE} transform={`rotate(${a}) translate(0 -12) scale(1.32)`} />
      ))}
      {mid.map((a) => (
        <path key={`m${a}`} d={petal} fill={BLOOM} transform={`rotate(${a}) translate(0 -7) scale(0.98)`} />
      ))}
      {inner.map((a) => (
        <path key={`i${a}`} d={petal} fill={BLOOM_MID} opacity="0.9" transform={`rotate(${a}) translate(0 -3) scale(0.6)`} />
      ))}

      {/* The furled heart: two cupped petals wrapping a rolled centre. */}
      <path d="M0,7 C-8,5 -10,-3 -4,-8 C2,-12 9,-8 9,-1 C9,4 5,7 0,7 Z" fill={BLOOM} />
      <path d="M1,5 C-4,4 -6,-1 -2,-5 C2,-8 6,-5 6,-1 C6,3 4,5 1,5 Z" fill={BLOOM_MID} />
      <path
        d="M2,2 C-1,2 -2,-1 0,-2 C2,-3 4,-1 3,1"
        fill="none"
        stroke={BLOOM_DEEP}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

/** A rose in profile, for the edges of an arrangement. */
function RoseBud({ x = 0, y = 0, scale = 1, rotate = 0 }: Placement) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M1,22 C1,18 1,15 1,12" fill="none" stroke={STEM} strokeWidth="2" strokeLinecap="round" />
      <path d="M0,13 C-10,7 -12,-6 -3,-13 C5,-18 13,-10 11,0 C10,7 5,11 0,13 Z" fill={BLOOM_PALE} />
      <path d="M0,13 C-6,7 -7,-4 -1,-10 C5,-14 9,-8 8,-1 C7,6 4,10 0,13 Z" fill={BLOOM} />
      <path d="M0,13 C-3,7 -3,-2 1,-7 C4,-10 6,-6 5,0 C4,6 2,10 0,13 Z" fill={BLOOM_MID} />
      {/* Calyx: three sepals cupping the base. */}
      <path d="M-5,11 C-8,15 -7,19 -4,21 C-3,17 -2,14 0,12 Z" fill={LEAF_DEEP} />
      <path d="M1,12 C1,16 2,19 4,21 C6,17 6,13 4,10 Z" fill={LEAF} />
      <path d="M-6,10 C-1,16 4,16 9,10" fill="none" stroke={LEAF_DEEP} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** A eucalyptus sprig — the round-leaved stem that frames the printed card. */
function Eucalyptus({ x = 0, y = 0, scale = 1, rotate = 0, tone = LEAF }: Placement & { tone?: string }) {
  const leaves: Array<[number, number, number, number]> = [
    [0, -4, 7.5, -18], [0, 4, 7.5, 18],
    [0, -16, 8.5, -14], [1, -8, 8.5, 16],
    [2, -28, 8, -10], [3, -20, 8, 12],
    [4, -40, 7, -8], [5, -32, 7, 10],
    [6, -50, 5.5, -6],
  ];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0,0 C2,-18 4,-36 6,-54" fill="none" stroke={STEM} strokeWidth="2" strokeLinecap="round" />
      {leaves.map(([cx, cy, r, dx], i) => (
        <ellipse
          key={i}
          cx={cx + dx}
          cy={cy}
          rx={r}
          ry={r * 0.82}
          fill={i % 3 === 0 ? LEAF_PALE : tone}
          opacity="0.95"
        />
      ))}
    </g>
  );
}

/** A broad leaf, for weight at the base of a spray. */
function Leaf({ x = 0, y = 0, scale = 1, rotate = 0, tone = LEAF_DEEP }: Placement & { tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0,3 C14,-12 40,-13 58,2 C41,20 15,21 0,3 Z" fill={tone} opacity="0.92" />
      <path d="M1,3 C18,5 40,5 57,2" fill="none" stroke={LEAF_PALE} strokeWidth="1" opacity="0.5" />
    </g>
  );
}

/*
 * Sizing.
 *
 * A rose at scale 1 reaches ~48 units from its centre and a bud ~22, and an
 * SVG root clips whatever leaves its viewBox — which is how a rose becomes a
 * pale rectangle. Every placement below keeps centre ± radius inside the box.
 */

/** Tall corner spray — roses over eucalyptus, as on the printed corner. */
export function RoseSpray({ className, width = 170, height = 230, mirrored }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 180 240"
      width={width}
      height={height}
      className={className}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <Eucalyptus x={40} y={226} scale={1.25} rotate={-14} />
      <Eucalyptus x={126} y={218} scale={1.05} rotate={18} tone={LEAF_DEEP} />
      <Eucalyptus x={82} y={234} scale={0.9} rotate={2} tone={LEAF_PALE} />

      <Leaf x={18} y={202} scale={0.85} rotate={-34} />
      <Leaf x={108} y={208} scale={0.75} rotate={26} tone={LEAF} />

      <Rose x={70} y={150} scale={1.2} />
      <Rose x={120} y={180} scale={0.85} rotate={22} />
      <Rose x={36} y={182} scale={0.65} rotate={-16} />

      <RoseBud x={146} y={128} scale={0.9} rotate={28} />
      <RoseBud x={24} y={132} scale={0.75} rotate={-32} />
      <RoseBud x={92} y={104} scale={0.65} rotate={8} />
    </svg>
  );
}

/** Wide swag for section headers, the arch crown and the voucher. */
export function RoseCrest({ className, width = 200, height = 78 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 90" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <Eucalyptus x={62} y={78} scale={0.62} rotate={-62} />
      <Eucalyptus x={138} y={78} scale={0.62} rotate={62} />
      <Eucalyptus x={80} y={82} scale={0.46} rotate={-34} tone={LEAF_DEEP} />
      <Eucalyptus x={120} y={82} scale={0.46} rotate={34} tone={LEAF_DEEP} />

      <Rose x={100} y={50} scale={0.7} />
      <Rose x={72} y={60} scale={0.46} rotate={-18} />
      <Rose x={128} y={60} scale={0.46} rotate={18} />

      <RoseBud x={48} y={58} scale={0.5} rotate={-48} />
      <RoseBud x={152} y={58} scale={0.5} rotate={48} />
    </svg>
  );
}

/** Small posy for section corners. */
export function RosePosy({ className, width = 78, height = 78, mirrored }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 90 90"
      width={width}
      height={height}
      className={className}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <Eucalyptus x={24} y={84} scale={0.62} rotate={-20} />
      <Eucalyptus x={62} y={82} scale={0.5} rotate={24} tone={LEAF_DEEP} />
      <Rose x={45} y={42} scale={0.72} />
      <RoseBud x={72} y={58} scale={0.55} rotate={30} />
      <RoseBud x={18} y={54} scale={0.45} rotate={-28} />
    </svg>
  );
}

/*
 * Backdrop.
 *
 * The printed card is never a flat field: there is a watercolour bloom behind
 * the arrangement, loose petals and leaves fallen across the paper, and gold
 * flecks in the sage. Plain white bands read as dull beside it, so each band
 * carries a quiet version of that ground.
 *
 * Two scatter tiles of different sizes are layered so the repeat never lines up
 * into a visible grid. Everything stays pale and small, because text sits on
 * top of it. The wash strengths are computed, like the palette: on the light
 * bands `ink-soft` keeps 4.5:1 at the blush wash's peak, and on the dark ones
 * the peach kicker keeps 4.5:1 under the lamplight — at 55% it fell to 4.0.
 */

const GOLD = "var(--color-champagne)";

/** A single fallen petal, tip up. */
const PETAL = "M0,0 C-4,-2 -6,-8 -3,-12 C-1,-14 1,-14 3,-12 C6,-8 4,-2 0,0 Z";

/** A fallen eucalyptus tip: a short stem with three round leaves. */
function FallenSprig({ x, y, rotate, tone }: { x: number; y: number; rotate: number; tone: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d="M0,0 C1,-6 2,-12 3,-18" fill="none" stroke={tone} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="-3.5" cy="-5" rx="3.6" ry="3" fill={tone} />
      <ellipse cx="5.5" cy="-11" rx="3.4" ry="2.8" fill={tone} />
      <ellipse cx="2" cy="-18.5" rx="2.8" ry="2.3" fill={tone} />
    </g>
  );
}

function Fleck({ x, y, r = 1.1, tone = GOLD }: { x: number; y: number; r?: number; tone?: string }) {
  return <circle cx={x} cy={y} r={r} fill={tone} />;
}

/** A four-point glint, for the dark bands where a dot alone reads as dust. */
function Glint({ x, y, size = 3 }: { x: number; y: number; size?: number }) {
  const s = size;
  return (
    <path
      d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s} Z`}
      fill={GOLD}
    />
  );
}

export type BackdropTone = "paper" | "cream" | "olive";

export function RoseBackdrop({ tone }: { tone: BackdropTone }) {
  // Pattern ids must be unique per instance; strip the punctuation React puts
  // in its ids so they are safe inside `url(#…)`.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const dark = tone === "olive";

  const wash = dark
    ? // Lamplight from above, so the band has depth instead of one flat value.
      "radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--color-olive-mid) 25%, transparent), transparent 70%)," +
      "radial-gradient(90% 60% at 100% 100%, color-mix(in srgb, var(--color-leaf-deep) 15%, transparent), transparent 70%)"
    : // A blush bloom top-right and a sage one bottom-left, as on the card.
      "radial-gradient(75% 45% at 100% 0%, color-mix(in srgb, var(--color-bloom-pale) 75%, transparent), transparent 72%)," +
      "radial-gradient(70% 45% at 0% 100%, color-mix(in srgb, var(--color-leaf-pale) 38%, transparent), transparent 72%)," +
      "radial-gradient(40% 25% at 8% 18%, color-mix(in srgb, var(--color-bloom-pale) 40%, transparent), transparent 70%)";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: wash }}>
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id={`${id}a`} width="180" height="220" patternUnits="userSpaceOnUse">
            {dark ? (
              <>
                <FallenSprig x={30} y={60} rotate={-30} tone="var(--color-leaf)" />
                <Glint x={128} y={34} />
                <Fleck x={86} y={118} r={1} />
                <Fleck x={160} y={150} r={0.8} />
                <Glint x={52} y={186} size={2.2} />
                <Fleck x={14} y={130} r={0.7} />
              </>
            ) : (
              <>
                <FallenSprig x={28} y={58} rotate={-28} tone="var(--color-leaf-pale)" />
                <path d={PETAL} fill={BLOOM_PALE} transform="translate(132 40) rotate(38)" />
                <path d={PETAL} fill={BLOOM} opacity="0.55" transform="translate(96 150) rotate(-62) scale(0.8)" />
                <Fleck x={80} y={92} />
                <Fleck x={162} y={124} r={0.8} />
                <Fleck x={22} y={168} r={1.3} />
                <FallenSprig x={150} y={204} rotate={52} tone="var(--color-leaf-pale)" />
              </>
            )}
          </pattern>
          <pattern
            id={`${id}b`}
            width="250"
            height="290"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(70 110)"
          >
            {dark ? (
              <>
                <Fleck x={40} y={40} r={0.9} />
                <Glint x={190} y={120} size={2.6} />
                <Fleck x={110} y={230} r={1.2} />
                <FallenSprig x={210} y={270} rotate={140} tone="var(--color-leaf)" />
              </>
            ) : (
              <>
                <path d={PETAL} fill={BLOOM} opacity="0.5" transform="translate(44 66) rotate(150) scale(0.9)" />
                <FallenSprig x={200} y={140} rotate={110} tone="var(--color-leaf)" />
                <path d={PETAL} fill={BLOOM_PALE} transform="translate(120 250) rotate(-20) scale(1.1)" />
                <Fleck x={180} y={36} r={1} />
                <Fleck x={30} y={210} r={0.9} />
              </>
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}a)`} opacity={dark ? 0.16 : 0.6} />
        <rect width="100%" height="100%" fill={`url(#${id}b)`} opacity={dark ? 0.2 : 0.65} />
      </svg>

      {/* Paper tooth, so the surface reads as stock rather than as a screen. */}
      <span className={`paper-grain absolute inset-0 ${dark ? "opacity-[0.09]" : "opacity-[0.07]"}`} />

      {/* The card's gold double rule. Cream bands only — framing every band
          would make the frame mean nothing. */}
      {tone === "cream" ? (
        <>
          <span className="absolute inset-3.5 rounded-[var(--radius-frame)] border border-champagne/70" />
          <span className="absolute inset-[19px] rounded-[var(--radius-frame)] border border-champagne/35" />
        </>
      ) : null}
    </div>
  );
}

/**
 * Inline mark for dividers.
 *
 * One rose over two leaves. A eucalyptus stem at this size collapses into a
 * solid block of pale green, so the sprig uses single leaves instead.
 */
export function RoseSprig({ className, width = 26, height = 44 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 40 66" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <path d="M20,64 C20,56 20,50 20,42" fill="none" stroke={STEM} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="11" cy="48" rx="7" ry="5" fill={LEAF} transform="rotate(-24 11 48)" />
      <ellipse cx="29" cy="53" rx="6" ry="4.4" fill={LEAF_DEEP} transform="rotate(24 29 53)" />
      <Rose x={20} y={24} scale={0.4} />
    </svg>
  );
}

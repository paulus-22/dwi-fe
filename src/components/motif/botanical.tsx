/**
 * Original botanical illustrations.
 *
 * The arrangement is peach-led: open peach roses and blossom sprigs carry the
 * colour, cream calla lilies provide the highlights, and foliage is kept as a
 * supporting green rather than the dominant tone. Everything is inline SVG, so
 * a re-theme is a token change and nothing needs re-exporting.
 */

type OrnamentProps = {
  className?: string;
  width?: number;
  height?: number;
  /** Flip horizontally, for mirrored corner placements. */
  mirrored?: boolean;
};

type Placement = { x?: number; y?: number; scale?: number; rotate?: number };

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

/*
 * Illustration colours resolve through CSS custom properties so the botanicals
 * follow whichever theme the event is using. Hardcoding them meant a new theme
 * changed the type and the bands but left peach flowers on a navy page.
 */
const BLOOM = "var(--color-bloom)";
const BLOOM_MID = "var(--color-bloom-mid)";
const BLOOM_DEEP = "var(--color-bloom-deep)";
const BLOOM_PALE = "var(--color-bloom-pale)";
const PETAL = "var(--color-petal)";
const PETAL_SHADE = "var(--color-petal-shade)";
const PETAL_EDGE = "var(--color-petal-edge)";
const LEAF = "var(--color-leaf)";
const LEAF_DEEP = "var(--color-leaf-deep)";
const LEAF_PALE = "var(--color-leaf-pale)";
const STEM = "var(--color-stem)";

/**
 * An open garden rose. Built from overlapping petal shapes rather than a disc
 * with a spiral drawn on it — the spiral read as a snail shell at small sizes.
 */
function Rose({ x = 0, y = 0, scale = 1, rotate = 0 }: Placement) {
  // One cupped petal, pointing up from the flower's centre.
  const petal = "M0,2 C-9,-1 -13,-10 -9,-17 C-5,-23 5,-23 9,-17 C13,-10 9,-1 0,2 Z";
  const outer = [0, 51, 103, 154, 206, 257, 309];
  const inner = [26, 96, 166, 236, 306];

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {/* outer whorl, the widest and palest */}
      {outer.map((angle) => (
        <path
          key={`o${angle}`}
          d={petal}
          fill={BLOOM}
          transform={`rotate(${angle}) translate(0 -8) scale(1.18)`}
        />
      ))}
      {/* middle whorl, rotated off the outer so the edges show */}
      {inner.map((angle) => (
        <path
          key={`m${angle}`}
          d={petal}
          fill={BLOOM_MID}
          opacity="0.9"
          transform={`rotate(${angle}) translate(0 -4) scale(0.82)`}
        />
      ))}
      {/* the furled heart */}
      <circle cx="0" cy="0" r="6.5" fill={BLOOM_PALE} />
      <path
        d="M-4,1 C-5,-3 -2,-6 1,-5 C4,-4 5,-1 3,1"
        fill="none"
        stroke={BLOOM_DEEP}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
  );
}

/** A small five-petal blossom — used in clusters to fill gaps. */
function Blossom({ x = 0, y = 0, scale = 1, rotate = 0, tone = BLOOM }: Placement & { tone?: string }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {petals.map((angle) => (
        <ellipse key={angle} cx="0" cy="-6.5" rx="4.1" ry="6" fill={tone} transform={`rotate(${angle})`} />
      ))}
      <circle cx="0" cy="0" r="2.6" fill={BLOOM_DEEP} />
    </g>
  );
}

/** A tight bud, for the edges of an arrangement. */
function Bud({ x = 0, y = 0, scale = 1, rotate = 0 }: Placement) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0,10 C-7,4 -7,-7 0,-12 C7,-7 7,4 0,10 Z" fill={BLOOM} />
      <path d="M0,10 C-3,4 -3,-6 0,-12 C2,-6 2,4 0,10 Z" fill={BLOOM_PALE} opacity="0.7" />
      <path d="M-5,8 C-2,12 2,12 5,8" fill="none" stroke={LEAF_DEEP} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** A calla lily — the cream highlight among the peach. */
function CallaLily({ x = 0, y = 0, scale = 1, rotate = 0 }: Placement) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M1,96 C-2,64 0,38 3,22" fill="none" stroke={STEM} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M3,23 C-8,11 -14,-8 -6,-22 C0,-32 14,-34 19,-25 C23,-17 19,-6 11,6 C8,11 5,17 3,23 Z"
        fill={PETAL}
        stroke={PETAL_EDGE}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M3,23 C-3,10 -5,-6 2,-18 C7,-26 15,-27 17,-22 C19,-14 14,-2 7,10 Z" fill={PETAL_SHADE} opacity="0.85" />
      <path d="M-6,-22 C0,-31 13,-33 19,-25" fill="none" stroke={PETAL_EDGE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M5,8 C5,-3 6,-12 7,-19" fill="none" stroke={BLOOM} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** A pointed leaf. */
function Leaf({ x = 0, y = 0, scale = 1, rotate = 0, tone = LEAF }: Placement & { tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0,4 C16,-12 44,-14 64,2 C46,22 18,24 0,4 Z" fill={tone} opacity="0.92" />
      <path d="M1,4 C20,6 44,6 63,2" fill="none" stroke={PETAL} strokeWidth="1" opacity="0.4" />
    </g>
  );
}

/** A sprig of blossoms on a curving stem. */
function BlossomSprig({ x = 0, y = 0, scale = 1, rotate = 0 }: Placement) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0,0 C6,-14 8,-30 4,-46" fill="none" stroke={STEM} strokeWidth="2.2" strokeLinecap="round" />
      <Blossom x={4} y={-46} scale={0.9} />
      <Blossom x={9} y={-30} scale={0.7} rotate={30} />
      <Blossom x={2} y={-15} scale={0.55} rotate={-20} tone={BLOOM_PALE} />
      <Leaf x={6} y={-24} scale={0.32} rotate={-38} tone={LEAF_PALE} />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Arrangements                                                                */
/* -------------------------------------------------------------------------- */

/** Tall corner spray — roses, lilies and blossom over foliage. */
export function BotanicalSpray({ className, width = 170, height = 230, mirrored }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 170 230"
      width={width}
      height={height}
      className={className}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <Leaf x={24} y={158} scale={1.2} rotate={-30} tone={LEAF} />
      <Leaf x={34} y={186} scale={1} rotate={20} tone={LEAF_DEEP} />
      <Leaf x={16} y={170} scale={0.8} rotate={-68} tone={LEAF_PALE} />
      <Leaf x={96} y={150} scale={0.85} rotate={44} tone={LEAF} />

      <CallaLily x={112} y={112} scale={0.8} rotate={16} />
      <CallaLily x={46} y={118} scale={0.62} rotate={-26} />

      <BlossomSprig x={128} y={168} scale={1.05} rotate={12} />
      <BlossomSprig x={20} y={150} scale={0.8} rotate={-22} />

      <Rose x={68} y={150} scale={1.15} />
      <Rose x={104} y={186} scale={0.85} rotate={18} />
      <Rose x={36} y={196} scale={0.7} rotate={-12} />

      <Bud x={132} y={128} scale={0.85} rotate={24} />
      <Bud x={12} y={132} scale={0.7} rotate={-28} />

      <Blossom x={88} y={120} scale={0.75} />
      <Blossom x={56} y={178} scale={0.6} tone={BLOOM_PALE} />
    </svg>
  );
}

/** Wide swag for section headers, the envelope seal and the voucher. */
export function BotanicalCrest({ className, width = 200, height = 78 }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 200 78"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <Leaf x={58} y={50} scale={0.74} rotate={196} tone={LEAF} />
      <Leaf x={142} y={50} scale={0.74} rotate={-16} tone={LEAF} />
      <Leaf x={74} y={58} scale={0.5} rotate={228} tone={LEAF_DEEP} />
      <Leaf x={126} y={58} scale={0.5} rotate={-48} tone={LEAF_DEEP} />

      <CallaLily x={100} y={50} scale={0.52} />

      <Rose x={76} y={50} scale={0.7} />
      <Rose x={124} y={50} scale={0.7} rotate={14} />

      <Bud x={58} y={46} scale={0.55} rotate={-26} />
      <Bud x={142} y={46} scale={0.55} rotate={26} />

      <Blossom x={90} y={62} scale={0.62} />
      <Blossom x={110} y={62} scale={0.62} tone={BLOOM_PALE} />
      <Blossom x={66} y={60} scale={0.45} tone={BLOOM_PALE} />
      <Blossom x={134} y={60} scale={0.45} />
    </svg>
  );
}

/** A small posy, for inline accents inside sections. */
export function BotanicalPosy({ className, width = 78, height = 78, mirrored }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 78 78"
      width={width}
      height={height}
      className={className}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <Leaf x={8} y={50} scale={0.6} rotate={-24} tone={LEAF} />
      <Leaf x={34} y={56} scale={0.52} rotate={30} tone={LEAF_DEEP} />
      <Rose x={38} y={38} scale={0.95} />
      <Blossom x={20} y={28} scale={0.7} />
      <Blossom x={56} y={30} scale={0.6} tone={BLOOM_PALE} />
      <Bud x={58} y={52} scale={0.62} rotate={28} />
    </svg>
  );
}

/** A single stem, used inline inside dividers. */
export function BotanicalSprig({ className, width = 30, height = 44 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 34 44" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <Leaf x={2} y={30} scale={0.3} rotate={-30} tone={LEAF_PALE} />
      <Leaf x={18} y={32} scale={0.28} rotate={26} tone={LEAF} />
      <Rose x={17} y={18} scale={0.52} />
    </svg>
  );
}

/** Hairline rule — mark — hairline rule. The mark comes from the theme. */
export function Divider({
  className = "",
  tone = "var(--color-peach-line)",
  Sprig = BotanicalSprig,
}: {
  className?: string;
  tone?: string;
  Sprig?: (props: { width?: number; height?: number; className?: string }) => React.JSX.Element;
}) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} role="presentation">
      <span className="h-px w-14 sm:w-20" style={{ background: tone }} />
      <Sprig width={30} height={40} />
      <span className="h-px w-14 sm:w-20" style={{ background: tone }} />
    </div>
  );
}

/**
 * Art-deco ornament family.
 *
 * Built from fans, stepped rays and thin rules rather than anything organic —
 * the point is that a deco invitation should look drawn with a ruler where the
 * botanical one looks drawn by hand. Colours resolve through the same tokens,
 * so the family is interchangeable with the botanicals.
 */

type OrnamentProps = {
  className?: string;
  width?: number;
  height?: number;
  mirrored?: boolean;
};

const ACCENT = "var(--color-bloom)";
const ACCENT_DEEP = "var(--color-bloom-mid)";
const LINE = "var(--color-peach-line)";
const PALE = "var(--color-bloom-pale)";

/** A stepped fan — the motif the rest of the family is built from. */
function Fan({ x = 0, y = 0, scale = 1, rotate = 0 }) {
  const rays = [-60, -40, -20, 0, 20, 40, 60];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {rays.map((angle, i) => {
        const length = 34 - Math.abs(angle) * 0.22;
        return (
          <line
            key={angle}
            x1="0"
            y1="0"
            x2="0"
            y2={-length}
            stroke={i % 2 === 0 ? ACCENT : ACCENT_DEEP}
            strokeWidth={i % 2 === 0 ? 3 : 1.6}
            strokeLinecap="round"
            transform={`rotate(${angle})`}
          />
        );
      })}
      <circle cx="0" cy="0" r="4.5" fill={ACCENT} />
      <circle cx="0" cy="0" r="1.8" fill={PALE} />
    </g>
  );
}

/** Concentric arcs, used to weight a corner. */
function Arcs({ x = 0, y = 0, scale = 1, rotate = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {[16, 26, 36, 46].map((r, i) => (
        <path
          key={r}
          d={`M${-r},0 A${r},${r} 0 0 1 ${r},0`}
          fill="none"
          stroke={i % 2 === 0 ? ACCENT : LINE}
          strokeWidth={i % 2 === 0 ? 2.2 : 1.2}
        />
      ))}
    </g>
  );
}

/** A slim vertical chevron stack. */
function Chevrons({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 14, 28, 42].map((offset, i) => (
        <path
          key={offset}
          d={`M-13,${offset} L0,${offset - 9} L13,${offset}`}
          fill="none"
          stroke={i % 2 === 0 ? ACCENT : ACCENT_DEEP}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

/** Tall corner piece. */
export function DecoSpray({ className, width = 170, height = 230, mirrored }: OrnamentProps) {
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
      <Arcs x={54} y={168} scale={1.25} />
      <Fan x={54} y={168} scale={1.15} />
      <Chevrons x={120} y={92} scale={0.95} />
      <Fan x={120} y={186} scale={0.7} rotate={180} />
      <line x1="14" y1="200" x2="156" y2="200" stroke={LINE} strokeWidth="1.2" />
      <line x1="14" y1="206" x2="156" y2="206" stroke={ACCENT} strokeWidth="2" />
    </svg>
  );
}

/** Wide swag for section headers and seals. */
export function DecoCrest({ className, width = 200, height = 78 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 78" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <line x1="20" y1="52" x2="76" y2="52" stroke={LINE} strokeWidth="1.2" />
      <line x1="124" y1="52" x2="180" y2="52" stroke={LINE} strokeWidth="1.2" />
      <Arcs x={100} y={56} scale={0.72} />
      <Fan x={100} y={56} scale={0.82} />
      <path d="M86,64 L100,74 L114,64" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Small corner accent inside sections. */
export function DecoPosy({ className, width = 78, height = 78, mirrored }: OrnamentProps) {
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
      <Arcs x={38} y={54} scale={0.78} />
      <Fan x={38} y={54} scale={0.72} />
    </svg>
  );
}

/** Inline mark for dividers. */
export function DecoSprig({ className, width = 24, height = 44 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 34 44" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <path d="M17,6 L25,22 L17,38 L9,22 Z" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />
      <path d="M17,14 L21,22 L17,30 L13,22 Z" fill={ACCENT} />
    </svg>
  );
}

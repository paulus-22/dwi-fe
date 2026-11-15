/**
 * Minimal ornament family.
 *
 * Almost nothing: a hairline, a small lozenge, a single rule. Chosen for themes
 * whose whole point is restraint — dropping ornaments entirely would leave the
 * layout feeling unfinished, so this gives the eye a full stop without
 * decorating.
 */

type OrnamentProps = {
  className?: string;
  width?: number;
  height?: number;
  mirrored?: boolean;
};

const ACCENT = "var(--color-bloom)";
const LINE = "var(--color-peach-line)";

/** Corner piece: two hairlines meeting, nothing more. */
export function MinimalSpray({ className, width = 170, height = 230, mirrored }: OrnamentProps) {
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
      <path d="M26,216 L26,86 M26,86 L150,86" fill="none" stroke={LINE} strokeWidth="1.2" />
      <path d="M36,216 L36,96 M36,96 L150,96" fill="none" stroke={ACCENT} strokeWidth="1.6" opacity="0.7" />
      <circle cx="26" cy="86" r="3.4" fill={ACCENT} />
    </svg>
  );
}

/** A rule with a lozenge at its centre. */
export function MinimalCrest({ className, width = 200, height = 78 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 78" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <line x1="28" y1="42" x2="86" y2="42" stroke={LINE} strokeWidth="1.2" />
      <line x1="114" y1="42" x2="172" y2="42" stroke={LINE} strokeWidth="1.2" />
      <path d="M100,30 L108,42 L100,54 L92,42 Z" fill={ACCENT} />
    </svg>
  );
}

export function MinimalPosy({ className, width = 78, height = 78, mirrored }: OrnamentProps) {
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
      <path d="M18,60 L18,22 M18,22 L58,22" fill="none" stroke={LINE} strokeWidth="1.2" />
      <circle cx="18" cy="22" r="3" fill={ACCENT} />
    </svg>
  );
}

export function MinimalSprig({ className, width = 24, height = 44 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 34 44" width={width} height={height} className={className} aria-hidden="true" focusable="false">
      <path d="M17,14 L24,22 L17,30 L10,22 Z" fill={ACCENT} />
    </svg>
  );
}

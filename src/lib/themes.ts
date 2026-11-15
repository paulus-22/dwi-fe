/**
 * Invitation themes.
 *
 * A theme is a set of CSS custom properties applied to the invitation wrapper.
 * Because every utility and every botanical resolves through these variables,
 * switching one re-colours the type, the bands, the hairlines and the
 * illustrations together.
 *
 * Every colour that carries text was computed, not chosen by eye:
 *
 *   accent    clears 4.5:1 against its own band, so it can carry small text
 *             there. Terracotta's is lighter than the natural hue for exactly
 *             this reason — at #d98456 it measured 3.77:1.
 *   accentInk the darkened counterpart, clearing 4.5:1 on white and on cream.
 *   inkSoft   body copy; must clear 4.5:1 on white *and* on the theme's cream.
 *             Midnight and Slate both failed their cream on the first pass
 *             (4.29 and 4.21) and were darkened.
 */

export type ThemeKey =
  | "sage-peach"
  | "dusty-rose"
  | "midnight-gold"
  | "terracotta"
  | "slate-blush"
  | "rose-sage";

/** Which illustration set the invitation draws from. */
export type OrnamentFamily = "botanical" | "deco" | "minimal" | "rose";

/** How the invitation opens. */
export type CoverStyle = "envelope" | "arch" | "card" | "keepsake";

/** Typeface pairing. Each maps to font stacks declared in globals.css. */
export type TypeSet = "classic" | "modern" | "editorial" | "romantic";

/** Corner treatment, which does more than it sounds to set the tone. */
export type ShapeLanguage = "soft" | "sharp";

/**
 * How the ceremony details are set: `editorial` is the large day numeral per
 * ceremony; `lace` gathers every ceremony onto one scalloped, lace-edged card,
 * like the insert in a printed suite.
 */
export type EventsLayout = "editorial" | "lace";

export type ThemeDesign = {
  type: TypeSet;
  ornament: OrnamentFamily;
  cover: CoverStyle;
  shape: ShapeLanguage;
  events: EventsLayout;
  /** One line describing the look, shown in the picker. */
  note: string;
};

export type Theme = {
  key: ThemeKey;
  label: string;
  description: string;
  /** Swatches shown in the dashboard picker, darkest first. */
  swatches: string[];
  design: ThemeDesign;
  tokens: Record<string, string>;
};

/** Font stacks per pairing. Declared here so a theme owns its typography. */
const TYPE_TOKENS: Record<TypeSet, Record<string, string>> = {
  // Upright serif display over a serif body — the original stationery voice.
  classic: {
    "font-display": "var(--font-cormorant), 'Cormorant Upright', serif",
    "font-names": "var(--font-cormorant), 'Cormorant Upright', serif",
    "font-body": "var(--font-instrument), 'Instrument Serif', serif",
    "font-ui": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    "names-scale": "1",
    "names-leading": "1.04",
    "names-stroke": "0px",
  },
  // High-contrast display over a geometric sans: colder, more architectural.
  modern: {
    "font-display": "var(--font-playfair), 'Playfair Display', serif",
    "font-names": "var(--font-playfair), 'Playfair Display', serif",
    "font-body": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    "font-ui": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    "names-scale": "1",
    "names-leading": "1.04",
    "names-stroke": "0px",
  },
  // Sans display over a serif body — magazine rather than invitation.
  editorial: {
    "font-display": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    "font-names": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    "font-body": "var(--font-instrument), 'Instrument Serif', serif",
    "font-ui": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    "names-scale": "1",
    "names-leading": "1.04",
    "names-stroke": "0px",
  },
  // Calligraphic names over a serif — the printed-stationery voice. The script
  // is confined to `font-names`; headings and dates stay on the serif, because
  // a script set at 22px uppercase is unreadable.
  romantic: {
    "font-display": "var(--font-cormorant), 'Cormorant Upright', serif",
    "font-names": "var(--font-parisienne), 'Parisienne', cursive",
    "font-body": "var(--font-instrument), 'Instrument Serif', serif",
    "font-ui": "var(--font-jost), ui-sans-serif, system-ui, sans-serif",
    // Scripts carry a small x-height, so the names need more point size than a
    // serif to read at the same optical weight.
    "names-scale": "1.18",
    "names-leading": "1.16",
    // Parisienne ships in one weight and its hairlines vanish at a distance;
    // a stroke this thin thickens them without smearing the joins.
    "names-stroke": "0.4px",
  },
};

const SHAPE_TOKENS: Record<ShapeLanguage, Record<string, string>> = {
  soft: { "radius-control": "6px", "radius-card": "10px", "radius-frame": "4px" },
  sharp: { "radius-control": "0px", "radius-card": "0px", "radius-frame": "0px" },
};

function build({
  key,
  label,
  description,
  design,
  band,
  bandSoft,
  envelopeBack,
  envelopeFront,
  envelopeEdge,
  cream,
  accent,
  accentInk,
  accentDeep,
  accentLine,
  accentSoft,
  accentText,
  ink,
  namesInk,
  inkSoft,
  line,
  leaf,
  leafDeep,
  leafPale,
  stem,
  petal,
  petalShade,
  petalEdge,
}: {
  key: ThemeKey;
  label: string;
  description: string;
  design: ThemeDesign;
  band: string;
  bandSoft: string;
  envelopeBack: string;
  envelopeFront: string;
  envelopeEdge: string;
  cream: string;
  accent: string;
  accentInk: string;
  accentDeep: string;
  accentLine: string;
  accentSoft: string;
  accentText: string;
  ink: string;
  /** The couple's names, if they are not set in `ink`. */
  namesInk?: string;
  inkSoft: string;
  line: string;
  leaf: string;
  leafDeep: string;
  leafPale: string;
  stem: string;
  petal: string;
  petalShade: string;
  petalEdge: string;
}): Theme {
  return {
    key,
    label,
    description,
    design,
    swatches: [band, accent, cream, leaf],
    tokens: {
      ...TYPE_TOKENS[design.type],
      ...SHAPE_TOKENS[design.shape],

      // Surfaces. The names are historical — `olive-deep` means "the dark
      // band" in every theme, not literally olive.
      "olive-deep": band,
      "olive-mid": bandSoft,

      // Envelope: back panel, front pocket, and the fold highlight.
      "envelope-back": envelopeBack,
      "envelope-front": envelopeFront,
      "envelope-edge": envelopeEdge,
      cream,
      "ink-cream": cream,

      // Ink
      ink,
      "names-ink": namesInk ?? ink,
      "ink-soft": inkSoft,
      line,

      // Accent
      peach: accent,
      "peach-ink": accentInk,
      "peach-deep": accentDeep,
      "peach-line": accentLine,
      "peach-soft": accentSoft,
      "peach-text": accentText,
      champagne: accentLine,

      // Illustration
      bloom: accent,
      "bloom-mid": accentDeep,
      "bloom-deep": accentText,
      "bloom-pale": accentSoft,
      petal,
      "petal-shade": petalShade,
      "petal-edge": petalEdge,
      leaf,
      "leaf-deep": leafDeep,
      "leaf-pale": leafPale,
      stem,
      sage: leaf,
    },
  };
}

export const THEMES: Record<ThemeKey, Theme> = {
  "sage-peach": build({
    key: "sage-peach",
    design: {
      type: "classic",
      ornament: "botanical",
      cover: "envelope",
      shape: "soft",
      events: "editorial",
      note: "Amplop terbuka, ilustrasi bunga, serif klasik.",
    },
    label: "Sage & Peach",
    description: "Hijau zaitun dengan peach. Hangat, botanis, klasik.",
    band: "#353a20",
    bandSoft: "#56584b",
    envelopeBack: "#2c3019",
    envelopeFront: "#3d4325",
    envelopeEdge: "#47472f",
    cream: "#f5f0e8",
    accent: "#e9af8a",
    accentInk: "#876550",
    accentDeep: "#e5a279",
    accentLine: "#edcbb2",
    accentSoft: "#f7e3d4",
    accentText: "#4a2e1d",
    ink: "#353a20",
    inkSoft: "#786b5d",
    line: "#ddd8cc",
    leaf: "#8fa072",
    leafDeep: "#74855a",
    leafPale: "#a9b78d",
    stem: "#7f8f63",
    petal: "#fdfcf8",
    petalShade: "#efede0",
    petalEdge: "#d9d3c4",
  }),

  "dusty-rose": build({
    key: "dusty-rose",
    design: {
      type: "classic",
      ornament: "botanical",
      cover: "envelope",
      shape: "soft",
      events: "editorial",
      note: "Amplop terbuka, ilustrasi bunga, serif klasik.",
    },
    label: "Dusty Rose",
    description: "Merah anggur dengan mawar pudar. Romantis dan lembut.",
    band: "#4a2e35",
    bandSoft: "#6b4a52",
    envelopeBack: "#3d252b",
    envelopeFront: "#573740",
    envelopeEdge: "#63424b",
    cream: "#f8f0ef",
    accent: "#c99a91",
    accentInk: "#876761",
    accentDeep: "#b9857b",
    accentLine: "#e6c7c1",
    accentSoft: "#f5e4e1",
    accentText: "#42221d",
    ink: "#3a2429",
    inkSoft: "#7c6a6c",
    line: "#e0d4d2",
    leaf: "#9aa88f",
    leafDeep: "#7d8b73",
    leafPale: "#b6c1ad",
    stem: "#8b9a81",
    petal: "#fdfaf9",
    petalShade: "#f0e7e5",
    petalEdge: "#dfd0cd",
  }),

  "midnight-gold": build({
    key: "midnight-gold",
    design: {
      type: "modern",
      ornament: "deco",
      cover: "arch",
      shape: "sharp",
      events: "editorial",
      note: "Bingkai lengkung, ornamen art deco, garis tegas.",
    },
    label: "Midnight & Gold",
    description: "Biru malam dengan emas. Art deco, formal, tegas.",
    band: "#1f2937",
    bandSoft: "#3c4757",
    envelopeBack: "#18202c",
    envelopeFront: "#2b3747",
    envelopeEdge: "#374558",
    cream: "#f4f1ea",
    accent: "#c9a227",
    accentInk: "#856b19",
    accentDeep: "#b08e1f",
    accentLine: "#e0cf96",
    accentSoft: "#f3ecd6",
    accentText: "#2a2205",
    ink: "#1f2937",
    inkSoft: "#686e7c",
    line: "#dcd8ce",
    leaf: "#7d8b7a",
    leafDeep: "#657263",
    leafPale: "#9dab99",
    stem: "#6f7d6c",
    petal: "#fcfbf7",
    petalShade: "#ece8dc",
    petalEdge: "#d6d1c3",
  }),

  terracotta: build({
    key: "terracotta",
    design: {
      type: "editorial",
      ornament: "minimal",
      cover: "card",
      shape: "soft",
      events: "editorial",
      note: "Kartu polos, ornamen minimal, judul sans.",
    },
    label: "Terracotta",
    description: "Tanah liat hangat. Minimal, lapang, editorial.",
    band: "#5a3428",
    bandSoft: "#7d4f3f",
    envelopeBack: "#4a2a20",
    envelopeFront: "#6b3f31",
    envelopeEdge: "#7d4d3c",
    cream: "#faf2e9",
    // Lighter than the natural hue: #d98456 measured 3.77:1 on this band.
    accent: "#df9871",
    accentInk: "#93644a",
    accentDeep: "#c9784f",
    accentLine: "#eec8ae",
    accentSoft: "#f8e5d6",
    accentText: "#42200f",
    ink: "#402318",
    inkSoft: "#7d6959",
    line: "#e4d7c8",
    leaf: "#93a37c",
    leafDeep: "#788666",
    leafPale: "#b1bf9b",
    stem: "#84936e",
    petal: "#fefaf5",
    petalShade: "#f2e9dd",
    petalEdge: "#e0d2c1",
  }),

  "slate-blush": build({
    key: "slate-blush",
    design: {
      type: "modern",
      ornament: "minimal",
      cover: "arch",
      shape: "sharp",
      events: "editorial",
      note: "Bingkai lengkung, ornamen minimal, sangat bersih.",
    },
    label: "Slate & Blush",
    description: "Abu batu dengan blush. Modern, bersih, tenang.",
    band: "#3b3f4a",
    bandSoft: "#5a5f6c",
    envelopeBack: "#31343d",
    envelopeFront: "#474b58",
    envelopeEdge: "#565b69",
    cream: "#f6f2f2",
    accent: "#d9a3a3",
    accentInk: "#896767",
    accentDeep: "#c28e8e",
    accentLine: "#ecd2d2",
    accentSoft: "#f7e9e9",
    accentText: "#3a2020",
    ink: "#2f323a",
    inkSoft: "#6d6f77",
    line: "#dedada",
    leaf: "#8b9a94",
    leafDeep: "#72817b",
    leafPale: "#a9b6b1",
    stem: "#7d8c86",
    petal: "#fdfcfc",
    petalShade: "#eeeaea",
    petalEdge: "#d9d3d3",
  }),
  "rose-sage": build({
    key: "rose-sage",
    design: {
      type: "romantic",
      ornament: "rose",
      cover: "keepsake",
      shape: "soft",
      events: "lace",
      note: "Amplop berfoto di atas foto latar, mawar blush, kartu acara berenda.",
    },
    label: "Rose & Sage",
    description: "Sage hijau dengan mawar blush dan garis emas. Mengikuti kartu cetak.",
    /*
     * Sampled from the printed Invitto E.019.2 proof rather than picked by eye.
     *
     * The card's sage measures #c5c8b6 — hue 70, and pale. The band here is
     * that same hue carried down to the darkness this platform's inverted
     * sections need, because `olive-deep` is a field that cream body text sits
     * on (7.95:1). Matching the card's lightness as well would mean inverting
     * the cover, quote, countdown and voucher to dark-on-light.
     *
     * The foliage and the roses are the card's own: eucalyptus here is a
     * yellow-olive (hue ~63), not the blue-grey sage of the other themes, and
     * the roses are a warm peach-blush (hue ~17) rather than a cool pink.
     */
    band: "#4a4e36",
    bandSoft: "#656a4e",
    envelopeBack: "#3c3f2c",
    envelopeFront: "#555940",
    envelopeEdge: "#686d50",
    cream: "#f7f6ec",
    // The rose ramp, light to dark: highlight, petal, shadow. `accent` doubles
    // as kicker text on the band, so it cannot go lighter — 5.03:1 there.
    accent: "#ecbba8",
    accentInk: "#944638",
    accentDeep: "#c4745a",
    // Gold, which carries every hairline and frame on the printed card.
    accentLine: "#c9a54a",
    accentSoft: "#fae3d7",
    accentText: "#7c3127",
    ink: "#3c4232",
    // Gold, as on the printed card, which measured #a7801f. 3.47:1 on this
    // cream — the names are set at 32px and up, where 3:1 is the bar.
    namesInk: "#a47e1e",
    inkSoft: "#6b6a55",
    line: "#e2ddcb",
    // Eucalyptus: the card's yellow-olive, not the other themes' blue-grey.
    leaf: "#a4a776",
    leafDeep: "#717236",
    leafPale: "#c9cca4",
    stem: "#8e9155",
    petal: "#fdfaf7",
    petalShade: "#f3f0e8",
    petalEdge: "#dfdccd",
  }),
};

export const DEFAULT_THEME: ThemeKey = "sage-peach";

/** GENERIC events have no theme field; their e-voucher uses this fixed neutral one. */
export const GENERIC_VOUCHER_THEME: ThemeKey = "slate-blush";
export const THEME_LIST = Object.values(THEMES);

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return value != null && value in THEMES;
}

export function resolveTheme(key: string | null | undefined): Theme {
  return isThemeKey(key) ? THEMES[key] : THEMES[DEFAULT_THEME];
}

/**
 * The inline style applied to the invitation wrapper.
 *
 * Most tokens are colours and get the `--color-` prefix Tailwind expects.
 * Typography, radius and name-sizing tokens are already fully namespaced, so prefixing them
 * would produce `--color-font-display`, which nothing reads — the symptom being
 * that every theme silently rendered in the default typeface.
 */
const UNPREFIXED = /^(?:font-|radius-|names-scale$|names-leading$|names-stroke$)/;

export function themeStyle(key: string | null | undefined): React.CSSProperties {
  const theme = resolveTheme(key);
  return Object.fromEntries(
    Object.entries(theme.tokens).map(([name, value]) => [
      UNPREFIXED.test(name) ? `--${name}` : `--color-${name}`,
      value,
    ]),
  ) as React.CSSProperties;
}

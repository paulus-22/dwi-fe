import type { CSSProperties } from "react";

/**
 * Themes for GENERIC (corporate) events. Deliberately separate from the
 * wedding registry in `themes.ts` (envelope covers, botanicals, couple names…):
 * a theme here is a handful of colour tokens plus a shape language. Block
 * components read them through the `--g-*` custom properties that
 * `genericThemeStyle` puts on the page wrapper, so a block never branches on
 * colours — only on layout where the two designs genuinely differ.
 */

export type GenericThemeKey = "corporate-classic" | "corporate-soft" | "editorial";

export type GenericTheme = {
  key: GenericThemeKey;
  label: string;
  description: string;
  /**
   * sharp = hairline/2px corners; soft = rounded cards, pill buttons;
   * editorial = flat square sans-serif "conference" layout with a sticky nav.
   */
  shape: "sharp" | "soft" | "editorial";
  /** Dark brand colour: hero, dark sections, primary buttons. */
  navy: string;
  /** Lighter navy for gradients. */
  navy2: string;
  /** Accent on dark backgrounds. */
  gold: string;
  /** Accent for text/lines on light backgrounds (darker, readable). */
  goldInk: string;
  /** Page background. */
  paper: string;
  /** Alternate (tinted) section background. */
  cream: string;
  /** Hairlines. */
  line: string;
  ink: string;
  muted: string;
  /** Maximum width of the page column (px), matching the mockups. */
  column: number;
  radius: { control: string; card: string; pill: string };
};

export const GENERIC_THEMES: Record<GenericThemeKey, GenericTheme> = {
  "corporate-classic": {
    key: "corporate-classic",
    label: "Corporate Classic",
    description: "Sudut tegas, biru navy, tipografi serif.",
    shape: "sharp",
    navy: "#101c2c",
    navy2: "#17283d",
    gold: "#c8ad78",
    goldInk: "#a58a56",
    paper: "#ffffff",
    cream: "#f5f2eb",
    line: "#e7e4dc",
    ink: "#172235",
    muted: "#626c78",
    column: 520,
    radius: { control: "2px", card: "0px", pill: "2px" },
  },
  "corporate-soft": {
    key: "corporate-soft",
    label: "Corporate Soft",
    description: "Sudut membulat, tombol pil, nuansa emas.",
    shape: "soft",
    navy: "#101a2b",
    navy2: "#203754",
    gold: "#efd49a",
    goldInk: "#a9782b",
    paper: "#fbfaf7",
    cream: "#f3f0e9",
    line: "#e8e2d7",
    ink: "#172033",
    muted: "#59616d",
    column: 480,
    radius: { control: "10px", card: "16px", pill: "999px" },
  },
  editorial: {
    key: "editorial",
    label: "Editorial",
    description: "Konferensi modern: navbar menempel, penomoran bagian, tombol datar.",
    shape: "editorial",
    navy: "#112235",
    navy2: "#1d3652",
    // No gold in this palette: the accent slots carry a cool steel blue instead.
    gold: "#9db7d3",
    goldInk: "#2f5f93",
    paper: "#ffffff",
    cream: "#f2f4f6",
    line: "#dde2e8",
    ink: "#112235",
    muted: "#5d6977",
    column: 1080,
    radius: { control: "0px", card: "0px", pill: "0px" },
  },
};

export const GENERIC_THEME_LIST: GenericTheme[] = Object.values(GENERIC_THEMES);
export const DEFAULT_GENERIC_THEME: GenericThemeKey = "corporate-classic";

/** Unknown/missing values (older API, hand-edited data) fall back to the default. */
export function resolveGenericTheme(key: string | null | undefined): GenericTheme {
  return key && key in GENERIC_THEMES ? GENERIC_THEMES[key as GenericThemeKey] : GENERIC_THEMES[DEFAULT_GENERIC_THEME];
}

/** Custom properties for the page wrapper; see the `.gt-*` rules in globals.css. */
export function genericThemeStyle(t: GenericTheme): CSSProperties {
  return {
    "--g-navy": t.navy,
    "--g-navy2": t.navy2,
    "--g-gold": t.gold,
    "--g-gold-ink": t.goldInk,
    "--g-paper": t.paper,
    "--g-cream": t.cream,
    "--g-line": t.line,
    "--g-ink": t.ink,
    "--g-muted": t.muted,
    "--g-r-ctl": t.radius.control,
    "--g-r-card": t.radius.card,
    "--g-r-pill": t.radius.pill,
  } as CSSProperties;
}

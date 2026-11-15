import {
  Cormorant_Upright,
  Instrument_Serif,
  Jost,
  Parisienne,
  Playfair_Display,
} from "next/font/google";

/**
 * Display face — couple names, section headings.
 * Only 300 (`.display`) and 400 (admin headings) are used; loading the heavier
 * cuts shipped ~60KB of woff2 for nothing.
 */
export const cormorant = Cormorant_Upright({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

/** Body face — every paragraph and quote on the invitation. */
export const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400"],
  display: "swap",
});

/** UI face — kickers, buttons, form labels, the admin dashboard. */
export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Display face for the "modern" pairing — higher contrast, more architectural. */
export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Script face for couple names in the "romantic" pairing.
 *
 * Only the names use it. A script at body or heading size is barely legible,
 * so themes point `font-names` here while leaving `font-display` on a serif.
 */
export const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const fontVariables = `${cormorant.variable} ${instrument.variable} ${jost.variable} ${playfair.variable} ${parisienne.variable}`;

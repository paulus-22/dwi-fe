import type { OrnamentFamily } from "@/lib/themes";

import {
  BotanicalCrest,
  BotanicalPosy,
  BotanicalSpray,
  BotanicalSprig,
} from "./botanical";
import { DecoCrest, DecoPosy, DecoSpray, DecoSprig } from "./deco";
import { MinimalCrest, MinimalPosy, MinimalSpray, MinimalSprig } from "./minimal";
import {
  RoseBackdrop,
  RoseCrest,
  RosePosy,
  RoseSpray,
  RoseSprig,
  type BackdropTone,
} from "./rose";

/**
 * Ornament resolution.
 *
 * Every family exposes the same shapes at the same call sites — spray for
 * corners, crest for headers, posy for section corners, sprig for dividers,
 * backdrop for the ground behind a band — so a theme swaps the whole
 * illustration language without any section knowing which family it is
 * rendering.
 */
export type OrnamentSet = {
  Spray: typeof BotanicalSpray;
  Crest: typeof BotanicalCrest;
  Posy: typeof BotanicalPosy;
  Sprig: typeof BotanicalSprig;
  Backdrop: (props: { tone: BackdropTone }) => React.ReactNode;
};

export type { BackdropTone };

/** Families drawn before backdrops existed keep their plain bands. */
function NoBackdrop() {
  return null;
}

const SETS: Record<OrnamentFamily, OrnamentSet> = {
  botanical: {
    Spray: BotanicalSpray,
    Crest: BotanicalCrest,
    Posy: BotanicalPosy,
    Sprig: BotanicalSprig,
    Backdrop: NoBackdrop,
  },
  deco: {
    Spray: DecoSpray,
    Crest: DecoCrest,
    Posy: DecoPosy,
    Sprig: DecoSprig,
    Backdrop: NoBackdrop,
  },
  minimal: {
    Spray: MinimalSpray,
    Crest: MinimalCrest,
    Posy: MinimalPosy,
    Sprig: MinimalSprig,
    Backdrop: NoBackdrop,
  },
  rose: {
    Spray: RoseSpray,
    Crest: RoseCrest,
    Posy: RosePosy,
    Sprig: RoseSprig,
    Backdrop: RoseBackdrop,
  },
};

export function ornamentSet(family: OrnamentFamily): OrnamentSet {
  return SETS[family] ?? SETS.botanical;
}

export { Divider } from "./botanical";

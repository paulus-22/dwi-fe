import type { Dictionary } from "@/i18n/dictionaries";

import { MountedPhoto } from "./photo";
import { Reveal } from "./reveal";

export function DressCode({
  note,
  colors,
  imageUrl,
  dict,
}: {
  note: string;
  colors: string[];
  /** A reference sheet: what the palette actually looks like as clothing. */
  imageUrl: string | null;
  dict: Dictionary;
}) {
  if (!note && colors.length === 0 && !imageUrl) return null;

  return (
    <div className="text-center">
      {colors.length > 0 ? (
        <Reveal variant="zoom-in">
          {/* Inline size: `.kicker` sets its own 10px and wins over a class. */}
          <p className="kicker mb-5 text-cream/80" style={{ fontSize: 12 }}>
            {dict.dressCode.paletteNote}
          </p>
          <div className="flex justify-center gap-0">
            {colors.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="size-14 rounded-full border-2 border-cream/80 shadow-[0_0_0_1px_rgba(53,58,32,0.35)]"
                style={{ background: color, marginLeft: index === 0 ? 0 : "-12px" }}
                title={color}
              />
            ))}
          </div>
        </Reveal>
      ) : null}

      {note ? (
        <Reveal variant="fade-up" delay={140}>
          {/* Weighted by colour, size and a hairline stroke rather than
              `font-bold`: the body face ships in 400 only, so a bold would be
              the browser smearing the strokes. */}
          {/* Larger than body copy elsewhere: it is the one instruction guests
              act on, so it should read before the swatches are admired. */}
          <p className="mx-auto mt-7 max-w-[28ch] text-[21px] leading-[1.55] text-cream [-webkit-text-stroke:0.3px_currentColor]">
            {note}
          </p>
        </Reveal>
      ) : null}

      {imageUrl ? (
        <Reveal variant="fade-up" delay={240}>
          <div className="mx-auto mt-8 max-w-[20rem]">
            <MountedPhoto
              src={imageUrl}
              alt={dict.dressCode.imageAlt}
              ratio={1.09}
              tone="cream"
              sizes="(max-width: 460px) 85vw, 320px"
            />
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}

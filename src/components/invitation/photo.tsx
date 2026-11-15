import Image from "next/image";

import { NaturalPhoto } from "./natural-photo";
import { Reveal } from "./reveal";

/**
 * A framed photograph on the invitation.
 *
 * Photo URLs are admin input, so they may point anywhere. `next/image` throws
 * at request time for a host that is not in `images.remotePatterns` — on a
 * public invitation that is a 500, not a broken image — so only same-origin
 * paths go through the optimiser and anything else falls back to a plain
 * `<img>`. Both paths get the same frame and the same reserved space, so a
 * late-loading photo never shifts the section under it.
 */

type Frame = "arch" | "soft" | "square" | "round";

const FRAME_CLASS: Record<Frame, string> = {
  // The printed card's shape: a tall window closed with a half-round top.
  arch: "rounded-t-[999px] rounded-b-[--radius-frame]",
  soft: "rounded-[--radius-frame]",
  square: "",
  round: "rounded-full",
};

/** Same-origin paths can be optimised; everything else cannot be trusted to. */
function isLocal(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

/**
 * The image itself, with no frame. Absolutely positioned, so every caller
 * supplies its own sized, `relative`, overflow-hidden box.
 */
export function PhotoImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (isLocal(src)) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the note above
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className="absolute inset-0 size-full object-cover"
    />
  );
}

export function Photo({
  src,
  alt,
  ratio,
  frame = "soft",
  className,
  priority = false,
  sizes = "(max-width: 460px) 100vw, 460px",
  natural = false,
  headroom,
}: {
  src: string;
  /** Empty for a purely decorative photo; it carries no information. */
  alt: string;
  /** width / height. Reserves the space before the file arrives. */
  ratio: number;
  frame?: Frame;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /**
   * Let the frame take the photo's own shape once it loads, with `ratio` held
   * until then. For admin-supplied photos of any shape.
   */
  natural?: boolean;
  /** With `natural`: space above the photo so an arch clears the heads. */
  headroom?: number;
}) {
  const shape = `${FRAME_CLASS[frame]} ${className ?? ""}`.trim();

  if (natural) {
    return (
      <NaturalPhoto
        src={src}
        alt={alt}
        sizes={sizes}
        fallbackRatio={ratio}
        priority={priority}
        headroom={headroom}
        className={`bg-petal-shade ${shape}`}
      />
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-petal-shade ${shape}`}
      style={{ aspectRatio: ratio }}
    >
      <PhotoImage src={src} alt={alt} sizes={sizes} priority={priority} />
    </div>
  );
}

/**
 * A photo inside a hairline border, offset so the rule reads as a mount rather
 * than an outline. Used where the photo sits on cream or on the dark band.
 */
export function MountedPhoto({
  tone = "line",
  ...props
}: Parameters<typeof Photo>[0] & { tone?: "line" | "cream" }) {
  return (
    <div
      className={
        tone === "cream"
          ? "rounded-[--radius-frame] border border-cream/30 p-1.5"
          : "rounded-[--radius-frame] border border-champagne p-1.5"
      }
    >
      <Photo {...props} />
    </div>
  );
}

/**
 * A full-bleed photograph between two sections.
 *
 * Not illustration and not content — a breath, where the column stops being a
 * document for a moment. It is edge to edge because an inset photo reads as
 * another block of content; the whole point is that the reading stops.
 *
 * The image is taller than its frame and drifts inside it as the page scrolls,
 * which is the one place the spec allows parallax on photography. The overhang
 * is sized to the travel, so no edge is ever exposed.
 *
 * The band takes the photo's own shape. It used to be fixed just off square,
 * which cut nearly a third off a 2:3 portrait; now only the parallax overhang
 * is trimmed. Clamped between 2:3 and 16:10 so the band stays a pause in the
 * reading rather than a wall or a sliver.
 */
export function Interlude({
  src,
  ratio = 1.1,
  alt = "",
}: {
  src: string;
  /** Held until the photo loads and its own shape is known. */
  ratio?: number;
  alt?: string;
}) {
  return (
    <Reveal variant="wipe" as="section" className="relative block overflow-hidden bg-petal-shade">
      {/* 20px of overhang top and bottom for 20px of travel. */}
      <NaturalPhoto
        src={src}
        alt={alt}
        sizes="(max-width: 460px) 100vw, 460px"
        fallbackRatio={ratio}
        minRatio={2 / 3}
        maxRatio={1.6}
        parallax={20}
      />
    </Reveal>
  );
}

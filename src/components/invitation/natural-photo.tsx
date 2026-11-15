"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { Parallax } from "./parallax";

/**
 * A photo whose frame takes the shape of the photo.
 *
 * Fixed frames cropped whatever did not match them: a 3:4 gift photo in a
 * square lost a quarter of its height, a 2:3 portrait in the interlude band
 * lost nearly a third. The frame reserves `fallbackRatio` until the file
 * arrives, then settles on the photo's own width / height — clamped, so one
 * extreme panorama or phone screenshot cannot take over the page.
 */
export function NaturalPhoto({
  src,
  alt,
  sizes,
  fallbackRatio,
  minRatio = 0.6,
  maxRatio = 1.8,
  parallax = 0,
  priority = false,
  headroom = 0,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  fallbackRatio: number;
  minRatio?: number;
  maxRatio?: number;
  /** Pixels of scroll drift; the image overhangs the frame by this much. */
  parallax?: number;
  /** Above the fold: fetch now rather than when scrolled near. */
  priority?: boolean;
  /**
   * Extra space above the photo, as a fraction of the frame's width, filled
   * with the colour of the photo's top edge. An arch's round top otherwise
   * clips whatever sits high in the picture — usually the heads.
   */
  headroom?: number;
  className?: string;
}) {
  const [ratio, setRatio] = useState(fallbackRatio);
  const [edge, setEdge] = useState<string>();

  const measure = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img?.naturalWidth || !img.naturalHeight) return;
      const natural = img.naturalWidth / img.naturalHeight;
      setRatio(Math.min(maxRatio, Math.max(minRatio, natural)));
      if (headroom) setEdge(topEdgeColour(img));
    },
    [minRatio, maxRatio, headroom],
  );

  // A cached image can finish loading before hydration, when `onLoad` has
  // nothing attached yet; the ref sees it already complete and measures then.
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete) measure(img);
    },
    [measure],
  );
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => measure(e.currentTarget);

  const local = src.startsWith("/") && !src.startsWith("//");
  const image = local ? (
    <Image ref={ref} src={src} alt={alt} fill sizes={sizes} priority={priority} onLoad={onLoad} className="object-cover" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- external hosts cannot go through the optimiser (see photo.tsx)
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onLoad={onLoad}
      className="absolute inset-0 size-full object-cover"
    />
  );

  if (headroom) {
    return (
      <div
        className={`relative w-full overflow-hidden ${className}`}
        style={{ aspectRatio: 1 / (1 / ratio + headroom), backgroundColor: edge }}
      >
        <div className="absolute inset-x-0 bottom-0" style={{ aspectRatio: ratio }}>
          {image}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: ratio }}>
      {parallax ? (
        <Parallax offset={parallax} className="absolute inset-0 block">
          <span className="absolute inset-0 block" style={{ top: -parallax, bottom: -parallax }}>
            {image}
          </span>
        </Parallax>
      ) : (
        image
      )}
    </div>
  );
}

/**
 * Average colour of the photo's top row, so the headroom reads as more of the
 * photo's own background. Undefined when the pixels cannot be read (a host
 * without CORS taints the canvas); the frame's own background shows instead.
 */
function topEdgeColour(img: HTMLImageElement): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, img.naturalWidth, Math.max(1, img.naturalHeight * 0.02), 0, 0, 16, 1);
    const px = ctx.getImageData(0, 0, 16, 1).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < px.length; i += 4) {
      r += px[i];
      g += px[i + 1];
      b += px[i + 2];
    }
    const n = px.length / 4;
    return `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)})`;
  } catch {
    return undefined;
  }
}

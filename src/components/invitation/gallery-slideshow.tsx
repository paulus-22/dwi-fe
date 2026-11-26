"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pre-wedding photo slideshow. Full-width, theme-aware (reads the invitation's
 * `--color-*` tokens), auto-advances every 3s, and taps open a full-screen
 * lightbox with arrows + dots. Hidden when there are no photos.
 */
export function GallerySlideshow({ photos, label = "Galeri" }: { photos: string[]; label?: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = photos.length;
  const at = ((index % count) + count) % count;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // Auto-advance, paused whenever the pointer is over the deck or lightbox open.
  useEffect(() => {
    if (count <= 1 || paused || lightbox) return;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % count), 3000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, count, paused, lightbox]);

  if (count === 0) return null;

  const css = (
    <style
      dangerouslySetInnerHTML={{
        __html: `@keyframes galFade{from{opacity:0;transform:scale(1.035)}to{opacity:1;transform:scale(1)}}
.gal-fade{animation:galFade .7s cubic-bezier(.2,.7,.3,1) both}`,
      }}
    />
  );

  const dot = (i: number) => (
    <button
      key={i}
      type="button"
      aria-label={`Foto ${i + 1}`}
      onClick={() => go(i)}
      style={{
        width: 7,
        height: 7,
        borderRadius: 99,
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: i === at ? "var(--color-peach)" : "var(--color-line, var(--color-ink-soft, rgba(0,0,0,.25)))",
        transition: "background .2s",
      }}
    />
  );

  const deck = (
    <>
      <div
        className="relative w-full select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Perbesar foto"
          className="block w-full cursor-zoom-in overflow-hidden rounded-[calc(var(--radius,18px)*0.8)]"
          style={{ aspectRatio: "3 / 4", background: "var(--color-olive-mid, #eee)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`deck-${at}`}
            src={photos[at]}
            alt={label}
            loading="lazy"
            className="gal-fade h-full w-full object-cover"
            style={{ transform: "scale(1.001)" }}
          />
        </button>

        {/* Arrows */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-2 my-auto flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-olive-deep, #000) 60%, transparent)", color: "var(--color-cream)" }}
          onClick={() => go(at - 1)}
        >
          ←
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 end-2 my-auto flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-olive-deep, #000) 60%, transparent)", color: "var(--color-cream)" }}
          onClick={() => go(at + 1)}
        >
          →
        </span>

        <span
          className="pointer-events-none absolute end-3 top-3 rounded-full px-2 py-0.5 text-[11px]"
          style={{ background: "color-mix(in srgb, var(--color-olive-deep, #000) 55%, transparent)", color: "var(--color-cream)" }}
        >
          {at + 1} / {count}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">{photos.map((_, i) => dot(i))}</div>
    </>
  );

  // Lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, count]);

  if (!lightbox) return <>{css}{deck}</>;

  return <>{css}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.9)" }}
      onClick={() => setLightbox(false)}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={`light-${at}`} src={photos[at]} alt={label} className="gal-fade mx-auto max-h-[82dvh] max-w-full rounded-lg object-contain" />
        <div className="mt-3 flex items-center justify-center gap-6 text-white">
          <button type="button" onClick={() => go(at - 1)} className="text-2xl" aria-label="Sebelumnya">←</button>
          <button type="button" onClick={() => setLightbox(false)} className="text-sm underline" aria-label="Tutup">Tutup</button>
          <button type="button" onClick={() => go(at + 1)} className="text-2xl" aria-label="Berikutnya">→</button>
        </div>
      </div>
    </div>
  </>;
}

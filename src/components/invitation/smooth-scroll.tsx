"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * One Lenis instance for the whole invitation. The spec is explicit that each
 * section must not spin up its own — a single smoothed scroll position is what
 * keeps the reveals feeling synchronised.
 *
 * `enabled` is false while the envelope gate is closed, so the cover cannot be
 * scrolled past before it is opened.
 */
export function SmoothScroll({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    // Smoothing fights assistive tech and vestibular sensitivity; the spec
    // says to turn Lenis off entirely rather than merely shorten it.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [enabled]);

  return null;
}

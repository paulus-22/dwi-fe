"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll parallax for decoration only. The spec caps the travel at a few tens
 * of pixels — enough to give depth, not enough to read as a 3D page — and
 * limits it to hero backgrounds, large photography, and florals.
 *
 * Positions are written straight to the style on a rAF tick rather than through
 * state, so scrolling never queues a React render.
 */
export function Parallax({
  children,
  offset = 30,
  className,
}: {
  children: ReactNode;
  /** Total travel in pixels across the element's time on screen. */
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      // -1 just above the viewport, +1 just below it.
      const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      const clamped = Math.max(-1, Math.min(1, progress));
      node.style.transform = `translate3d(0, ${(clamped * offset).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [offset]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {children}
    </span>
  );
}

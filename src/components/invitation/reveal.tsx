"use client";

import { useCallback, type ElementType, type ReactNode } from "react";

export type RevealVariant =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  /** Editorial page-turn wipe, for images and map frames. */
  | "wipe"
  /** A rule that draws itself downward, for the story timeline. */
  | "grow-y";

/**
 * Reveals its children once they scroll into view. One observer is created per
 * element via a ref callback — cheap at this page's element count, and it means
 * no effect has to re-run when the tree changes.
 */
export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  /** Stagger, in milliseconds. */
  delay?: number;
  duration?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    // Without IntersectionObserver the content must still be readable.
    if (typeof IntersectionObserver === "undefined") {
      node.setAttribute("data-revealed", "");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          // Reveal once — re-animating on scroll-back is distracting.
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={className}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        transitionDuration: duration ? `${duration}ms` : undefined,
      }}
    >
      {children}
    </Tag>
  );
}

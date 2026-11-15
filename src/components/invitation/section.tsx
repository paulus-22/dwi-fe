import type { ReactNode } from "react";

import { Divider, type OrnamentSet } from "@/components/motif";

import { Parallax } from "./parallax";
import { Reveal } from "./reveal";

/**
 * A page band. `tone="olive"` flips the section to the deep-olive background
 * with cream text — the reference alternates these against white to pace the
 * scroll.
 */
export function Section({
  id,
  title,
  kicker,
  intro,
  children,
  tone = "paper",
  divider = true,
  posy = "none",
  ornaments,
}: {
  id?: string;
  title?: string;
  kicker?: string;
  intro?: string;
  children?: ReactNode;
  tone?: "paper" | "olive" | "cream";
  divider?: boolean;
  /** Corner posy placement. Sections alternate sides down the page. */
  posy?: "none" | "left" | "right" | "both";
  ornaments: OrnamentSet;
}) {
  const { Backdrop, Posy, Sprig } = ornaments;
  const toneClass =
    tone === "olive"
      ? "bg-olive-deep text-ink-cream"
      : tone === "cream"
        ? "bg-cream text-ink"
        : "bg-paper text-ink";

  const mutedClass = tone === "olive" ? "text-cream/65" : "text-ink-soft";
  const ruleTone = tone === "olive" ? "rgba(245,240,232,0.28)" : "var(--color-champagne)";

  const showLeft = posy === "left" || posy === "both";
  const showRight = posy === "right" || posy === "both";

  return (
    <section id={id} className={`relative isolate overflow-hidden px-7 py-16 ${toneClass}`}>
      <Backdrop tone={tone} />
      {showLeft ? (
        <Parallax offset={22} className="pointer-events-none absolute -left-12 top-8 block">
          <Posy className="float-slow opacity-60" width={96} height={96} />
        </Parallax>
      ) : null}
      {showRight ? (
        <Parallax offset={-20} className="pointer-events-none absolute -right-12 bottom-8 block">
          <Posy
            className="float-slower opacity-60"
            width={96}
            height={96}
            mirrored
          />
        </Parallax>
      ) : null}

      {/* Content sits above the decoration. */}
      <div className="relative">
        {divider ? (
          <Reveal variant="zoom-in">
            <Divider className="mb-10" tone={ruleTone} Sprig={Sprig} />
          </Reveal>
        ) : null}

        {kicker ? (
          <Reveal variant="fade-up" delay={80}>
            <p
              className={`kicker text-center ${
                tone === "olive" ? "text-peach" : "text-peach-ink"
              }`}
            >
              {kicker}
            </p>
          </Reveal>
        ) : null}

        {title ? (
          <Reveal variant="fade-up" delay={160}>
            <h2 className="display mt-3 text-center text-[38px] leading-tight">{title}</h2>
          </Reveal>
        ) : null}

        {intro ? (
          <Reveal variant="fade-up" delay={240}>
            <p
              className={`mx-auto mt-5 max-w-[34ch] text-center text-[15px] leading-relaxed ${mutedClass}`}
            >
              {intro}
            </p>
          </Reveal>
        ) : null}

        {children ? <div className={title || intro ? "mt-9" : ""}>{children}</div> : null}
      </div>
    </section>
  );
}

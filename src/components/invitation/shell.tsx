"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import type { AppLocale } from "@/i18n/dictionaries";

import { ornamentSet, type OrnamentSet } from "@/components/motif";
import type { CoverStyle, OrnamentFamily } from "@/lib/themes";

import { Cover } from "./cover";
import { ArchCover, CardCover } from "./cover-variants";
import { KeepsakeCover } from "./keepsake-cover";
import { MusicButton, useBackgroundMusic } from "./music";
import { SmoothScroll } from "./smooth-scroll";

export type CoverCopy = {
  brideName: string;
  groomName: string;
  hashtag: string | null;
  dateLabel: string;
  guestName: string | null;
  greeting: string;
  salutation: string;
  kicker: string;
  openLabel: string;
  /** The couple portrait; the keepsake cover tucks it into the envelope. */
  photoUrl: string | null;
  /** Full-bleed photo behind the keepsake cover. */
  backgroundUrl: string | null;
};

export type QuickPassBar = {
  href: string;
  /** True when the guest already has an issued pass on initial load. */
  initiallyReady: boolean;
  /** True when passMode === "DIRECT" (pass stays issued regardless of RSVP). */
  alwaysReady?: boolean;
  badgeLabel: string;
  ctaLabel: string;
};

/**
 * Holds the envelope gate. The cover fills the viewport and the invitation
 * stays mounted-but-hidden until it is opened — that tap doubles as the user
 * gesture browsers require before audio may start.
 */
export function InvitationShell({
  cover,
  children,
  locale,
  showLocaleSwitch = true,
  coverStyle,
  ornamentFamily,
  musicUrl,
  musicLabels,
  quickPass,
}: {
  cover: CoverCopy;
  children: ReactNode;
  locale: AppLocale;
  /** False for a single-language invitation. */
  showLocaleSwitch?: boolean;
  coverStyle: CoverStyle;
  /**
   * The family name, not the components. Component functions cannot cross the
   * server/client boundary, so the set is resolved here inside the client.
   */
  ornamentFamily: OrnamentFamily;
  musicUrl?: string | null;
  musicLabels: { play: string; pause: string };
  quickPass?: QuickPassBar | null;
}) {
  const ornaments = ornamentSet(ornamentFamily);
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const opened = phase === "open";
  const music = useBackgroundMusic(musicUrl);
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
  const passReady = Boolean(
    quickPass && (quickPass.alwaysReady || (rsvpAttending ?? quickPass.initiallyReady)),
  );

  useEffect(() => {
    function onRsvpStatus(e: Event) {
      const detail = (e as CustomEvent<{ attending?: boolean }>).detail;
      if (typeof detail?.attending === "boolean") {
        setRsvpAttending(detail.attending);
      }
    }
    window.addEventListener("dwi:rsvp-status", onRsvpStatus);
    return () => window.removeEventListener("dwi:rsvp-status", onRsvpStatus);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", !opened);
    return () => document.body.classList.remove("scroll-locked");
  }, [opened]);

  function open() {
    if (phase !== "closed") return;

    // The opening sequence is flap (1100ms) → card lifts (from 420ms) → the
    // whole cover recedes (from 700ms). Skip straight through it when the
    // visitor has asked for reduced motion.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Here, not after the timeout: only inside the tap may audio start.
    music.start();
    setPhase("opening");
    window.setTimeout(
      () => {
        setPhase("open");
        window.scrollTo({ top: 0 });
      },
      reduced ? 0 : 1700,
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px] bg-paper text-ink shadow-[0_0_60px_rgba(53,58,32,0.08)]">
      <SmoothScroll enabled={opened} />
      {!opened ? (
        <div className="safe-area">
          <CoverForStyle
            style={coverStyle}
            ornaments={ornaments}
            cover={cover}
            voucherHref={passReady && quickPass ? quickPass.href : null}
            voucherLabel={quickPass?.ctaLabel}
            opening={phase === "opening"}
            onOpen={open}
          />
        </div>
      ) : null}

      {/*
        `inert` is what actually seals the invitation: it removes the subtree
        from the tab order and the accessibility tree together. `aria-hidden`
        alone hid it from screen readers while leaving every input, link and
        button reachable by Tab from behind the closed envelope.
      */}
      <div
        className={
          opened
            ? "animate-[invitation-enter_900ms_cubic-bezier(0.16,1,0.3,1)_both]"
            : "h-0 overflow-hidden"
        }
        inert={!opened}
      >
        {opened && passReady && quickPass ? (
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-champagne/30 bg-olive-deep/95 px-4 py-2.5 backdrop-blur">
            <span className="flex min-w-0 items-center gap-2 font-ui text-[10px] uppercase tracking-[0.18em] text-cream/85">
              <span className="inline-block size-1.5 shrink-0 rounded-full bg-peach" aria-hidden="true" />
              <span className="truncate">{quickPass.badgeLabel}</span>
            </span>
            <Link
              href={quickPass.href}
              className="inline-flex shrink-0 items-center gap-1.5 border border-peach bg-peach px-3.5 py-1.5 font-ui text-[10px] uppercase tracking-[0.2em] text-peach-text transition-colors hover:bg-transparent hover:text-peach"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="9.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="1.5" y="9.5" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M9.5 9.5h2v2h-2zM12.5 9.5h2v2h-2zM9.5 12.5h2v2h-2zM12.5 12.5h2v2h-2z" fill="currentColor" />
              </svg>
              {quickPass.ctaLabel}
            </Link>
          </div>
        ) : null}
        {children}
      </div>

      {/* Docked controls. Kept outside the gated subtree so they are never
          focusable while hidden, and bottom-anchored so they never collide
          with a centred section heading. */}
      <div className="fixed bottom-5 left-1/2 z-30 w-full max-w-[460px] -translate-x-1/2 px-5">
        <div className="flex items-end justify-between">
          {showLocaleSwitch ? <LocaleSwitch locale={locale} /> : <span />}
          {opened && musicUrl ? (
            <MusicButton playing={music.playing} onToggle={music.toggle} labels={musicLabels} />
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}

/** The opening gesture is most of a theme's first impression, so each style
 *  owns its own rather than re-skinning one. */
function CoverForStyle({
  style,
  ornaments,
  cover,
  voucherHref,
  voucherLabel,
  opening,
  onOpen,
}: {
  style: CoverStyle;
  ornaments: OrnamentSet;
  cover: CoverCopy;
  voucherHref?: string | null;
  voucherLabel?: string;
  opening: boolean;
  onOpen: () => void;
}) {
  const shared = { ...cover, voucherHref, voucherLabel, opening, onOpen, ornaments };

  if (style === "arch") return <ArchCover {...shared} />;
  if (style === "card") return <CardCover {...shared} />;
  if (style === "keepsake") return <KeepsakeCover {...shared} />;
  return <Cover {...shared} />;
}

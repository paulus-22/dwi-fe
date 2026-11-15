"use client";

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
}) {
  const ornaments = ornamentSet(ornamentFamily);
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const opened = phase === "open";
  const music = useBackgroundMusic(musicUrl);

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
  opening,
  onOpen,
}: {
  style: CoverStyle;
  ornaments: OrnamentSet;
  cover: CoverCopy;
  opening: boolean;
  onOpen: () => void;
}) {
  const shared = { ...cover, opening, onOpen, ornaments };

  if (style === "arch") return <ArchCover {...shared} />;
  if (style === "card") return <CardCover {...shared} />;
  if (style === "keepsake") return <KeepsakeCover {...shared} />;
  return <Cover {...shared} />;
}

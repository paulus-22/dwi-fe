"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Comfortable rather than full: guests open these at work and in bed. */
const VOLUME = 0.7;
const FADE_IN_MS = 2500;
const RESUME_FADE_MS = 800;

/**
 * Background music for the invitation.
 *
 * Nothing is fetched until the guest opens the envelope, so the cover stays
 * as light as it was; the file then streams, and plays as soon as the first
 * seconds arrive rather than after the whole song. `start` must be called
 * inside the opening tap itself — that tap is the gesture browsers require
 * before audio may play, and a timeout in between would forfeit it.
 *
 * The song pauses while the tab is hidden (a switch to WhatsApp, a locked
 * phone) and resumes on return, unless the guest paused it themselves. If the
 * browser refuses to play — iOS in silent mode, a strict autoplay setting —
 * the button simply stays on "play", and a tap on it is the way in.
 */
export function useBackgroundMusic(src: string | null | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef(0);
  const pausedByGuest = useRef(false);
  const resumeOnReturn = useRef(false);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(
    (fadeMs: number) => {
      if (!src) return;
      if (!audioRef.current) {
        const audio = new Audio(src);
        audio.loop = true;
        // Follow the element rather than our own calls, so a pause from the
        // lock screen, a phone call or a headset button shows on the button.
        audio.addEventListener("play", () => setPlaying(true));
        audio.addEventListener("pause", () => setPlaying(false));
        audioRef.current = audio;
      }
      const audio = audioRef.current;

      cancelAnimationFrame(fadeRef.current);
      // iOS ignores `volume` (the hardware buttons own it), so there the song
      // simply starts at full level; everywhere else it rises in.
      audio.volume = 0;
      const begin = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - begin) / fadeMs);
        audio.volume = VOLUME * t * t;
        if (t < 1) fadeRef.current = requestAnimationFrame(step);
      };

      audio
        .play()
        .then(() => {
          fadeRef.current = requestAnimationFrame(step);
        })
        .catch(() => {
          audio.volume = VOLUME;
        });
    },
    [src],
  );

  const start = useCallback(() => {
    pausedByGuest.current = false;
    play(FADE_IN_MS);
  }, [play]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      pausedByGuest.current = true;
      cancelAnimationFrame(fadeRef.current);
      audio.pause();
      return;
    }
    pausedByGuest.current = false;
    play(RESUME_FADE_MS);
  }, [play]);

  useEffect(() => {
    function onVisibility() {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        resumeOnReturn.current = !audio.paused;
        cancelAnimationFrame(fadeRef.current);
        audio.pause();
      } else if (resumeOnReturn.current && !pausedByGuest.current) {
        resumeOnReturn.current = false;
        play(RESUME_FADE_MS);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [play]);

  useEffect(
    () => () => {
      cancelAnimationFrame(fadeRef.current);
      audioRef.current?.pause();
    },
    [],
  );

  return { playing, start, toggle };
}

/** A turning record while the song plays, a still note while it is paused. */
export function MusicButton({
  playing,
  onToggle,
  labels,
}: {
  playing: boolean;
  onToggle: () => void;
  labels: { play: string; pause: string };
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? labels.pause : labels.play}
      aria-pressed={playing}
      className="flex size-10 items-center justify-center rounded-full border border-olive-deep/20 bg-paper/90 text-olive-deep shadow-md backdrop-blur"
    >
      {playing ? (
        <span className="animate-[spin_6s_linear_infinite] motion-reduce:animate-none">
          <DiscIcon />
        </span>
      ) : (
        <NoteIcon />
      )}
    </button>
  );
}

function DiscIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" className="block">
      <circle cx="11" cy="11" r="10" fill="currentColor" />
      <circle cx="11" cy="11" r="7" stroke="var(--color-paper)" strokeOpacity="0.25" strokeWidth="0.6" />
      <circle cx="11" cy="11" r="5" stroke="var(--color-paper)" strokeOpacity="0.25" strokeWidth="0.6" />
      {/* An off-centre highlight is what makes the turning visible. */}
      <path d="M11 2.5a8.5 8.5 0 0 1 7.4 4.3" stroke="var(--color-paper)" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
      <circle cx="11" cy="11" r="3" fill="var(--color-peach)" />
      <circle cx="11" cy="11" r="0.9" fill="var(--color-paper)" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 12V3.5L13 2v8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4.5" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.5" cy="10.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

import { useEffect, useMemo, useState } from "react";

import { usePhotos } from "./Gallery";
import { Icon } from "../components/ui";
import { api } from "../data/api";
import { store } from "../data/store";
import { useApp } from "../state";

type Item = { kind: "title" } | { kind: "photo"; id: string; url: string; caption: string | null };
type RemoteSlide = { id: string; url: string; contentType: string };
type RemoteSelfie = { id: string; url: string; householdName: string | null };

/**
 * Standby slideshow for the scan screen. It replaces the live camera while
 * nobody is at the door: guests walking up see the couple, not themselves on a
 * hunting viewfinder, and with the camera off nothing is being filmed.
 *
 * When the device is paired online, slides and guest selfies come from R2 so
 * every door shows the same content (uploaded from the dashboard). Offline, it
 * falls back to this device's local slides and photos.
 *
 * Tap anywhere to go back to scanning. In "watch" mode the camera keeps
 * decoding behind this screen and a held-up QR wakes it by itself.
 */
export function IdleSlideshow({ onWake, watching }: { onWake(): void; watching: boolean }) {
  const { pairing, idle, version } = useApp();
  const selfies = usePhotos(15_000);
  const [slides, setSlides] = useState<{ id: string; url: string }[]>([]);
  const [remoteSlides, setRemoteSlides] = useState<RemoteSlide[]>([]);
  const [remoteSelfies, setRemoteSelfies] = useState<RemoteSelfie[]>([]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let urls: string[] = [];
    void store.getSlides().then((list) => {
      const next = list.map((s) => ({ id: s.id, url: URL.createObjectURL(s.blob) }));
      urls = next.map((n) => n.url);
      setSlides(next);
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [version]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Pull the R2 slideshow + every door's selfies whenever online. Local data
  // stays as the offline fallback, so a tablet without signal still shows its
  // own content. Refresh every 30s (new selfies arrive as guests check in).
  useEffect(() => {
    let stop = false;
    async function tick() {
      if (!api.live || !pairing) return;
      try {
        const [s, p] = await Promise.all([api.slideshow(pairing.event.id), api.photos(pairing.event.id)]);
        if (stop) return;
        setRemoteSlides(s.images);
        setRemoteSelfies(p.photos);
      } catch {
        /* offline → local fallback stays put */
      }
    }
    void tick();
    const t = setInterval(tick, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [pairing, version]);

  // Title card, then the couple's photos and the latest guest selfies, with
  // the title coming back every few slides so a newcomer always learns whose
  // wedding this is. R2 content wins; local is the offline fallback.
  const items = useMemo<Item[]>(() => {
    const effSlides: { id: string; url: string }[] = remoteSlides.length ? remoteSlides : slides;
    const effSelfies: { id: string; url: string; householdName: string | null }[] = remoteSelfies.length
      ? remoteSelfies
      : selfies;
    const photos: Item[] = [
      ...effSlides.map((s) => ({ kind: "photo" as const, id: `s-${s.id}`, url: s.url, caption: null })),
      ...(idle.includeSelfies
        ? effSelfies
            .slice(0, 12)
            .map((s) => ({ kind: "photo" as const, id: `p-${s.id}`, url: s.url, caption: s.householdName }))
        : []),
    ];
    const out: Item[] = [{ kind: "title" }];
    photos.forEach((p, i) => {
      out.push(p);
      if ((i + 1) % 4 === 0 && i + 1 < photos.length) out.push({ kind: "title" });
    });
    return out;
  }, [slides, selfies, remoteSlides, remoteSelfies, idle.includeSelfies]);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), idle.slideSec * 1000);
    return () => clearInterval(t);
  }, [items.length, idle.slideSec]);

  const event = pairing?.event;
  const current = items[index % Math.max(items.length, 1)];

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden bg-night"
      // onClick, not onPointerDown: waking on pointer-down removes this layer
      // mid-tap and the click then lands on the button underneath.
      onClick={onWake}
      role="button"
      aria-label="Ketuk untuk mulai scan"
    >
      {items.map((item, i) =>
        item.kind === "photo" ? (
          <div
            key={`${item.id}-${i}`}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ${i === index ? "opacity-100" : "opacity-0"}`}
          >
            {i === index ? (
              <>
                {/* Blurred fill so portrait and landscape photos both cover the screen. */}
                <img src={item.url} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
                <img
                  src={item.url}
                  alt=""
                  className="kenburns absolute inset-0 h-full w-full object-contain"
                  style={{ animationDuration: `${idle.slideSec + 2}s` }}
                />
              </>
            ) : null}
          </div>
        ) : null,
      )}

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-opacity duration-[1500ms] ${
          current?.kind === "title" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(233,175,138,0.12),transparent_65%)]" />
        <p className="kicker relative text-peach">The wedding of</p>
        <h1 className="relative mt-4 font-display text-[clamp(52px,13vw,120px)] font-light leading-[0.95] text-cream">
          {event?.coupleLine.split("&").map((name, i, all) => (
            <span key={name} className="block">
              {name.trim()}
              {i < all.length - 1 ? <span className="block py-2 text-[0.45em] text-gold">&amp;</span> : null}
            </span>
          ))}
        </h1>
        {event?.dateLabel ? <p className="kicker relative mt-8 text-gold">{event.dateLabel}</p> : null}
        {event?.venue ? <p className="relative mt-2 text-[length:calc(15px*var(--fs))] text-cream-dim">{event.venue}</p> : null}
        {event?.hashtag ? <p className="relative mt-6 font-display text-[length:calc(24px*var(--fs))] text-peach">{event.hashtag}</p> : null}
      </div>

      {current?.kind === "photo" && current.caption ? (
        <p className="absolute left-6 top-[max(env(safe-area-inset-top),20px)] rounded-full bg-night/60 px-4 py-1.5 text-[length:calc(13px*var(--fs))] text-cream-dim backdrop-blur">
          {current.caption}
        </p>
      ) : null}
      <p className="absolute right-6 top-[max(env(safe-area-inset-top),20px)] text-[length:calc(14px*var(--fs))] tabular-nums text-cream-dim/70">
        {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </p>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/80 to-transparent px-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-20 text-center">
        <p className="font-display text-[length:calc(30px*var(--fs))] leading-tight text-cream">Selamat datang</p>
        <p className="mt-2 inline-flex items-center gap-2 text-[length:calc(16px*var(--fs))] text-cream-dim">
          <Icon name="qr" className="size-5 text-peach" />
          {watching ? "Tunjukkan QR undangan ke kamera" : "Siapkan QR undangan Anda"}
        </p>
        <p className="mt-3 text-[length:calc(12px*var(--fs))] tracking-wide text-mute">Ketuk layar untuk mulai</p>
      </div>
    </div>
  );
}

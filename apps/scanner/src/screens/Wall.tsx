import { useEffect, useState } from "react";

import { usePhotos } from "./Gallery";
import { store } from "../data/store";
import { go } from "../lib/ui";
import { useApp } from "../state";

/**
 * The venue TV. Newest selfie large, a strip of recent ones, the live count.
 * In this demo it reads the same device's storage; with the backend it polls
 * `GET /v1/events/:id/photos?since=` so every door's photos appear on one TV.
 */
export function WallScreen() {
  const { pairing, version } = useApp();
  const shots = usePhotos(3000);
  const [index, setIndex] = useState(0);
  const [people, setPeople] = useState(0);

  useEffect(() => {
    void store.checkIns().then((rows) => {
      const seen = new Set<string>();
      let n = 0;
      for (const r of rows) {
        if (seen.has(r.code)) continue;
        seen.add(r.code);
        n += r.headcount;
      }
      setPeople(n);
    });
  }, [version, shots.length]);

  // Newest photo first whenever one arrives, then rotate through the rest.
  useEffect(() => setIndex(0), [shots.length]);
  useEffect(() => {
    if (shots.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % Math.min(shots.length, 12)), 6000);
    return () => clearInterval(t);
  }, [shots.length]);

  const current = shots[index];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-night" onDoubleClick={() => go("gallery")}>
      <div className="flex items-end justify-between px-10 pb-4 pt-8">
        <div>
          <p className="kicker text-peach">{pairing?.event.kind === "WEDDING" ? "The wedding of" : "Acara"}</p>
          <h1 className="font-display text-[clamp(40px,6vw,88px)] leading-none text-cream">{pairing?.event.displayName}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-[clamp(40px,5vw,72px)] leading-none text-gold">{people}</p>
          <p className="kicker text-mute">tamu telah hadir</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-10">
        {current ? (
          <img key={current.id} src={current.url} alt={current.householdName} className="fadein max-h-full rounded-3xl shadow-2xl shadow-black/60" />
        ) : (
          <p className="font-display text-[length:calc(36px*var(--fs))] text-cream-dim">Foto tamu akan tampil di sini</p>
        )}
      </div>

      {shots.length > 1 ? (
        <div className="flex gap-3 overflow-hidden px-10 pb-8 pt-5">
          {shots.slice(0, 10).map((s, i) => (
            <img
              key={s.id}
              src={s.url}
              alt=""
              className={`h-24 w-[72px] shrink-0 rounded-xl object-cover transition ${i === index ? "ring-2 ring-peach" : "opacity-50"}`}
            />
          ))}
        </div>
      ) : (
        <div className="h-8" />
      )}
      <button type="button" onClick={() => go("gallery")} className="absolute bottom-3 left-4 rounded-full px-3 py-1 text-[length:calc(12px*var(--fs))] text-mute/40 hover:text-mute">
        keluar
      </button>
    </div>
  );
}

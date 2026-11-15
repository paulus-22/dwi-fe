import { useEffect, useState } from "react";

import { Header, Icon } from "../components/ui";
import { store } from "../data/store";
import type { PhotoRecord } from "../domain/types";
import { go, timeLabel } from "../lib/ui";
import { useApp } from "../state";

type Shot = PhotoRecord & { url: string };

/** Object URLs for stored photo blobs, revoked when the list changes. */
export function usePhotos(pollMs?: number) {
  const { version } = useApp();
  const [shots, setShots] = useState<Shot[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(() => setTick((n) => n + 1), pollMs);
    return () => clearInterval(t);
  }, [pollMs]);

  useEffect(() => {
    let urls: string[] = [];
    let cancelled = false;
    void (async () => {
      const photos = (await store.photos()).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      if (cancelled) return;
      const next = photos.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }));
      urls = next.map((n) => n.url);
      setShots(next);
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [version, tick]);

  return shots;
}

export function GalleryScreen() {
  const shots = usePhotos();
  const [open, setOpen] = useState<Shot | null>(null);

  return (
    <div className="flex h-full flex-col bg-ground">
      <Header
        title="Galeri tamu"
        right={
          <button type="button" onClick={() => go("wall")} className="inline-flex items-center gap-2 rounded-full border border-edge px-3 py-1.5 text-[length:calc(13px*var(--fs))] text-cream-dim">
            <Icon name="tv" className="size-4" /> Layar
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28">
        {shots.length === 0 ? (
          <div className="mt-20 text-center">
            <Icon name="image" className="mx-auto size-12 text-edge" />
            <p className="mt-4 text-[length:calc(16px*var(--fs))] text-cream-dim">Belum ada foto.</p>
            <p className="mt-1 text-[length:calc(14px*var(--fs))] text-mute">Foto selfie tamu saat check-in akan muncul di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shots.map((s) => (
              <button key={s.id} type="button" onClick={() => setOpen(s)} className="group relative overflow-hidden rounded-2xl bg-panel text-left">
                <img src={s.url} alt={s.householdName} className="aspect-[3/4] w-full object-cover" />
                <span className="absolute right-2 top-2 rounded-full bg-night/70 px-2 py-0.5 text-[length:calc(11px*var(--fs))] text-cream-dim">
                  {s.synced ? "☁︎ terunggah" : "menunggu"}
                </span>
                <span className="block truncate px-3 py-2 text-[length:calc(13px*var(--fs))] text-cream-dim">
                  {timeLabel(s.occurredAt)} · {s.householdName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-night/95 p-5" onClick={() => setOpen(null)}>
          <div className="safe-top flex justify-end">
            <Icon name="x" className="size-8 text-cream" />
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <img src={open.url} alt={open.householdName} className="pop max-h-full rounded-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

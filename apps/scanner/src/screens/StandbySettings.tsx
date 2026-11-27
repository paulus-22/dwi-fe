import { useEffect, useRef, useState } from "react";

import { Button, Icon } from "../components/ui";
import { uid } from "../data/scanner";
import { store } from "../data/store";
import type { IdleConfig, Slide } from "../domain/types";
import { resizeForSlide } from "../lib/photo";
import { useApp } from "../state";

const AFTER: [number, string][] = [
  [30, "30 dtk"],
  [60, "1 mnt"],
  [120, "2 mnt"],
  [300, "5 mnt"],
];
const SLIDE: [number, string][] = [
  [5, "5 dtk"],
  [8, "8 dtk"],
  [12, "12 dtk"],
];
const MAX_SLIDES = 20;

/** Settings for the standby slideshow ("layar jeda") and its photos. */
export function StandbySettings({ onPreview }: { onPreview(): void }) {
  const { idle, setIdle, refresh, version } = useApp();
  const [slides, setSlides] = useState<(Slide & { url: string })[]>([]);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let urls: string[] = [];
    void store.getSlides().then((list) => {
      const next = list.map((s) => ({ ...s, url: URL.createObjectURL(s.blob) }));
      urls = next.map((n) => n.url);
      setSlides(next);
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [version]);

  async function add(files: File[]) {
    setAdding(true);
    try {
      const current = await store.getSlides();
      const room = MAX_SLIDES - current.length;
      const picked = files.filter((f) => f.type.startsWith("image/")).slice(0, room);
      const added: Slide[] = [];
      for (const f of picked) {
        added.push({ id: uid(), blob: await resizeForSlide(f), addedAt: new Date().toISOString() });
      }
      await store.setSlides([...current, ...added]);
      refresh();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await store.setSlides((await store.getSlides()).filter((s) => s.id !== id));
    refresh();
  }

  const set = (patch: Partial<IdleConfig>) => setIdle(patch);

  return (
    <section className="rounded-2xl bg-panel p-4">
      <div className="flex items-center gap-3">
        <Icon name="tv" className="size-6 text-peach" />
        <span className="flex-1">
          <span className="block text-[length:calc(16px*var(--fs))] text-cream">Layar jeda</span>
          <span className="block text-[length:calc(13px*var(--fs))] text-cream-dim">
            Saat sepi, tampilkan slideshow mempelai alih-alih kamera.
          </span>
        </span>
      </div>

      <Row label="Otomatis saat tidak dipakai">
        <Switch on={idle.auto} onChange={(on) => set({ auto: on })} />
      </Row>
      {idle.auto ? (
        <Row label="Setelah">
          <Chips options={AFTER} value={idle.afterSec} onChange={(v) => set({ afterSec: v })} />
        </Row>
      ) : null}

      <div className="mt-4">
        <p className="text-[length:calc(15px*var(--fs))] text-cream">Kamera saat jeda</p>
        <div className="mt-2 grid gap-2">
          {(
            [
              ["off", "Mati", "Ketuk layar untuk scan lagi. Hemat baterai, tidak merekam."],
              ["watch", "Tetap scan", "QR yang ditunjukkan langsung terbaca, tanpa ketuk."],
            ] as const
          ).map(([key, title, note]) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ camera: key })}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                idle.camera === key ? "border-peach bg-peach/10" : "border-edge bg-ground"
              }`}
            >
              <span className={`block text-[length:calc(15px*var(--fs))] ${idle.camera === key ? "text-peach" : "text-cream"}`}>{title}</span>
              <span className="block text-[length:calc(12px*var(--fs))] text-cream-dim">{note}</span>
            </button>
          ))}
        </div>
      </div>

      <Row label="Ganti slide tiap">
        <Chips options={SLIDE} value={idle.slideSec} onChange={(v) => set({ slideSec: v })} />
      </Row>
      <Row label="Ikutkan foto tamu terbaru">
        <Switch on={idle.includeSelfies} onChange={(on) => set({ includeSelfies: on })} />
      </Row>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[length:calc(15px*var(--fs))] text-cream">Foto mempelai</p>
          <p className="text-[length:calc(12px*var(--fs))] text-mute">
            {slides.length}/{MAX_SLIDES}
          </p>
        </div>
        <p className="mt-0.5 text-[length:calc(12px*var(--fs))] text-cream-dim">Prewedding, momen lamaran, dll. Disimpan di perangkat ini.</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {slides.map((s) => (
            <div key={s.id} className="relative">
              <img src={s.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <button
                type="button"
                aria-label="Hapus foto"
                onClick={() => void remove(s.id)}
                className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-night text-cream ring-1 ring-edge"
              >
                <Icon name="x" className="size-3.5" />
              </button>
            </div>
          ))}
          {slides.length < MAX_SLIDES ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={adding}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gold/50 text-[length:calc(11px*var(--fs))] text-cream-dim disabled:opacity-50"
            >
              <Icon name="image" className="size-6 text-peach" />
              {adding ? "…" : "Tambah"}
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            // Copy first: a FileList is live, and clearing the input (so the
            // same photo can be picked again) would empty it under `add`.
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void add(files);
          }}
        />
      </div>

      <Button tone="ghost" className="mt-4 w-full" onClick={onPreview}>
        Coba layar jeda
      </Button>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="text-[length:calc(15px*var(--fs))] text-cream">{label}</span>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange }: { options: [number, string][]; value: number; onChange(v: number): void }) {
  return (
    <div className="flex rounded-xl bg-ground p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg px-2.5 py-1.5 text-[length:calc(13px*var(--fs))] ${value === v ? "bg-peach text-peach-ink" : "text-cream-dim"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange(on: boolean): void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-peach" : "bg-edge"}`}
    >
      <span className={`absolute top-1 size-6 rounded-full bg-cream transition-all ${on ? "left-7" : "left-1"}`} />
    </button>
  );
}

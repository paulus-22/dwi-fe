import { Icon } from "./ui";
import { DEFAULT_FONT_SCALE, FONT_SCALE_MAX, FONT_SCALE_MIN, useApp } from "../state";

const PRESETS: [number, string][] = [
  [1, "Kecil"],
  [1.1, "Normal"],
  [1.25, "Besar"],
  [1.4, "Sangat besar"],
];

/**
 * Live text-size control. Changes apply to the whole app as you move the
 * slider, so the usher can tune it on the actual device, at the distance it
 * will be read from.
 */
export function TextSizeControl() {
  const { fontScale, setFontScale } = useApp();
  const step = (d: number) => setFontScale(fontScale + d);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Perkecil teks"
          onClick={() => step(-0.05)}
          disabled={fontScale <= FONT_SCALE_MIN}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ground text-cream disabled:opacity-30"
        >
          <span className="text-[13px]">A</span>
        </button>
        <input
          type="range"
          min={FONT_SCALE_MIN}
          max={FONT_SCALE_MAX}
          step={0.05}
          value={fontScale}
          onChange={(e) => setFontScale(Number(e.target.value))}
          aria-label="Ukuran teks"
          className="h-2 flex-1 accent-peach"
        />
        <button
          type="button"
          aria-label="Perbesar teks"
          onClick={() => step(0.05)}
          disabled={fontScale >= FONT_SCALE_MAX}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ground text-cream disabled:opacity-30"
        >
          <span className="text-[22px]">A</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFontScale(value)}
            className={`rounded-full px-3 py-1.5 text-[length:calc(13px*var(--fs))] ${
              Math.abs(fontScale - value) < 0.01 ? "bg-peach text-peach-ink" : "bg-ground text-cream-dim"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-[length:calc(12px*var(--fs))] tabular-nums text-mute">
          {Math.round(fontScale * 100)}%
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-ground px-4 py-3">
        <p className="kicker text-peach">Contoh</p>
        <p className="mt-1 font-display text-[length:calc(28px*var(--fs))] leading-tight text-cream">Keluarga Bapak Hadi</p>
        <p className="text-[length:calc(15px*var(--fs))] text-cream-dim">Konfirmasi RSVP: 3 orang · Meja A1</p>
      </div>
      {fontScale !== DEFAULT_FONT_SCALE ? (
        <button
          type="button"
          onClick={() => setFontScale(DEFAULT_FONT_SCALE)}
          className="mt-2 inline-flex items-center gap-1 text-[length:calc(13px*var(--fs))] text-peach"
        >
          <Icon name="refresh" className="size-4" /> Kembalikan ke Normal
        </button>
      ) : null}
    </div>
  );
}

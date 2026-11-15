import { useEffect, useRef, useState } from "react";

import { TextSizeControl } from "../components/TextSize";
import { Button, Icon } from "../components/ui";
import { eventFromForm, guessCoupleLine, parseGuestCsv, type CsvImport } from "../data/csv";
import { api } from "../data/api";
import { DEMO_PAIRING_CODE } from "../data/demo";
import { pairDevice, pairFromCsv } from "../data/scanner";
import { store } from "../data/store";
import type { Pairing } from "../domain/types";
import { preloadDecoder } from "../lib/qr";
import { go } from "../lib/ui";
import { useApp } from "../state";

const DOORS = ["Pintu Utama", "Pintu Samping", "Meja VIP"];

type Mode = "code" | "csv";

/**
 * Pairing binds this device to one event, two ways:
 *
 *  - Event code: the pairing code from the dashboard (*Perangkat scanner*);
 *    the device gets a token and the guest list from the server. Without a
 *    server (`VITE_API_URL` unset) only the built-in demo (`alex-ajeng`) resolves.
 *  - Import CSV: the admin's *Kode & QR → unduh csv* export, read on the
 *    device. Needs no network at all, so it also works at a venue without
 *    signal, and doubles as the fallback if the server is unreachable.
 *
 * With `reimport` it only offers the CSV path, for refreshing RSVPs on an
 * already-paired device without losing its check-ins.
 */
export function PairScreen({ reimport = false, onClose }: { reimport?: boolean; onClose?(): void }) {
  const { pairing, setPairing, refresh } = useApp();
  const [mode, setMode] = useState<Mode>(reimport ? "csv" : "code");
  const [door, setDoor] = useState(pairing?.deviceName ?? DOORS[0]);
  const [textOpen, setTextOpen] = useState(false);

  useEffect(() => preloadDecoder(), []);

  function done(p: Pairing) {
    setPairing(p);
    refresh();
    if (onClose) onClose();
    else go("scan");
  }

  return (
    <div className="safe-top safe-bottom flex min-h-full flex-col bg-ground px-6">
      <div className="mt-2 flex items-center justify-between">
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-full p-2 text-cream-dim">
            <Icon name="back" />
          </button>
        ) : (
          <span />
        )}
        {!reimport ? (
          <button
            type="button"
            aria-label="Ukuran teks"
            aria-expanded={textOpen}
            onClick={() => setTextOpen((o) => !o)}
            className={`rounded-full px-3 py-1.5 font-display text-[20px] leading-none ${textOpen ? "bg-peach text-peach-ink" : "bg-panel text-cream-dim"}`}
          >
            Aa
          </button>
        ) : null}
      </div>
      {textOpen ? (
        <div className="rise mx-auto mt-3 w-full max-w-sm rounded-2xl bg-panel p-4">
          <TextSizeControl />
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
        <div className="rise mx-auto flex size-20 items-center justify-center rounded-[28px] bg-panel text-peach">
          <Icon name="scan" className="size-10" />
        </div>
        <p className="kicker rise mt-7 text-center text-peach">Scanner tamu</p>
        <h1 className="rise mt-2 text-center font-display text-[length:calc(40px*var(--fs))] leading-tight">
          {reimport ? "Perbarui daftar tamu" : "Hubungkan perangkat"}
        </h1>

        {!reimport ? (
          <div className="rise mt-7 grid grid-cols-2 rounded-2xl bg-panel p-1">
            {([["code", "Kode acara"], ["csv", "Impor CSV"]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`rounded-xl py-3 text-[length:calc(15px*var(--fs))] transition ${mode === key ? "bg-peach text-peach-ink" : "text-cream-dim"}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {!reimport ? (
          <div className="rise mt-6">
            <span className="kicker text-mute">Posisi perangkat</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DOORS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDoor(d)}
                  className={`rounded-xl border px-2 py-3 text-[length:calc(14px*var(--fs))] transition ${
                    door === d ? "border-peach bg-peach/15 text-peach" : "border-edge text-cream-dim"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {mode === "code" ? <CodePairing door={door} onPaired={done} /> : <CsvPairing door={door} onPaired={done} />}
      </div>
    </div>
  );
}

function CodePairing({ door, onPaired }: { door: string; onPaired(p: Pairing): void }) {
  const [code, setCode] = useState(api.live ? "" : DEMO_PAIRING_CODE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onPaired(await pairDevice(code, door));
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "offline"
          ? e.message
          : "Tidak ada koneksi. Pairing dengan kode butuh internet sekali — atau pakai Impor CSV.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rise mt-6 space-y-5">
      <label className="block">
        <span className="kicker text-mute">Kode acara</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder={api.live ? "mis. HP4Y-8FN4" : "mis. alex-ajeng"}
          className="mt-2 w-full rounded-2xl border border-edge bg-panel px-4 py-4 text-center font-mono text-[length:calc(20px*var(--fs))] tracking-[0.08em] text-cream outline-none placeholder:text-mute/50 focus:border-peach"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {error ? <p className="rounded-xl bg-bad-deep px-4 py-3 text-[length:calc(14px*var(--fs))] leading-relaxed text-cream">{error}</p> : null}
      <Button className="w-full" onClick={submit} disabled={busy || code.trim().length < 3}>
        {busy ? "Mengunduh daftar tamu…" : "Hubungkan"}
      </Button>
      <p className="text-center text-[length:calc(12px*var(--fs))] leading-relaxed text-mute">
        {api.live ? (
          <>Minta kode pairing ke admin acara — dibuat di dashboard, menu Perangkat scanner. Satu kode untuk semua pintu.</>
        ) : (
          <>
            Mode demo tanpa server: tersedia acara <span className="font-mono text-cream-dim">alex-ajeng</span>; acara lain
            lewat Impor CSV.
          </>
        )}
      </p>
    </div>
  );
}

type EventForm = { slug: string; coupleLine: string; dateLabel: string; venue: string; hashtag: string };

function CsvPairing({ door, onPaired }: { door: string; onPaired(p: Pairing): void }) {
  const { pairing } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; data: CsvImport } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<EventForm>({
    slug: pairing?.event.slug ?? "",
    coupleLine: pairing?.event.coupleLine ?? "",
    dateLabel: pairing?.event.dateLabel ?? "",
    venue: pairing?.event.venue ?? "",
    hashtag: pairing?.event.hashtag ?? "",
  });

  // Event details typed for an earlier import come back, so setting up the
  // second tablet — or re-importing on the morning — is one tap.
  useEffect(() => {
    if (pairing) return;
    void store.getPref<EventForm>("csvEvent").then((saved) => saved && setForm(saved));
  }, [pairing]);

  async function read(f: File) {
    setError(null);
    try {
      const data = parseGuestCsv(await f.text());
      setFile({ name: f.name, data });
      setForm((prev) => {
        const sameEvent = !prev.slug || !data.slug || prev.slug === data.slug;
        const base = sameEvent ? prev : { slug: "", coupleLine: "", dateLabel: "", venue: "", hashtag: "" };
        return {
          ...base,
          slug: base.slug || data.slug || "",
          coupleLine: base.coupleLine || guessCoupleLine(data.slug),
        };
      });
    } catch (e) {
      setFile(null);
      setError(e instanceof Error ? e.message : "File tidak bisa dibaca.");
    }
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await store.setPref("csvEvent", form);
      const fresh = eventFromForm(form);
      const event = pairing ? { ...fresh, id: pairing.event.id } : fresh;
      onPaired(await pairFromCsv(event, file.data.guests, pairing?.deviceName ?? door, file.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  const s = file?.data.stats;
  const field = (key: keyof EventForm, label: string, placeholder: string) => (
    <label className="block">
      <span className="kicker text-mute">{label}</span>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-edge bg-panel px-4 py-3 text-[length:calc(16px*var(--fs))] text-cream outline-none placeholder:text-mute/50 focus:border-peach"
      />
    </label>
  );

  return (
    <div className="rise mt-6 space-y-5">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void read(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-gold/50 bg-panel px-5 py-5 text-left active:bg-panel-2"
      >
        <Icon name="users" className="size-8 shrink-0 text-peach" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[length:calc(16px*var(--fs))] text-cream">{file ? file.name : "Pilih file CSV"}</span>
          <span className="block text-[length:calc(13px*var(--fs))] text-cream-dim">
            {file ? "Ketuk untuk ganti file" : "Dashboard → Kode & QR → unduh csv"}
          </span>
        </span>
      </button>

      {s && file ? (
        <div className="rounded-2xl bg-panel p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {(
              [
                [s.total, "tamu"],
                [s.attending, "hadir"],
                [s.declined, "menolak"],
                [s.pending, "belum"],
              ] as const
            ).map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-[length:calc(30px*var(--fs))] leading-none text-cream">{n}</p>
                <p className="mt-1 text-[length:calc(11px*var(--fs))] text-mute">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[length:calc(13px*var(--fs))] text-cream-dim">
            {s.people} orang diharapkan · awalan kode {file.data.prefixes.join(", ")}
          </p>
          {file.data.problems.length ? (
            <details className="mt-3 rounded-xl bg-warn-deep/60 px-3 py-2 text-[length:calc(13px*var(--fs))] text-cream">
              <summary>{file.data.problems.length} baris dilewati</summary>
              <ul className="mt-2 space-y-1 text-cream-dim">
                {file.data.problems.slice(0, 20).map((p) => (
                  <li key={`${p.line}-${p.value}`}>
                    Baris {p.line}: <span className="font-mono">{p.value}</span> — {p.reason}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <p className="mt-3 text-[length:calc(12px*var(--fs))] leading-relaxed text-mute">
            Disimpan di perangkat: kode, nama, kategori, RSVP, jumlah. Nomor HP dan tautan tidak disimpan.
          </p>
        </div>
      ) : null}

      {file ? (
        <div className="space-y-3">
          {field("coupleLine", "Nama mempelai / acara (untuk bingkai foto)", "Tari & Saefulloh")}
          {field("dateLabel", "Tanggal", "Sabtu, 12 Desember 2026")}
          {field("venue", "Tempat", "Nama gedung")}
          {field("hashtag", "Hashtag", "#TariSaefulloh")}
        </div>
      ) : null}

      {error ? <p className="rounded-xl bg-bad-deep px-4 py-3 text-[length:calc(14px*var(--fs))] leading-relaxed text-cream">{error}</p> : null}

      <Button className="w-full" onClick={submit} disabled={!file || busy || !form.coupleLine.trim()}>
        {busy ? "Menyimpan…" : pairing ? "Perbarui daftar tamu" : "Gunakan daftar ini"}
      </Button>
      <p className="text-center text-[length:calc(12px*var(--fs))] text-mute">Tidak butuh internet. Data tetap di perangkat ini.</p>
    </div>
  );
}

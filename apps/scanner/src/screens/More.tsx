import { useState } from "react";

import { PairScreen } from "./Pair";
import { queueIdle } from "./Scan";
import { StandbySettings } from "./StandbySettings";
import { TextSizeControl } from "../components/TextSize";
import { Button, Header, Icon } from "../components/ui";
import { network } from "../data/api";
import { exportCheckInsCsv, exportPhotosZip } from "../data/export";
import { DEFAULT_ACTIVITIES, forgetSession, pairDevice, setSimulateOffline, syncNow } from "../data/scanner";
import { store } from "../data/store";
import type { ActivityConfig } from "../domain/types";
import type { Facing } from "../lib/camera";
import { go, timeLabel } from "../lib/ui";
import { useApp } from "../state";

/**
 * Device settings. In production the activity list comes from the event's
 * configuration in the admin dashboard; it is editable here so the demo can
 * show how one scanner serves weddings that want different steps.
 */
export function MoreScreen() {
  const { pairing, activities, setActivities, setPairing, refresh, sync, facing, setFacing } = useApp();
  const [offline, setOffline] = useState(network.simulateOffline);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [reimport, setReimport] = useState(false);
  const [zipPct, setZipPct] = useState<number | null>(null);

  if (reimport) {
    return (
      <div className="h-full overflow-y-auto pb-20">
        <PairScreen reimport onClose={() => setReimport(false)} />
      </div>
    );
  }

  function update(index: number, patch: Partial<ActivityConfig>) {
    void setActivities(activities.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function move(index: number, delta: number) {
    const next = [...activities];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    void setActivities(next);
  }

  async function refreshGuests() {
    if (!pairing) return;
    if (pairing.source === "csv") {
      setReimport(true);
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      setPairing(await pairDevice(pairing.sourceLabel, pairing.deviceName));
      refresh();
      setNote("Daftar tamu diperbarui.");
    } catch {
      setNote("Tidak ada koneksi — daftar tamu yang tersimpan tetap dipakai.");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    const n = await exportCheckInsCsv();
    setNote(n ? `${n} check-in diekspor.` : "Belum ada check-in untuk diekspor.");
  }

  async function exportZip() {
    setZipPct(0);
    try {
      const n = await exportPhotosZip(setZipPct);
      setNote(n ? `${n} foto diekspor.` : "Belum ada foto.");
    } finally {
      setZipPct(null);
    }
  }

  async function resetDevice() {
    if (!confirm("Hapus semua check-in, foto, dan pairing di perangkat ini? Ekspor dulu jika datanya masih dibutuhkan.")) return;
    await store.wipe();
    await forgetSession();
    await setSimulateOffline(false);
    await store.setActivities(DEFAULT_ACTIVITIES);
    setPairing(null);
    refresh();
    go("scan");
  }

  return (
    <div className="flex h-full flex-col bg-ground">
      <Header title="Pengaturan" />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-28">
        <section className="rounded-2xl bg-panel p-4">
          <p className="kicker text-mute">Perangkat</p>
          <p className="mt-2 text-[length:calc(17px*var(--fs))] text-cream">{pairing?.deviceName}</p>
          <p className="text-[length:calc(14px*var(--fs))] text-cream-dim">
            {pairing?.event.displayName}
            {pairing?.event.dateLabel ? ` · ${pairing.event.dateLabel}` : ""}
          </p>
          <p className="mt-1 text-[length:calc(13px*var(--fs))] text-mute">
            {pairing?.source === "csv" ? `Dari CSV: ${pairing.sourceLabel}` : `Kode acara: ${pairing?.sourceLabel}`} ·{" "}
            {pairing ? timeLabel(pairing.snapshotAt) : "-"}
            {sync.lastSyncedAt ? ` · sinkron ${timeLabel(sync.lastSyncedAt)}` : ""}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button tone="ghost" onClick={refreshGuests} disabled={busy}>
              <Icon name="refresh" /> {busy ? "Mengunduh…" : pairing?.source === "csv" ? "Impor ulang" : "Unduh ulang"}
            </Button>
            <Button tone="ghost" onClick={() => void syncNow()}>
              Sinkron
            </Button>
          </div>
          {note ? <p className="mt-3 text-[length:calc(13px*var(--fs))] text-cream-dim">{note}</p> : null}
        </section>

        <AutoCheckInSettings />

        <section className="rounded-2xl bg-panel p-4">
          <p className="kicker text-mute">Ukuran teks</p>
          <p className="mb-3 mt-1 text-[length:calc(13px*var(--fs))] text-cream-dim">
            Berlaku langsung di seluruh aplikasi. Atur di perangkat yang dipakai, dari jarak baca sebenarnya.
          </p>
          <TextSizeControl />
        </section>

        <section className="rounded-2xl bg-panel p-4">
          <p className="kicker text-mute">Kamera</p>
          <CameraChoice
            label="Scan QR"
            hint="Depan: tablet di stand, tamu menunjukkan QR ke layar."
            value={facing.scan}
            onChange={(f) => setFacing("scan", f)}
          />
          <CameraChoice
            label="Foto"
            hint="Depan: selfie tamu. Belakang: penerima tamu yang memotret."
            value={facing.photo}
            onChange={(f) => setFacing("photo", f)}
          />
        </section>

        <StandbySettings
          onPreview={() => {
            queueIdle();
            go("scan");
          }}
        />

        <section className="rounded-2xl bg-panel p-4">
          <p className="kicker text-mute">Aktivitas setelah check-in</p>
          <p className="mt-1 text-[length:calc(13px*var(--fs))] text-cream-dim">Urutan dan pilihan ini nanti diatur per acara dari dashboard admin.</p>
          <ul className="mt-3 space-y-2">
            {activities.map((a, i) => (
              <li key={a.type} className="flex items-center gap-3 rounded-xl bg-ground px-3 py-3">
                <div className="flex flex-col">
                  <button type="button" aria-label="Naik" onClick={() => move(i, -1)} disabled={i === 0} className="text-mute disabled:opacity-20"><Icon name="up" className="size-5" /></button>
                  <button type="button" aria-label="Turun" onClick={() => move(i, 1)} disabled={i === activities.length - 1} className="text-mute disabled:opacity-20"><Icon name="down" className="size-5" /></button>
                </div>
                <span className="flex-1">
                  <span className={`block text-[length:calc(16px*var(--fs))] ${a.enabled ? "text-cream" : "text-mute line-through"}`}>{a.label}</span>
                  <label className="mt-1 inline-flex items-center gap-2 text-[length:calc(13px*var(--fs))] text-cream-dim">
                    <input type="checkbox" checked={a.required} disabled={!a.enabled} onChange={(e) => update(i, { required: e.target.checked })} className="accent-peach" />
                    Wajib (tidak bisa dilewati)
                  </label>
                </span>
                <Toggle on={a.enabled} onChange={(on) => update(i, { enabled: on })} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-panel p-4">
          <p className="kicker text-mute">Ekspor data perangkat ini</p>
          <p className="mt-1 text-[length:calc(13px*var(--fs))] leading-relaxed text-cream-dim">
            Belum ada server, jadi data hanya ada di perangkat ini. Ekspor di akhir acara — tiap pintu mengekspor filenya sendiri.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button tone="ghost" onClick={() => void exportCsv()}>Check-in CSV</Button>
            <Button tone="ghost" onClick={() => void exportZip()} disabled={zipPct !== null}>
              {zipPct !== null ? `ZIP ${zipPct}%` : "Foto ZIP"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-panel p-4">
          <div className="flex items-center gap-3">
            <Icon name="wifi-off" className="size-6 text-warn" />
            <span className="flex-1">
              <span className="block text-[length:calc(16px*var(--fs))] text-cream">Simulasi offline</span>
              <span className="block text-[length:calc(13px*var(--fs))] text-cream-dim">Scan tetap jalan; data antre dan terkirim saat online lagi.</span>
            </span>
            <Toggle
              on={offline}
              onChange={(on) => {
                setOffline(on);
                void setSimulateOffline(on);
              }}
            />
          </div>
        </section>

        <section className="space-y-3">
          <p className="kicker px-1 text-mute">Demo</p>
          <Row icon="qr" label="Kartu QR demo" sub="Buka di perangkat lain untuk di-scan" onClick={() => go("passes")} />
          <Row icon="tv" label="Layar galeri (TV)" sub="Foto tamu terbaru + jumlah hadir" onClick={() => go("wall")} />
          <Button tone="bad" className="w-full" onClick={resetDevice}>Reset perangkat</Button>
        </section>
      </div>
    </div>
  );
}

function CameraChoice({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: Facing;
  onChange(f: Facing): void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[length:calc(16px*var(--fs))] text-cream">{label}</span>
        <div className="grid grid-cols-2 rounded-xl bg-ground p-1">
          {([["environment", "Belakang"], ["user", "Depan"]] as const).map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`rounded-lg px-3 py-2 text-[length:calc(14px*var(--fs))] ${value === key ? "bg-peach text-peach-ink" : "text-cream-dim"}`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[length:calc(12px*var(--fs))] text-mute">{hint}</p>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange(on: boolean): void }) {
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

function Row({ icon, label, sub, onClick }: { icon: "qr" | "tv"; label: string; sub: string; onClick(): void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl bg-panel px-4 py-4 text-left active:bg-panel-2">
      <Icon name={icon} className="size-7 text-peach" />
      <span className="flex-1">
        <span className="block text-[length:calc(16px*var(--fs))] text-cream">{label}</span>
        <span className="block text-[length:calc(13px*var(--fs))] text-cream-dim">{sub}</span>
      </span>
      <Icon name="chevron" className="size-5 text-mute" />
    </button>
  );
}

const AUTO_DELAYS: [number, string][] = [
  [0, "Langsung"],
  [2, "2 dtk"],
  [3, "3 dtk"],
];

function AutoCheckInSettings() {
  const { auto, setAuto, activities } = useApp();
  const anyActivity = activities.some((a) => a.enabled);
  return (
    <section className="rounded-2xl bg-panel p-4">
      <div className="flex items-center gap-3">
        <Icon name="check" className="size-6 text-ok" />
        <span className="flex-1">
          <span className="block text-[length:calc(16px*var(--fs))] text-cream">Check-in otomatis</span>
          <span className="block text-[length:calc(13px*var(--fs))] text-cream-dim">
            QR hijau langsung check-in dengan jumlah RSVP. Kuning dan merah tetap menunggu penerima tamu.
          </span>
        </span>
        <Toggle on={auto.on} onChange={(on) => setAuto({ on })} />
      </div>
      {auto.on ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[length:calc(15px*var(--fs))] text-cream">Jeda sebelum check-in</span>
            <div className="flex rounded-xl bg-ground p-1">
              {AUTO_DELAYS.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAuto({ delaySec: v })}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[length:calc(13px*var(--fs))] ${
                    auto.delaySec === v ? "bg-peach text-peach-ink" : "text-cream-dim"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span>
              <span className="block text-[length:calc(15px*var(--fs))] text-cream">Lewati aktivitas</span>
              <span className="block text-[length:calc(12px*var(--fs))] text-mute">
                {anyActivity ? "Tanpa foto/buku tamu/souvenir — langsung scan berikutnya." : "Tidak ada aktivitas yang aktif."}
              </span>
            </span>
            <Toggle on={auto.skipActivities} onChange={(on) => setAuto({ skipActivities: on })} />
          </div>
        </>
      ) : null}
    </section>
  );
}

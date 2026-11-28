import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityRunner } from "./Activities";
import { IdleSlideshow } from "./Idle";
import { ResultView } from "./Result";
import { Button, Header, Icon } from "../components/ui";
import { checkIn, lookup, sendGreeting, type Lookup } from "../data/scanner";
import { api } from "../data/api";
import { store } from "../data/store";
import type { ActivityType, CheckIn, SnapshotGuest } from "../domain/types";
import { useCamera } from "../lib/camera";
import { cue } from "../lib/cue";
import { scanLoop } from "../lib/qr";
import { useApp } from "../state";

type Phase =
  | { kind: "scanning" }
  | { kind: "result"; lookup: Lookup }
  | { kind: "activities"; checkIn: CheckIn; guest: SnapshotGuest }
  | { kind: "done"; checkIn: CheckIn; guest: SnapshotGuest; completed: ActivityType[] };

/** Set by the guest list's "check-in manual", picked up when this screen mounts. */
let pendingCode: string | null = null;
export function queueLookup(code: string) {
  pendingCode = code;
}

/** Set by Settings' "coba sekarang", so the slideshow can be previewed on demand. */
let pendingIdle = false;
export function queueIdle() {
  pendingIdle = true;
}

export function ScanScreen() {
  const { pairing, refresh, setImmersive, facing, setFacing, idle, auto, groupNameMode } = useApp();
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const [standby, setStandby] = useState(false);

  // Consumed in an effect, not a state initialiser: StrictMode runs
  // initialisers twice and the second call would see the flag already cleared.
  useEffect(() => {
    if (!pendingIdle) return;
    pendingIdle = false;
    setStandby(true);
  }, []);
  const [manual, setManual] = useState(false);
  const lastScan = useRef<{ text: string; at: number } | null>(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    setImmersive(phase.kind === "activities" || phase.kind === "done" || standby);
    return () => setImmersive(false);
  }, [phase.kind, standby, setImmersive]);

  const touch = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  // Drop into standby after a quiet spell — only from the idle scan view, never
  // with a result sheet, manual entry or a guest mid-flow on screen.
  useEffect(() => {
    if (!idle.auto || standby || manual || phase.kind !== "scanning") return;
    touch();
    const t = setInterval(() => {
      if (Date.now() - lastActivity.current > idle.afterSec * 1000) setStandby(true);
    }, 1000);
    return () => clearInterval(t);
  }, [idle.auto, idle.afterSec, standby, manual, phase.kind, touch]);

  const wake = useCallback(() => {
    touch();
    setStandby(false);
  }, [touch]);

  const watching = standby && idle.camera === "watch";
  const cameraOn = (phase.kind === "scanning" || phase.kind === "result") && (!standby || watching);
  const { videoRef, state: camera } = useCamera(facing.scan, cameraOn);
  const mirrored = facing.scan === "user";

  const handle = useCallback(async (text: string) => {
    const now = Date.now();
    // The same QR stays in frame for a while after the sheet closes; ignore it.
    if (lastScan.current && lastScan.current.text === text && now - lastScan.current.at < 3000) return;
    lastScan.current = { text, at: now };
    lastActivity.current = now;
    setStandby(false);

    const result = await lookup(text);
    if (result.kind === "ok") cue.ok();
    else if (result.kind === "duplicate" || result.kind === "not_confirmed") cue.warn();
    else cue.bad();
    setPhase({ kind: "result", lookup: result });
  }, []);

  useEffect(() => {
    if (pendingCode) {
      const code = pendingCode;
      pendingCode = null;
      void handle(code);
    }
  }, [handle]);

  useEffect(() => {
    const video = videoRef.current;
    if (phase.kind !== "scanning" || camera.status !== "live" || !video) return;
    return scanLoop(video, (text) => void handle(text));
  }, [phase.kind, camera.status, handle, videoRef]);

  async function confirm(guest: SnapshotGuest, headcount: number, override: boolean, memberName?: string) {
    const row = await checkIn(guest, headcount, pairing!.deviceName, override, memberName);
    refresh();
    if (auto.on && auto.skipActivities) {
      void sendGreeting(row, { skippedActivities: true });
      cue.ok();
      setPhase({ kind: "done", checkIn: row, guest, completed: [] });
    } else {
      setPhase({ kind: "activities", checkIn: row, guest });
    }
  }

  function reset() {
    lastScan.current = lastScan.current ? { ...lastScan.current, at: Date.now() } : null;
    setPhase({ kind: "scanning" });
  }

  if (phase.kind === "activities") {
    return (
      <ActivityRunner
        checkIn={phase.checkIn}
        guest={phase.guest}
        onFinish={(completed) => {
          // If PHOTO was disabled in settings, ensure GREET still fires on finish.
          void sendGreeting(phase.checkIn);
          refresh();
          setPhase({ kind: "done", checkIn: phase.checkIn, guest: phase.guest, completed });
        }}
      />
    );
  }

  if (phase.kind === "done") {
    return (
      <DoneView
        guest={phase.guest}
        checkIn={phase.checkIn}
        completed={phase.completed}
        onNext={reset}
        seconds={auto.on ? 3 : 6}
      />
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-night" onPointerDown={touch}>
      {standby ? <IdleSlideshow onWake={wake} watching={watching} /> : null}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${mirrored ? "-scale-x-100" : ""}`}
          playsInline
          muted
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/85 via-transparent to-night/90" />
      </div>

      <div className="relative z-10">
        <Header />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8">
        {camera.status === "error" ? (
          <div className="rise max-w-sm rounded-3xl border border-edge bg-panel/95 p-6 text-center">
            <Icon name="camera" className="mx-auto size-9 text-peach" />
            <p className="mt-3 text-[length:calc(16px*var(--fs))] text-cream">{camera.message}</p>
            <p className="mt-2 text-[length:calc(14px*var(--fs))] text-cream-dim">Kode undangan tetap bisa diketik manual.</p>
            <Button className="mt-5 w-full" onClick={() => setManual(true)}>
              <Icon name="keyboard" /> Ketik kode
            </Button>
          </div>
        ) : (
          <>
            <div className="finder relative aspect-square w-[min(72vw,340px)]">
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
                <span key={c} className={`absolute size-14 border-peach ${c}`} />
              ))}
              {camera.status === "live" ? (
                <span className="scanline absolute left-[8%] right-[8%] h-0.5 rounded bg-peach/80 shadow-[0_0_16px_2px] shadow-peach/60" />
              ) : null}
            </div>
            <p className="mt-8 text-center text-[length:calc(16px*var(--fs))] text-cream">
              {camera.status !== "live"
                ? "Membuka kamera…"
                : mirrored
                  ? "Minta tamu menunjukkan QR ke layar"
                  : "Arahkan ke QR undangan tamu"}
            </p>

          </>
        )}
        {auto.on ? (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ok/20 px-3 py-1 text-[length:calc(13px*var(--fs))] text-ok">
            <Icon name="check" className="size-4" /> Check-in otomatis
            {auto.skipActivities ? " · tanpa aktivitas" : ""}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 flex justify-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        <Button tone="ghost" className="bg-night/60 backdrop-blur" onClick={() => setManual(true)}>
          <Icon name="keyboard" /> Ketik kode
        </Button>
        <Button
          tone="ghost"
          className="bg-night/60 px-4 backdrop-blur"
          aria-label={`Ganti kamera (sekarang ${mirrored ? "depan" : "belakang"})`}
          onClick={() => setFacing("scan", mirrored ? "environment" : "user")}
        >
          <Icon name="flip" />
        </Button>
        <Button
          tone="ghost"
          className="bg-night/60 px-4 backdrop-blur"
          aria-label="Layar jeda"
          onClick={() => setStandby(true)}
        >
          <Icon name="tv" />
        </Button>
      </div>

      {manual ? (
        <ManualEntry
          onClose={() => setManual(false)}
          onSubmit={(text) => {
            setManual(false);
            lastScan.current = null;
            void handle(text);
          }}
        />
      ) : null}

      {phase.kind === "result" ? (
        <ResultView
          lookup={phase.lookup}
          onCancel={reset}
          onConfirm={confirm}
          autoSec={auto.on ? auto.delaySec : null}
          groupNameMode={groupNameMode}
        />
      ) : null}
    </div>
  );
}

function ManualEntry({ onClose, onSubmit }: { onClose(): void; onSubmit(text: string): void }) {
  const { pairing } = useApp();
  const [mode, setMode] = useState<"code" | "name">("name");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [guests, setGuests] = useState<SnapshotGuest[]>([]);
  const [addCat, setAddCat] = useState("GEN");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "name") void store.guests().then(setGuests);
  }, [mode]);

  // Case-insensitive substring match over the local guest list — the offline
  // equivalent of SQL ILIKE, so an usher can find anyone by name (great for
  // older guests who arrive without their QR).
  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return guests
      .filter((g) => g.householdName.toLowerCase().includes(q) || g.code.toLowerCase().includes(q))
      .slice(0, 25);
  }, [name, guests]);

  async function addGuest() {
    const nm = name.trim();
    const eventId = pairing?.event.id;
    if (!nm || !eventId || adding) return;
    setAdding(true);
    setAddErr(null);
    try {
      const g = await api.addGuest(eventId, { householdName: nm, category: addCat });
      // Make the new guest immediately check-in-able from this device.
      const cur = await store.guests();
      await store.replaceGuests([
        ...cur,
        {
          code: g.code,
          householdName: g.householdName,
          category: g.category as SnapshotGuest["category"],
          attending: true,
          admits: 1,
          table: null,
          vip: g.category === "VIP",
          isWalkIn: true,
        },
      ]);
      setAdding(false);
      onSubmit(g.code); // run the new guest's check-in straight away
    } catch {
      setAdding(false);
      setAddErr("Gagal menambah. Periksa koneksi.");
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end bg-night/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rise safe-bottom max-h-[85%] w-full rounded-t-[32px] bg-panel px-6 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === "code" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) onSubmit(text);
            }}
          >
            <p className="kicker text-peach">Check-in manual</p>
            <h2 className="mt-1 font-display text-[length:calc(28px*var(--fs))]">Ketik kode undangan</h2>
            <input
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              placeholder="AJ27-FAM-0001-2"
              className="mt-5 w-full rounded-2xl border border-edge bg-ground px-4 py-4 text-center font-mono text-[length:calc(22px*var(--fs))] tracking-[0.12em] text-cream outline-none placeholder:text-mute/50 focus:border-peach"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-2 text-center text-[length:calc(13px*var(--fs))] text-mute">Huruf terakhir adalah kode cek — salah ketik langsung ditolak.</p>
            <button
              type="button"
              onClick={() => setMode("name")}
              className="mt-3 block w-full text-center text-[length:calc(13px*var(--fs))] text-peach underline underline-offset-4"
            >
              atau cari berdasarkan nama tamu
            </button>
            <div className="mt-5 grid grid-cols-2 gap-3 pb-4">
              <Button tone="ghost" onClick={onClose}>Batal</Button>
              <Button type="submit">Cari tamu</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker text-peach">Cari nama</p>
                <h2 className="mt-1 font-display text-[length:calc(24px*var(--fs))]">Siapa yang datang?</h2>
              </div>
              <button
                type="button"
                onClick={() => setMode("code")}
                className="mt-1 shrink-0 text-[length:calc(13px*var(--fs))] text-peach underline underline-offset-4"
              >
                Kembali ke kode
              </button>
            </div>
            {/* Results ABOVE the field, so they grow upward and stay clear of the
                on-screen keyboard on a tablet. */}
            <div className="mt-3 max-h-[50dvh] overflow-y-auto">
              {name.trim() && matches.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[length:calc(14px*var(--fs))] text-mute">Tidak ada yang cocok.</p>
                  <p className="mt-1 text-[length:calc(12px*var(--fs))] text-mute/70">Tambahkan sebagai tamu baru (walk-in)?</p>
                  <div className="mx-auto mt-3 flex max-w-xs flex-wrap justify-center gap-1 rounded-xl bg-ground p-1">
                    {(
                      [
                        ["GEN", "Umum"],
                        ["VIP", "VIP"],
                        ["FAM", "Keluarga"],
                        ["FRN", "Teman"],
                        ["WRK", "Kolega"],
                      ] as const
                    ).map(([c, label]) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAddCat(c)}
                        className={`whitespace-nowrap rounded-lg px-2 py-1 text-[length:calc(12px*var(--fs))] ${
                          addCat === c ? "bg-peach text-peach-ink" : "text-cream-dim"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={adding}
                    onClick={() => void addGuest()}
                    className="mt-3 rounded-full bg-peach px-5 py-2 text-[length:calc(14px*var(--fs))] font-medium text-peach-ink disabled:opacity-50"
                  >
                    {adding ? "Menambah…" : "Tambah & check-in"}
                  </button>
                  {addErr ? <p className="mt-2 text-[length:calc(12px*var(--fs))] text-bad">{addErr}</p> : null}
                </div>
              ) : (
                <ul className="divide-y divide-edge/60 overflow-hidden rounded-2xl bg-ground">
                  {matches.map((g) => (
                    <li key={g.code}>
                      <button
                        type="button"
                        onClick={() => onSubmit(g.code)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-panel"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block break-words text-[length:calc(15px*var(--fs))] leading-snug text-cream">
                            {g.householdName}
                          </span>
                          <span className="block truncate text-[length:calc(11px*var(--fs))] text-mute">{g.code}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cari nama atau kode…"
              className="mt-3 w-full rounded-2xl border border-edge bg-ground px-4 py-3.5 text-[length:calc(16px*var(--fs))] text-cream outline-none placeholder:text-mute focus:border-peach"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const LABELS: Record<ActivityType, string> = { PHOTO: "Foto", GUESTBOOK: "Buku tamu", SOUVENIR: "Souvenir" };

function DoneView({
  guest,
  checkIn: row,
  completed,
  onNext,
  seconds,
}: {
  guest: SnapshotGuest;
  checkIn: CheckIn;
  completed: ActivityType[];
  onNext(): void;
  seconds: number;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) {
      onNext();
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onNext]);

  return (
    <div className="safe-top safe-bottom flex h-full flex-col items-center justify-center bg-ground px-8 text-center" onClick={onNext}>
      <div className="pop flex size-24 items-center justify-center rounded-full bg-ok text-ok-deep">
        <Icon name="check" className="size-12" />
      </div>
      <p className="kicker mt-8 text-peach">Selamat datang</p>
      <h1 className="mt-2 max-w-[18ch] font-display text-[length:calc(40px*var(--fs))] leading-tight">{guest.householdName}</h1>
      <p className="mt-3 text-[length:calc(16px*var(--fs))] text-cream-dim">{row.headcount} orang · check-in berhasil</p>

      {guest.vip ? (
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-1.5 text-[length:calc(16px*var(--fs))] font-semibold tracking-[0.18em] text-night">
          ✦ Tamu VIP
        </span>
      ) : null}

      {guest.table ? (
        <div className="mt-8 rounded-3xl border border-gold/40 px-10 py-5">
          <p className="kicker text-mute">Meja</p>
          <p className="font-display text-[56px] leading-none text-gold">{guest.table}</p>
        </div>
      ) : null}

      {completed.length ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {completed.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-[length:calc(13px*var(--fs))] text-cream-dim">
              <Icon name="check" className="size-4 text-ok" /> {LABELS[t]}
            </span>
          ))}
        </div>
      ) : null}

      <Button className="mt-10 w-full max-w-xs" onClick={onNext}>
        Scan tamu berikutnya · {left}
      </Button>
    </div>
  );
}

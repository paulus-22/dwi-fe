import { useEffect, useRef, useState } from "react";

import { Button, Icon } from "../components/ui";
import { recordActivity, savePhoto } from "../data/scanner";
import type { ActivityConfig, ActivityType, CheckIn, SnapshotGuest } from "../domain/types";
import { useCamera } from "../lib/camera";
import { cue } from "../lib/cue";
import { fileToImage, framePhoto, loadFrameFonts } from "../lib/photo";
import { useApp } from "../state";

/**
 * Runs the event's activities in order after a check-in. Each activity is a
 * step with its own screen; optional ones can be skipped, so a guest who does
 * not want a photo never holds up the queue.
 */
export function ActivityRunner({
  checkIn,
  guest,
  onFinish,
}: {
  checkIn: CheckIn;
  guest: SnapshotGuest;
  onFinish(completed: ActivityType[]): void;
}) {
  const { activities } = useApp();
  const steps = activities.filter((a) => a.enabled);
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState<ActivityType[]>([]);

  useEffect(() => {
    if (steps.length === 0) onFinish([]);
  }, [steps.length, onFinish]);

  if (steps.length === 0) return null;
  const step = steps[index];

  function next(done: boolean) {
    const list = done ? [...completed, step.type] : completed;
    setCompleted(list);
    if (index + 1 >= steps.length) onFinish(list);
    else setIndex(index + 1);
  }

  const props = { step, checkIn, guest, onDone: () => next(true), onSkip: () => next(false) };

  return (
    <div className="flex h-full flex-col bg-ground">
      <div className="safe-top flex items-center gap-3 px-5 pb-3">
        <div className="flex flex-1 gap-1.5">
          {steps.map((s, i) => (
            <span key={s.type} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-peach" : "bg-edge"}`} />
          ))}
        </div>
        <span className="text-[length:calc(13px*var(--fs))] text-mute">
          {index + 1}/{steps.length}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        {step.type === "PHOTO" ? <SelfieStep key={step.type} {...props} /> : null}
        {step.type === "GUESTBOOK" ? <GuestbookStep key={step.type} {...props} /> : null}
        {step.type === "SOUVENIR" ? <SouvenirStep key={step.type} {...props} /> : null}
      </div>
    </div>
  );
}

type StepProps = {
  step: ActivityConfig;
  checkIn: CheckIn;
  guest: SnapshotGuest;
  onDone(): void;
  onSkip(): void;
};

// ------------------------------------------------------------------ selfie

function SelfieStep({ step, checkIn, guest, onDone, onSkip }: StepProps) {
  const { pairing, facing, setFacing } = useApp();
  const selfie = facing.photo === "user";
  const [stage, setStage] = useState<"handover" | "live" | "review">("handover");
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { videoRef, state: camera } = useCamera(facing.photo, stage === "live");

  useEffect(() => void loadFrameFonts(), []);
  useEffect(() => () => void (result && URL.revokeObjectURL(result.url)), [result]);

  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    cue.shutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    const blob = await framePhoto(video, pairing!.event, guest.householdName, { mirror: selfie });
    setResult({ blob, url: URL.createObjectURL(blob) });
    setStage("review");
  }

  async function fromFile(file: File) {
    const img = await fileToImage(file);
    const blob = await framePhoto(img, pairing!.event, guest.householdName, { mirror: false });
    setResult({ blob, url: URL.createObjectURL(blob) });
    setStage("review");
  }

  async function keep() {
    if (!result) return;
    setSaving(true);
    await savePhoto(checkIn, guest, result.blob);
    onDone();
  }

  if (stage === "handover") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="pop flex size-24 items-center justify-center rounded-full bg-panel text-peach">
          <Icon name="camera" className="size-11" />
        </div>
        <p className="kicker mt-8 text-peach">{step.label}</p>
        <p className="mt-3 font-display text-[length:calc(22px*var(--fs))] italic text-cream-dim">Foto kenangan untuk</p>
        {/* The couple stand on their own: each name on its own line, set larger
            than the lead-in, with the ampersand as a small gold ornament. */}
        <h2 className="mt-2 font-display text-[length:calc(46px*var(--fs))] font-light leading-[1.05] text-cream">
          {pairing!.event.coupleLine.split("&").map((name, i, all) => (
            <span key={`${name}-${i}`} className="block">
              {name.trim()}
              {i < all.length - 1 ? (
                <span className="block py-1 text-[length:calc(24px*var(--fs))] italic text-gold">&amp;</span>
              ) : null}
            </span>
          ))}
        </h2>
        <p className="mt-4 max-w-[32ch] text-[length:calc(16px*var(--fs))] leading-relaxed text-cream-dim">
          {selfie
            ? "Serahkan perangkat ke tamu untuk selfie."
            : "Arahkan kamera belakang ke tamu untuk memotret."}{" "}
          Foto akan dibingkai dengan nama mempelai dan tampil di layar galeri.
        </p>
        <div className="mt-10 grid w-full max-w-sm gap-3">
          <Button onClick={() => setStage("live")}>
            <Icon name="camera" /> Mulai foto
          </Button>
          {!step.required ? <Button tone="quiet" onClick={onSkip}>Lewati foto</Button> : null}
        </div>
      </div>
    );
  }

  if (stage === "review" && result) {
    return (
      <div className="flex h-full flex-col px-5 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <img src={result.url} alt="Hasil foto" className="pop max-h-full rounded-2xl shadow-2xl shadow-black/50" />
        </div>
        <p className="mt-3 text-center text-[length:calc(13px*var(--fs))] text-mute">{Math.round(result.blob.size / 1024)} KB · tersimpan di perangkat lalu diunggah</p>
        <div className="safe-bottom mt-4 grid grid-cols-2 gap-3">
          <Button tone="ghost" onClick={() => { setResult(null); setStage("live"); }}>
            <Icon name="refresh" /> Ulangi
          </Button>
          <Button onClick={keep} disabled={saving}>
            <Icon name="check" /> {saving ? "Menyimpan…" : "Pakai foto"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative mx-5 min-h-0 flex-1 overflow-hidden rounded-[28px] bg-night">
        <video ref={videoRef} className={`h-full w-full object-cover ${selfie ? "-scale-x-100" : ""}`} playsInline muted />
        {camera.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-[length:calc(16px*var(--fs))] text-cream">{camera.message}</p>
            <Button onClick={() => fileRef.current?.click()}>
              <Icon name="image" /> Ambil dari kamera bawaan
            </Button>
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent px-6 pb-5 pt-16 text-center">
          <p className="font-display text-[length:calc(30px*var(--fs))] text-cream">{pairing!.event.coupleLine}</p>
          <p className="kicker mt-1 text-gold">{pairing!.event.dateLabel}</p>
        </div>
        {flash ? <div className="flash absolute inset-0 bg-white" /> : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={selfie ? "user" : "environment"}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void fromFile(file);
        }}
      />

      <p className="mt-3 px-8 text-center text-[length:calc(12px*var(--fs))] leading-snug text-mute">
        Dengan berfoto, tamu setuju fotonya dibagikan kepada mempelai dan ditampilkan di layar acara.
      </p>
      <div className="safe-bottom flex items-center justify-between px-8 pt-3">
        {!step.required ? (
          <button type="button" onClick={onSkip} className="w-20 text-left text-[length:calc(15px*var(--fs))] text-cream-dim">Lewati</button>
        ) : <span className="w-20" />}
        <button
          type="button"
          aria-label="Ambil foto"
          disabled={camera.status !== "live"}
          onClick={() => void capture()}
          className="flex size-20 items-center justify-center rounded-full border-4 border-cream/90 transition active:scale-95 disabled:opacity-40"
        >
          <span className="size-[60px] rounded-full bg-peach" />
        </button>
        <button
          type="button"
          aria-label="Ganti kamera"
          onClick={() => setFacing("photo", selfie ? "environment" : "user")}
          className="flex w-20 flex-col items-end text-[length:calc(13px*var(--fs))] text-cream-dim disabled:opacity-40"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-panel-2">
            <Icon name="flip" />
          </span>
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ guestbook

function GuestbookStep({ step, checkIn, guest, onDone, onSkip }: StepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState("");
  const [signed, setSigned] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f5f0e8";
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  }

  async function save() {
    const signature = signed ? canvasRef.current!.toDataURL("image/png") : null;
    await recordActivity(checkIn, "GUESTBOOK", { message: message.trim() || null, signature });
    onDone();
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pb-6">
      <p className="kicker mt-2 text-peach">{step.label}</p>
      <h2 className="mt-1 font-display text-[length:calc(34px*var(--fs))] leading-tight">Ucapan untuk mempelai</h2>
      <p className="mt-1 text-[length:calc(15px*var(--fs))] text-cream-dim">{guest.householdName}</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tulis doa dan ucapan…"
        rows={3}
        maxLength={280}
        className="mt-5 w-full resize-none rounded-2xl border border-edge bg-panel px-4 py-3 text-[length:calc(17px*var(--fs))] text-cream outline-none placeholder:text-mute focus:border-peach"
      />

      <div className="mt-5 flex items-center justify-between">
        <span className="kicker text-mute">Tanda tangan</span>
        {signed ? <button type="button" onClick={clear} className="text-[length:calc(14px*var(--fs))] text-peach">Hapus</button> : null}
      </div>
      <canvas
        ref={canvasRef}
        className="mt-2 h-44 w-full touch-none rounded-2xl border border-dashed border-gold/50 bg-panel"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext("2d")!;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const p = point(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          setSigned(true);
        }}
        onPointerUp={() => (drawing.current = false)}
      />

      <div className="safe-bottom mt-auto grid grid-cols-2 gap-3 pt-6">
        {!step.required ? <Button tone="ghost" onClick={onSkip}>Lewati</Button> : <span />}
        <Button onClick={save} disabled={!message.trim() && !signed}>
          <Icon name="pen" /> Simpan
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ souvenir

const SOUVENIRS = [
  { key: "standard", label: "Souvenir standar", note: "Untuk semua tamu" },
  { key: "family", label: "Paket keluarga", note: "Keluarga inti & VIP" },
];

function SouvenirStep({ step, checkIn, guest, onDone, onSkip }: StepProps) {
  const [kind, setKind] = useState(guest.category === "FAM" || guest.vip ? "family" : "standard");
  const [qty, setQty] = useState(1);

  async function save() {
    await recordActivity(checkIn, "SOUVENIR", { kind, qty });
    onDone();
  }

  return (
    <div className="flex h-full flex-col px-6 pb-6">
      <p className="kicker mt-2 text-peach">{step.label}</p>
      <h2 className="mt-1 font-display text-[length:calc(34px*var(--fs))] leading-tight">Serahkan souvenir</h2>
      <p className="mt-1 text-[length:calc(15px*var(--fs))] text-cream-dim">
        {guest.householdName} · {checkIn.headcount} orang
      </p>

      <div className="mt-6 space-y-3">
        {SOUVENIRS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setKind(s.key)}
            className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
              kind === s.key ? "border-peach bg-peach/10" : "border-edge bg-panel"
            }`}
          >
            <Icon name="gift" className={`size-8 ${kind === s.key ? "text-peach" : "text-mute"}`} />
            <span className="flex-1">
              <span className="block text-[length:calc(17px*var(--fs))] text-cream">{s.label}</span>
              <span className="block text-[length:calc(13px*var(--fs))] text-mute">{s.note}</span>
            </span>
            {kind === s.key ? <Icon name="check" className="size-6 text-peach" /> : null}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-panel p-2">
        <button type="button" className="size-14 rounded-xl bg-panel-2 text-[length:calc(28px*var(--fs))]" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
        <span className="text-[length:calc(17px*var(--fs))] text-cream">{qty} buah</span>
        <button type="button" className="size-14 rounded-xl bg-panel-2 text-[length:calc(28px*var(--fs))]" onClick={() => setQty((q) => Math.min(9, q + 1))}>+</button>
      </div>

      <div className="safe-bottom mt-auto grid grid-cols-2 gap-3 pt-6">
        {!step.required ? <Button tone="ghost" onClick={onSkip}>Lewati</Button> : <span />}
        <Button onClick={save}>
          <Icon name="check" /> Diberikan
        </Button>
      </div>
    </div>
  );
}

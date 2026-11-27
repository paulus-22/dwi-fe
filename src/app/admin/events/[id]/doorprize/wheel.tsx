"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Card, Notice, formatDateTime, formatTime, inputCls } from "@/components/ui";
import type { DoorprizeParticipant, DoorprizeState, DoorprizeWinner } from "@/lib/doorprize-types";

import {
  fetchDoorprizeAction,
  recordWinnerAction,
  removeWinnerAction,
  resetWinnersAction,
} from "./actions";

const TAU = Math.PI * 2;
/** Above this count, render a crisp 28-slice display wheel sampled fairly around the true winner. */
const MAX_VISIBLE_SLICES = 32;
const SAMPLED_SLICES = 28;
const SPIN_DURATION_MS = 5800;

/** Wedding-elegant jewel & sage palette matching The Moments aesthetic. */
const SLICE_COLORS = [
  "#2e3f23",
  "#c69c4b",
  "#4c6238",
  "#8f5b3e",
  "#22334a",
  "#7a8c5b",
  "#a66e46",
  "#5a4863",
];

/** Cryptographically uniform integer in [0, max). */
function cryptoInt(max: number): number {
  if (max <= 1) return 0;
  const arr = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  let val = 0;
  do {
    crypto.getRandomValues(arr);
    val = arr[0];
  } while (val >= limit);
  return val % max;
}

function cryptoUnit(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 0x1_0000_0000;
}

/** Fisher-Yates shuffle using crypto RNG. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = cryptoInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeMod(rad: number): number {
  return ((rad % TAU) + TAU) % TAU;
}

/** Given wheel rotation (radians), return the slice index under the 12-o'clock pointer. */
function indexAtPointer(rotation: number, count: number): number {
  if (count <= 0) return 0;
  const slice = TAU / count;
  const pointerAngle = normalizeMod(-Math.PI / 2 - rotation);
  return Math.floor(pointerAngle / slice) % count;
}

function winnerKey(w: Pick<DoorprizeWinner, "code" | "name" | "householdName">): string {
  const normMember =
    w.householdName && w.householdName.trim().toLowerCase() === w.name.trim().toLowerCase()
      ? ""
      : w.name.trim().toLowerCase();
  return `${w.code}::${normMember}`;
}

function truncateLabel(text: string, maxChars: number): string {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(2, maxChars - 1)).trimEnd()}…`;
}

// ------------------------------------------------------------------ Web Audio

function createAudioEngine() {
  let ctx: AudioContext | null = null;
  function ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  return {
    tick(speedRatio: number) {
      const c = ensure();
      if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520 + speedRatio * 340, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.032);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    },
    fanfare() {
      const c = ensure();
      if (!c) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const start = c.currentTime + i * 0.09;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    },
  };
}

// ------------------------------------------------------------------ Confetti

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  alpha: number;
};

function ConfettiOverlay({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#e9af8a", "#d8c3a5", "#a9b98a", "#f5f0e8", "#c69c4b", "#7fb069"];
    const particles: Particle[] = Array.from({ length: 120 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 7 + Math.random() * 11;
      return {
        x: w * (0.2 + Math.random() * 0.6),
        y: h * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 6 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 0.25,
        alpha: 1,
      };
    });

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.992;
        p.rot += p.vr;
        if (elapsed > 1800) p.alpha = Math.max(0, p.alpha - 0.02);
        if (p.alpha > 0.01 && p.y < h + 40) alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
        ctx.restore();
      }
      if (alive && elapsed < 3600) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[70] h-full w-full" aria-hidden />;
}

// ------------------------------------------------------------------ Component

export function DoorprizeWheel({
  eventId,
  eventTitle,
  dateLabel,
  canEdit,
  initial,
}: {
  eventId: string;
  eventTitle: string;
  dateLabel: string;
  canEdit: boolean;
  initial: DoorprizeState;
}) {
  const [participants, setParticipants] = useState<DoorprizeParticipant[]>(initial.participants);
  const [winners, setWinners] = useState<DoorprizeWinner[]>(initial.winners);
  const [prize, setPrize] = useState("");
  const [excludeWinners, setExcludeWinners] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [stageMode, setStageMode] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Spin animation state
  const [spinning, setSpinning] = useState(false);
  const [pointerName, setPointerName] = useState<string | null>(null);
  const [clapperTick, setClapperTick] = useState(false);
  const [candidate, setCandidate] = useState<DoorprizeParticipant | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudioEngine> | null>(null);

  const wonKeys = useMemo(() => {
    const s = new Set<string>();
    for (const w of winners) {
      if (w.checkInId) s.add(`id:${w.checkInId}`);
      s.add(winnerKey(w));
    }
    return s;
  }, [winners]);

  const eligible = useMemo(() => {
    if (!excludeWinners) return participants;
    return participants.filter((p) => !wonKeys.has(`id:${p.checkInId}`) && !wonKeys.has(p.entryKey));
  }, [participants, excludeWinners, wonKeys]);

  // Active slice snapshot used during/after a spin; when null, derived directly from `eligible`.
  const [spinSlices, setSpinSlices] = useState<DoorprizeParticipant[] | null>(null);

  const wheelSlices = useMemo(() => {
    if (spinSlices && (spinning || candidate)) return spinSlices;
    if (eligible.length <= MAX_VISIBLE_SLICES) return eligible;
    return eligible.slice(0, SAMPLED_SLICES);
  }, [spinSlices, spinning, candidate, eligible]);

  const filteredParticipants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.householdName?.toLowerCase().includes(q) ?? false),
    );
  }, [participants, search]);

  // Draw wheel on high-DPI canvas
  const drawWheel = useCallback((slices: DoorprizeParticipant[], rotation: number, activeSpin: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(280, Math.floor(Math.min(rect.width, rect.height) || 460));
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 10;
    const wheelR = outerR - 14;

    // Outer metallic gold-sage bezel
    const rimGrad = ctx.createRadialGradient(cx, cy, wheelR - 4, cx, cy, outerR);
    rimGrad.addColorStop(0, "#1c2417");
    rimGrad.addColorStop(0.55, "#c9a659");
    rimGrad.addColorStop(0.85, "#8f6e2d");
    rimGrad.addColorStop(1, "#e2c883");
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, TAU);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Decorative chasing rim lights
    const bulbCount = 24;
    const phase = activeSpin ? Math.floor(performance.now() / 120) : 0;
    for (let i = 0; i < bulbCount; i++) {
      const a = (i / bulbCount) * TAU;
      const bx = cx + Math.cos(a) * (wheelR + 7);
      const by = cy + Math.sin(a) * (wheelR + 7);
      const lit = (i + phase) % 2 === 0;
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, TAU);
      ctx.fillStyle = lit ? "#fff6dc" : "#5e4a22";
      ctx.fill();
    }

    if (slices.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, wheelR, 0, TAU);
      ctx.fillStyle = "#1b2216";
      ctx.fill();
      ctx.fillStyle = "#c8cfb8";
      ctx.font = `500 ${Math.round(size * 0.036)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Belum ada tamu yang discan", cx, cy);
      return;
    }

    const n = slices.length;
    const sliceAngle = TAU / n;
    const fontSize = Math.max(10, Math.min(18, Math.round((wheelR * 0.56) / Math.max(n * 0.55, 5))));
    const maxChars = n <= 8 ? 22 : n <= 16 ? 17 : 13;

    for (let i = 0; i < n; i++) {
      const start = rotation + i * sliceAngle;
      const end = start + sliceAngle;
      const color = SLICE_COLORS[i % SLICE_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, wheelR, start, end);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Subtle inner bevel & gold divider
      ctx.strokeStyle = "rgba(245, 240, 232, 0.25)";
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // Radial label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color === "#c69c4b" ? "#1b1e14" : "#f7f3ea";
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.shadowColor = color === "#c69c4b" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 3;
      const label = truncateLabel(slices[i].name, maxChars);
      ctx.fillText(label, wheelR - 16, 0);
      ctx.restore();
    }

    // Subtle inner shadow ring
    const innerShadow = ctx.createRadialGradient(cx, cy, wheelR * 0.72, cx, cy, wheelR);
    innerShadow.addColorStop(0, "rgba(0,0,0,0)");
    innerShadow.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.beginPath();
    ctx.arc(cx, cy, wheelR, 0, TAU);
    ctx.fillStyle = innerShadow;
    ctx.fill();

    // Center gold medallion
    const hubR = Math.max(30, Math.round(size * 0.088));
    const hubGrad = ctx.createRadialGradient(cx - 5, cy - 5, 4, cx, cy, hubR);
    hubGrad.addColorStop(0, "#f5e3b3");
    hubGrad.addColorStop(0.55, "#c69c4b");
    hubGrad.addColorStop(1, "#7b5a1f");
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, TAU);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f7f3ea";
    ctx.stroke();

    ctx.fillStyle = "#1a1d14";
    ctx.font = `700 ${Math.max(11, Math.round(hubR * 0.34))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(activeSpin ? "···" : "PUTAR", cx, cy);
  }, []);

  // Re-draw when slices or stage mode change
  useEffect(() => {
    drawWheel(wheelSlices, rotationRef.current, spinning);
    const onResize = () => drawWheel(wheelSlices, rotationRef.current, spinning);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [wheelSlices, spinning, stageMode, drawWheel]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = useCallback(() => {
    if (spinning || eligible.length === 0) return;
    setError(null);
    setCandidate(null);

    // 1. Cryptographically fair selection across ALL eligible checked-in guests.
    const trueWinner = eligible[cryptoInt(eligible.length)];

    // 2. Build display slices guaranteeing the true winner is on the wheel.
    let slices: DoorprizeParticipant[];
    if (eligible.length <= MAX_VISIBLE_SLICES) {
      slices = wheelSlices.length === eligible.length ? wheelSlices : eligible;
    } else {
      const others = eligible.filter((p) => p.entryKey !== trueWinner.entryKey);
      const sampled = shuffle(others).slice(0, SAMPLED_SLICES - 1);
      slices = shuffle([trueWinner, ...sampled]);
    }
    const winnerIndex = slices.findIndex((p) => p.entryKey === trueWinner.entryKey);
    setSpinSlices(slices);

    if (soundOn && !audioRef.current) audioRef.current = createAudioEngine();

    // 3. Compute exact final rotation so top pointer lands comfortably inside winnerIndex.
    const sliceAngle = TAU / slices.length;
    const landingOffset = (0.22 + cryptoUnit() * 0.56) * sliceAngle;
    const targetMod = normalizeMod(-Math.PI / 2 - (winnerIndex * sliceAngle + landingOffset));
    const startRot = rotationRef.current;
    const currentMod = normalizeMod(startRot);
    let deltaToTarget = normalizeMod(targetMod - currentMod);
    if (deltaToTarget < 0.25) deltaToTarget += TAU;
    const extraSpins = (6 + cryptoInt(3)) * TAU;
    const totalDelta = extraSpins + deltaToTarget;

    setSpinning(true);
    const startTime = performance.now();
    let lastIndex = indexAtPointer(startRot, slices.length);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / SPIN_DURATION_MS);
      // Quintic ease-out for dramatic slowdown
      const eased = 1 - Math.pow(1 - t, 5);
      const rot = startRot + totalDelta * eased;
      rotationRef.current = rot;
      drawWheel(slices, rot, t < 1);

      const curIndex = indexAtPointer(rot, slices.length);
      if (curIndex !== lastIndex) {
        lastIndex = curIndex;
        setPointerName(slices[curIndex]?.name ?? null);
        setClapperTick(true);
        setTimeout(() => setClapperTick(false), 65);
        if (soundOn) audioRef.current?.tick(1 - t);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setSpinning(false);
        setPointerName(trueWinner.name);
        setCandidate(trueWinner);
        setConfettiKey((k) => k + 1);
        if (soundOn) audioRef.current?.fanfare();
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [spinning, eligible, wheelSlices, soundOn, drawWheel]);

  // Spacebar shortcut in stage mode
  useEffect(() => {
    if (!stageMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setStageMode(false);
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      } else if (e.code === "Space" && !candidate && !spinning) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stageMode, candidate, spinning, spin]);

  async function toggleStageMode() {
    if (!stageMode) {
      setStageMode(true);
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* overlay still fills viewport cleanly */
      }
    } else {
      setStageMode(false);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    const res = await fetchDoorprizeAction(eventId);
    setRefreshing(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setParticipants(res.data.participants);
    setWinners(res.data.winners);
  }

  async function handleSaveWinner() {
    if (!candidate || !canEdit) return;
    setSaving(true);
    setError(null);
    const res = await recordWinnerAction(eventId, {
      checkInId: candidate.checkInId,
      code: candidate.code,
      name: candidate.name,
      householdName: candidate.householdName,
      prize: prize.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setWinners((prev) => [res.winner, ...prev]);
    setCandidate(null);
  }

  async function handleRemoveWinner(winnerId: string) {
    if (!canEdit) return;
    setError(null);
    const res = await removeWinnerAction(eventId, winnerId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setWinners((prev) => prev.filter((w) => w.id !== winnerId));
  }

  async function handleResetWinners() {
    if (!canEdit) return;
    if (!confirm("Hapus seluruh daftar pemenang doorprize untuk acara ini?")) return;
    setError(null);
    const res = await resetWinnersAction(eventId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setWinners([]);
  }

  const wheelBlock = (
    <div className="flex flex-col items-center">
      {/* Live ticker pill */}
      <div
        className={`mb-4 flex min-h-10 items-center justify-center rounded-full px-5 py-1.5 text-center text-sm font-medium transition-colors ${
          stageMode
            ? "border border-[#bdca9f]/30 bg-[#1a2215]/90 text-[#f5f0e8]"
            : "border border-panel-border bg-white text-admin-ink shadow-xs"
        }`}
      >
        {pointerName ? (
          <span className="max-w-[28ch] truncate">{pointerName}</span>
        ) : eligible.length > 0 ? (
          <span className={stageMode ? "text-[#bdca9f]" : "text-admin-muted"}>
            {eligible.length} peserta siap diundi
            {eligible.length > MAX_VISIBLE_SLICES
              ? ` · menampilkan ${SAMPLED_SLICES} di roda (peluang sama)`
              : ""}
          </span>
        ) : (
          <span className={stageMode ? "text-[#bdca9f]/70" : "text-admin-muted"}>
            {participants.length === 0
              ? "Belum ada tamu yang discan"
              : "Semua tamu hadir sudah pernah menang"}
          </span>
        )}
      </div>

      {/* Wheel + top pointer */}
      <div className="relative flex items-center justify-center">
        {/* Top pointer arrow */}
        <div
          className={`pointer-events-none absolute -top-3 z-20 transition-transform duration-75 ${
            clapperTick ? "-rotate-12 scale-105" : "rotate-0"
          }`}
          aria-hidden
        >
          <svg width="38" height="44" viewBox="0 0 38 44" fill="none">
            <path
              d="M19 42L4 12C2.5 8.5 5 4 9 4H29C33 4 35.5 8.5 34 12L19 42Z"
              fill="#e2c883"
              stroke="#1b1e14"
              strokeWidth="2.5"
            />
            <circle cx="19" cy="13" r="4" fill="#1b1e14" />
          </svg>
        </div>

        <canvas
          ref={canvasRef}
          onClick={() => {
            if (!spinning && eligible.length > 0) spin();
          }}
          className={`aspect-square select-none rounded-full shadow-2xl ${
            stageMode ? "h-[min(68vh,560px)] w-[min(68vh,560px)]" : "h-[min(78vw,440px)] w-[min(78vw,440px)]"
          } ${!spinning && eligible.length > 0 ? "cursor-pointer" : "cursor-default"}`}
        />
      </div>

      {/* Primary spin button */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={spin}
          disabled={spinning || eligible.length === 0}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold tracking-wide transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${
            stageMode
              ? "bg-[#d4b062] text-[#141a10] shadow-lg shadow-black/40 hover:bg-[#e2c276]"
              : "bg-accent text-white shadow-md hover:bg-accent-strong"
          }`}
        >
          {spinning ? "Mengundi…" : "Putar Roda"}
        </button>
        {stageMode ? (
          <span className="text-xs text-[#bdca9f]/70">atau tekan Spasi</span>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <ConfettiOverlay trigger={confettiKey} />

      {/* Fullscreen Stage Overlay */}
      {stageMode ? (
        <div
          ref={stageRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-y-auto bg-[radial-gradient(110%_80%_at_50%_0%,#20291a_0%,#141a10_58%,#0b0f08_100%)] px-6 py-6 text-[#f5f0e8]"
        >
          <div className="flex w-full max-w-5xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-[#bdca9f] uppercase">Doorprize · {dateLabel}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{eventTitle}</h2>
              {prize.trim() ? (
                <p className="mt-1 inline-block rounded-full border border-[#d4b062]/40 bg-[#d4b062]/15 px-3 py-0.5 text-sm text-[#e8cf91]">
                  Hadiah: {prize.trim()}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-[#f5f0e8] hover:bg-white/10"
              >
                {soundOn ? "Suara: Aktif" : "Suara: Bisu"}
              </button>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={refreshing || spinning}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-[#f5f0e8] hover:bg-white/10 disabled:opacity-40"
              >
                {refreshing ? "Memuat…" : `Muat ulang (${eligible.length})`}
              </button>
              <button
                type="button"
                onClick={() => void toggleStageMode()}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-[#f5f0e8] hover:bg-white/20"
              >
                Keluar layar penuh
              </button>
            </div>
          </div>

          <div className="my-auto py-4">{wheelBlock}</div>

          <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-xs text-[#bdca9f]/70">
            <span>Total hadir: {participants.length} · Pemenang tersimpan: {winners.length}</span>
            {winners.length > 0 ? (
              <span>Pemenang terakhir: {winners[0].name}{winners[0].prize ? ` (${winners[0].prize})` : ""}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Winner Reveal Modal */}
      {candidate ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#d4b062]/40 bg-[radial-gradient(120%_80%_at_50%_0%,#24301c_0%,#141a10_70%,#0d110a_100%)] p-7 text-center text-[#f5f0e8] shadow-2xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#d4b062] uppercase">
              Selamat kepada pemenang!
            </p>
            {prize.trim() ? (
              <p className="mt-2 inline-block rounded-full border border-[#d4b062]/40 bg-[#d4b062]/15 px-4 py-1 text-sm font-medium text-[#eed79d]">
                {prize.trim()}
              </p>
            ) : null}

            <h3 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {candidate.name}
            </h3>
            <p className="mt-1.5 text-sm text-[#bdca9f]">
              {candidate.householdName && candidate.householdName !== candidate.name
                ? `${candidate.householdName} · `
                : ""}
              <span className="font-mono">{candidate.code}</span>
            </p>

            {candidate.selfie ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidate.selfie}
                alt={candidate.name}
                className="mx-auto mt-5 aspect-[4/3] w-full max-w-[300px] rounded-2xl border-2 border-[#d4b062]/60 object-cover shadow-lg"
              />
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void handleSaveWinner()}
                  disabled={saving}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#d4b062] px-4 text-sm font-semibold text-[#141a10] transition hover:bg-[#e2c276] disabled:opacity-50"
                >
                  {saving ? "Menyimpan…" : "Simpan pemenang"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setCandidate(null);
                  setTimeout(() => spin(), 120);
                }}
                disabled={saving}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-medium text-[#f5f0e8] transition hover:bg-white/15"
              >
                Putar ulang (tidak hadir)
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCandidate(null)}
              disabled={saving}
              className="mt-3 text-xs text-[#bdca9f]/70 underline-offset-4 hover:text-[#f5f0e8] hover:underline"
            >
              Tutup tanpa menyimpan
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      {/* Normal Admin Layout */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="flex flex-col items-center">
          <div className="mb-5 flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium">Roda Undian</h2>
              <p className="text-xs text-admin-muted">
                Diambil otomatis dari tamu yang sudah discan check-in.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" type="button" onClick={() => setSoundOn((s) => !s)}>
                {soundOn ? "Suara: Aktif" : "Suara: Bisu"}
              </Button>
              <Button variant="secondary" type="button" onClick={() => void toggleStageMode()}>
                Mode layar penuh
              </Button>
            </div>
          </div>

          {!stageMode ? wheelBlock : (
            <p className="py-12 text-sm text-admin-muted">Sedang tampil di mode layar penuh…</p>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-medium">Pengaturan undian</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="doorprize-prize" className="mb-1 block text-xs font-medium text-admin-muted">
                  Nama hadiah (opsional)
                </label>
                <input
                  id="doorprize-prize"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="Mis. Grand Prize — Logam Mulia"
                  maxLength={120}
                  className={inputCls}
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-control)] border border-panel-border px-3 py-2.5 text-sm">
                <span>Kecualikan pemenang sebelumnya</span>
                <input
                  type="checkbox"
                  checked={excludeWinners}
                  onChange={(e) => setExcludeWinners(e.target.checked)}
                  className="size-4 accent-accent"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-xs text-admin-muted">
                  Tamu hadir: <strong className="text-admin-ink">{participants.length}</strong> · Berpeluang:{" "}
                  <strong className="text-admin-ink">{eligible.length}</strong>
                </p>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing || spinning}
                >
                  {refreshing ? "Memuat…" : "Muat ulang peserta"}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-medium">Daftar pemenang ({winners.length})</h2>
              {canEdit && winners.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleResetWinners()}
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Reset semua
                </button>
              ) : null}
            </div>
            {winners.length === 0 ? (
              <p className="text-sm text-admin-muted">Belum ada pemenang tersimpan.</p>
            ) : (
              <ul className="divide-y divide-panel-border text-sm">
                {winners.map((w, idx) => (
                  <li key={w.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-medium">
                        <span className="mr-1.5 text-xs text-admin-faint">#{winners.length - idx}</span>
                        {w.name}
                      </p>
                      <p className="text-xs text-admin-muted">
                        {w.prize ? <span className="font-medium text-accent-strong">{w.prize} · </span> : null}
                        <span className="font-mono">{w.code}</span> · {formatDateTime(w.drawnAt)}
                      </p>
                    </div>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveWinner(w.id)}
                        className="shrink-0 text-xs text-admin-muted hover:text-danger"
                      >
                        Hapus
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-medium">Peserta hadir ({participants.length})</h2>
            </div>
            {participants.length > 0 ? (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau kode…"
                className={`${inputCls} mb-3`}
              />
            ) : null}
            {filteredParticipants.length === 0 ? (
              <p className="text-sm text-admin-muted">
                {participants.length === 0 ? "Belum ada tamu yang discan check-in." : "Tidak ada yang cocok."}
              </p>
            ) : (
              <ul className="max-h-64 divide-y divide-panel-border overflow-y-auto text-sm">
                {filteredParticipants.map((p) => {
                  const alreadyWon = wonKeys.has(`id:${p.checkInId}`) || wonKeys.has(p.entryKey);
                  return (
                    <li key={p.entryKey} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className={`truncate font-medium ${alreadyWon && excludeWinners ? "text-admin-muted line-through" : ""}`}>
                          {p.name}
                        </p>
                        <p className="truncate text-xs text-admin-muted">
                          <span className="font-mono">{p.code}</span> · {p.deviceName} · {formatTime(p.occurredAt)}
                        </p>
                      </div>
                      {alreadyWon ? (
                        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-strong">
                          Menang
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

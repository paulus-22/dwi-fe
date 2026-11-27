import { useEffect, useRef, useState } from "react";

import { Button, Chip, Icon } from "../components/ui";
import type { Lookup } from "../data/scanner";
import { CATEGORIES } from "../domain/codes";
import type { SnapshotGuest } from "../domain/types";
import { agoLabel, timeLabel } from "../lib/ui";

/**
 * The verdict sheet. Colour carries the answer — green go, amber think, red
 * stop — so an usher reading it at arm's length in a dim hall gets it before
 * reading a word.
 */
export function ResultView({
  lookup,
  onCancel,
  onConfirm,
  autoSec = null,
  groupNameMode = "usher",
}: {
  lookup: Lookup;
  onCancel(): void;
  onConfirm(guest: SnapshotGuest, headcount: number, override: boolean, memberName?: string): void;
  /** Seconds before a green result checks in by itself; null = auto off. */
  autoSec?: number | null;
  /** 'usher' = the door types the member's name; 'guest' = hand tablet to them. */
  groupNameMode?: "usher" | "guest";
}) {
  if (lookup.kind === "invalid" || lookup.kind === "unknown") {
    return (
      <Sheet tone="bad" onBackdrop={onCancel}>
        <Banner tone="bad" icon="x" title={lookup.kind === "invalid" ? "QR tidak dikenal" : "Kode tidak terdaftar"} />
        <div className="px-6 pb-2 pt-5">
          <p className="text-[length:calc(16px*var(--fs))] leading-relaxed text-cream-dim">
            {lookup.kind === "invalid"
              ? "Ini bukan QR undangan acara ini, atau kodenya salah ketik."
              : "Kodenya valid, tapi tidak ada di daftar tamu acara ini."}
          </p>
          <p className="mt-3 break-all rounded-xl bg-ground px-4 py-3 font-mono text-[length:calc(13px*var(--fs))] text-mute">
            {lookup.kind === "invalid" ? lookup.raw : lookup.code}
          </p>
          <p className="mt-3 text-[length:calc(14px*var(--fs))] text-cream-dim">Arahkan tamu ke meja penerima tamu untuk dicek manual.</p>
        </div>
        <div className="px-6 pb-4 pt-4">
          <Button tone="ghost" className="w-full" onClick={onCancel}>Kembali scan</Button>
        </div>
      </Sheet>
    );
  }

  return <GuestSheet lookup={lookup} onCancel={onCancel} onConfirm={onConfirm} autoSec={autoSec} groupNameMode={groupNameMode} />;
}

function GuestSheet({
  lookup,
  onCancel,
  onConfirm,
  autoSec,
  groupNameMode,
}: {
  lookup: Extract<Lookup, { guest: SnapshotGuest }>;
  onCancel(): void;
  onConfirm(guest: SnapshotGuest, headcount: number, override: boolean, memberName?: string): void;
  autoSec: number | null;
  /** 'usher' = the door types the member's name; 'guest' = hand tablet to them. */
  groupNameMode: "usher" | "guest";
}) {
  const { guest, previous } = lookup;
  const [count, setCount] = useState(guest.admits);
  const [confirmOverride, setConfirmOverride] = useState(false);
  const over = count > guest.admits;
  const [memberName, setMemberName] = useState("");
  const group = guest.group === true;
  const groupCap = guest.groupCap ?? guest.admits;
  const nameInputId = "group-member-name";

  // Auto check-in only ever fires for a clean green result. Touching the
  // headcount stops it: the usher has taken over.
  const [autoLeft, setAutoLeft] = useState<number | null>(
    lookup.kind === "ok" && autoSec !== null && !(guest.group === true) ? autoSec : null,
  );
  const fired = useRef(false);
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  useEffect(() => {
    if (autoLeft === null || fired.current) return;
    if (autoLeft <= 0) {
      fired.current = true;
      confirmRef.current(guest, guest.admits, false);
      return;
    }
    const t = setTimeout(() => setAutoLeft((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [autoLeft, guest]);
  const stopAuto = () => setAutoLeft(null);

  const tone = lookup.kind === "ok" ? "ok" : "warn";
  const title =
    lookup.kind === "ok"
      ? "Silakan masuk"
      : lookup.kind === "duplicate"
        ? "Sudah check-in"
        : guest.attending === false
          ? "Konfirmasi tidak hadir"
          : "Belum konfirmasi RSVP";

  return (
    <Sheet tone={tone} onBackdrop={onCancel}>
      <Banner tone={tone} icon={tone === "ok" ? "check" : "alert"} title={title} />

      <div className="px-6 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip className="bg-panel-2 text-cream-dim">{CATEGORIES[guest.category]}</Chip>
          {guest.vip ? <Chip className="bg-gold/20 text-gold">VIP</Chip> : null}
          {guest.table ? <Chip className="bg-panel-2 text-cream-dim">Meja {guest.table}</Chip> : null}
          <span className="ml-auto font-mono text-[length:calc(12px*var(--fs))] text-mute">{guest.code}</span>
        </div>
        <h2 className="mt-3 font-display text-[length:calc(34px*var(--fs))] leading-[1.1] text-cream">{guest.householdName}</h2>

        {lookup.kind === "duplicate" ? (
          <div className="mt-4 space-y-2">
            {previous.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-warn-deep/60 px-4 py-3 text-[length:calc(14px*var(--fs))]">
                <span className="text-cream">
                  {timeLabel(p.occurredAt)} · {p.deviceName}
                </span>
                <span className="text-cream-dim">{p.headcount} org · {agoLabel(p.occurredAt)}</span>
              </div>
            ))}
            <p className="text-[length:calc(14px*var(--fs))] leading-relaxed text-cream-dim">
              Bisa jadi tangkapan layar yang diteruskan. Cocokkan nama dengan tamu sebelum mengizinkan masuk.
            </p>
          </div>
        ) : lookup.kind === "not_confirmed" ? (
          <p className="mt-3 text-[length:calc(15px*var(--fs))] leading-relaxed text-cream-dim">
            {guest.attending === false
              ? "Tamu ini sebelumnya menjawab tidak bisa hadir. Tetap bisa masuk jika rencana berubah."
              : "Tamu belum mengisi RSVP. Undangan berlaku untuk maksimal"}{" "}
            {guest.attending === false ? null : <strong className="text-cream">{guest.admits} orang</strong>}
          </p>
        ) : (
          <p className="mt-2 text-[length:calc(15px*var(--fs))] text-cream-dim">
            Konfirmasi RSVP: <strong className="text-cream">{guest.admits} orang</strong>
          </p>
        )}
      </div>

      <div className="mt-5 px-6">
        <p className="kicker text-mute">Jumlah yang datang</p>
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-ground p-2">
          <StepButton label="−" onClick={() => { stopAuto(); setCount((c) => Math.max(1, c - 1)); }} disabled={count <= 1} />
          <div className="text-center">
            <span className="font-display text-[length:calc(44px*var(--fs))] leading-none text-cream">{count}</span>
            <span className="ml-2 text-[length:calc(15px*var(--fs))] text-cream-dim">orang</span>
          </div>
          <StepButton label="+" onClick={() => { stopAuto(); setCount((c) => Math.min(10, c + 1)); }} />
        </div>
        {over ? (
          <p className="mt-2 text-[length:calc(13px*var(--fs))] text-warn">Melebihi jatah undangan ({guest.admits}). Akan dicatat sebagai pengecualian.</p>
        ) : null}
      </div>

      {group ? (
        <div className="mt-4 px-6">
          <p className="kicker text-mute">
            {groupNameMode === "usher" ? "Siapa yang datang? (diisi penerima tamu)" : "Siapa Anda? Ketik nama Anda"}
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-ground px-4 py-3">
            <span className="text-cream-dim">&nbsp;</span>
            <input
              id={nameInputId}
              autoFocus
              value={memberName}
              placeholder="nama anggota (mis. Paul)"
              maxLength={80}
              onChange={(e) => { stopAuto(); setMemberName(e.target.value); }}
              className="w-full bg-transparent text-[length:calc(18px*var(--fs))] text-cream placeholder:text-mute outline-none"
              aria-label="Nama anggota kelompok"
            />
          </div>
          <p className="mt-2 text-[length:calc(13px*var(--fs))] text-cream-dim">Cap jatah kelompok: {groupCap} orang</p>
        </div>
      ) : null}

      {autoLeft !== null && autoSec ? (
        <div className="mx-6 mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-ground">
            <div
              className="h-full rounded-full bg-ok"
              style={{ width: "100%", animation: `autobar ${autoSec}s linear forwards` }}
            />
          </div>
          <p className="mt-2 text-center text-[length:calc(14px*var(--fs))] text-cream-dim">
            Check-in otomatis dalam {Math.max(autoLeft, 0)} dtk · ketuk Batal atau ubah jumlah untuk menahan
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr_1.6fr] gap-3 px-6 pb-4 pt-5">
        <Button tone="ghost" onClick={onCancel}>Batal</Button>
        {lookup.kind === "duplicate" && !confirmOverride ? (
          <Button tone="warn" onClick={() => setConfirmOverride(true)}>Tetap izinkan…</Button>
        ) : (
          <Button
            tone={lookup.kind === "ok" && !over ? "ok" : "warn"}
            disabled={group && memberName.trim().length === 0}
            onClick={() => onConfirm(guest, count, lookup.kind !== "ok" || over, group ? memberName.trim() : undefined)}
          >
            <Icon name="check" /> {confirmOverride ? "Ya, izinkan masuk" : "Check-in"}
          </Button>
        )}
      </div>
    </Sheet>
  );
}

function StepButton({ label, onClick, disabled }: { label: string; onClick(): void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="size-14 rounded-xl bg-panel-2 text-[length:calc(28px*var(--fs))] text-cream transition active:bg-edge disabled:opacity-30"
    >
      {label}
    </button>
  );
}

const sheetEdge = { ok: "border-ok", warn: "border-warn", bad: "border-bad" } as const;
const bannerBg = { ok: "bg-ok text-ok-deep", warn: "bg-warn text-warn-deep", bad: "bg-bad text-cream" } as const;

function Sheet({
  tone,
  onBackdrop,
  children,
}: {
  tone: keyof typeof sheetEdge;
  onBackdrop(): void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-night/60 backdrop-blur-[2px]" onClick={onBackdrop}>
      <div
        className={`rise safe-bottom w-full overflow-hidden rounded-t-[32px] border-t-4 bg-panel ${sheetEdge[tone]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Banner({ tone, icon, title }: { tone: keyof typeof bannerBg; icon: "check" | "alert" | "x"; title: string }) {
  return (
    <div className={`flex items-center gap-3 px-6 py-4 ${bannerBg[tone]}`}>
      <span className="pop flex size-10 items-center justify-center rounded-full bg-black/10">
        <Icon name={icon} className="size-6" />
      </span>
      <span className="text-[length:calc(20px*var(--fs))] font-medium tracking-wide">{title}</span>
    </div>
  );
}

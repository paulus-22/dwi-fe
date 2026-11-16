"use client";

import { useState } from "react";

import { submitRsvp } from "@/lib/public-client";

export type BlockGuest = {
  token: string;
  householdName: string;
  plusGuestAllowance: number;
  rsvp: {
    attending: boolean;
    guestCount: number;
    message: string | null;
  } | null;
};

/** Themed form primitives (styled by the `.gt-*` rules + `--g-*` vars in globals.css). */
export const fieldCls = "gt-field";
export const labelCls = "gt-label";

export type Shape = "sharp" | "soft" | "editorial";

export function FormNotice({ tone = "info", children }: { tone?: "info" | "error"; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} data-tone={tone} className="gt-notice">
      {children}
    </p>
  );
}

/** Shown by both forms when the visitor opened the page without a personal link. */
export function NeedsInvitation() {
  return (
    <FormNotice>
      Buka tautan undangan pribadi Anda (yang memuat <code>?to=…</code>) untuk mengisi formulir ini.
    </FormNotice>
  );
}

export function RsvpBlock({
  slug,
  guest,
  description,
  shape = "sharp",
}: {
  slug: string;
  guest: BlockGuest | null;
  description?: string;
  shape?: Shape;
}) {
  const [name, setName] = useState(guest?.householdName ?? "");
  const [attending, setAttending] = useState<boolean | null>(guest?.rsvp?.attending ?? null);
  const [count, setCount] = useState(guest?.rsvp?.guestCount || 1);
  const [message, setMessage] = useState(guest?.rsvp?.message ?? "");
  const [state, setState] = useState<"idle" | "sending" | "done">(guest?.rsvp ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);

  if (!guest) return <NeedsInvitation />;
  const max = guest.plusGuestAllowance + 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest) return;
    if (!name.trim()) return setError("Nama wajib diisi.");
    if (attending === null) return setError("Pilih hadir atau tidak hadir.");
    if (attending && (count < 1 || count > max)) return setError(`Jumlah tamu harus antara 1 dan ${max}.`);
    setError(null);
    setState("sending");
    const failure = await submitRsvp(slug, guest.token, {
      name: name.trim(),
      attending,
      guestCount: attending ? count : 1,
      message: message.trim(),
    });
    if (failure !== null) {
      setState("idle");
      setError(failure || "Gagal mengirim. Coba lagi sebentar.");
      return;
    }
    setState("done");
  }

  if (state === "done")
    return (
      <div className={`space-y-3 ${shape === "soft" ? "text-center" : ""}`}>
        {shape === "soft" ? (
          <span
            aria-hidden="true"
            className="mx-auto grid size-[60px] place-items-center rounded-full bg-[#f1dfbb] text-[29px] text-[#76511d]"
          >
            ✓
          </span>
        ) : null}
        <FormNotice>{attending ? `Terima kasih! Kehadiran ${count} orang tercatat.` : "Terima kasih atas konfirmasinya."}</FormNotice>
        {attending ? (
          <a href={`/v/${encodeURIComponent(slug)}?to=${encodeURIComponent(guest.token)}`} className="gt-btn mr-4 !w-auto px-6">
            Lihat tiket &amp; QR
          </a>
        ) : null}
        <button type="button" className="gt-ghost" onClick={() => setState("idle")}>
          Ubah jawaban
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {description ? <p className="text-sm leading-relaxed text-[var(--g-muted)]">{description}</p> : null}
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <label className="block">
        <span className={labelCls}>Nama</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={fieldCls} />
      </label>
      {shape === "soft" ? (
        // Segmented choice (corporate-soft); same state + validation as the select below.
        <fieldset>
          <legend className={labelCls}>Kehadiran</legend>
          <div className="flex gap-2.5">
            {(
              [
                [true, "✓　Hadir"],
                [false, "Tidak hadir"],
              ] as const
            ).map(([v, label]) => (
              <button key={String(v)} type="button" className="gt-choice" aria-pressed={attending === v} onClick={() => setAttending(v)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <label className="block">
          <span className={labelCls}>Kehadiran</span>
          <select
            value={attending === null ? "" : attending ? "yes" : "no"}
            onChange={(e) => setAttending(e.target.value === "" ? null : e.target.value === "yes")}
            className={fieldCls}
          >
            <option value="">Pilih jawaban Anda</option>
            <option value="yes">Ya, saya hadir</option>
            <option value="no">Tidak dapat hadir</option>
          </select>
        </label>
      )}
      {attending ? (
        <label className="block">
          <span className={labelCls}>Jumlah tamu (maks. {max})</span>
          <input type="number" min={1} max={max} value={count} onChange={(e) => setCount(Number(e.target.value))} className={fieldCls} />
        </label>
      ) : null}
      <label className="block">
        <span className={labelCls}>Pesan (opsional)</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={600} className={fieldCls} />
      </label>
      <button type="submit" disabled={state === "sending"} className="gt-btn">
        {state === "sending" ? "Mengirim…" : "Kirim"}
        {shape === "soft" && state !== "sending" ? "　›" : null}
        {shape === "editorial" && state !== "sending" ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}

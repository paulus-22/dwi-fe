"use client";

import { useState } from "react";

import { Button, Notice } from "@/components/ui";
import { submitRsvp } from "@/lib/public-client";

export type BlockGuest = {
  token: string;
  householdName: string;
  plusGuestAllowance: number;
  rsvp: { attending: boolean; guestCount: number; message: string | null } | null;
};

export const fieldCls =
  "w-full rounded-[var(--radius-control)] border border-panel-border bg-white px-3 py-2 outline-none focus:border-gold";

/** Shown by both forms when the visitor opened the page without a personal link. */
export function NeedsInvitation() {
  return <Notice>Buka tautan undangan pribadi Anda (yang memuat <code>?to=…</code>) untuk mengisi formulir ini.</Notice>;
}

export function RsvpBlock({ slug, guest, description }: { slug: string; guest: BlockGuest | null; description?: string }) {
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
      <div className="space-y-3">
        <Notice>
          {attending ? `Terima kasih! Kehadiran ${count} orang tercatat.` : "Terima kasih atas konfirmasinya."}
        </Notice>
        <Button variant="ghost" onClick={() => setState("idle")}>
          Ubah jawaban
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {description ? <p className="text-admin-muted">{description}</p> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Nama</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={fieldCls} />
      </label>
      <fieldset className="space-y-1.5">
        <legend className="text-sm text-admin-muted">Kehadiran</legend>
        <div className="flex gap-3">
          {[
            [true, "Hadir"],
            [false, "Tidak hadir"],
          ].map(([v, label]) => (
            <label key={String(v)} className="flex items-center gap-2">
              <input type="radio" name="attending" checked={attending === v} onChange={() => setAttending(v as boolean)} className="accent-gold" />
              {label as string}
            </label>
          ))}
        </div>
      </fieldset>
      {attending ? (
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Jumlah tamu (maks. {max})</span>
          <input type="number" min={1} max={max} value={count} onChange={(e) => setCount(Number(e.target.value))} className={fieldCls} />
        </label>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Pesan (opsional)</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={600} className={fieldCls} />
      </label>
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Mengirim…" : "Kirim"}
      </Button>
    </form>
  );
}

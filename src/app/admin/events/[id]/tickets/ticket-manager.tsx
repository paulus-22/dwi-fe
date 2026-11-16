"use client";

import { useActionState, useState } from "react";

import { Button, Card, Notice, textareaCls } from "@/components/ui";
import type { ActionState } from "@/lib/builder";
import type { AllowlistEntry, RegistrationMode, TicketType } from "@/lib/tickets";

import { inputCls, smallBtn, submitKeepingInput, useRowAction } from "../builder-ui";
import {
  addAllowlist,
  createTicketType,
  deleteTicketType,
  expandTicketType,
  removeAllowlistEntry,
  setRegistrationMode,
  updateTicketType,
} from "./actions";

export function TicketManager({
  eventId,
  ticketTypes,
  entries,
  entriesError,
  mode,
}: {
  eventId: string;
  ticketTypes: TicketType[];
  entries: AllowlistEntry[];
  entriesError: string | null;
  mode: RegistrationMode | null;
}) {
  const row = useRowAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const sorted = [...ticketTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      {row.error ? <Notice tone="error">{row.error}</Notice> : null}

      <Card>
        <h2 className="mb-1 font-medium">Jenis tiket</h2>
        <p className="mb-4 text-sm text-admin-muted">
          Dipakai untuk pendaftaran mandiri (mode Terbuka / Daftar izin). Jika belum ada jenis tiket, halaman publik tetap
          hanya untuk tamu dengan tautan undangan.
        </p>
        {sorted.length === 0 ? (
          <p className="text-sm text-admin-muted">Belum ada jenis tiket.</p>
        ) : (
          <ul className="divide-y divide-panel-border">
            {sorted.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{t.name}</p>
                    {t.description ? <p className="text-sm text-admin-muted">{t.description}</p> : null}
                    <p className="text-xs text-admin-muted">
                      {t.quota === null
                        ? `Tidak terbatas · ${t.claimed} terdaftar`
                        : `Kuota ${t.quota} · ${t.claimed} terpakai · sisa ${t.remaining ?? 0}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {t.quota !== null ? <ExpandForm eventId={eventId} id={t.id} /> : null}
                    <Button
                      type="button"
                      variant="secondary"
                      className={smallBtn}
                      onClick={() => setEditing(editing === t.id ? null : t.id)}
                    >
                      {editing === t.id ? "Tutup" : "Edit"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className={smallBtn}
                      disabled={row.pending}
                      onClick={() => {
                        if (confirm(`Hapus jenis tiket "${t.name}"?`)) row.run(() => deleteTicketType(eventId, t.id));
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
                {editing === t.id ? <EditForm key={t.id} eventId={eventId} ticket={t} onDone={() => setEditing(null)} /> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="mb-1 font-medium">Jenis tiket baru</h3>
        <CreateForm key={formKey} eventId={eventId} onDone={() => setFormKey((k) => k + 1)} />
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Mode pendaftaran</h2>
        <p className="mb-3 text-sm text-admin-muted">
          <strong>Terbuka</strong>: siapa saja boleh mendaftar. <strong>Daftar izin</strong>: hanya nomor HP / email yang
          terdaftar di bawah, masing-masing satu kali.
        </p>
        {mode === null ? (
          <p className="mb-3 text-sm text-admin-muted">Mode saat ini belum dapat dibaca (acara belum terbit).</p>
        ) : mode === "CLOSED" ? (
          <p className="mb-3 text-sm text-admin-muted">Mode saat ini: Tertutup (hanya undangan).</p>
        ) : null}
        <div className="flex gap-2">
          {(["OPEN", "ALLOWLIST"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? "primary" : "secondary"}
              disabled={row.pending}
              aria-pressed={mode === m}
              onClick={() => row.run(() => setRegistrationMode(eventId, m))}
            >
              {m === "OPEN" ? "Terbuka" : "Daftar izin"}
            </Button>
          ))}
        </div>
      </Card>

      {mode === "ALLOWLIST" ? <Allowlist eventId={eventId} entries={entries} loadError={entriesError} /> : null}
    </div>
  );
}

function useForm(run: (prev: ActionState, form: FormData) => Promise<ActionState>, onDone?: () => void) {
  return useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await run(prev, form);
    if (res?.ok) onDone?.();
    return res;
  }, undefined);
}

function CreateForm({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [state, action, pending] = useForm((p, f) => createTicketType(eventId, p, f), onDone);
  return (
    <form onSubmit={(e) => submitKeepingInput(e, action)} className="space-y-3">
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Nama</span>
          <input name="name" required maxLength={80} placeholder="VIP" className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Kuota (kosong = tidak terbatas)</span>
          <input name="quota" type="number" min={1} step={1} placeholder="Tidak terbatas" className={inputCls} />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Deskripsi (opsional)</span>
        <input name="description" className={inputCls} />
      </label>
      <p className="text-xs text-admin-muted">
        Jika kuota diisi, sebanyak itu kode QR langsung dibuat sekarang (bukan saat pendaftaran). Kuota tidak bisa diubah
        nanti selain ditambah lewat &ldquo;Tambah slot&rdquo;.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Buat jenis tiket"}
      </Button>
    </form>
  );
}

function EditForm({ eventId, ticket, onDone }: { eventId: string; ticket: TicketType; onDone: () => void }) {
  const [state, action, pending] = useForm((p, f) => updateTicketType(eventId, ticket.id, p, f), onDone);
  return (
    <form
      onSubmit={(e) => submitKeepingInput(e, action)}
      className="mt-3 space-y-3 rounded-[var(--radius-control)] border border-accent-line bg-accent-soft/40 p-4"
    >
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm text-admin-muted">Nama</span>
          <input name="name" defaultValue={ticket.name} required maxLength={80} className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Urutan</span>
          <input name="sortOrder" type="number" step={1} defaultValue={ticket.sortOrder} className={inputCls} />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Deskripsi</span>
        <input name="description" defaultValue={ticket.description ?? ""} className={inputCls} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function ExpandForm({ eventId, id }: { eventId: string; id: string }) {
  const [state, action, pending] = useForm((p, f) => expandTicketType(eventId, id, p, f));
  return (
    <form onSubmit={(e) => submitKeepingInput(e, action)} className="flex items-center gap-1.5">
      <input
        name="count"
        type="number"
        min={1}
        max={10000}
        defaultValue={10}
        aria-label="Jumlah slot tambahan"
        className={`${inputCls} h-8 w-20 px-2 text-xs`}
      />
      <Button type="submit" variant="secondary" className={smallBtn} disabled={pending}>
        Tambah slot
      </Button>
      {state?.error ? <span className="text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}

function Allowlist({ eventId, entries, loadError }: { eventId: string; entries: AllowlistEntry[]; loadError: string | null }) {
  const row = useRowAction();
  const [text, setText] = useState("");
  const [state, action, pending] = useForm((p, f) => addAllowlist(eventId, p, f), () => setText(""));
  return (
    <Card>
      <h2 className="mb-1 font-medium">Daftar izin</h2>
      <p className="mb-3 text-sm text-admin-muted">
        Tempel satu nomor HP atau email per baris (yang memuat @ dianggap email).
      </p>
      {row.error ? <Notice tone="error">{row.error}</Notice> : null}
      {loadError ? <Notice tone="error">{`Daftar izin gagal dimuat: ${loadError}`}</Notice> : null}
      <form onSubmit={(e) => submitKeepingInput(e, action)} className="mb-4 space-y-3">
        {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
        <textarea
          name="entries"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={"081234567890\nbudi@example.com"}
          className={`${textareaCls} font-mono`}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Menambah…" : "Tambah ke daftar"}
        </Button>
      </form>
      {loadError ? null : entries.length === 0 ? (
        <p className="text-sm text-admin-muted">Daftar masih kosong.</p>
      ) : (
        <ul className="divide-y divide-panel-border text-sm">
          {entries.map((en) => (
            <li key={en.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                {[en.phone, en.email].filter(Boolean).join(" · ")}
                {en.usedAt ? <span className="ml-2 text-xs text-admin-muted">sudah dipakai</span> : null}
              </span>
              <Button
                type="button"
                variant="danger"
                className={smallBtn}
                disabled={row.pending}
                onClick={() => row.run(() => removeAllowlistEntry(eventId, en.id))}
              >
                Hapus
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

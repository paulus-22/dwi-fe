"use client";

import { useActionState } from "react";

import { Button, Notice } from "@/components/ui";
import type { ActionState } from "@/lib/builder";

import { createEvent } from "./actions";

const field =
  "h-11 w-full rounded-[var(--radius-control)] border border-panel-border bg-white px-3 text-base outline-none focus:border-gold";
const label = "block space-y-1.5";

export function CreateEventForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createEvent, undefined);
  return (
    <form action={action} className="max-w-lg space-y-4">
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}

      <label className={label}>
        <span className="text-sm text-admin-muted">Judul acara</span>
        <input name="title" required className={field} placeholder="Konferensi Tahunan 2026" />
      </label>

      <label className={label}>
        <span className="text-sm text-admin-muted">Slug (untuk tautan publik, tidak bisa diubah nanti)</span>
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Huruf kecil, angka, dan tanda hubung"
          className={field}
          placeholder="konferensi-tahunan-2026"
        />
      </label>

      <label className={label}>
        <span className="text-sm text-admin-muted">Subjudul (opsional)</span>
        <input name="subtitle" className={field} placeholder="Jakarta Convention Center" />
      </label>

      <label className={label}>
        <span className="text-sm text-admin-muted">Deskripsi (opsional)</span>
        <textarea name="description" rows={3} className={`${field} h-auto py-2`} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          <span className="text-sm text-admin-muted">Tanggal &amp; waktu</span>
          <input name="headlineDate" type="datetime-local" required className={field} />
        </label>
        <label className={label}>
          <span className="text-sm text-admin-muted">Zona waktu</span>
          <select name="timezone" defaultValue="Asia/Jakarta" className={field}>
            <option value="Asia/Jakarta">WIB (Jakarta)</option>
            <option value="Asia/Makassar">WITA (Makassar)</option>
            <option value="Asia/Jayapura">WIT (Jayapura)</option>
          </select>
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Membuat…" : "Buat acara"}
      </Button>
    </form>
  );
}

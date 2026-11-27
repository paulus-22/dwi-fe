"use client";

import { useRef, useState } from "react";

import { toWebp } from "./slideshow-upload";
import { clearGreeting, presignGreeting, setGreeting } from "@/app/admin/events/[id]/scanner/slideshow-actions";

/**
 * Upload (or clear) the TV greeter's greeting backdrop for an event: the image
 * the TV shows behind a guest's name/selfie when they check in. Converted to
 * WebP client-side, PUT to R2 via a presigned URL, then set on the event.
 */
export function GreetingUpload({ eventId, current }: { eventId: string; current: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await toWebp(file);
      const id = crypto.randomUUID();
      const p = await presignGreeting(eventId, id);
      const put = await fetch(p.url, { method: "PUT", headers: { "content-type": "image/webp" }, body: blob });
      if (!put.ok) throw new Error(`Upload ke R2 gagal (${put.status}).`);
      await setGreeting(eventId, p.key);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    setError(null);
    try {
      await clearGreeting(eventId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex h-10 items-center rounded-[var(--radius-control)] border border-panel-border px-4 text-sm disabled:opacity-50"
      >
        {busy ? "Menyimpan…" : "Pilih backdrop (WebP otomatis)"}
      </button>
      {current ? (
        <button
          type="button"
          onClick={clear}
          disabled={busy}
          className="inline-flex h-10 items-center rounded-[var(--radius-control)] border border-red-300 px-4 text-sm text-red-600 disabled:opacity-50"
        >
          Hapus backdrop
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";

import { completeSlide, presignSlide } from "@/app/admin/events/[id]/scanner/slideshow-actions";

/** Convert any image to a WebP blob at a sane size, client-side (no server cost). */
export async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  // Cap the long edge at 1600px so a phone shot doesn't upload a full 12MP frame.
  const LONG = 1600;
  const scale = Math.min(1, LONG / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  if (!blob) throw new Error("Gagal mengonversi gambar ke WebP.");
  return blob;
}

/**
 * Upload scanner-slideshow images from the dashboard. Each file is converted
 * to WebP in the browser, uploaded straight to R2 via a presigned URL, then
 * registered. Empties the file input when it's done so re-selecting works.
 */
export function SlideshowUpload({ eventId, onDone }: { eventId: string; onDone(): void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [, startTransition] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        setProgress(`Mengupload ${file.name}…`);
        const blob = await toWebp(file);
        const id = crypto.randomUUID();
        const presign = await presignSlide(eventId, id);
        const put = await fetch(presign.url, {
          method: "PUT",
          headers: { "content-type": "image/webp" },
          body: blob,
        });
        if (!put.ok) throw new Error(`Upload ke R2 gagal (${put.status}) untuk ${file.name}.`);
        await completeSlide(eventId, { id, key: presign.key });
        done++;
      }
      setProgress("");
      if (fileRef.current) fileRef.current.value = "";
      startTransition(onDone);
      alert(`${done} slide ditambahkan ke slideshow.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
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
        {busy ? "Mengupload…" : "Pilih foto (WebP otomatis)"}
      </button>
      {progress ? <p className="mt-2 text-sm text-admin-muted">{progress}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Downloads the server-rendered voucher PNG. Fetching the blob first (rather
 * than pointing an anchor at the route) means the filename is ours and the
 * in-app browsers WhatsApp links open in still save the file.
 */
export function SaveVoucherImage({
  imageUrl,
  fileName,
  dict,
}: {
  imageUrl: string;
  fileName: string;
  dict: Dictionary;
}) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("image route failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Some in-app browsers block programmatic downloads; opening the image
      // directly lets the guest long-press and save it themselves.
      window.open(imageUrl, "_blank", "noopener");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={saving}
      className="inline-block border border-cream/40 px-8 py-3 font-ui text-[10px] uppercase tracking-[0.24em] text-cream transition-colors duration-300 hover:border-peach hover:bg-peach hover:text-peach-text disabled:opacity-50"
    >
      {saving ? dict.voucher.saving : dict.voucher.saveImage}
    </button>
  );
}

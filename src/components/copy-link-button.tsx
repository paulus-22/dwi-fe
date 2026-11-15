"use client";

import { useState } from "react";

/**
 * Shows a relative public path as an absolute link (resolved from the
 * browser's own origin — admin and public pages share a domain, so no env
 * var is needed) plus a one-click copy button.
 */
export function CopyLinkButton({ path, label }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="mt-1 block max-w-full truncate rounded px-1 -mx-1 text-left text-xs text-admin-muted underline underline-offset-2 hover:text-admin-ink"
      title="Salin tautan"
    >
      {copied ? "Tautan disalin!" : label ?? path}
    </button>
  );
}

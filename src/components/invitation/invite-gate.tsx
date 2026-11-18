"use client";

import { useEffect, useState } from "react";

import { verifyGate } from "@/lib/public-client";

/**
 * Full-page invitation gate. When the event's `inviteGate` is 'PHONE_6' and
 * the page is opened with a guest token, the invite is covered by a password
 * screen until the guest enters the last 6 digits of their phone. On success
 * the gate unlocks and the invite renders.
 */
export function InviteGate({
  gate,
  slug,
  token,
  children,
}: {
  gate?: "OPEN" | "PHONE_6";
  slug: string;
  token?: string;
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const active = gate === "PHONE_6" && !!token;

  // A once-unlocked token stays open for this browser tab, so people don't
  // get re-prompted on every navigation/reload.
  useEffect(() => {
    if (active && typeof window !== "undefined") {
      const k = `tm-gate:${slug}:${token}`;
      try {
        setUnlocked(sessionStorage.getItem(k) === "1");
      } catch {
        /* ignore storage errors */
      }
    }
    setChecking(false);
  }, [active, slug, token]);

  if (!active || unlocked) return <>{children}</>;

  if (checking) {
    // Brief blank while we read the session; avoid a flash of the gate when
    // the page is re-navigated after unlocking.
    return <div className="min-h-dvh bg-[#0e0e10]" />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const ok = await verifyGate(slug, token!, code.trim());
    setSubmitting(false);
    if (ok) {
      try {
        sessionStorage.setItem(`tm-gate:${slug}:${token}`, "1");
      } catch {
        /* ignore */
      }
      setUnlocked(true);
    } else {
      setError("Kode tidak valid. Periksa 6 angka terakhir nomor HP Anda.");
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[#0e0e10] px-6 text-center">
      <form onSubmit={submit} className="w-full max-w-sm">
        <p className="font-serif text-3xl tracking-tight text-[#efece6]">Undangan terlindungi</p>
        <p className="mt-3 text-sm leading-relaxed text-[#b9b3a8]">
          Acara ini dilindungi kata sandi. Masukkan <span className="text-[#d8d2c6]">6 angka terakhir nomor HP</span> yang
          digunakan pada undangan untuk membukanya.
        </p>
        <input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-[#efece6] outline-none focus:border-[#c8ad78]"
          aria-label="6 digit terakhir nomor HP"
        />
        {error ? <p className="mt-3 text-sm text-[#e0706f]">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting || code.length < 6}
          className="mt-6 w-full rounded-xl bg-[#c8ad78] px-5 py-3 text-sm font-semibold text-[#0e0e10] transition-opacity disabled:opacity-40"
        >
          {submitting ? "Membuka…" : "Buka undangan"}
        </button>
      </form>
    </div>
  );
}

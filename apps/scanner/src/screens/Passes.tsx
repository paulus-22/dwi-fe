import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Icon } from "../components/ui";
import { demoGuests } from "../data/demo";
import { CATEGORIES, demoPayload } from "../domain/codes";
import type { SnapshotGuest } from "../domain/types";
import { go } from "../lib/ui";

/**
 * Demo passes to scan. Open this page on a second phone or a laptop and point
 * the scanner at it — the QR carries the same `DWI1.…` payload the real
 * e-voucher does. Not part of the real scanner; it exists for the show-case.
 */
export function PassesScreen() {
  const [open, setOpen] = useState<SnapshotGuest | null>(null);

  return (
    <div className="min-h-full bg-cream text-[#353a20]">
      <header className="safe-top sticky top-0 z-10 flex items-center gap-3 bg-cream/95 px-5 pb-3 backdrop-blur">
        <button type="button" onClick={() => go("more")} className="rounded-full p-2 text-[#786b5d]">
          <Icon name="back" />
        </button>
        <div>
          <p className="kicker text-[#876550]">Kartu demo</p>
          <h1 className="font-display text-[length:calc(28px*var(--fs))] leading-tight">QR undangan tamu</h1>
        </div>
      </header>
      <p className="px-5 text-[length:calc(14px*var(--fs))] leading-relaxed text-[#786b5d]">
        Buka halaman ini di perangkat lain, lalu scan dengan scanner. Ketuk kartu untuk memperbesar.
      </p>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
        {demoGuests.map((g) => (
          <button key={g.code} type="button" onClick={() => setOpen(g)} className="rounded-2xl border border-[#ddd8cc] bg-white p-3 text-left">
            <Qr text={demoPayload(g.code, g.admits)} />
            <p className="mt-2 truncate text-[length:calc(14px*var(--fs))]">{g.householdName}</p>
            <p className="truncate font-mono text-[length:calc(11px*var(--fs))] text-[#786b5d]">{g.code}</p>
            <p className="mt-1 text-[length:calc(11px*var(--fs))] text-[#876550]">
              {CATEGORIES[g.category]} · {g.attending === true ? `${g.admits} org` : g.attending === false ? "tidak hadir" : "belum RSVP"}
            </p>
          </button>
        ))}
        <div className="rounded-2xl border border-dashed border-[#d8c3a5] bg-white p-3">
          <Qr text="DWI1.ZZ99.GEN.0001.1.000000000000" />
          <p className="mt-2 text-[length:calc(14px*var(--fs))]">Kode acara lain</p>
          <p className="text-[length:calc(11px*var(--fs))] text-[#786b5d]">Untuk demo layar merah</p>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream p-8 text-center" onClick={() => setOpen(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <p className="kicker text-[#876550]">E-voucher · Alex &amp; Ajeng</p>
            <p className="mt-2 font-display text-[length:calc(30px*var(--fs))] leading-tight">{open.householdName}</p>
            <div className="mx-auto mt-4 w-full max-w-[280px]">
              <Qr text={demoPayload(open.code, open.admits)} />
            </div>
            <p className="mt-3 font-mono text-[length:calc(15px*var(--fs))] tracking-wider">{open.code}</p>
            <p className="mt-1 text-[length:calc(13px*var(--fs))] text-[#786b5d]">Berlaku untuk {open.admits} orang</p>
          </div>
          <p className="mt-6 text-[length:calc(13px*var(--fs))] text-[#786b5d]">Ketuk untuk menutup</p>
        </div>
      ) : null}
    </div>
  );
}

function Qr({ text }: { text: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    void QRCode.toDataURL(text, { margin: 1, width: 360, color: { dark: "#2c3019", light: "#ffffff" } }).then(setSrc);
  }, [text]);
  return src ? <img src={src} alt="" className="aspect-square w-full" /> : <div className="aspect-square w-full bg-[#f5f0e8]" />;
}

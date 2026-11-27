import QRCode from "qrcode";

import type { OrnamentSet } from "@/components/motif";
import { format, type Dictionary } from "@/i18n/dictionaries";

/**
 * The e-voucher itself, styled as a ticket: a body carrying the QR and a
 * perforated stub below it with the guest's details. The PNG route renders the
 * same artwork, so changes here should be mirrored there.
 */
export async function VoucherTicket({
  token,
  qrPayload,
  guestName,
  admits,
  coupleLine,
  dateLine,
  venueLine,
  dict,
  ornaments,
}: {
  /** The printed code, shown as text under the QR. */
  token: string;
  /** The signed payload the QR actually encodes. */
  qrPayload: string;
  guestName: string;
  admits: number;
  coupleLine: string;
  dateLine: string;
  venueLine: string | null;
  dict: Dictionary;
  ornaments: OrnamentSet;
}) {
  const { Crest } = ornaments;
  const qr = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 640,
    color: { dark: "#353A20", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  return (
    <div
      style={{ colorScheme: "only light", forcedColorAdjust: "none" }}
      className="relative mx-auto w-full max-w-[22rem] bg-paper text-ink shadow-[0_24px_60px_rgba(0,0,0,0.30)]"
    >
      <div className="border border-champagne">
        <div className="px-6 pt-7 text-center">
          <div className="flex justify-center">
            <Crest width={130} height={48} />
          </div>
          <p className="kicker mt-3 text-peach-ink">{dict.voucher.kicker}</p>
          <p className="display names mt-3 [--names-size:30px] leading-tight text-names-ink">{coupleLine}</p>
          <p className="mt-2 font-ui text-[11px] tracking-[0.22em] text-ink-soft">
            {dateLine}
          </p>
          {venueLine ? (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{venueLine}</p>
          ) : null}
        </div>

        <div className="px-6 pb-6 pt-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL */}
          <img
            src={qr}
            alt={`QR ${token}`}
            width={190}
            height={190}
            className="mx-auto size-[190px]"
          />
          <p className="mt-3 font-ui text-[11px] tracking-[0.3em] text-peach-ink">{token}</p>
        </div>

        {/* Perforation — the notches sit on the olive page behind the ticket. */}
        <div className="relative">
          <span className="absolute -left-[9px] top-1/2 size-4 -translate-y-1/2 rounded-full bg-olive-deep" />
          <span className="absolute -right-[9px] top-1/2 size-4 -translate-y-1/2 rounded-full bg-olive-deep" />
          <span className="mx-5 block border-t border-dashed border-champagne" />
        </div>

        <div className="px-6 pb-7 pt-6 text-center">
          <p className="kicker text-ink-soft">{dict.voucher.issuedTo}</p>
          <p className="display mt-2 text-[26px] leading-tight text-ink">{guestName}</p>
          <p className="mt-3 font-ui text-[11px] tracking-[0.18em] text-peach-ink">
            {admits === 1
              ? dict.voucher.admitOne
              : format(dict.voucher.admits, { count: admits })}
          </p>
          <p className="mx-auto mt-4 max-w-[26ch] text-[13px] leading-relaxed text-ink-soft">
            {dict.voucher.instruction}
          </p>
        </div>
      </div>
    </div>
  );
}

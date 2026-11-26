"use client";

import { type Dictionary } from "@/i18n/dictionaries";
import { RsvpForm } from "@/components/invitation/rsvp-form";

/**
 * Unconfirmed-guest card for the /v barcode page. Embeds the RSVP form right
 * on the pass page so a guest can confirm attendance without scrolling the
 * whole invitation. On "hadir" it flips to the issued pass by reloading the
 * page (the server re-resolves the voucher once the RSVP is saved).
 */
export function PendingRsvpCard({
  eventSlug,
  token,
  defaultName,
  maxGuests,
  coupleLine,
  dateLine,
  declined,
  dict,
}: {
  eventSlug: string;
  token: string;
  defaultName: string;
  maxGuests: number;
  coupleLine: string;
  dateLine: string;
  declined: boolean;
  dict: Dictionary;
}) {
  return (
    <div className="border border-cream/25 bg-olive-deep/20 px-5 py-10 text-center sm:px-7">
      <p className="display text-[30px] leading-tight text-cream">{coupleLine}</p>
      <p className="mt-2 font-ui text-[11px] tracking-[0.22em] text-cream/70">{dateLine}</p>

      <span className="mx-auto my-8 block h-px w-12 bg-cream/25" />

      <h1 className="display text-[22px] leading-tight text-cream">
        {declined ? dict.voucher.declinedTitle : dict.voucher.pendingTitle}
      </h1>
      <p className="mx-auto mb-8 mt-3 max-w-[32ch] text-[14px] leading-relaxed text-cream/70">
        {declined ? dict.voucher.declinedBody : dict.voucher.pendingBody}
      </p>

      <RsvpForm
        eventSlug={eventSlug}
        token={token}
        defaultName={defaultName}
        maxGuests={maxGuests}
        existing={null}
        dict={dict}
        onDone={(attending) => {
          // "Hadir" confirmed → show the issued Kartu masuk pass. Brief delay so
          // the confirmation text is legible before the page reloads to reveal it.
          if (attending) setTimeout(() => window.location.reload(), 1300);
        }}
      />
    </div>
  );
}

import Link from "next/link";

import type { OrnamentSet } from "@/components/motif";
import type { Dictionary } from "@/i18n/dictionaries";

import { Reveal } from "./reveal";

/**
 * The bridge from the invitation to the e-voucher. The pass itself lives on its
 * own page so it can be sent over WhatsApp on its own; this only points at it,
 * and only once the guest has confirmed.
 */
export function VoucherLink({
  href,
  dict,
  ornaments,
}: {
  href: string;
  dict: Dictionary;
  ornaments: OrnamentSet;
}) {
  const { Crest } = ornaments;
  return (
    <Reveal variant="fade-up">
      <div className="mx-auto max-w-[22rem] border border-champagne px-6 py-10 text-center">
        <div className="flex justify-center">
          <Crest width={120} height={44} />
        </div>
        <h3 className="display mt-4 text-[26px] leading-tight text-ink">
          {dict.voucher.fromInviteTitle}
        </h3>
        <p className="mx-auto mt-3 max-w-[28ch] text-[14px] leading-relaxed text-ink-soft">
          {dict.voucher.fromInviteBody}
        </p>
        <Link
          href={href}
          className="mt-7 inline-block border border-champagne px-8 py-3 font-ui text-[10px] uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:border-peach hover:bg-peach hover:text-peach-text"
        >
          {dict.voucher.fromInviteCta}
        </Link>
      </div>
    </Reveal>
  );
}

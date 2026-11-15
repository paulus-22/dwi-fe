"use client";

import { useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";

import { GhostButton } from "./ui";

type Account = {
  id: string;
  kind: "BANK" | "EWALLET";
  institution: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl: string | null;
};

export function Gift({
  accounts,
  address,
  dict,
}: {
  accounts: Account[];
  /** Where a physical gift can be sent; shown after the accounts. */
  address: string | null;
  dict: Dictionary;
}) {
  if (accounts.length === 0 && !address) return null;

  return (
    <div className="space-y-10">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} dict={dict} />
      ))}
      {address ? <AddressCard address={address} dict={dict} /> : null}
    </div>
  );
}

/** Copy to the clipboard, with a two-second "copied" state. */
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Blocked on insecure origins and in some in-app browsers; the text
      // stays visible and selectable either way.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return { copied, copy };
}

function AccountCard({ account, dict }: { account: Account; dict: Dictionary }) {
  const { copied, copy } = useCopy(account.accountNumber);

  return (
    <div className="text-center">
      <p className="kicker text-peach-ink">{account.institution}</p>

      {account.qrImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL, may be external
        <img
          src={account.qrImageUrl}
          alt={`${account.institution} QR`}
          className="mx-auto mt-5 size-[140px] border border-champagne object-contain p-2"
        />
      ) : null}

      <p className="display mt-5 text-[30px] tracking-[0.06em] text-ink">
        {account.accountNumber}
      </p>
      <p className="mt-2 text-[14px] text-ink-soft">
        {dict.gift.accountHolder} {account.accountHolder}
      </p>

      <div className="mt-6">
        <GhostButton onClick={copy}>
          {copied ? dict.gift.copied : dict.gift.copy}
        </GhostButton>
      </div>

      <span className="mx-auto mt-10 block h-px w-10 bg-champagne" />
    </div>
  );
}

/**
 * For guests sending a parcel instead of a transfer. Set as the admin typed
 * it — recipient, street, city, phone — because an address reflowed into one
 * line is the one a courier misreads.
 */
function AddressCard({ address, dict }: { address: string; dict: Dictionary }) {
  const { copied, copy } = useCopy(address);

  return (
    <div className="text-center">
      <p className="kicker text-peach-ink">{dict.gift.addressTitle}</p>
      <address className="mx-auto mt-5 max-w-[30ch] whitespace-pre-line font-body text-[16px] not-italic leading-relaxed text-ink">
        {address}
      </address>
      <div className="mt-6">
        <GhostButton onClick={copy}>
          {copied ? dict.gift.copied : dict.gift.copyAddress}
        </GhostButton>
      </div>
    </div>
  );
}

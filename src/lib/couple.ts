/**
 * How the couple's names are ordered everywhere they appear as a pair.
 *
 * The bride leads. Keeping it in one place means the hero, cover, voucher,
 * share metadata, WhatsApp copy, CSV export and admin listings can never
 * drift apart — and it is display only, so no invite code or QR payload
 * depends on it.
 */
export function coupleLine(event: {
  brideShortName: string;
  groomShortName: string;
}): string {
  return `${event.brideShortName} & ${event.groomShortName}`;
}

/** One row of `GET /v1/events/{id}/guests` (closed, admin-managed guest list). */
export type GuestItem = {
  id: string;
  /** The guest's invite token — used as `/e/{slug}?to={code}`. */
  code: string;
  householdName: string;
  category: string;
  /** `null` = no RSVP yet. */
  attending: boolean | null;
  admits: number;
  checkedInAt: string | null;
  checkedInHeadcount: number | null;
  /** Direct-QR: issue the pass without this guest having to confirm. */
  qrDirect?: boolean;
};

export const guestLink = (slug: string, code: string) => `/e/${slug}?to=${encodeURIComponent(code)}`;

/** The e-voucher/QR pass — only shows a real QR once the guest has RSVP'd attending. */
export const voucherLink = (slug: string, code: string) => `/v/${slug}?to=${encodeURIComponent(code)}`;

/**
 * Short form of a guest's name for tight cover/greeting spots: keeps at most
 * two words, then "…". "Paulus Ricardo Manurung" → "Paulus Ricardo…",
 * "Bismo & Istri" → "Bismo & Istri", "Paulus" → "Paulus".
 */
export function shortGuestName(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim().replace(/\s+/g, " ");
  const words = trimmed.split(" ");
  return words.length > 2 ? `${words.slice(0, 2).join(" ")}…` : trimmed;
}

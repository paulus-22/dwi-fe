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
};

export const guestLink = (slug: string, code: string) => `/e/${slug}?to=${encodeURIComponent(code)}`;

/** The e-voucher/QR pass — only shows a real QR once the guest has RSVP'd attending. */
export const voucherLink = (slug: string, code: string) => `/v/${slug}?to=${encodeURIComponent(code)}`;

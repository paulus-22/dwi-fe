/**
 * Browser-side access to the public API (RSVP form, wishes wall, registration
 * form). Unlike `lib/api.ts` this is client-safe: it carries no credentials and
 * the API's public routes need none. Requires `CORS_ORIGINS` on dwi-be to list
 * this site's origin.
 */
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

const pub = (path: string) => `${PUBLIC_API_URL}/v1/public/events${path}`;

export const wishesUrl = (slug: string, query = "") => pub(`/${encodeURIComponent(slug)}/wishes${query}`);
export const rsvpUrl = (slug: string, token: string) =>
  pub(`/${encodeURIComponent(slug)}/guests/${encodeURIComponent(token)}/rsvp`);
export const gateUrl = (slug: string) => pub(`/${encodeURIComponent(slug)}/gate`);

/** Unlocks a PHONE_6 gate with the guest's code. Resolves true on success. */
export async function verifyGate(slug: string, token: string, code: string): Promise<boolean> {
  const res = await fetch(gateUrl(slug), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, code }),
  }).catch(() => null);
  return res?.ok === true;
}

export type RsvpResponseValue = { fieldKey: string; value: unknown };

export type RsvpPayload = {
  name: string;
  attending: boolean;
  guestCount: number;
  message?: string;
  responses?: RsvpResponseValue[];
};

/** POSTs an RSVP. Resolves to an error message, or null on success. */
export async function submitRsvp(slug: string, token: string, payload: RsvpPayload): Promise<string | null> {
  const res = await fetch(rsvpUrl(slug, token), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  if (res?.ok) return null;
  const body = (await res?.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "";
}

export type RegisterPayload = {
  ticketTypeId: string;
  name: string;
  phone?: string;
  email?: string;
  responses: RsvpResponseValue[];
};

export type RegisterResult =
  | { ok: true; token: string; qrPayload: string }
  | { ok: false; code: string; message: string };

/** POSTs a self-registration. Resolves to the issued token, or the API's error code + message. */
export async function register(slug: string, payload: RegisterPayload): Promise<RegisterResult> {
  const res = await fetch(pub(`/${encodeURIComponent(slug)}/register`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  if (!res) return { ok: false, code: "network", message: "" };
  if (res.ok) {
    const body = (await res.json().catch(() => null)) as { token?: string; qrPayload?: string } | null;
    if (body?.token) return { ok: true, token: body.token, qrPayload: body.qrPayload ?? "" };
  }
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  return { ok: false, code: body?.error?.code ?? "unknown", message: body?.error?.message ?? "" };
}

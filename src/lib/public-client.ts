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

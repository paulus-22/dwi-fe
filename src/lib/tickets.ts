/**
 * Types and helpers for GENERIC-event ticket types and the open/allowlist
 * self-registration modes. Plain module, safe to import from client components.
 */

export type RegistrationMode = "CLOSED" | "OPEN" | "ALLOWLIST";

export type TicketType = {
  id: string;
  name: string;
  description: string | null;
  /** null = unlimited. */
  quota: number | null;
  sortOrder: number;
  claimed: number;
  /** null when unlimited. */
  remaining: number | null;
};

export type AllowlistEntry = {
  id: string;
  phone: string | null;
  email: string | null;
  usedAt: string | null;
};

export type PublicTicketType = { id: string; name: string; description: string | null };

/** One phone or email per line (commas/semicolons also split); `@` means email. */
export function parseAllowlist(raw: string): { phone?: string; email?: string }[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.includes("@") ? { email: s } : { phone: s }));
}

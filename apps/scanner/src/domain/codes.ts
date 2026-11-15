/**
 * Invite codes and QR payloads, as the scanner sees them.
 *
 * Ported from the main app (`src/lib/invite-code.ts`, `src/lib/qr-payload.ts`)
 * so a pass printed or sent by the real system scans here unchanged. The two
 * must not drift — the Rust backend will carry the same rules, pinned by
 * golden test vectors.
 *
 * What the scanner deliberately does NOT do is verify the HMAC signature. That
 * would mean shipping INVITE_SIGNING_SECRET to every tablet, and anyone who
 * pulled it off one device could forge passes. Instead a scanned code is valid
 * when it is in the guest snapshot the device downloaded at pairing, and the
 * headcount comes from that snapshot, never from the QR. The server re-checks
 * the signature when the check-in syncs.
 */

const ALPHABET = "23456789ABCDEFGHJKMNPQRTUVWXYZ";

export const CATEGORIES = {
  FAM: "Keluarga",
  FRN: "Teman",
  WRK: "Kolega",
  VIP: "VIP",
  GEN: "Umum",
} as const;

export type CategoryCode = keyof typeof CATEGORIES;

export function isCategoryCode(value: string): value is CategoryCode {
  return value in CATEGORIES;
}

/** Position-weighted checksum; identical to the server's. */
function checkCharacter(body: string): string {
  let total = 0;
  for (let i = 0; i < body.length; i += 1) {
    const index = ALPHABET.indexOf(body[i]);
    total += (index < 0 ? 1 : index + 1) * (i + 2);
  }
  return ALPHABET[total % ALPHABET.length];
}

export function buildInviteCode(prefix: string, category: CategoryCode, sequence: number): string {
  const body = `${prefix}-${category}-${String(sequence).padStart(4, "0")}`;
  return `${body}-${checkCharacter(body)}`;
}

export function parseInviteCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  const match = /^([A-Z0-9]{2,6})-([A-Z]{3})-(\d{4})-([A-Z0-9])$/.exec(code);
  if (!match) return null;
  const [, prefix, category, sequence, check] = match;
  if (!isCategoryCode(category)) return null;
  if (checkCharacter(`${prefix}-${category}-${sequence}`) !== check) return null;
  return code;
}

export type ScanVerdict =
  | { ok: true; code: string; qrAdmits: number | null }
  | { ok: false; reason: "malformed" | "unknown_version" | "bad_check" };

/**
 * Accepts either a signed QR payload (`DWI1.AJ27.FAM.0042.4.<sig>`) or a bare
 * typed code (`AJ27-FAM-0042-K`), so the manual-entry box and the camera share
 * one path.
 */
export function readScan(raw: string): ScanVerdict {
  const text = raw.trim();

  if (text.toUpperCase().startsWith("DWI")) {
    const parts = text.split(".");
    if (parts.length !== 6) return { ok: false, reason: "malformed" };
    const [version, prefix, category, sequence, admits] = parts;
    if (version !== "DWI1") return { ok: false, reason: "unknown_version" };
    if (!isCategoryCode(category) || !/^\d{4}$/.test(sequence) || !/^\d{1,2}$/.test(admits)) {
      return { ok: false, reason: "malformed" };
    }
    return {
      ok: true,
      code: buildInviteCode(prefix, category, Number(sequence)),
      qrAdmits: Number(admits),
    };
  }

  const code = parseInviteCode(text);
  return code ? { ok: true, code, qrAdmits: null } : { ok: false, reason: "bad_check" };
}

/**
 * Demo-only payload builder. The trailing segment stands in for the HMAC the
 * server signs with; the scanner never checks it (see the note at the top).
 */
export function demoPayload(code: string, admits: number): string {
  const [prefix, category, sequence] = code.split("-");
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const sig = h.toString(16).padStart(8, "0") + "demo";
  return ["DWI1", prefix, category, sequence, String(admits), sig].join(".");
}

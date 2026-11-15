import Papa from "papaparse";

import { CATEGORIES, parseInviteCode, type CategoryCode } from "../domain/codes";
import type { EventInfo, SnapshotGuest } from "../domain/types";

/**
 * Reads the CSV the admin dashboard exports from *Kode & QR → unduh csv*:
 *
 *   sequence, code, category, name, admits, phone, phone_wa, rsvp,
 *   confirmed_count, qr_payload, invitation_link, voucher_link, wa_invitation
 *
 * Runs entirely on the device, so a scanner can be set up at a venue with no
 * signal. Only what the door needs is kept: code, name, category, RSVP and
 * headcount. Phone numbers and links are dropped on the spot.
 *
 * An optional `table` / `meja` column is honoured if an organiser adds one.
 */

export type CsvProblem = { line: number; value: string; reason: string };

export type CsvImport = {
  guests: SnapshotGuest[];
  problems: CsvProblem[];
  stats: { total: number; attending: number; declined: number; pending: number; people: number };
  prefixes: string[];
  /** Guessed from invitation/voucher links: `/e/tari-saefulloh?to=…`. */
  slug: string | null;
};

function pick(row: Record<string, string>, ...names: string[]) {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v.trim() !== "") return v.trim();
  }
  return "";
}

export function parseGuestCsv(text: string): CsvImport {
  const result = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const fields = result.meta.fields ?? [];
  if (!fields.includes("code") && !fields.includes("kode")) {
    throw new Error("Kolom 'code' tidak ditemukan. Gunakan CSV dari dashboard: Kode & QR → unduh csv.");
  }

  const guests: SnapshotGuest[] = [];
  const problems: CsvProblem[] = [];
  const seen = new Set<string>();
  let slug: string | null = null;

  result.data.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const rawCode = pick(row, "code", "kode");
    const code = parseInviteCode(rawCode);
    if (!code) {
      problems.push({ line, value: rawCode || "(kosong)", reason: "kode tidak valid" });
      return;
    }
    if (seen.has(code)) {
      problems.push({ line, value: code, reason: "kode ganda" });
      return;
    }
    seen.add(code);

    const category = code.split("-")[1] as CategoryCode;
    const cap = Math.max(1, Number.parseInt(pick(row, "admits"), 10) || 1);
    const rsvp = pick(row, "rsvp").toLowerCase();
    const attending = rsvp === "attending" ? true : rsvp === "declined" ? false : null;
    const confirmed = Number.parseInt(pick(row, "confirmed_count"), 10);
    const admits = attending && confirmed > 0 ? Math.min(confirmed, cap) : cap;

    slug ??= /\/(?:e|v)\/([a-z0-9-]+)/i.exec(pick(row, "invitation_link", "voucher_link"))?.[1] ?? null;

    guests.push({
      code,
      householdName: pick(row, "name", "nama") || code,
      category: category in CATEGORIES ? category : "GEN",
      attending,
      admits,
      table: pick(row, "table", "meja") || null,
      vip: category === "VIP",
    });
  });

  for (const e of result.errors.slice(0, 5)) {
    problems.push({ line: (e.row ?? 0) + 2, value: e.code, reason: e.message });
  }

  if (guests.length === 0) throw new Error("Tidak ada tamu yang bisa dibaca dari file ini.");

  return {
    guests,
    problems,
    slug,
    prefixes: [...new Set(guests.map((g) => g.code.split("-")[0]))],
    stats: {
      total: guests.length,
      attending: guests.filter((g) => g.attending === true).length,
      declined: guests.filter((g) => g.attending === false).length,
      pending: guests.filter((g) => g.attending === null).length,
      people: guests.filter((g) => g.attending === true).reduce((n, g) => n + g.admits, 0),
    },
  };
}

/** "tari-saefulloh" → "Tari & Saefulloh"; anything else is left for the user. */
export function guessCoupleLine(slug: string | null) {
  if (!slug) return "";
  const parts = slug.split("-").filter(Boolean);
  if (parts.length !== 2) return "";
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return `${cap(parts[0])} & ${cap(parts[1])}`;
}

export function eventFromForm(input: {
  slug: string;
  coupleLine: string;
  dateLabel: string;
  venue: string;
  hashtag: string;
}): EventInfo {
  const [groom = "", bride = ""] = input.coupleLine.split("&").map((s) => s.trim());
  const slug =
    input.slug.trim() ||
    input.coupleLine.toLowerCase().replace(/&/g, " ").trim().replace(/[^a-z0-9]+/g, "-") ||
    "acara";
  return {
    id: `csv-${slug}`,
    slug,
    kind: "WEDDING",
    displayName: input.coupleLine.trim(),
    coupleLine: input.coupleLine.trim(),
    groomShortName: groom,
    brideShortName: bride,
    dateLabel: input.dateLabel.trim(),
    venue: input.venue.trim(),
    hashtag: input.hashtag.trim() ? (input.hashtag.trim().startsWith("#") ? input.hashtag.trim() : `#${input.hashtag.trim()}`) : null,
  };
}

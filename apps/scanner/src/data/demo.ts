import { buildInviteCode, type CategoryCode } from "../domain/codes";
import type { EventInfo, SnapshotGuest } from "../domain/types";

/**
 * Demo data — the Alex & Ajeng event the invitation's preview mode serves.
 *
 * Guest #1 is the same "Keluarga Bapak Wibowo" (AJ27-FAM-0001-2) the preview
 * deploy issues a voucher for, so the real `/v/alex-ajeng` pass scans here.
 * Everyone else is invented. No real guest data is in this file.
 */

/** What the pairing box suggests. Any built-in event's slug also works. */
export const DEMO_PAIRING_CODE = "alex-ajeng";

export const demoEvent: EventInfo = {
  id: "demo-alex-ajeng",
  slug: "alex-ajeng",
  kind: "WEDDING",
  displayName: "Alex & Ajeng",
  coupleLine: "Alex & Ajeng",
  brideShortName: "Ajeng",
  groomShortName: "Alex",
  dateLabel: "Sabtu, 15 Mei 2027",
  venue: "Gedung Sasana Kriya, Jakarta",
  hashtag: "#AlexMeetsAjeng",
};

type Seed = [name: string, category: CategoryCode, attending: boolean | null, admits: number, table?: string];

const seeds: Seed[] = [
  ["Keluarga Bapak Wibowo", "FAM", true, 2, "A1"],
  ["Keluarga Ibu Ratna Sari", "FAM", true, 4, "A1"],
  ["Bapak & Ibu Hartono", "FAM", true, 2, "A2"],
  ["Keluarga Om Budi", "FAM", true, 3, "A2"],
  ["Tante Lilis & Keluarga", "FAM", true, 4, "A3"],
  ["Eyang Putri Soemarno", "VIP", true, 2, "VIP"],
  ["Bapak Dr. Hendra Gunawan", "VIP", true, 2, "VIP"],
  ["Ibu Prof. Wulandari", "VIP", null, 2, "VIP"],
  ["Rani & Dimas", "FRN", true, 2, "B1"],
  ["Sekar Ayu", "FRN", true, 1, "B1"],
  ["Bayu Pratama", "FRN", true, 1, "B1"],
  ["Nadia & Rizky", "FRN", true, 2, "B2"],
  ["Gilang Ramadhan", "FRN", false, 1],
  ["Putri Anggraini", "FRN", true, 1, "B2"],
  ["Kevin Wijaya", "FRN", null, 2],
  ["Anisa Rahma", "FRN", true, 1, "B3"],
  ["Tim Engineering PT Nusantara", "WRK", true, 4, "C1"],
  ["Bapak Agus Salim (Direktur)", "WRK", true, 2, "C1"],
  ["Ibu Maya Lestari", "WRK", true, 1, "C2"],
  ["Fajar Nugraha", "WRK", false, 1],
  ["Dewi Kartika", "WRK", true, 2, "C2"],
  ["Hendro & Partner", "WRK", null, 2],
  ["Keluarga Pak RT 05", "GEN", true, 3, "D1"],
  ["Ibu Sumiati", "GEN", true, 1, "D1"],
  ["Mas Joko Susilo", "GEN", true, 2, "D2"],
  ["Mbak Indah", "GEN", null, 1],
  ["Keluarga Bapak Rahmat", "GEN", true, 4, "D2"],
  ["Citra & Yoga", "FRN", true, 2, "B3"],
];

export const demoGuests: SnapshotGuest[] = seeds.map(([name, category, attending, admits, table], i) => ({
  code: buildInviteCode("AJ27", category, i + 1),
  householdName: name,
  category,
  attending,
  admits,
  table: table ?? null,
  vip: category === "VIP",
}));

/**
 * A check-in that "another usher" already made at the side door, so the
 * duplicate warning can be shown without staging it by hand.
 */
export const demoRemoteCheckIns = [
  { code: demoGuests[2].code, deviceName: "Pintu Samping", minutesAgo: 14, headcount: 2 },
  { code: demoGuests[9].code, deviceName: "Pintu Samping", minutesAgo: 6, headcount: 1 },
];

/**
 * Events this build knows without a backend, keyed by every code that pairs to
 * them. With the Rust API this lookup moves server-side
 * (`POST /v1/devices/pair`) and any published event's code works.
 */
export const builtinEvents: Record<
  string,
  { event: EventInfo; guests: SnapshotGuest[]; remote: typeof demoRemoteCheckIns }
> = {
  "alex-ajeng": { event: demoEvent, guests: demoGuests, remote: demoRemoteCheckIns },
};

const aliases: Record<string, string> = { "DEMO-2027": "alex-ajeng", AJ27: "alex-ajeng" };

export function resolveBuiltin(code: string) {
  const raw = code.trim();
  const key = aliases[raw.toUpperCase()] ?? raw.toLowerCase();
  return builtinEvents[key] ?? null;
}

import { store } from "./store";
import { CATEGORIES } from "../domain/codes";
import type { ActivityRecord } from "../domain/types";

/**
 * Everything this device recorded, as files a person can open.
 *
 * Until the backend exists this is the only way check-ins leave a device, so
 * it doubles as the safety net: export at the end of the night and the couple
 * has their guest list, guestbook and photos even if a tablet is lost later.
 * With two doors, each device exports its own file; sort by time to merge.
 */

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function localTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" });
}

export async function exportCheckInsCsv() {
  const [pairing, guests, checkIns, records, photos] = await Promise.all([
    store.getPairing(),
    store.guests(),
    store.checkIns(),
    store.records(),
    store.photos(),
  ]);
  const byCode = new Map(guests.map((g) => [g.code, g]));
  const recordsBy = new Map<string, ActivityRecord[]>();
  for (const r of records) recordsBy.set(r.checkInId, [...(recordsBy.get(r.checkInId) ?? []), r]);
  const photoCount = new Map<string, number>();
  for (const p of photos) photoCount.set(p.checkInId, (photoCount.get(p.checkInId) ?? 0) + 1);

  const header = [
    "waktu", "kode", "nama", "kategori", "rsvp", "jatah", "jumlah_hadir", "pintu", "pengecualian",
    "foto", "buku_tamu", "souvenir", "sumber", "waktu_iso",
  ];

  const rows = checkIns
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((c) => {
      const g = byCode.get(c.code);
      const recs = recordsBy.get(c.id) ?? [];
      const book = recs.find((r) => r.type === "GUESTBOOK")?.data;
      const souvenir = recs.find((r) => r.type === "SOUVENIR")?.data;
      return [
        localTime(c.occurredAt),
        c.code,
        g?.householdName ?? "",
        g ? CATEGORIES[g.category] : "",
        g ? (g.attending === true ? "hadir" : g.attending === false ? "tidak hadir" : "belum") : "",
        g?.admits ?? "",
        c.headcount,
        c.deviceName,
        c.override ? "ya" : "",
        photoCount.get(c.id) ?? 0,
        book ? [book.message, book.signature ? "(bertanda tangan)" : ""].filter(Boolean).join(" ") : "",
        souvenir ? `${souvenir.kind} × ${souvenir.qty}` : "",
        c.id.startsWith("remote-") ? "perangkat lain" : "perangkat ini",
        c.occurredAt,
      ];
    });

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
  const slug = pairing?.event.slug ?? "acara";
  download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `checkin-${slug}-${stamp()}.csv`);
  return rows.length;
}

export async function exportPhotosZip(onProgress?: (pct: number) => void) {
  const [pairing, photos] = await Promise.all([store.getPairing(), store.photos()]);
  if (photos.length === 0) return 0;
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  photos
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .forEach((p, i) => {
      const t = new Date(p.occurredAt);
      const hhmm = `${String(t.getHours()).padStart(2, "0")}${String(t.getMinutes()).padStart(2, "0")}`;
      const safe = p.householdName.replace(/[^\p{L}\p{N} _-]/gu, "").replace(/\s+/g, " ").trim() || "tamu";
      zip.file(`${String(i + 1).padStart(3, "0")}_${hhmm}_${safe}.jpg`, p.blob);
    });
  const blob = await zip.generateAsync({ type: "blob" }, (m) => onProgress?.(Math.round(m.percent)));
  download(blob, `foto-${pairing?.event.slug ?? "acara"}-${stamp()}.zip`);
  return photos.length;
}


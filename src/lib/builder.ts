/**
 * Types and labels for the GENERIC-event builders (registration form fields,
 * page blocks). Plain module, safe to import from client components.
 */

export const FIELD_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "SELECT", "RADIO", "CHECKBOX", "DATE"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Teks singkat",
  TEXTAREA: "Teks panjang",
  NUMBER: "Angka",
  SELECT: "Dropdown",
  RADIO: "Pilihan tunggal",
  CHECKBOX: "Pilihan ganda",
  DATE: "Tanggal",
};
/** Field types that carry an `options` list. */
export const hasOptions = (t: FieldType) => t === "SELECT" || t === "RADIO" || t === "CHECKBOX";

export type FieldOption = { value: string; labelId: string; labelEn: string | null };

export type FormField = {
  id: string;
  fieldKey: string;
  labelId: string;
  labelEn: string | null;
  fieldType: FieldType;
  options: FieldOption[];
  required: boolean;
  sortOrder: number;
};

export const BLOCK_TYPES = [
  "COVER",
  "COUNTDOWN",
  "SCHEDULE",
  "MAP",
  "GALLERY",
  "RSVP_FORM",
  "REGISTRATION_FORM",
  "CUSTOM_HTML",
  "SPONSOR",
  "CONTACT",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  COVER: "Sampul",
  COUNTDOWN: "Hitung mundur",
  SCHEDULE: "Jadwal",
  MAP: "Peta",
  GALLERY: "Galeri",
  RSVP_FORM: "Form RSVP",
  REGISTRATION_FORM: "Form pendaftaran",
  CUSTOM_HTML: "HTML kustom",
  SPONSOR: "Sponsor",
  CONTACT: "Kontak",
};

export type PageBlock = {
  id: string;
  blockType: BlockType;
  config: unknown;
  sortOrder: number;
  isVisible: boolean;
};

/**
 * Moves one item up (-1) or down (+1) and renumbers everything as 10, 20, 30…
 * (which also repairs duplicate sortOrders, e.g. several rows left at 0).
 * Returns only the items whose sortOrder actually changed, ready to PUT.
 */
export function reorder<T extends { id: string; sortOrder: number }>(items: T[], id: string, dir: -1 | 1): T[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const i = sorted.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return [];
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  return sorted.flatMap((x, k) => (x.sortOrder === (k + 1) * 10 ? [] : [{ ...x, sortOrder: (k + 1) * 10 }]));
}

export const nextSortOrder = (items: { sortOrder: number }[]) =>
  items.reduce((max, x) => Math.max(max, x.sortOrder), 0) + 10;

export type ActionState = { error?: string; ok?: boolean } | undefined;

/**
 * Parses a block's config textarea. Used by the editor for inline errors and
 * again by the server action as a backstop — invalid JSON is never dropped.
 */
export function parseConfig(raw: string): { config: Record<string, unknown> } | { error: string } {
  let config: unknown;
  try {
    config = JSON.parse(raw.trim() || "{}");
  } catch (e) {
    return { error: `JSON tidak valid: ${(e as Error).message}` };
  }
  if (config === null || typeof config !== "object" || Array.isArray(config))
    return { error: 'Konfigurasi harus berupa objek JSON, mis. { "judul": "…" }.' };
  return { config: config as Record<string, unknown> };
}

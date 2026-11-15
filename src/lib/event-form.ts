import type { EventKind } from "@/lib/api";

/** UTC offset for the three timezones events can be created in. */
export const OFFSETS: Record<string, string> = {
  "Asia/Jakarta": "+07:00",
  "Asia/Makassar": "+08:00",
  "Asia/Jayapura": "+09:00",
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Everything the event form can pre-fill (edit). Lists are already joined into text. */
export type EventDefaults = {
  slug?: string;
  status?: string;
  headlineDate?: string; // datetime-local value, in `timezone`
  timezone?: string;
  // GENERIC
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  // WEDDING
  brideShortName?: string | null;
  brideFullName?: string | null;
  brideParents?: string | null;
  brideInstagram?: string | null;
  groomShortName?: string | null;
  groomFullName?: string | null;
  groomParents?: string | null;
  groomInstagram?: string | null;
  defaultLocale?: string;
  bilingual?: boolean;
  theme?: string;
  hashtag?: string | null;
  quoteTextId?: string | null;
  quoteTextEn?: string | null;
  quoteAuthor?: string | null;
  storyIntroId?: string | null;
  storyIntroEn?: string | null;
  closingNoteId?: string | null;
  closingNoteEn?: string | null;
  dressCodeNoteId?: string | null;
  dressCodeNoteEn?: string | null;
  dressCodeColors?: string; // comma separated
  musicUrl?: string | null;
  coverPhotoUrl?: string | null;
  coverBackgroundUrl?: string | null;
  closingPhotoUrl?: string | null;
  dressCodeImageUrl?: string | null;
  interludePhotos?: string; // one per line
};

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
/** Empty → null, so clearing a field in the edit form actually clears it. */
const opt = (f: FormData, k: string) => str(f, k) || null;
const list = (raw: string, sep: RegExp) =>
  raw
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);

/** Validates the form and maps it onto the API body. Same mapping for POST and PUT. */
export function buildEventBody(
  kind: EventKind,
  form: FormData,
): { body: Record<string, unknown>; error?: undefined } | { error: string } {
  const slug = str(form, "slug").toLowerCase();
  const timezone = str(form, "timezone") || "Asia/Jakarta";
  const localDate = str(form, "headlineDate");
  const status = str(form, "status") || "DRAFT";

  if (!SLUG_RE.test(slug)) return { error: "Slug hanya boleh huruf kecil, angka, dan tanda hubung (tanpa di awal/akhir)." };
  if (!localDate) return { error: "Tanggal & waktu acara wajib diisi." };
  // datetime-local gives "YYYY-MM-DDTHH:mm" (seconds only if step < 60).
  const headlineDate = `${localDate.length === 16 ? `${localDate}:00` : localDate}${OFFSETS[timezone] ?? OFFSETS["Asia/Jakarta"]}`;
  const common = { slug, headlineDate, timezone, status };

  if (kind === "GENERIC") {
    const title = str(form, "title");
    if (!title) return { error: "Judul acara wajib diisi." };
    return { body: { kind, ...common, title, subtitle: opt(form, "subtitle"), description: opt(form, "description"), theme: opt(form, "theme") } };
  }

  const names = ["brideShortName", "brideFullName", "groomShortName", "groomFullName"];
  if (names.some((k) => !str(form, k))) return { error: "Nama panggilan dan nama lengkap kedua mempelai wajib diisi." };
  return {
    body: {
      kind,
      ...common,
      brideShortName: str(form, "brideShortName"),
      brideFullName: str(form, "brideFullName"),
      brideParents: opt(form, "brideParents"),
      brideInstagram: opt(form, "brideInstagram"),
      groomShortName: str(form, "groomShortName"),
      groomFullName: str(form, "groomFullName"),
      groomParents: opt(form, "groomParents"),
      groomInstagram: opt(form, "groomInstagram"),
      defaultLocale: str(form, "defaultLocale") === "EN" ? "EN" : "ID",
      bilingual: str(form, "languageMode") !== "single",
      theme: opt(form, "theme"),
      hashtag: opt(form, "hashtag"),
      quoteTextId: opt(form, "quoteTextId"),
      quoteTextEn: opt(form, "quoteTextEn"),
      quoteAuthor: opt(form, "quoteAuthor"),
      storyIntroId: opt(form, "storyIntroId"),
      storyIntroEn: opt(form, "storyIntroEn"),
      closingNoteId: opt(form, "closingNoteId"),
      closingNoteEn: opt(form, "closingNoteEn"),
      dressCodeNoteId: opt(form, "dressCodeNoteId"),
      dressCodeNoteEn: opt(form, "dressCodeNoteEn"),
      dressCodeColors: list(str(form, "dressCodeColors"), /,/),
      musicUrl: opt(form, "musicUrl"),
      coverPhotoUrl: opt(form, "coverPhotoUrl"),
      coverBackgroundUrl: opt(form, "coverBackgroundUrl"),
      closingPhotoUrl: opt(form, "closingPhotoUrl"),
      dressCodeImageUrl: opt(form, "dressCodeImageUrl"),
      interludePhotos: list(str(form, "interludePhotos"), /\r?\n/),
    },
  };
}

/**
 * The API returns `detail.headlineDate` as a UTC timestamp without a zone
 * (`2026-12-01T03:00:00`). `datetime-local` wants wall-clock time in the
 * event's own timezone.
 */
export function toLocalInput(utc: string, timezone: string): string {
  const hasZone = /(Z|[+-]\d\d:?\d\d)$/.test(utc);
  const ms = new Date(hasZone ? utc : `${utc}Z`).getTime();
  if (Number.isNaN(ms)) return "";
  const m = /^([+-])(\d\d):(\d\d)$/.exec(OFFSETS[timezone] ?? OFFSETS["Asia/Jakarta"])!;
  const shift = (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60_000;
  return new Date(ms + shift).toISOString().slice(0, 16);
}

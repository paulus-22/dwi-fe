import type { AppLocale } from "@/i18n/dictionaries";

const LOCALE_TAG: Record<AppLocale, string> = { id: "id-ID", en: "en-GB" };

export function formatEventDate(
  date: Date,
  locale: AppLocale,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatEventTime(
  date: Date,
  locale: AppLocale,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

/** The cover date line: 13.06.2026 */
export function formatHeroDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}

/** Day / month-name / year, for the editorial event block. */
export function splitEditorialDate(
  date: Date,
  locale: AppLocale,
  timeZone: string,
): { day: string; month: string; year: string; weekday: string } {
  const parts = new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
    timeZone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: get("day"),
    month: get("month"),
    year: get("year"),
    weekday: get("weekday"),
  };
}

/** The oversized date plate, split so each piece can be typeset separately. */
export function splitHeroDate(
  date: Date,
  locale: AppLocale,
  timeZone: string,
): { dayMonth: string; weekday: string; year: string } {
  const numeric = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const get = (type: string) => numeric.find((p) => p.type === type)?.value ?? "";

  const weekday = new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    weekday: "long",
    timeZone,
  }).format(date);

  return { dayMonth: `${get("day")}.${get("month")}`, weekday, year: get("year") };
}

export function formatWishDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

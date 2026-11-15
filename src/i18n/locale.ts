import { cookies } from "next/headers";

import { LOCALE_COOKIE } from "./constants";
import { DEFAULT_LOCALE, isLocale, type AppLocale } from "./dictionaries";

export { LOCALE_COOKIE };

/**
 * Locale precedence: explicit ?lang= on the URL, then the visitor's stored
 * choice, then the event's own default (an Indonesian wedding defaults to ID
 * even if the browser is English).
 *
 * A single-language event ignores all of that and always returns its default —
 * otherwise a stored preference from a different wedding would render this one
 * in a language whose content was never written.
 */
export async function resolveLocale(
  searchParamLang: string | undefined,
  eventDefault: AppLocale = DEFAULT_LOCALE,
  bilingual = true,
): Promise<AppLocale> {
  if (!bilingual) return eventDefault;

  if (isLocale(searchParamLang)) return searchParamLang;

  const store = await cookies();
  const stored = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;

  return eventDefault;
}

/** Picks the right half of an `...Id` / `...En` database field pair. */
export function pick(
  locale: AppLocale,
  idValue: string | null | undefined,
  enValue: string | null | undefined,
): string {
  const primary = locale === "en" ? enValue : idValue;
  const fallback = locale === "en" ? idValue : enValue;
  return (primary?.trim() || fallback?.trim()) ?? "";
}

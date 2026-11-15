"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "./constants";
import { isLocale } from "./dictionaries";

/**
 * Persists the guest's language choice. Written from the server so the cookie
 * is set the same way on every route, rather than poked into `document`.
 */
export async function rememberLocale(locale: string) {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

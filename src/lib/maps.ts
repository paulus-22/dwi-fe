/**
 * Google Maps input from the dashboard.
 *
 * Two different things get pasted, and they are easy to mix up:
 *
 *   mapsUrl       the "Bagikan → Salin link" link, e.g. https://maps.app.goo.gl/…
 *                 Opened in a new tab by the "lihat lokasi" button.
 *   mapsEmbedUrl  the "Bagikan → Sematkan peta" one, which Google hands over as a
 *                 whole <iframe …> snippet. Only its src can be framed — a share
 *                 link put here renders as a grey "refused to connect" box.
 */

type Parsed = { ok: true; url: string | null } | { ok: false; error: string };

/** A link guests open. Anything http(s) is fine; empty clears it. */
export function parseMapsLink(raw: string | undefined): Parsed {
  const value = raw?.trim() ?? "";
  if (!value) return { ok: true, url: null };
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return { ok: true, url: url.toString() };
  } catch {
    // fall through
  }
  return { ok: false, error: "Link Google Maps harus berupa alamat lengkap, diawali https://" };
}

/**
 * The embedded map. Accepts the bare URL or Google's entire <iframe> snippet
 * and keeps only a src that Google will actually let us frame.
 */
export function parseMapsEmbed(raw: string | undefined): Parsed {
  let value = raw?.trim() ?? "";
  if (!value) return { ok: true, url: null };

  const src = value.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  if (src) value = src[1].replace(/&amp;/g, "&");

  try {
    const url = new URL(value);
    const isGoogle = url.hostname === "www.google.com" || url.hostname === "maps.google.com";
    if (url.protocol === "https:" && isGoogle && url.pathname.startsWith("/maps/embed")) {
      return { ok: true, url: url.toString() };
    }
  } catch {
    // fall through
  }
  return {
    ok: false,
    error:
      "Embed peta harus dari Google Maps → Bagikan → Sematkan peta → Salin HTML. " +
      "Link biasa (maps.app.goo.gl) tidak bisa ditampilkan sebagai peta.",
  };
}

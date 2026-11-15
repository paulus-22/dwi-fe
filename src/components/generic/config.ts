/**
 * Block `config` is free-form JSON typed by an organizer, so every read goes
 * through these guards: a wrong shape renders as "missing", never as a crash.
 *
 * Config shapes (all keys optional unless noted; `title` is the section heading):
 *
 *   COVER              { title, subtitle, description, imageUrl }   (falls back to the event's own; editorial: bundled hero photo)
 *   COUNTDOWN          { title, targetDate (ISO) }                  (falls back to headlineDate)
 *   SCHEDULE           { title, items: [{ time, title, description }] }
 *   MAP                { title, address, embedUrl, mapsUrl }        (embedUrl: Google "Sematkan peta" src or iframe)
 *                      editorial theme also reads { imageUrl (default: bundled venue photo), description (practical details) }
 *   GALLERY            { title, images: [url | { url, caption }] }
 *   RSVP_FORM          { title, description }
 *   REGISTRATION_FORM  { title, description }
 *   CUSTOM_HTML        { title, html, height }                      (rendered sandboxed, see CustomHtmlBlock)
 *   SPONSOR            { title, sponsors: [{ name, logoUrl, url }] }
 *   CONTACT            { title, contacts: [{ name, role, phone, email }] }
 */
export type Config = Record<string, unknown>;

export const asConfig = (v: unknown): Config =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Config) : {};

export const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

export const list = (v: unknown): Config[] => (Array.isArray(v) ? v.map(asConfig) : []);

/** Only http(s) URLs are ever put in an href/src; anything else is dropped. */
export function safeUrl(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

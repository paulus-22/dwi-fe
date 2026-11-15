import type { OrnamentSet } from "@/components/motif";
import type { AppLocale, Dictionary } from "@/i18n/dictionaries";
import { pick } from "@/i18n/locale";
import { formatEventDate, formatEventTime, splitEditorialDate } from "@/lib/format";
import type { PublicEvent } from "@/lib/event";
import type { EventsLayout } from "@/lib/themes";
import { parseMapsEmbed } from "@/lib/maps";

import { Reveal } from "./reveal";
import { GhostLink } from "./ui";

/**
 * Editorial event block: the day set very large, month and year stacked under
 * it, a hairline, then the practical details. Deliberately not a card — the
 * spec calls card UI out as the thing that makes an invitation look like an app.
 *
 * A theme can opt into `lace` instead, which is a card on purpose: it imitates
 * the details insert of a printed suite, not an app tile.
 */
export function Ceremonies({
  ceremonies,
  timezone,
  locale,
  dict,
  layout = "editorial",
  ornaments,
}: {
  ceremonies: PublicEvent["ceremonies"];
  timezone: string;
  locale: AppLocale;
  dict: Dictionary;
  layout?: EventsLayout;
  ornaments: OrnamentSet;
}) {
  if (ceremonies.length === 0) return null;
  if (layout === "lace") {
    return (
      <LaceCeremonies
        ceremonies={ceremonies}
        timezone={timezone}
        locale={locale}
        dict={dict}
        ornaments={ornaments}
      />
    );
  }

  return (
    <div className="space-y-10">
      {ceremonies.map((ceremony, index) => {
        const date = splitEditorialDate(ceremony.startsAt, locale, timezone);

        return (
          <Reveal key={ceremony.id} variant="fade-up" delay={index * 100}>
            <article className="border border-champagne px-6 py-10 text-center">
              <p className="kicker text-peach-ink">
                {pick(locale, ceremony.nameId, ceremony.nameEn)}
              </p>

              <p className="display mt-6 text-[62px] leading-none text-ink">
                {date.day}
              </p>
              <p className="display mt-1 text-[22px] uppercase tracking-[0.2em] text-ink-soft">
                {date.month}
              </p>
              <p className="display mt-0.5 text-[19px] text-ink-soft">{date.year}</p>

              <span className="mx-auto my-7 block h-px w-16 bg-champagne" />

              <p className="font-ui text-[12px] tracking-[0.18em] text-ink-soft">
                {formatEventTime(ceremony.startsAt, locale, timezone)}
                {" — "}
                {ceremony.endsAt
                  ? formatEventTime(ceremony.endsAt, locale, timezone)
                  : dict.events.until}
              </p>

              <p className="mt-5 font-body text-[19px] text-ink">{ceremony.venueName}</p>
              {ceremony.venueAddress ? (
                <p className="mx-auto mt-1.5 max-w-[30ch] text-[14px] leading-relaxed text-ink-soft">
                  {ceremony.venueAddress}
                </p>
              ) : null}

              {ceremony.mapsUrl ? (
                <div className="mt-8">
                  <GhostLink href={ceremony.mapsUrl}>{dict.events.directions}</GhostLink>
                </div>
              ) : null}
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}

/**
 * Every ceremony on one lace-edged card, the way a printed suite sets the
 * order of the day: the name in script, then time and place, with a sprig
 * between ceremonies. When they all fall on one day the date is set once at
 * the head of the card instead of repeated under each name.
 */
function LaceCeremonies({
  ceremonies,
  timezone,
  locale,
  dict,
  ornaments,
}: {
  ceremonies: PublicEvent["ceremonies"];
  timezone: string;
  locale: AppLocale;
  dict: Dictionary;
  ornaments: OrnamentSet;
}) {
  const { Sprig } = ornaments;
  const dates = ceremonies.map((c) => formatEventDate(c.startsAt, locale, timezone));
  const sharedDate = dates.every((d) => d === dates[0]) ? dates[0] : null;

  return (
    <Reveal variant="fade-up">
      {/* The mask that cuts the scallops would clip a box-shadow, so the
          shadow is a drop-shadow on this wrapper, which follows the edge. */}
      <div className="drop-shadow-[0_12px_22px_rgba(60,66,50,0.14)]">
        <article className="lace-card">
          <div className="lace-card-field px-6 pb-11 pt-10 text-center">
            {sharedDate ? (
              <p className="kicker mb-8 text-peach-ink">{sharedDate}</p>
            ) : null}

            {ceremonies.map((ceremony, index) => (
              <div key={ceremony.id}>
                {index > 0 ? (
                  <div className="my-8 flex justify-center" aria-hidden="true">
                    <Sprig width={22} height={37} />
                  </div>
                ) : null}

                <h3 className="display names [--names-size:40px] text-names-ink">
                  {pick(locale, ceremony.nameId, ceremony.nameEn)}
                </h3>

                {sharedDate ? null : (
                  <p className="kicker mt-3 text-peach-ink">{dates[index]}</p>
                )}

                <p className="mt-3 font-ui text-[13px] tracking-[0.16em] text-ink">
                  {formatEventTime(ceremony.startsAt, locale, timezone)}
                  {" – "}
                  {ceremony.endsAt
                    ? formatEventTime(ceremony.endsAt, locale, timezone)
                    : dict.events.until}
                </p>

                <p className="mt-4 font-body text-[18px] text-ink">{ceremony.venueName}</p>
                {ceremony.venueAddress ? (
                  <p className="mx-auto mt-1 max-w-[28ch] text-[14px] leading-relaxed text-ink-soft">
                    {ceremony.venueAddress}
                  </p>
                ) : null}

                {ceremony.mapsUrl ? (
                  <div className="mt-6">
                    <GhostLink href={ceremony.mapsUrl}>{dict.events.directions}</GhostLink>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </div>
    </Reveal>
  );
}

/**
 * Which map to frame, if any.
 *
 * A pasted embed wins when it is one Google will actually let us frame. A
 * share link (maps.app.goo.gl) is not: Google serves it with
 * `X-Frame-Options: SAMEORIGIN`, so stored in the embed field it rendered as a
 * broken-page box. When the organiser filled either map field but no usable
 * embed exists, the map is built from the venue's name and address instead —
 * Google frames that search form without an API key.
 */
function mapSource(ceremonies: PublicEvent["ceremonies"]) {
  for (const c of ceremonies) {
    const embed = parseMapsEmbed(c.mapsEmbedUrl ?? "");
    if (embed.ok && embed.url) return { url: embed.url, title: c.venueName };
  }

  const wanted = ceremonies.find((c) => c.mapsEmbedUrl || c.mapsUrl);
  if (!wanted) return null;
  const query = [wanted.venueName, wanted.venueAddress].filter(Boolean).join(", ");
  return {
    url: `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`,
    title: wanted.venueName,
  };
}

export function CeremonyMap({ ceremonies }: { ceremonies: PublicEvent["ceremonies"] }) {
  const map = mapSource(ceremonies);
  if (!map) return null;

  return (
    <Reveal variant="wipe" delay={120}>
      <div className="mt-10 border border-champagne p-2">
        <iframe
          src={map.url}
          title={map.title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[220px] w-full border-0 grayscale-[0.35]"
        />
      </div>
    </Reveal>
  );
}

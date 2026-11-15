import type { ReactNode } from "react";

import { Countdown } from "@/components/invitation/countdown";
import { Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicGenericEvent } from "@/lib/event";
import { parseMapsEmbed } from "@/lib/maps";
import type { FormField, PageBlock } from "@/lib/builder";
import type { PublicTicketType } from "@/lib/tickets";

import { asConfig, list, safeUrl, str, type Config } from "./config";
import { RegistrationBlock } from "./registration-block";
import { RsvpBlock } from "./rsvp-block";

/**
 * One component per `blockType` for GENERIC events. Deliberately plain: the
 * dashboard's primitives, no theming — functional and legible.
 */

export type BlockContext = {
  event: PublicGenericEvent;
  dict: Dictionary;
  guest: { token: string; householdName: string; plusGuestAllowance: number; rsvp: { attending: boolean; guestCount: number; message: string | null } | null } | null;
  formFields: FormField[];
  /** Still-claimable ticket types; non-empty enables open/allowlist self-registration. */
  ticketTypes: PublicTicketType[];
};

function Section({ title, children, id }: { title?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto w-full max-w-3xl px-5 py-8">
      {title ? <h2 className="mb-4 font-display text-3xl">{title}</h2> : null}
      {children}
    </section>
  );
}

export function GenericBlock({ block, ctx }: { block: PageBlock; ctx: BlockContext }) {
  const c = asConfig(block.config);
  const { event } = ctx;
  switch (block.blockType) {
    case "COVER":
      return <CoverBlock c={c} event={event} />;
    case "COUNTDOWN":
      return <CountdownBlock c={c} event={event} dict={ctx.dict} />;
    case "SCHEDULE":
      return <ScheduleBlock c={c} />;
    case "MAP":
      return <MapBlock c={c} />;
    case "GALLERY":
      return <GalleryBlock c={c} />;
    case "RSVP_FORM":
      return (
        <Section id="rsvp" title={str(c.title) ?? "RSVP"}>
          <RsvpBlock slug={event.slug} guest={ctx.guest} description={str(c.description)} />
        </Section>
      );
    case "REGISTRATION_FORM":
      return (
        <Section id="pendaftaran" title={str(c.title) ?? "Pendaftaran"}>
          <RegistrationBlock
            slug={event.slug}
            guest={ctx.guest}
            fields={ctx.formFields}
            ticketTypes={ctx.ticketTypes}
            registrationMode={event.registrationMode}
            description={str(c.description)}
          />
        </Section>
      );
    case "CUSTOM_HTML":
      return <CustomHtmlBlock c={c} />;
    case "SPONSOR":
      return <SponsorBlock c={c} />;
    case "CONTACT":
      return <ContactBlock c={c} />;
    default:
      return null;
  }
}

function CoverBlock({ c, event }: { c: Config; event: PublicGenericEvent }) {
  const image = safeUrl(c.imageUrl);
  const title = str(c.title) ?? event.title;
  const subtitle = str(c.subtitle) ?? event.subtitle ?? undefined;
  const description = str(c.description) ?? event.description ?? undefined;
  return (
    <header className="relative isolate overflow-hidden bg-admin-ink text-center text-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- organizer-supplied URL, any host
        <img src={image} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-50" />
      ) : null}
      <div className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
        <h1 className="font-display text-4xl leading-tight sm:text-6xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-lg text-white/85">{subtitle}</p> : null}
        {description ? <p className="mx-auto mt-6 max-w-xl whitespace-pre-line text-white/80">{description}</p> : null}
      </div>
    </header>
  );
}

function CountdownBlock({ c, event, dict }: { c: Config; event: PublicGenericEvent; dict: Dictionary }) {
  const custom = str(c.targetDate);
  const target = custom && !Number.isNaN(Date.parse(custom)) ? new Date(custom) : event.headlineDate;
  return (
    <div className="bg-olive-deep py-10 text-cream">
      <Section title={str(c.title)}>
        <Countdown targetIso={target.toISOString()} dict={dict} />
      </Section>
    </div>
  );
}

function ScheduleBlock({ c }: { c: Config }) {
  const items = list(c.items).filter((i) => str(i.title));
  return (
    <Section title={str(c.title) ?? "Jadwal"}>
      {items.length === 0 ? (
        <p className="text-admin-muted">Jadwal akan segera diumumkan.</p>
      ) : (
        <ol className="divide-y divide-panel-border rounded-[var(--radius-card)] border border-panel-border bg-panel">
          {items.map((i, n) => (
            <li key={n} className="flex gap-4 px-4 py-3">
              <span className="w-20 shrink-0 font-medium tabular-nums">{str(i.time) ?? ""}</span>
              <span>
                <span className="block font-medium">{str(i.title)}</span>
                {str(i.description) ? <span className="block text-sm text-admin-muted">{str(i.description)}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function MapBlock({ c }: { c: Config }) {
  // Same rule as the wedding ceremonies: only a Google "embed" src can be framed.
  const embed = parseMapsEmbed(str(c.embedUrl));
  const embedUrl = embed.ok ? embed.url : null;
  const mapsUrl = safeUrl(c.mapsUrl);
  const address = str(c.address);
  return (
    <Section title={str(c.title) ?? "Lokasi"}>
      <Card className="space-y-3">
        {address ? <p className="whitespace-pre-line">{address}</p> : null}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Peta lokasi"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="aspect-[4/3] w-full rounded-[var(--radius-control)] border-0"
          />
        ) : null}
        {mapsUrl ? (
          <a href={mapsUrl} target="_blank" rel="noreferrer noopener" className="inline-block text-gold underline underline-offset-4">
            Buka di Google Maps
          </a>
        ) : null}
        {!address && !embedUrl && !mapsUrl ? <p className="text-admin-muted">Lokasi akan segera diumumkan.</p> : null}
      </Card>
    </Section>
  );
}

function GalleryBlock({ c }: { c: Config }) {
  const images = (Array.isArray(c.images) ? c.images : [])
    .map((i) => (typeof i === "string" ? { url: safeUrl(i), caption: undefined } : { url: safeUrl(asConfig(i).url), caption: str(asConfig(i).caption) }))
    .filter((i): i is { url: string; caption: string | undefined } => Boolean(i.url));
  if (images.length === 0) return null;
  return (
    <Section title={str(c.title) ?? "Galeri"}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((i, n) => (
          <li key={n}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- organizer-supplied URL, any host */}
              <img src={i.url} alt={i.caption ?? ""} loading="lazy" className="aspect-square w-full rounded-[var(--radius-control)] object-cover" />
              {i.caption ? <figcaption className="mt-1 text-xs text-admin-muted">{i.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * XSS tradeoff: `config.html` is organizer-authored, the same trust level as
 * the admin who built the block — but it is still markup served to the public
 * on our origin. Rather than ship a hand-rolled sanitizer (easy to get wrong,
 * and a dependency for something this rare), it is rendered in an iframe with
 * `sandbox` (no `allow-scripts`, no `allow-same-origin`): scripts, forms and
 * access to this page's DOM/cookies are all blocked, while layout, styles,
 * images and links still work. Cost: fixed height (`config.height`, px,
 * default 400) and links open in a new tab.
 */
function CustomHtmlBlock({ c }: { c: Config }) {
  const html = typeof c.html === "string" ? c.html : "";
  if (!html.trim()) return null;
  const height = typeof c.height === "number" && c.height >= 80 && c.height <= 2000 ? c.height : 400;
  const doc = `<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:12px;font-family:system-ui,sans-serif;color:#222}</style>${html}`;
  return (
    <Section title={str(c.title)}>
      <iframe
        title={str(c.title) ?? "Konten"}
        srcDoc={doc}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={{ height }}
        className="w-full rounded-[var(--radius-control)] border border-panel-border bg-white"
      />
    </Section>
  );
}

function SponsorBlock({ c }: { c: Config }) {
  const sponsors = list(c.sponsors).filter((s) => str(s.name) || safeUrl(s.logoUrl));
  if (sponsors.length === 0) return null;
  return (
    <Section title={str(c.title) ?? "Sponsor"}>
      <ul className="flex flex-wrap items-center justify-center gap-6">
        {sponsors.map((s, n) => {
          const logo = safeUrl(s.logoUrl);
          const name = str(s.name);
          const inner = logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- organizer-supplied URL, any host
            <img src={logo} alt={name ?? ""} className="h-14 w-auto max-w-40 object-contain" />
          ) : (
            <span className="font-medium">{name}</span>
          );
          const url = safeUrl(s.url);
          return (
            <li key={n}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer noopener">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function ContactBlock({ c }: { c: Config }) {
  const contacts = list(c.contacts).filter((p) => str(p.name));
  if (contacts.length === 0) return null;
  return (
    <Section title={str(c.title) ?? "Kontak"}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {contacts.map((p, n) => {
          const phone = str(p.phone);
          const email = str(p.email);
          return (
            <li key={n}>
              <Card>
                <p className="font-medium">{str(p.name)}</p>
                {str(p.role) ? <p className="text-sm text-admin-muted">{str(p.role)}</p> : null}
                {phone ? (
                  <p className="mt-2 text-sm">
                    <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="text-gold underline underline-offset-4">
                      {phone}
                    </a>
                  </p>
                ) : null}
                {email ? (
                  <p className="text-sm">
                    <a href={`mailto:${email}`} className="text-gold underline underline-offset-4">
                      {email}
                    </a>
                  </p>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

import type { ReactNode } from "react";

import { Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicGenericEvent } from "@/lib/event";
import type { GenericTheme } from "@/lib/generic-themes";
import { parseMapsEmbed } from "@/lib/maps";
import type { FormField, PageBlock } from "@/lib/builder";
import type { PublicTicketType } from "@/lib/tickets";

import { asConfig, list, safeUrl, str, type Config } from "./config";
import { GenericCountdown } from "./countdown";
import { RegistrationBlock } from "./registration-block";
import { RsvpBlock } from "./rsvp-block";

/**
 * One component per `blockType` for GENERIC events. Colours and corner radii
 * come from the event's theme (`--g-*` vars on the page wrapper, see
 * `lib/generic-themes.ts`); a block only branches on `theme.shape` where the
 * two designs lay things out differently (hero, countdown, schedule, forms).
 */

export type BlockContext = {
  event: PublicGenericEvent;
  theme: GenericTheme;
  dict: Dictionary;
  guest: {
    token: string;
    householdName: string;
    plusGuestAllowance: number;
    rsvp: {
      attending: boolean;
      guestCount: number;
      message: string | null;
    } | null;
  } | null;
  formFields: FormField[];
  /** Still-claimable ticket types; non-empty enables open/allowlist self-registration. */
  ticketTypes: PublicTicketType[];
  /** The hero button's target: the page's first RSVP/registration block, if any. */
  cta: { href: string; label: string } | null;
};

type Tone = "paper" | "alt" | "navy";

const TONE: Record<Tone, string> = {
  paper: "bg-[var(--g-paper)] text-[var(--g-ink)]",
  alt: "bg-[var(--g-cream)] text-[var(--g-ink)]",
  navy: "bg-[var(--g-navy)] text-white",
};

function Section({
  title,
  kicker,
  children,
  id,
  tone = "paper",
  shape,
}: {
  title?: string;
  kicker?: string;
  children: ReactNode;
  id?: string;
  tone?: Tone;
  shape: "sharp" | "soft";
}) {
  const soft = shape === "soft";
  return (
    <section id={id} className={`${TONE[tone]} ${soft ? "px-[25px] py-[31px]" : "px-[27px] py-[54px]"}`}>
      {kicker ? (
        <p className="gt-kicker" style={tone === "navy" ? { color: "var(--g-gold)" } : undefined}>
          {kicker}
        </p>
      ) : null}
      {title ? (
        <h2
          className={`gt-serif font-normal ${
            soft ? "text-[27px]" : "mt-3 text-[32px] leading-[1.12]"
          } ${tone === "navy" ? "text-white" : "text-[var(--g-navy)]"} ${children ? "mb-4" : ""}`}
        >
          {title}
        </h2>
      ) : null}
      {soft && title ? <div className="-mt-2 mb-5 h-0.5 w-[58px] bg-gradient-to-r from-[#c99b4b] to-[#f0dcae]" /> : null}
      {children}
    </section>
  );
}

export function GenericBlock({ block, ctx }: { block: PageBlock; ctx: BlockContext }) {
  const c = asConfig(block.config);
  const { event, theme } = ctx;
  const shape = theme.shape;
  const sec = { shape, kicker: str(c.kicker) } as const;
  switch (block.blockType) {
    case "COVER":
      return <CoverBlock c={c} ctx={ctx} />;
    case "COUNTDOWN":
      return <CountdownBlock c={c} ctx={ctx} />;
    case "SCHEDULE":
      return <ScheduleBlock c={c} ctx={ctx} />;
    case "MAP":
      return <MapBlock c={c} shape={shape} />;
    case "GALLERY":
      return <GalleryBlock c={c} shape={shape} />;
    case "RSVP_FORM":
      return (
        <Section {...sec} id="rsvp" title={str(c.title) ?? "RSVP"} tone={shape === "soft" ? "alt" : "paper"}>
          <RsvpBlock slug={event.slug} guest={ctx.guest} description={str(c.description)} shape={shape} />
        </Section>
      );
    case "REGISTRATION_FORM":
      return (
        <Section {...sec} id="pendaftaran" title={str(c.title) ?? "Pendaftaran"} tone={shape === "soft" ? "alt" : "paper"}>
          <RegistrationBlock
            slug={event.slug}
            guest={ctx.guest}
            fields={ctx.formFields}
            ticketTypes={ctx.ticketTypes}
            registrationMode={event.registrationMode}
            description={str(c.description)}
            shape={shape}
          />
        </Section>
      );
    case "CUSTOM_HTML":
      return <CustomHtmlBlock c={c} shape={shape} />;
    case "SPONSOR":
      return <SponsorBlock c={c} shape={shape} />;
    case "CONTACT":
      return <ContactBlock c={c} shape={shape} />;
    default:
      return null;
  }
}

function longDate(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(d);
}

function CoverBlock({ c, ctx }: { c: Config; ctx: BlockContext }) {
  const { event, theme, guest, cta } = ctx;
  const image = safeUrl(c.imageUrl);
  const title = str(c.title) ?? event.title;
  const subtitle = str(c.subtitle) ?? event.subtitle ?? undefined;
  const description = str(c.description) ?? event.description ?? undefined;
  const date = longDate(event.headlineDate, event.timezone);
  const bgImage = image ? (
    // eslint-disable-next-line @next/next/no-img-element -- organizer-supplied URL, any host
    <img src={image} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-35" />
  ) : null;

  if (theme.shape === "soft") {
    return (
      <>
        <header
          className="relative isolate overflow-hidden px-7 pt-[34px] pb-[38px] text-white"
          style={{
            background: "linear-gradient(180deg,#111d30 0%,#192a42 70%,#233b58 100%)",
          }}
        >
          {bgImage}
          <h1 className="gt-serif text-[42px] leading-[1.06] font-normal tracking-[-0.03em]">{title}</h1>
          {subtitle ? <p className="mt-4 max-w-[300px] text-[15px] leading-normal text-[#e7e9ed]">{subtitle}</p> : null}
          <p className="mt-6 flex items-start gap-3 text-[13px] text-[#f4f1eb]">
            <span aria-hidden="true" className="w-[22px] text-center text-lg text-[var(--g-gold)]">
              ▦
            </span>
            <span>{date}</span>
          </p>
          {description ? <p className="mt-4 text-[13px] leading-relaxed whitespace-pre-line text-[#e7e9ed]/85">{description}</p> : null}
          {cta ? (
            <a href={cta.href} className="gt-cta mt-6 w-full">
              {cta.label}　›
            </a>
          ) : null}
        </header>
        {guest ? (
          <section
            className="border-y border-[var(--g-line)] px-[25px] py-[27px]"
            style={{ background: "linear-gradient(135deg,#fff,#f5f0e6)" }}
          >
            <p className="text-[10px] font-normal tracking-[0.25em] text-[var(--g-gold-ink)] uppercase">Undangan pribadi Anda</p>
            <h2 className="gt-serif mt-2 mb-3 text-[31px] font-normal text-[var(--g-navy)]">Yth. {guest.householdName},</h2>
            <p className="text-sm leading-[1.65] text-[#4e5662]">
              Anda diundang secara khusus untuk menghadiri {title}. Undangan ini ditujukan langsung kepada Anda — kami menantikan kehadiran
              Anda.
            </p>
          </section>
        ) : null}
      </>
    );
  }

  // corporate-classic: navy hero, two concentric circle ornaments, serif title.
  return (
    <header
      className="relative isolate flex min-h-[690px] flex-col items-center overflow-hidden px-[27px] pt-[30px] pb-[42px] text-center text-white"
      style={{
        background:
          "radial-gradient(ellipse at 82% 28%,#31445b 0,transparent 37%),linear-gradient(145deg,#0c1725 0%,#1b2b40 58%,#101b2b 100%)",
      }}
    >
      {bgImage}
      <span
        aria-hidden="true"
        className="absolute top-[110px] left-1/2 -z-10 size-[390px] -translate-x-1/2 rounded-full border border-[#c8ad7850]"
      />
      <span
        aria-hidden="true"
        className="absolute top-[145px] left-1/2 -z-10 size-[320px] -translate-x-1/2 rounded-full border border-white/[0.125]"
      />
      {guest ? <p className="gt-serif text-xs tracking-[0.11em] text-[#e7d7b6] uppercase">Yth. {guest.householdName}</p> : null}
      <h1 className="gt-serif mt-[110px] mb-4 max-w-[390px] text-[clamp(39px,11vw,54px)] leading-[1.04] font-normal tracking-[-0.035em]">
        {title}
      </h1>
      {subtitle ? <p className="max-w-[290px] text-[13px] leading-[1.75] text-[#d5dce4]">{subtitle}</p> : null}
      <div className="my-[27px] mb-5 flex items-center gap-3 text-xs text-[var(--g-gold)]">
        <span aria-hidden="true" className="h-px w-[42px] bg-[#c8ad7880]" />✦
        <span aria-hidden="true" className="h-px w-[42px] bg-[#c8ad7880]" />
      </div>
      <p className="text-xs tracking-[0.14em] text-[#f0e9dc] uppercase">{date}</p>
      {description ? (
        <p className="mt-4 max-w-[330px] text-[11px] leading-[1.7] whitespace-pre-line text-[#aeb9c5]">{description}</p>
      ) : null}
      {cta ? (
        <a href={cta.href} className="gt-cta mt-[34px]">
          {cta.label}
        </a>
      ) : null}
      <p className="mt-auto pt-11 text-[9px] tracking-[0.22em] text-[#8f9aaa] uppercase">Gulir untuk melihat ↓</p>
    </header>
  );
}

function CountdownBlock({ c, ctx }: { c: Config; ctx: BlockContext }) {
  const { event, theme, dict } = ctx;
  const custom = str(c.targetDate);
  const target = custom && !Number.isNaN(Date.parse(custom)) ? new Date(custom) : event.headlineDate;
  const clock = <GenericCountdown targetIso={target.toISOString()} dict={dict} shape={theme.shape} />;

  if (theme.shape === "soft") {
    return (
      <section className="bg-[var(--g-paper)] px-[25px] pt-[25px] pb-[31px]">
        <div className="rounded-2xl px-3.5 py-5 text-center text-white" style={{ background: "linear-gradient(135deg,#101a2b,#203754)" }}>
          <h3 className="gt-serif mb-3.5 text-[19px] font-normal">{str(c.title) ?? "Acara dimulai dalam"}</h3>
          {clock}
        </div>
      </section>
    );
  }
  return (
    <section className="bg-[#e9e5dc] px-5 py-[31px] text-center">
      <p className="text-[9px] tracking-[0.22em] text-[#7f7158] uppercase">{str(c.title) ?? "Menuju hari acara"}</p>
      <div className="mt-5">{clock}</div>
    </section>
  );
}

function ScheduleBlock({ c, ctx }: { c: Config; ctx: BlockContext }) {
  const shape = ctx.theme.shape;
  const items = list(c.items).filter((i) => str(i.title));
  const soft = shape === "soft";
  return (
    <Section shape={shape} kicker={str(c.kicker)} tone={soft ? "paper" : "navy"} title={str(c.title) ?? "Jadwal"}>
      {items.length === 0 ? (
        <p className={soft ? "text-[var(--g-muted)]" : "text-[#b7c0ca]"}>Jadwal akan segera diumumkan.</p>
      ) : soft ? (
        <ol>
          {items.map((i, n) => (
            <li key={n} className="grid grid-cols-[92px_1fr] gap-2.5 border-b border-[var(--g-line)] py-3 text-[13px]">
              <span className="font-bold text-[var(--g-gold-ink)] tabular-nums">{str(i.time) ?? ""}</span>
              <span className="leading-[1.45]">
                {str(i.title)}
                {str(i.description) ? <span className="block text-xs text-[var(--g-muted)]">{str(i.description)}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="mt-[25px]">
          {items.map((i, n) => (
            <li key={n} className="grid grid-cols-[68px_1fr] gap-3.5 border-t border-white/[0.125] py-[17px]">
              <span className="gt-serif text-[17px] text-[var(--g-gold)] tabular-nums">{str(i.time) ?? ""}</span>
              <span>
                <span className="block text-xs font-semibold text-white">{str(i.title)}</span>
                {str(i.description) ? (
                  <span className="mt-[5px] block text-[10px] leading-[1.6] text-[#aeb9c5]">{str(i.description)}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

type Shape = "sharp" | "soft";

function MapBlock({ c, shape }: { c: Config; shape: Shape }) {
  // Same rule as the wedding ceremonies: only a Google "embed" src can be framed.
  const embed = parseMapsEmbed(str(c.embedUrl));
  const embedUrl = embed.ok ? embed.url : null;
  const mapsUrl = safeUrl(c.mapsUrl);
  const address = str(c.address);
  return (
    <Section shape={shape} kicker={str(c.kicker)} title={str(c.title) ?? "Lokasi"}>
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
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-block text-[var(--g-gold-ink)] underline underline-offset-4"
          >
            Buka di Google Maps
          </a>
        ) : null}
        {!address && !embedUrl && !mapsUrl ? <p className="text-[var(--g-muted)]">Lokasi akan segera diumumkan.</p> : null}
      </Card>
    </Section>
  );
}

function GalleryBlock({ c, shape }: { c: Config; shape: Shape }) {
  const images = (Array.isArray(c.images) ? c.images : [])
    .map((i) =>
      typeof i === "string"
        ? { url: safeUrl(i), caption: undefined }
        : { url: safeUrl(asConfig(i).url), caption: str(asConfig(i).caption) },
    )
    .filter((i): i is { url: string; caption: string | undefined } => Boolean(i.url));
  if (images.length === 0) return null;
  return (
    <Section shape={shape} kicker={str(c.kicker)} title={str(c.title) ?? "Galeri"}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((i, n) => (
          <li key={n}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- organizer-supplied URL, any host */}
              <img
                src={i.url}
                alt={i.caption ?? ""}
                loading="lazy"
                className="aspect-square w-full rounded-[var(--radius-control)] object-cover"
              />
              {i.caption ? <figcaption className="mt-1 text-xs text-[var(--g-muted)]">{i.caption}</figcaption> : null}
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
function CustomHtmlBlock({ c, shape }: { c: Config; shape: Shape }) {
  const html = typeof c.html === "string" ? c.html : "";
  if (!html.trim()) return null;
  const height = typeof c.height === "number" && c.height >= 80 && c.height <= 2000 ? c.height : 400;
  const doc = `<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:12px;font-family:system-ui,sans-serif;color:#222}</style>${html}`;
  return (
    <Section shape={shape} kicker={str(c.kicker)} title={str(c.title)}>
      <iframe
        title={str(c.title) ?? "Konten"}
        srcDoc={doc}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={{ height }}
        className="w-full rounded-[var(--radius-control)] border border-[var(--g-line)] bg-white"
      />
    </Section>
  );
}

function SponsorBlock({ c, shape }: { c: Config; shape: Shape }) {
  const sponsors = list(c.sponsors).filter((s) => str(s.name) || safeUrl(s.logoUrl));
  if (sponsors.length === 0) return null;
  return (
    <Section shape={shape} kicker={str(c.kicker)} title={str(c.title) ?? "Sponsor"}>
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

function ContactBlock({ c, shape }: { c: Config; shape: Shape }) {
  const contacts = list(c.contacts).filter((p) => str(p.name));
  if (contacts.length === 0) return null;
  return (
    <Section shape={shape} kicker={str(c.kicker)} title={str(c.title) ?? "Kontak"}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {contacts.map((p, n) => {
          const phone = str(p.phone);
          const email = str(p.email);
          return (
            <li key={n}>
              <Card>
                <p className="font-medium">{str(p.name)}</p>
                {str(p.role) ? <p className="text-sm text-[var(--g-muted)]">{str(p.role)}</p> : null}
                {phone ? (
                  <p className="mt-2 text-sm">
                    <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="text-[var(--g-gold-ink)] underline underline-offset-4">
                      {phone}
                    </a>
                  </p>
                ) : null}
                {email ? (
                  <p className="text-sm">
                    <a href={`mailto:${email}`} className="text-[var(--g-gold-ink)] underline underline-offset-4">
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

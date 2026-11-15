import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocaleSwitch } from "@/components/locale-switch";
import { ornamentSet } from "@/components/motif";
import { SaveVoucherImage } from "@/components/voucher/save-image";
import { VoucherTicket } from "@/components/voucher/ticket";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/locale";
import { coupleLine } from "@/lib/couple";
import { findPublicEvent, getPublicEvent, resolveVoucher } from "@/lib/event";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { resolveTheme, themeStyle } from "@/lib/themes";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/v/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const token = typeof query.to === "string" ? query.to : undefined;

  const event = await findPublicEvent(slug);
  if (!event || event.kind !== "WEDDING") return { title: "E-voucher" };

  const couple = coupleLine(event);
  const title = `E-voucher · ${couple}`;

  // The share preview is the voucher artwork itself, so a WhatsApp forward
  // shows the pass rather than a bare text card.
  const image = token
    ? `/v/${slug}/image?to=${encodeURIComponent(token)}`
    : undefined;

  return {
    title,
    description: `Entry pass for the wedding of ${couple}`,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      type: "website",
      ...(image ? { images: [{ url: image, width: 800, height: 1200 }] } : {}),
    },
    ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
  };
}

export default async function VoucherPage({
  params,
  searchParams,
}: PageProps<"/v/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;

  const event = await getPublicEvent(slug);
  // E-vouchers are part of the wedding product; generic events have none.
  if (event.kind !== "WEDDING") notFound();

  const localeParam = typeof query.lang === "string" ? query.lang : undefined;
  const locale = await resolveLocale(
    localeParam,
    event.defaultLocale === "EN" ? "en" : "id",
    event.bilingual,
  );
  const dict = getDictionary(locale);

  const token = typeof query.to === "string" ? query.to : undefined;
  const voucher = await resolveVoucher(event.slug, token);

  const theme = resolveTheme(event.theme);
  const ornaments = ornamentSet(theme.design.ornament);

  const invitationHref = token
    ? `/e/${event.slug}?to=${encodeURIComponent(token)}`
    : `/e/${event.slug}`;

  // The reception is the ceremony guests are checked in for; fall back to the
  // first listed if an event has only one.
  const gate = event.ceremonies[event.ceremonies.length - 1] ?? null;
  const couple = coupleLine(event);
  const dateLine = formatEventDate(event.headlineDate, locale, event.timezone);
  const venueLine = gate
    ? `${gate.venueName} · ${formatEventTime(gate.startsAt, locale, event.timezone)}`
    : null;

  return (
    <main
      style={themeStyle(event.theme)}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-olive-deep px-6 py-14"
    >
      <ornaments.Spray
        className="float-slow pointer-events-none absolute -left-12 -top-4 opacity-70"
        width={185}
        height={250}
      />
      <ornaments.Spray
        className="float-slower pointer-events-none absolute -right-12 -bottom-4 rotate-180 opacity-70"
        width={185}
        height={250}
        mirrored
      />

      <div className="relative w-full max-w-[22rem]">
        {voucher.status === "issued" ? (
          <>
            <VoucherTicket
              ornaments={ornaments}
              token={voucher.guest.token}
              qrPayload={voucher.qrPayload}
              guestName={voucher.guest.displayName}
              admits={voucher.admits}
              coupleLine={couple}
              dateLine={dateLine}
              venueLine={venueLine}
              dict={dict}
            />

            <div className="mt-8 flex flex-col items-center gap-4">
              <SaveVoucherImage
                imageUrl={`/v/${event.slug}/image?to=${encodeURIComponent(voucher.guest.token)}`}
                fileName={`evoucher-${voucher.guest.token}.png`}
                dict={dict}
              />
              <Link
                href={invitationHref}
                className="font-ui text-[10px] uppercase tracking-[0.22em] text-cream/70 underline underline-offset-[6px]"
              >
                {dict.voucher.openInvitation}
              </Link>
            </div>
          </>
        ) : (
          <MessageCard
            title={
              voucher.status === "unknown"
                ? dict.voucher.unknownTitle
                : voucher.declined
                  ? dict.voucher.declinedTitle
                  : dict.voucher.pendingTitle
            }
            body={
              voucher.status === "unknown"
                ? dict.voucher.unknownBody
                : voucher.declined
                  ? dict.voucher.declinedBody
                  : dict.voucher.pendingBody
            }
            cta={
              voucher.status === "unknown"
                ? null
                : {
                    href: `${invitationHref}#rsvp`,
                    label: voucher.declined
                      ? dict.voucher.declinedCta
                      : dict.voucher.pendingCta,
                  }
            }
            coupleLine={couple}
            dateLine={dateLine}
          />
        )}
      </div>

      {event.bilingual ? (
        <div className="mt-10">
          <LocaleSwitch locale={locale} />
        </div>
      ) : null}
    </main>
  );
}

function MessageCard({
  title,
  body,
  cta,
  coupleLine,
  dateLine,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string } | null;
  coupleLine: string;
  dateLine: string;
}) {
  return (
    <div className="border border-cream/25 px-7 py-12 text-center">
      <p className="display text-[30px] leading-tight text-cream">{coupleLine}</p>
      <p className="mt-2 font-ui text-[11px] tracking-[0.22em] text-cream/70">
        {dateLine}
      </p>

      <span className="mx-auto my-8 block h-px w-12 bg-cream/25" />

      <h1 className="display text-[26px] leading-tight text-cream">{title}</h1>
      <p className="mx-auto mt-4 max-w-[28ch] text-[15px] leading-relaxed text-cream/70">
        {body}
      </p>

      {cta ? (
        <Link
          href={cta.href}
          className="mt-8 inline-block border border-cream/40 px-8 py-3 font-ui text-[10px] uppercase tracking-[0.24em] text-cream transition-colors duration-300 hover:border-peach hover:bg-peach hover:text-peach-text"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}

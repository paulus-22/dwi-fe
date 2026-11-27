import { Ceremonies, CeremonyMap } from "@/components/invitation/ceremonies";
import { Countdown } from "@/components/invitation/countdown";
import { Couple } from "@/components/invitation/couple";
import { shortGuestName } from "@/lib/guests";
import { DressCode } from "@/components/invitation/dress-code";
import { GallerySlideshow } from "@/components/invitation/gallery-slideshow";
import { Gift } from "@/components/invitation/gift";
import { Hero } from "@/components/invitation/hero";
import { Quote } from "@/components/invitation/quote";
import { Reveal } from "@/components/invitation/reveal";
import { RsvpForm } from "@/components/invitation/rsvp-form";
import { Rundown } from "@/components/invitation/rundown";
import { Interlude, MountedPhoto, Photo } from "@/components/invitation/photo";
import { Section } from "@/components/invitation/section";
import { InvitationShell } from "@/components/invitation/shell";
import { Story } from "@/components/invitation/story";
import { VoucherLink } from "@/components/invitation/voucher-link";
import { WishesWall } from "@/components/invitation/wishes";
import { ornamentSet } from "@/components/motif";
import { getDictionary } from "@/i18n/dictionaries";
import { pick, resolveLocale } from "@/i18n/locale";
import { coupleLine } from "@/lib/couple";
import { getWishesPage, type PublicEvent, type ResolvedGuest } from "@/lib/event";
import { formatHeroDate } from "@/lib/format";
import { resolveTheme, themeStyle } from "@/lib/themes";

const WISHES_PAGE_SIZE = 10;

/** The wedding invitation — a straight port of the old app's `/e/[slug]`. */
export async function WeddingInvitation({
  event,
  query,
  guest,
}: {
  event: PublicEvent;
  query: Record<string, string | string[] | undefined>;
  guest: ResolvedGuest | null;
}) {

  const localeParam = typeof query.lang === "string" ? query.lang : undefined;
  const locale = await resolveLocale(
    localeParam,
    event.defaultLocale === "EN" ? "en" : "id",
    event.bilingual,
  );
  const dict = getDictionary(locale);

  const { wishes, nextCursor } = await getWishesPage(event.slug, WISHES_PAGE_SIZE);

  const theme = resolveTheme(event.theme);
  const ornaments = ornamentSet(theme.design.ornament);

  // Named theme first, then any per-event overrides on top of it.
  const overrides = event.themeTokens;
  const cssVars = {
    ...themeStyle(event.theme),
    ...(overrides
      ? Object.fromEntries(
          Object.entries(overrides).map(([key, value]) => [`--color-${key}`, value]),
        )
      : {}),
  };

  /**
   * Full-bleed photos between sections, filled in order into the four slots
   * below. The slots are fixed rather than computed: these are breaks in the
   * reading, and where a reader gets a breath is a design decision, not
   * something to derive from how many files were uploaded.
   */
  const interludes = event.interludePhotos;
  const interlude = (slot: number) =>
    interludes[slot] ? <Interlude src={interludes[slot]} /> : null;

  const storyIntro = pick(locale, event.storyIntroId, event.storyIntroEn);
  const closingNote =
    pick(locale, event.closingNoteId, event.closingNoteEn) || dict.closing.default;
  const dressCodeNote = pick(locale, event.dressCodeNoteId, event.dressCodeNoteEn);
  const quoteText = pick(locale, event.quoteTextId, event.quoteTextEn);

  return (
    <main style={cssVars} className="bg-olive-mid/10 font-body text-black">
      <InvitationShell
        locale={locale}
        showLocaleSwitch={event.bilingual}
        coverStyle={theme.design.cover}
        ornamentFamily={theme.design.ornament}
        musicUrl={event.musicUrl}
        musicLabels={{ play: dict.music.play, pause: dict.music.pause }}
        cover={{
          brideName: event.brideShortName,
          groomName: event.groomShortName,
          hashtag: event.hashtag,
          dateLabel: formatHeroDate(event.headlineDate, event.timezone),
          guestName: shortGuestName(guest?.householdName),
          greeting: dict.hero.guestFallback,
          salutation: dict.hero.salutation,
          kicker: dict.hero.kicker,
          openLabel: dict.hero.open,
          photoUrl: event.coverPhotoUrl,
          backgroundUrl: event.coverBackgroundUrl,
        }}
      >
        <Hero
          ornaments={ornaments}
          brideName={event.brideShortName}
          groomName={event.groomShortName}
          hashtag={event.hashtag}
          photoUrl={event.coverPhotoUrl}
          dict={dict}
        />

        <Quote ornaments={ornaments} text={quoteText} author={event.quoteAuthor} />

        <Section ornaments={ornaments}
          id="couple"
          kicker={dict.couple.kicker}
          title={dict.couple.title}
          intro={storyIntro}
          divider={false}
          posy="right"
        >
          <Couple
            ornaments={ornaments}
            bride={{
              fullName: event.brideFullName,
              parents: event.brideParents,
              instagram: event.brideInstagram,
            }}
            groom={{
              fullName: event.groomFullName,
              parents: event.groomParents,
              instagram: event.groomInstagram,
            }}
            dict={dict}
          />
        </Section>

        {interlude(0)}

        {event.milestones.length > 0 ? (
          <Section ornaments={ornaments}
            id="story"
            kicker={dict.story.kicker}
            title={dict.story.title}
            tone="cream"
            posy="left"
          >
            <Story milestones={event.milestones} locale={locale} />
          </Section>
        ) : null}

        {event.galleryPhotos.length > 0 ? (
          <Section ornaments={ornaments} id="gallery" kicker="Pre-Wedding" title="Galeri Foto" tone="cream" posy="right">
            <GallerySlideshow photos={event.galleryPhotos} />
          </Section>
        ) : null}

        <Section ornaments={ornaments} id="save-the-date" title={dict.countdown.title} tone="olive" posy="both">
          <Countdown targetIso={event.headlineDate.toISOString()} dict={dict} />
        </Section>

        {interlude(1)}

        <Section ornaments={ornaments}
          id="events"
          kicker={dict.events.kicker}
          title={dict.events.title}
          divider={false}
          posy="right"
        >
          <Ceremonies
            ceremonies={event.ceremonies}
            layout={theme.design.events}
            ornaments={ornaments}
            timezone={event.timezone}
            locale={locale}
            dict={dict}
          />
          <CeremonyMap ceremonies={event.ceremonies} />
        </Section>

        {interlude(2)}

        {event.rundown.length > 0 ? (
          <Section ornaments={ornaments} id="rundown" title={dict.rundown.title} tone="olive" posy="left">
            <Rundown items={event.rundown} locale={locale} />
          </Section>
        ) : null}

        {dressCodeNote || event.dressCodeColors.length > 0 || event.dressCodeImageUrl ? (
          <Section ornaments={ornaments}
            id="dress-code"
            kicker={dict.dressCode.kicker}
            title={dict.dressCode.title}
            tone="olive"
            divider={false}
          >
            <DressCode
              note={dressCodeNote}
              colors={event.dressCodeColors}
              imageUrl={event.dressCodeImageUrl}
              dict={dict}
            />
          </Section>
        ) : null}

        {guest ? (
          <>
            {/* GROUP (kelompok) invitations: no RSVP form, no per-person pass —
                the section is omitted entirely (see below). */}
            {guest.passMode !== "GROUP" ? (
              <Section ornaments={ornaments} id="rsvp" title={dict.rsvp.title} tone="olive" posy="right">
                <RsvpForm
                  eventSlug={event.slug}
                  token={guest.token}
                  defaultName={guest.householdName}
                  maxGuests={guest.plusGuestAllowance + 1}
                  existing={
                    guest.rsvp
                      ? {
                          attending: guest.rsvp.attending,
                          guestCount: guest.rsvp.guestCount,
                          message: guest.rsvp.message,
                        }
                      : null
                  }
                  dict={dict}
                  voucherHref={`/v/${event.slug}?to=${encodeURIComponent(guest.token)}`}
                />
              </Section>
            ) : null}

            {/* The pass only exists once attendance is confirmed, so the
                invitation links to it rather than embedding it. GROUP
                invitations (e.g. a whole class) have no per-person pass. */}
            {guest.rsvp?.attending && guest.passMode !== "GROUP" ? (
              <Section ornaments={ornaments}
                id="pass"
                kicker={dict.pass.kicker}
                title={dict.pass.title}
                tone="cream"
                posy="left"
              >
                <VoucherLink
                  ornaments={ornaments}
                  href={`/v/${event.slug}?to=${encodeURIComponent(guest.token)}`}
                  dict={dict}
                />
              </Section>
            ) : null}
          </>
        ) : null}

        {event.giftAccounts.length > 0 || event.giftImageUrl || event.giftAddress ? (
          <Section ornaments={ornaments}
            id="gift"
            kicker={dict.gift.kicker}
            title={dict.gift.title}
            intro={dict.gift.note}
            posy="right"
          >
            {event.giftImageUrl ? (
              <Reveal variant="fade-up">
                <div className="mx-auto mb-10 max-w-[18rem]">
                  <MountedPhoto
                    src={event.giftImageUrl}
                    alt=""
                    ratio={0.8}
                    sizes="(max-width: 460px) 75vw, 288px"
                    natural
                  />
                </div>
              </Reveal>
            ) : null}
            <Gift accounts={event.giftAccounts} address={event.giftAddress} dict={dict} />
          </Section>
        ) : null}

        {interlude(3)}

        <Section ornaments={ornaments} id="wishes" kicker={dict.wishes.kicker} title={dict.wishes.title} posy="left">
          <WishesWall
            eventSlug={event.slug}
            token={guest?.token ?? null}
            defaultName={guest?.householdName ?? ""}
            initialWishes={wishes}
            initialCursor={nextCursor}
            locale={locale}
            dict={dict}
          />
        </Section>

        {/* Closing, set like the last page of a letter: generous whitespace,
            a signature, and a fleuron to end on. */}
        <section className="relative isolate overflow-hidden bg-olive-deep px-8 pb-24 pt-24 text-center">
          <ornaments.Backdrop tone="olive" />
          {event.closingPhotoUrl ? (
            <Reveal variant="fade-up">
              <div className="mx-auto mb-12 max-w-[18rem]">
                <Photo
                  src={event.closingPhotoUrl}
                  alt=""
                  ratio={0.75}
                  frame="arch"
                  sizes="(max-width: 460px) 75vw, 288px"
                  className="border border-cream/25"
                />
              </div>
            </Reveal>
          ) : null}

          <Reveal variant="zoom-in">
            <div className="flex justify-center">
              <ornaments.Crest width={170} height={62} />
            </div>
          </Reveal>

          <Reveal variant="fade-up" delay={140}>
            <p className="kicker mt-10 text-peach">{dict.closing.thanks}</p>
            <p className="mx-auto mt-7 max-w-[32ch] font-body text-[17px] leading-loose text-cream/80">
              {closingNote}
            </p>
          </Reveal>

          <Reveal variant="fade-up" delay={280}>
            <span className="mx-auto mt-14 block h-px w-12 bg-cream/25" />
            <p className="kicker mt-8 text-cream/70">{dict.closing.withLove}</p>
            <p className="display names mt-5 [--names-size:44px] leading-tight text-cream">
              {coupleLine(event)}
            </p>
            <p className="mt-5 font-ui text-[11px] tracking-[0.28em] text-cream/70">
              {formatHeroDate(event.headlineDate, event.timezone)}
            </p>
            {event.hashtag ? (
              <p className="mt-3 font-ui text-[11px] tracking-[0.24em] text-cream/70">
                {event.hashtag}
              </p>
            ) : null}
            {/* Fleuron. Kept on a generic serif stack because the display face
                does not carry U+2766. */}
            <p
              className="mt-12 font-[Georgia,'Times_New_Roman',serif] text-[30px] leading-none text-peach-ink"
              aria-hidden="true"
            >
              &#10086;
            </p>
          </Reveal>
        </section>
      </InvitationShell>
    </main>
  );
}

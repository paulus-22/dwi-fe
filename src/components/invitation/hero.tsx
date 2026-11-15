import type { OrnamentSet } from "@/components/motif";
import type { Dictionary } from "@/i18n/dictionaries";

import { Parallax } from "./parallax";
import { Photo } from "./photo";
import { Reveal } from "./reveal";

/** First band after the envelope: names large, hashtag beneath. */
export function Hero({
  brideName,
  groomName,
  hashtag,
  photoUrl,
  dict,
  ornaments,
}: {
  brideName: string;
  groomName: string;
  hashtag: string | null;
  /** Couple portrait, shown under the names in an arched mount. */
  photoUrl: string | null;
  dict: Dictionary;
  ornaments: OrnamentSet;
}) {
  const { Backdrop, Crest, Spray } = ornaments;
  return (
    <section className="safe-area relative isolate overflow-hidden bg-paper px-7 pb-16 pt-20 text-center">
      <Backdrop tone="paper" />
      <Parallax offset={26} className="pointer-events-none absolute -left-20 -top-10 block">
        <Spray className="float-slow opacity-80" width={190} height={257} />
      </Parallax>
      <Parallax offset={-22} className="pointer-events-none absolute -right-20 -bottom-10 block">
        <Spray
          className="float-slower rotate-180 opacity-80"
          width={190}
          height={257}
          mirrored
        />
      </Parallax>

      <div className="relative">
        <Reveal variant="zoom-in">
          <div className="flex justify-center">
            <Crest width={210} height={82} />
          </div>
        </Reveal>

        <Reveal variant="fade-up" delay={140}>
          <p className="kicker mt-4 text-peach-ink">{dict.hero.kicker}</p>
        </Reveal>

        <Reveal variant="fade-up" delay={260}>
          <p className="display names mt-6 [--names-size:52px] text-names-ink">{brideName}</p>
        </Reveal>
        <Reveal variant="fade-up" delay={340}>
          <p className="my-1 font-body text-lg italic text-peach-ink">&amp;</p>
        </Reveal>
        <Reveal variant="fade-up" delay={420}>
          <p className="display names [--names-size:52px] text-names-ink">{groomName}</p>
        </Reveal>

        {photoUrl ? (
          <Reveal variant="fade-up" delay={520}>
            <div className="mx-auto mt-10 max-w-[17rem]">
              {/* The portrait is the one image above the fold, so it loads
                  eagerly; everything further down lazily. */}
              <Photo
                src={photoUrl}
                alt=""
                ratio={0.72}
                frame="arch"
                // A longer arch: the photo keeps its own shape, with room
                // above it so the round top passes over the heads.
                natural
                headroom={0.22}
                priority
                sizes="(max-width: 460px) 70vw, 272px"
                className="border border-champagne"
              />
            </div>
          </Reveal>
        ) : null}

        {hashtag ? (
          <Reveal variant="fade-up" delay={photoUrl ? 640 : 520}>
            <p className="mt-6 font-ui text-[11px] tracking-[0.24em] text-peach-ink">
              {hashtag}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

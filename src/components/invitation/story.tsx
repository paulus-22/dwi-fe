import type { AppLocale } from "@/i18n/dictionaries";
import { pick } from "@/i18n/locale";
import type { PublicEvent } from "@/lib/event";

import { MountedPhoto } from "./photo";
import { Reveal } from "./reveal";

/**
 * Love-story timeline. The rule down the left draws itself as the section
 * enters view, then each milestone fades up behind it.
 */
export function Story({
  milestones,
  locale,
}: {
  milestones: PublicEvent["milestones"];
  locale: AppLocale;
}) {
  if (milestones.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-[24rem] pl-8">
      {/* The rule spans the whole list and draws itself downward on reveal. */}
      <Reveal
        as="span"
        variant="grow-y"
        className="absolute bottom-8 left-[3px] top-2 block w-px bg-champagne"
      >
        <span className="sr-only" />
      </Reveal>

      <ol className="space-y-11">
        {milestones.map((milestone, index) => {
          const title = pick(locale, milestone.titleId, milestone.titleEn);
          const body = pick(locale, milestone.bodyId, milestone.bodyEn);
          // Told by the photo alone: it takes the whole column, since there
          // is no paragraph for it to sit beside.
          const photoOnly = !title && !body;

          return (
            <Reveal key={milestone.id} as="li" variant="fade-up" delay={index * 120}>
              <span className="absolute -ml-8 mt-2.5 block size-[7px] rounded-full bg-peach" />
              {milestone.periodLabel ? (
                <p className="kicker text-peach-ink">{milestone.periodLabel}</p>
              ) : null}
              {title ? (
                <h3 className="display mt-2.5 text-[27px] leading-tight text-ink">{title}</h3>
              ) : null}
              {body ? (
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{body}</p>
              ) : null}
              {milestone.photoUrl ? (
                // With text, narrower than the column: a milestone is a
                // paragraph with a picture beside it, not a picture with a caption.
                <div
                  className={
                    photoOnly
                      ? milestone.periodLabel ? "mt-3" : ""
                      : "mt-4 max-w-[13.5rem]"
                  }
                >
                  <MountedPhoto
                    src={milestone.photoUrl}
                    alt=""
                    ratio={0.82}
                    sizes={photoOnly ? "(max-width: 460px) 80vw, 352px" : "(max-width: 460px) 50vw, 216px"}
                    natural
                  />
                </div>
              ) : null}
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}

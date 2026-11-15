import type { AppLocale } from "@/i18n/dictionaries";
import { pick } from "@/i18n/locale";
import type { PublicEvent } from "@/lib/event";

import { Reveal } from "./reveal";

/** Reception timeline: a rail of times down the left, events to the right. */
export function Rundown({
  items,
  locale,
}: {
  items: PublicEvent["rundown"];
  locale: AppLocale;
}) {
  if (items.length === 0) return null;

  return (
    <ol className="relative mx-auto max-w-[19rem] border-l border-cream/25 pl-6">
      {items.map((item, index) => (
        <Reveal
          key={item.id}
          as="li"
          variant="fade-up"
          delay={index * 80}
          className="relative pb-7 last:pb-0"
        >
          <span className="absolute -left-[26.5px] top-2 size-[7px] rounded-full bg-cream/70" />
          <p className="font-ui text-[11px] tracking-[0.2em] text-cream/60">
            {item.timeLabel}
          </p>
          <p className="mt-1 font-body text-[16px] text-cream">
            {pick(locale, item.titleId, item.titleEn)}
          </p>
        </Reveal>
      ))}
    </ol>
  );
}

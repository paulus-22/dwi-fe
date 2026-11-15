import type { OrnamentSet } from "@/components/motif";
import type { Dictionary } from "@/i18n/dictionaries";

import { Reveal } from "./reveal";

type Person = {
  fullName: string;
  parents: string | null;
  instagram: string | null;
};

/** Bride and groom, each with parentage and an optional Instagram handle. */
export function Couple({
  bride,
  groom,
  dict,
  ornaments,
}: {
  bride: Person;
  groom: Person;
  dict: Dictionary;
  ornaments: OrnamentSet;
}) {
  return (
    <div className="space-y-2">
      <Profile person={bride} role={dict.couple.bride} delay={0} Sprig={ornaments.Sprig} />

      <Reveal variant="zoom-in" delay={120}>
        <p className="py-2 text-center font-body text-2xl italic text-peach-ink">&amp;</p>
      </Reveal>

      <Profile person={groom} role={dict.couple.groom} delay={120} Sprig={ornaments.Sprig} />
    </div>
  );
}

function Profile({
  person,
  role,
  delay,
  Sprig,
}: {
  person: Person;
  role: string;
  delay: number;
  Sprig: OrnamentSet["Sprig"];
}) {
  return (
    <div className="text-center">
      <Reveal variant="fade-up" delay={delay}>
        <div className="flex justify-center">
          <Sprig width={26} height={34} />
        </div>
        <p className="kicker mt-2 text-peach-ink">{role}</p>
        <h3 className="display names mt-3 [--names-size:32px] text-names-ink">{person.fullName}</h3>
        {person.parents ? (
          // One line whenever the column allows: a 30ch cap used to split
          // "Bapak X & Ibu Y" across two lines even with room to spare. If a
          // very long parentage must wrap on a narrow phone, balance it rather
          // than leaving one or two words orphaned.
          <p className="mx-auto mt-3 text-balance text-[14px] leading-relaxed text-ink-soft">
            {person.parents}
          </p>
        ) : null}
        {person.instagram ? (
          <a
            href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 font-ui text-[11px] tracking-[0.14em] text-peach-ink"
          >
            <InstagramGlyph />
            {person.instagram.startsWith("@") ? person.instagram : `@${person.instagram}`}
          </a>
        ) : null}
      </Reveal>
    </div>
  );
}

function InstagramGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

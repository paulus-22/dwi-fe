import type { OrnamentSet } from "@/components/motif";

import { Reveal } from "./reveal";

/** Opening epigraph, set on the deep-olive band. */
export function Quote({
  text,
  author,
  ornaments,
}: {
  text: string;
  author: string | null;
  ornaments: OrnamentSet;
}) {
  if (!text) return null;
  const { Backdrop } = ornaments;

  return (
    <section className="relative isolate overflow-hidden bg-olive-deep px-9 py-20 text-center">
      <Backdrop tone="olive" />
      <Reveal variant="fade-up">
        <p className="font-body text-[19px] italic leading-relaxed text-cream">
          &ldquo;{text}&rdquo;
        </p>
      </Reveal>
      {author ? (
        <Reveal variant="fade-up" delay={180}>
          <p className="kicker mt-6 text-cream/70">— {author}</p>
        </Reveal>
      ) : null}
    </section>
  );
}

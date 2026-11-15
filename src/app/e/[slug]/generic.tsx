import { editorialMarks, editorialNavLabel, GenericBlock, type BlockContext } from "@/components/generic/blocks";
import { getDictionary } from "@/i18n/dictionaries";
import { ApiError, publicApi } from "@/lib/api";
import { genericThemeStyle, resolveGenericTheme } from "@/lib/generic-themes";
import type { FormField } from "@/lib/builder";
import { resolveGuest, type PublicGenericEvent } from "@/lib/event";
import { isPreviewMode } from "@/lib/preview";
import type { PublicTicketType } from "@/lib/tickets";

/** Public page for GENERIC events: the organizer's page blocks, in order. */
export async function GenericInvitation({
  event,
  query,
}: {
  event: PublicGenericEvent;
  query: Record<string, string | string[] | undefined>;
}) {
  const blocks = event.pageBlocks.filter((b) => b.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

  const token = typeof query.to === "string" ? query.to : undefined;
  const guest = await resolveGuest(event.slug, token);

  // Only fetch the form definition if a block will actually show it.
  let formFields: FormField[] = [];
  if (!isPreviewMode() && blocks.some((b) => b.blockType === "REGISTRATION_FORM")) {
    try {
      ({ fields: formFields } = await publicApi<{ fields: FormField[] }>(
        `/v1/public/events/${encodeURIComponent(event.slug)}/form-fields`,
      ));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e; // an API error just hides the form
    }
  }

  // Ticket types switch on self-registration; only needed without a personal link.
  let ticketTypes: PublicTicketType[] = [];
  if (!guest && !isPreviewMode() && blocks.some((b) => b.blockType === "REGISTRATION_FORM")) {
    try {
      ({ ticketTypes } = await publicApi<{ ticketTypes: PublicTicketType[] }>(
        `/v1/public/events/${encodeURIComponent(event.slug)}/ticket-types`,
      ));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
  }

  const theme = resolveGenericTheme(event.theme);
  const editorial = theme.key === "editorial";
  const rsvp = blocks.some((b) => b.blockType === "RSVP_FORM");
  const registration = blocks.some((b) => b.blockType === "REGISTRATION_FORM");
  const cta = rsvp
    ? { href: "#rsvp", label: "Konfirmasi Kehadiran" }
    : registration
      ? { href: "#pendaftaran", label: "Daftar Sekarang" }
      : null;
  const ctx: BlockContext = {
    event,
    theme,
    dict: getDictionary("id"),
    guest,
    formFields,
    ticketTypes,
    cta,
    marks: editorial ? editorialMarks(blocks) : undefined,
  };

  if (editorial) {
    // Full-bleed sections (each caps its own content at the theme column); every
    // block sits in an anchor wrapper so the sticky nav can jump to it.
    const navLinks = blocks.flatMap((b) => {
      const label = ctx.marks?.[b.id] ? editorialNavLabel(b) : null;
      return label ? [{ id: b.id, label }] : [];
    });
    return (
      <main data-gtheme={theme.key} style={genericThemeStyle(theme)} className="min-h-dvh scroll-smooth bg-[var(--g-paper)]">
        <nav aria-label="Navigasi halaman" className="sticky top-0 z-30 border-b border-white/10 bg-[#112235]/95 text-white backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-5 px-6 sm:px-12">
            <a href="#atas" className="max-w-[34%] shrink-0 truncate text-sm sm:max-w-[45%] font-bold tracking-[-0.01em]">
              {event.title}
            </a>
            <ul className="gt-mono flex min-w-0 gap-4 overflow-x-auto !text-[10px] whitespace-nowrap text-white/80 sm:gap-7 sm:!text-[11px]">
              {navLinks.map((l) => (
                <li key={l.id}>
                  <a href={`#blk-${l.id}`} className="py-4 hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        {blocks.length === 0 ? (
          <p className="px-6 py-24 text-center text-admin-muted">Halaman ini belum memiliki konten.</p>
        ) : (
          blocks.map((b) => (
            <div key={b.id} id={`blk-${b.id}`} className="scroll-mt-14">
              <GenericBlock block={b} ctx={ctx} />
            </div>
          ))
        )}
      </main>
    );
  }

  return (
    <main data-gtheme={theme.key} style={genericThemeStyle(theme)} className="min-h-dvh scroll-smooth bg-[#e9e9e7] sm:py-6">
      <div
        className="mx-auto w-full overflow-hidden bg-[var(--g-paper)] shadow-[0_0_40px_#101c2c12] sm:rounded-lg"
        style={{ maxWidth: theme.column }}
      >
        {blocks.length === 0 ? (
          <p className="px-5 py-24 text-center text-admin-muted">Halaman ini belum memiliki konten.</p>
        ) : (
          blocks.map((b) => <GenericBlock key={b.id} block={b} ctx={ctx} />)
        )}
      </div>
    </main>
  );
}

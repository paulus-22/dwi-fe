import { GenericBlock, type BlockContext } from "@/components/generic/blocks";
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
  };

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

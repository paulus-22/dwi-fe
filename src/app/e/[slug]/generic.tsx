import { GenericBlock, type BlockContext } from "@/components/generic/blocks";
import { getDictionary } from "@/i18n/dictionaries";
import { ApiError, publicApi } from "@/lib/api";
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

  const ctx: BlockContext = { event, dict: getDictionary("id"), guest, formFields, ticketTypes };

  return (
    <main className="min-h-dvh bg-surface pb-16">
      {blocks.length === 0 ? (
        <p className="px-5 py-24 text-center text-admin-muted">Halaman ini belum memiliki konten.</p>
      ) : (
        blocks.map((b) => <GenericBlock key={b.id} block={b} ctx={ctx} />)
      )}
    </main>
  );
}

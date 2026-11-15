import Link from "next/link";

import { PageTitle } from "@/components/ui";
import { api, ApiError, eventName } from "@/lib/api";
import type { AllowlistEntry, RegistrationMode, TicketType } from "@/lib/tickets";

import { requireGenericEvent } from "../generic-event";
import { TicketManager } from "./ticket-manager";

export const metadata = { title: "Jenis tiket · The Moments by Bizzmo" };

/** Admin event payloads don't carry the mode; a published event exposes it publicly. */
async function currentMode(slug: string): Promise<RegistrationMode | null> {
  try {
    const raw = await api<{ event?: { registrationMode?: RegistrationMode } }>(`/v1/public/events/${encodeURIComponent(slug)}`, {
      anonymous: true,
    });
    return raw.event?.registrationMode ?? null;
  } catch (e) {
    if (e instanceof ApiError) return null;
    throw e;
  }
}

export default async function TicketsPage({ params }: PageProps<"/admin/events/[id]/tickets">) {
  const { id } = await params;
  const event = await requireGenericEvent(id);
  const [{ ticketTypes }, allowlist, mode] = await Promise.all([
    api<{ ticketTypes: TicketType[] }>(`/v1/events/${id}/ticket-types`),
    // A failing allowlist read shouldn't take the whole page (and ticket types) down with it.
    api<{ entries: AllowlistEntry[] }>(`/v1/events/${id}/allowlist`).then(
      (r) => ({ entries: r.entries, error: null as string | null }),
      (e) => {
        if (e instanceof ApiError) return { entries: [] as AllowlistEntry[], error: e.message };
        throw e;
      },
    ),
    currentMode(event.slug),
  ]);

  return (
    <>
      <PageTitle kicker={eventName(event)} title="Jenis tiket">
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>
      <TicketManager eventId={id} ticketTypes={ticketTypes} entries={allowlist.entries} entriesError={allowlist.error} mode={mode} />
    </>
  );
}

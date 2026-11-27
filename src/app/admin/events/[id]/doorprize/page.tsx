import Link from "next/link";

import { PageTitle } from "@/components/ui";
import { api, canManage, eventName, type EventItem } from "@/lib/api";
import type { DoorprizeState } from "@/lib/doorprize-types";

import { DoorprizeWheel } from "./wheel";

export default async function DoorprizePage({ params }: PageProps<"/admin/events/[id]/doorprize">) {
  const { id } = await params;
  const [{ event }, doorprize] = await Promise.all([
    api<{ event: EventItem }>(`/v1/events/${id}`),
    api<DoorprizeState>(`/v1/events/${id}/doorprize`),
  ]);

  return (
    <>
      <PageTitle kicker={eventName(event)} title="Undian Doorprize">
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted transition-colors hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>

      <DoorprizeWheel
        eventId={id}
        eventTitle={eventName(event)}
        dateLabel={event.dateLabel}
        canEdit={canManage(event.role)}
        initial={doorprize}
      />
    </>
  );
}

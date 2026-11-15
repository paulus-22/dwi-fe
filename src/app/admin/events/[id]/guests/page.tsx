import { notFound } from "next/navigation";
import Link from "next/link";

import { PageTitle } from "@/components/ui";
import { api, ApiError, canManage, eventKind, eventName, type EventItem } from "@/lib/api";
import type { GuestItem } from "@/lib/guests";

import { GuestManager } from "./guest-manager";

export const metadata = { title: "Tamu · The Moments by Bizzmo" };

export default async function GuestsPage({ params }: PageProps<"/admin/events/[id]/guests">) {
  const { id } = await params;
  let event: EventItem;
  try {
    ({ event } = await api<{ event: EventItem }>(`/v1/events/${id}`));
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
  // Works for WEDDING and GENERIC alike; only viewers without manage rights get a 404.
  if (!canManage(event.role)) notFound();
  const { guests } = await api<{ guests: GuestItem[] }>(`/v1/events/${id}/guests`);
  const generic = eventKind(event) === "GENERIC";

  return (
    <>
      <PageTitle kicker={eventName(event)} title={generic ? "Peserta" : "Tamu"}>
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>
      <GuestManager eventId={id} slug={event.slug} guests={guests} noun={generic ? "peserta" : "tamu"} />
    </>
  );
}

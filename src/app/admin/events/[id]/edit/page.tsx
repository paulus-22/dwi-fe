import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/admin/event-form";
import { PageTitle } from "@/components/ui";
import { api, ApiError, eventKind, eventName, type EventItem } from "@/lib/api";
import { toLocalInput, type EventDefaults } from "@/lib/event-form";

import { updateEvent } from "./actions";

export const metadata = { title: "Edit acara · The Moments by Bizzmo" };

type Detail = Omit<EventDefaults, "dressCodeColors" | "interludePhotos" | "headlineDate"> & {
  headlineDate: string;
  dressCodeColors: string[];
  interludePhotos: string[];
};

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]/edit">) {
  const { id } = await params;
  let res: { event: EventItem; detail: Detail };
  try {
    res = await api(`/v1/events/${id}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
  const { event, detail } = res;
  if (event.role !== "OWNER") notFound();

  const kind = eventKind(event);
  const timezone = detail.timezone ?? "Asia/Jakarta";
  const defaults: EventDefaults = {
    ...detail,
    title: event.title,
    subtitle: event.subtitle,
    // NOTE: the API currently returns neither brideFullName nor groomFullName
    // (not in `event`, not in `detail`), so those two inputs open empty unless
    // `detail` starts carrying them (spread above).
    brideShortName: event.brideShortName,
    groomShortName: event.groomShortName,
    hashtag: event.hashtag,
    status: event.status,
    headlineDate: toLocalInput(detail.headlineDate, timezone),
    dressCodeColors: detail.dressCodeColors.join(", "),
    interludePhotos: detail.interludePhotos.join("\n"),
  };

  return (
    <>
      <PageTitle kicker="Edit acara" title={eventName(event)}>
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted transition-colors hover:text-admin-ink">
          ← Kembali ke acara
        </Link>
      </PageTitle>
      <EventForm
        kind={kind}
        action={updateEvent.bind(null, id, kind)}
        defaults={defaults}
        submitLabel="Simpan perubahan"
        pendingLabel="Menyimpan…"
      />
    </>
  );
}

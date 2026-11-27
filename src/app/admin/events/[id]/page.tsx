import { Card, LinkButton, PageTitle, Stat, formatTime } from "@/components/ui";
import { api, canManage, eventKind, eventName, type Attendance, type EventItem } from "@/lib/api";

import { DeleteEventButton } from "./edit/delete-button";
import { LiveFeed } from "./live-feed";

export default async function EventDashboard({ params }: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const [{ event }, att] = await Promise.all([
    api<{ event: EventItem }>(`/v1/events/${id}`),
    api<Attendance>(`/v1/events/${id}/attendance`),
  ]);
  const pct = att.expectedPeople > 0 ? Math.round((att.checkedInPeople / att.expectedPeople) * 100) : 0;
  const avgPeople =
    att.checkedInHouseholds > 0 ? (att.checkedInPeople / att.checkedInHouseholds).toFixed(1) : "0";

  return (
    <>
      <PageTitle kicker={event.dateLabel} title={eventName(event)}>
        {canManage(event.role) ? (
          <div className="flex flex-wrap gap-2">
            {eventKind(event) === "GENERIC" ? (
              <>
                <LinkButton variant="secondary" href={`/admin/events/${id}/form`}>
                  Form pendaftaran
                </LinkButton>
                <LinkButton variant="secondary" href={`/admin/events/${id}/blocks`}>
                  Blok halaman
                </LinkButton>
                <LinkButton variant="secondary" href={`/admin/events/${id}/tickets`}>
                  Jenis tiket
                </LinkButton>
              </>
            ) : null}
            <LinkButton variant="secondary" href={`/admin/events/${id}/guests`}>
              Tamu/Peserta
            </LinkButton>
            <LinkButton variant="secondary" href={`/admin/events/${id}/scanner`}>
              Perangkat scanner
            </LinkButton>
            {event.role === "OWNER" ? (
              <>
                <LinkButton variant="secondary" href={`/admin/events/${id}/edit`}>
                  Edit acara
                </LinkButton>
                <DeleteEventButton id={id} kind={eventKind(event)} />
              </>
            ) : null}
          </div>
        ) : null}
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="QR/Tiket discan" value={att.checkedInHouseholds} sub={`${att.totalScans} scan · ${att.repeatScans} ulang`} />
        <Stat label="Orang hadir" value={att.checkedInPeople} sub={`rata-rata ${avgPeople} orang/tiket · ${pct}% dari konfirmasi`} />
        <Stat label="Konfirmasi hadir" value={att.attendingHouseholds} sub={`dari ${att.households} undangan`} />
        <Stat label="Scan ulang" value={att.repeatScans} sub="tiket yang discan lagi, tak dihitung ganda" />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-border" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <LiveFeed eventId={id} />
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-medium">Per pintu</h2>
            {att.byDevice.length === 0 ? (
              <p className="text-sm text-admin-muted">Belum ada check-in.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {att.byDevice.map((d) => (
                  <li key={d.deviceName} className="flex justify-between gap-3">
                    <span>{d.deviceName}</span>
                    <span className="tabular-nums">{d.checkIns}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-medium">Kedatangan terakhir</h2>
            {att.recent.length === 0 ? (
              <p className="text-sm text-admin-muted">Belum ada tamu.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {att.recent.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {r.householdName ?? r.code}
                      {r.memberName ? <span className="text-admin-muted"> · {r.memberName}</span> : null}
                    </span>
                    <span className="shrink-0 text-admin-muted tabular-nums">
                      {r.headcount} org · {formatTime(r.occurredAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

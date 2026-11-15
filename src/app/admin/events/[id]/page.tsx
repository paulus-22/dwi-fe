import Link from "next/link";

import { Card, PageTitle, Stat, formatTime } from "@/components/ui";
import { api, canManage, eventKind, eventName, type Attendance, type EventItem } from "@/lib/api";

import { LiveFeed } from "./live-feed";

const navLink =
  "inline-flex h-10 items-center rounded-[var(--radius-control)] border border-panel-border bg-panel px-4 text-sm font-medium hover:bg-panel-hover";

export default async function EventDashboard({ params }: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const [{ event }, att] = await Promise.all([
    api<{ event: EventItem }>(`/v1/events/${id}`),
    api<Attendance>(`/v1/events/${id}/attendance`),
  ]);
  const pct = att.expectedPeople > 0 ? Math.round((att.checkedInPeople / att.expectedPeople) * 100) : 0;

  return (
    <>
      <PageTitle kicker={event.dateLabel} title={eventName(event)}>
        {canManage(event.role) ? (
          <div className="flex flex-wrap gap-2">
            {eventKind(event) === "GENERIC" ? (
              <>
                <Link href={`/admin/events/${id}/form`} className={navLink}>
                  Form pendaftaran
                </Link>
                <Link href={`/admin/events/${id}/blocks`} className={navLink}>
                  Blok halaman
                </Link>
              </>
            ) : null}
            <Link href={`/admin/events/${id}/scanner`} className={navLink}>
              Perangkat scanner
            </Link>
          </div>
        ) : null}
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tamu hadir" value={att.checkedInPeople} sub={`dari ${att.expectedPeople} konfirmasi · ${pct}%`} />
        <Stat label="Undangan check-in" value={att.checkedInHouseholds} sub={`dari ${att.households} undangan`} />
        <Stat label="Konfirmasi hadir" value={att.attendingHouseholds} sub="undangan" />
        <Stat label="Scan ulang" value={att.repeatScans} sub="tamu yang sama, dihitung sekali" />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-border" aria-hidden>
        <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
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
                  <li key={r.id} className="flex justify-between gap-3">
                    <span className="truncate">{r.householdName ?? r.code}</span>
                    <span className="shrink-0 text-admin-muted tabular-nums">{formatTime(r.occurredAt)}</span>
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

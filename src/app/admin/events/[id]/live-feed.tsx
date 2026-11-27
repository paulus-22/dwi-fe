"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Scan = {
  type: "scan";
  id: string;
  activity: "CHECK_IN" | "PHOTO" | "GUESTBOOK" | "SOUVENIR";
  code: string;
  householdName: string | null;
  headcount: number | null;
  occurredAt: string;
  deviceName: string;
  override: boolean;
  /** GROUP check-in: which member arrived (usher-typed). */
  memberName?: string | null;
};

type Status = "connecting" | "live" | "offline";

const ACTIVITY: Record<Scan["activity"], string> = {
  CHECK_IN: "check-in",
  PHOTO: "foto",
  GUESTBOOK: "buku tamu",
  SOUVENIR: "souvenir",
};

const TIME = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Jakarta",
});

/**
 * Listens to the event's live stream. Each scan shows up in the feed at once,
 * and the server-rendered numbers refresh (debounced) so totals never drift
 * from what the API computes.
 */
export function LiveFeed({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");
  const [feed, setFeed] = useState<Scan[]>([]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 800);
    };
    const source = new EventSource(`/api/live/${eventId}`);
    source.addEventListener("ready", () => {
      setStatus("live");
      refresh(); // catch anything missed while (re)connecting
    });
    source.addEventListener("scan", (e) => {
      const scan = JSON.parse((e as MessageEvent<string>).data) as Scan;
      setFeed((prev) => [scan, ...prev.filter((s) => s.id !== scan.id)].slice(0, 30));
      if (scan.activity === "CHECK_IN") refresh();
    });
    source.addEventListener("resync", refresh);
    source.onerror = () => setStatus("offline"); // EventSource retries on its own
    return () => {
      source.close();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [eventId, router]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Aktivitas langsung</h2>
        <span className="flex items-center gap-2 text-sm text-admin-muted" aria-live="polite">
          <span
            className={`size-2 rounded-full ${
              status === "live" ? "animate-pulse bg-ok" : status === "connecting" ? "bg-accent" : "bg-danger"
            }`}
          />
          {status === "live" ? "Terhubung" : status === "connecting" ? "Menghubungkan…" : "Terputus, mencoba lagi…"}
        </span>
      </div>
      {feed.length === 0 ? (
        <p className="text-sm text-admin-muted">Belum ada aktivitas sejak halaman ini dibuka.</p>
      ) : (
        <ul className="divide-y divide-panel-border">
          {feed.map((s) => {
            const detail =
              s.activity === "CHECK_IN"
                ? s.memberName
                  ? `Anggota: ${s.memberName}`
                  : "Check-in"
                : ACTIVITY[s.activity];
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">
                    <span className="font-medium">{s.householdName ?? "(tamu luar)"}</span>
                    {s.activity === "CHECK_IN" ? (
                      <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-xs text-accent">
                        #{s.code}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-admin-muted">
                    {detail}
                    {s.override ? " · manual" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {s.activity === "CHECK_IN" ? (
                    <span className="block">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium tabular-nums text-accent">
                        {s.headcount ?? 1} org
                      </span>
                    </span>
                  ) : null}
                  <span className="block text-xs text-admin-muted tabular-nums">
                    {s.deviceName} · {TIME.format(new Date(s.occurredAt))}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

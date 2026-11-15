import Link from "next/link";

import { Button, Card, PageTitle, formatDateTime } from "@/components/ui";
import { api, eventName, type Device, type EventItem, type PairingCode } from "@/lib/api";

import { createPairingCode, revokeDevice, revokePairingCode } from "./actions";

export default async function ScannerDevicesPage({ params }: PageProps<"/admin/events/[id]/scanner">) {
  const { id } = await params;
  const [{ event }, { codes }, { devices }] = await Promise.all([
    api<{ event: EventItem }>(`/v1/events/${id}`),
    api<{ codes: PairingCode[] }>(`/v1/events/${id}/pairing-codes`),
    api<{ devices: Device[] }>(`/v1/events/${id}/devices`),
  ]);
  const scannerUrl = process.env.NEXT_PUBLIC_SCANNER_URL;

  return (
    <>
      <PageTitle kicker={eventName(event)} title="Perangkat scanner">
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">Kode pairing</h2>
          <p className="mt-1 mb-4 text-sm text-admin-muted">
            Buka aplikasi scanner{scannerUrl ? ` (${scannerUrl})` : ""} di tablet pintu, pilih <em>Kode acara</em>, lalu
            ketik kode ini. Satu kode bisa dipakai untuk semua pintu dan berlaku 24 jam.
          </p>
          <form action={createPairingCode.bind(null, id)} className="mb-5 flex gap-2">
            <input
              name="label"
              placeholder="Catatan (mis. Hari H)"
              maxLength={60}
              className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-panel-border px-3 text-sm outline-none focus:border-gold"
            />
            <Button type="submit">Buat kode</Button>
          </form>
          {codes.length === 0 ? (
            <p className="text-sm text-admin-muted">Belum ada kode aktif.</p>
          ) : (
            <ul className="space-y-3">
              {codes.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-gold-line bg-gold-soft px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-2xl tracking-[0.12em] select-all">{c.code}</p>
                    <p className="text-xs text-admin-muted">
                      {c.label ? `${c.label} · ` : ""}berlaku s.d. {formatDateTime(c.expiresAt)} · dipakai {c.uses}×
                    </p>
                  </div>
                  <form action={revokePairingCode.bind(null, id, c.id)}>
                    <Button type="submit" variant="danger">
                      Cabut
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Perangkat terpasang</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-admin-muted">Belum ada perangkat.</p>
          ) : (
            <ul className="divide-y divide-panel-border">
              {devices.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className={d.revokedAt ? "opacity-50" : ""}>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-admin-muted">
                      {d.checkIns} check-in ·{" "}
                      {d.revokedAt
                        ? `dilepas ${formatDateTime(d.revokedAt)}`
                        : d.lastSeenAt
                          ? `terakhir aktif ${formatDateTime(d.lastSeenAt)}`
                          : `terpasang ${formatDateTime(d.pairedAt)}`}
                      {Math.abs(d.clockOffsetMs) > 60_000 && !d.revokedAt
                        ? ` · jam perangkat selisih ${Math.round(d.clockOffsetMs / 60_000)} menit`
                        : ""}
                    </p>
                  </div>
                  {d.revokedAt ? null : (
                    <form action={revokeDevice.bind(null, id, d.id)}>
                      <Button type="submit" variant="ghost">
                        Lepas
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

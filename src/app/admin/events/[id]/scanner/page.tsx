import Link from "next/link";

import { Button, Card, PageTitle, formatDateTime, inputCls } from "@/components/ui";
import { api, eventName, type Device, type EventItem, type PairingCode } from "@/lib/api";
import { GreetingUpload } from "@/components/admin/greeting-upload";
import { SlideshowUpload } from "@/components/admin/slideshow-upload";

import { createPairingCode, revokeDevice, revokePairingCode } from "./actions";
import { removeSlide } from "./slideshow-actions";

export default async function ScannerDevicesPage({ params }: PageProps<"/admin/events/[id]/scanner">) {
  const { id } = await params;
  const [{ event }, { codes }, { devices }, { images, greeting }] = await Promise.all([
    api<{ event: EventItem }>(`/v1/events/${id}`),
    api<{ codes: PairingCode[] }>(`/v1/events/${id}/pairing-codes`),
    api<{ devices: Device[] }>(`/v1/events/${id}/devices`),
    api<{ images: { id: string; url: string; contentType: string }[]; greeting: string | null }>(
      `/v1/events/${id}/slideshow`,
    ).catch(() => ({ images: [], greeting: null })),
  ]);
  const scannerUrl = process.env.NEXT_PUBLIC_SCANNER_URL;

  return (
    <>
      <PageTitle kicker={eventName(event)} title="Perangkat scanner">
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted transition-colors hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">Kode pairing</h2>
          <p className="mt-1 mb-4 text-sm text-admin-muted">
            Buka aplikasi scanner{scannerUrl ? ` (${scannerUrl})` : ""} di tablet pintu, pilih <em>Kode acara</em>, lalu
            ketik kode ini. Setiap kode terikat ke satu pintu — pintunya diatur di sini, jadi di tablet tim cukup
            memasukkan kode.
          </p>
          <form action={createPairingCode.bind(null, id)} className="mb-5 flex flex-col gap-2 sm:flex-row">
            <input
              name="label"
              placeholder="Catatan (opsional)"
              maxLength={60}
              className={`${inputCls} min-w-0 flex-1`}
            />
            <input
              name="gate"
              defaultValue="Pintu Utama"
              placeholder="Pintu (mis. Pintu Utama)"
              maxLength={60}
              aria-label="Nama pintu untuk kode ini"
              className={`${inputCls} min-w-0 flex-none xl:w-48`}
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-accent-line bg-accent-soft px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-2xl tracking-[0.12em] select-all">{c.code}</p>
                    <p className="text-xs text-admin-muted">
                      <span className="font-medium text-admin-ink">{c.gate}</span>
                      {c.label ? ` · ${c.label}` : ""} · berlaku s.d. {formatDateTime(c.expiresAt)} · dipakai {c.uses}×
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
                      <Button type="submit" variant="secondary">
                        Lepas
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium">Backdrop sambutan (TV)</h2>
            <GreetingUpload eventId={id} current={greeting} />
          </div>
          <p className="mb-4 text-sm text-admin-muted">
            Gambar yang tampil di TV/layar greeter di belakang nama tamu saat mereka check-in. Tanpa backdrop, TV
            menampilkan kartu judul.
          </p>
          {greeting ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={greeting} alt="Backdrop sambutan" className="h-40 w-28 rounded-xl border border-panel-border object-cover" />
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium">Slide tampilan (slideshow)</h2>
            <SlideshowUpload eventId={id} onDone={() => {}} />
          </div>
          <p className="mb-4 text-sm text-admin-muted">
            Foto akan tampil bergantian di layar semua perangkat scanner. Diubah ke WebP otomatis saat diunggah.
          </p>
          {images.length === 0 ? (
            <p className="text-sm text-admin-muted">Belum ada slide.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <li key={img.id} className="relative overflow-hidden rounded-xl border border-panel-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="Slide scanner" className="aspect-[3/4] w-full object-cover" />
                  <form action={removeSlide.bind(null, id, img.id)} className="absolute right-1.5 top-1.5">
                    <Button type="submit" variant="danger" className="!h-8 !px-2 text-xs">
                      Hapus
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

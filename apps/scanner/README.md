# Scanner

The usher's door app: scan a guest's QR, check them in, then run the event's
activities (selfie, guestbook, souvenir). It is an installable PWA built with
Vite + React and keeps working with no network.

All data goes through `src/data/api.ts`, which has two modes:

- **Live** (`VITE_API_URL` set): talks to the Rust API (`dwi-api`). Devices pair
  with a code from the dashboard, sync check-ins both ways (other doors' scans
  show up as *Sudah check-in*), and upload selfies to R2.
- **Demo** (`VITE_API_URL` unset): the built-in Alex & Ajeng event, no server.

```bash
cd apps/scanner
bun install
cp .env.example .env.local   # VITE_API_URL=http://localhost:8080 (delete it for demo mode)
bun run dev        # http://localhost:5173, also on your LAN (see note on HTTPS)
bun run build      # static output in dist/, deployable to any static host
bun run preview    # serve the production build, service worker included
```

## Pairing a device

The pairing screen has two tabs.

**Kode acara (event code).**
- Live: the pairing code (`XXXX-XXXX`) an organiser creates in the dashboard
  under *Perangkat scanner*. One code pairs every door for 24 hours; revoking
  a device in the dashboard stops it syncing at once (its data stays on it).
- Demo: `alex-ajeng` (`DEMO-2027` also works); anything else points to CSV import.
- A device paired by CSV has no server token, so it never uploads. Export its
  data from *Lainnya* instead.

**Impor CSV.** Use the admin export, *Kode & QR → unduh csv*. Works with no
internet at all.
1. Pick the file. The device reads it, then shows:
   - totals: guests, attending, declined, pending, and people expected;
   - the code prefix;
   - any skipped rows (bad check character, duplicate code).
2. Confirm the event details, used for the photo frame and the TV wall. The
   couple's names are guessed from the slug in the links
   (`tari-saefulloh` → *Tari & Saefulloh*).
3. Only code, name, category, RSVP and headcount are stored. **Phone numbers
   and links are dropped.**
4. **Re-importing** (*Lainnya → Impor ulang*), e.g. with fresh RSVPs on the
   morning of the wedding, replaces the guest list but keeps every check-in,
   record and photo already made.

### Testing with a real event (e.g. Tari & Saefulloh)

1. In admin, open the event, go to *Kode & QR*, and tap *unduh csv*.
2. Send the CSV to the test phone (AirDrop, WhatsApp to yourself, Drive).
3. In the scanner: *Impor CSV*, pick the file, fill in the date and hashtag,
   then *Gunakan daftar ini*.
4. Scan any of these on a second screen: the e-voucher
   (`/v/tari-saefulloh?to=…`), the printed QR sheet, or a PNG from the zip.
5. At the end: *Lainnya → Check-in CSV* and *Foto ZIP*.
6. Run *Reset perangkat* when done. The guest list stays on the device until
   then.

## Cameras

Each step has its own front/back choice, remembered per device:
- **Scan:** the button next to *Ketik kode*, or *Lainnya → Kamera*.
  - Back (default): the usher points the device at the guest's phone.
  - Front: the tablet sits on a stand and guests hold their QR up to the
    screen. The preview is mirrored, but decoding is not affected.
- **Foto:** the round button next to the shutter.
  - Front (default): guest selfie, mirrored like a mirror.
  - Back: the usher photographs the guest, not mirrored.

## Auto check-in

*Lainnya → Check-in otomatis* turns the door into a fast lane.

- **Green results only.** A confirmed guest on their first visit checks in
  by itself with the RSVP headcount. Amber (already checked in, declined, no
  RSVP) and red (unknown code) always wait for the usher.
- **Delay:** *Langsung* (instant), 2 s or 3 s. During the countdown a green
  bar runs out; tapping *Batal* or changing the headcount stops it, and the
  usher takes over.
- **Lewati aktivitas:** skip the selfie, guestbook and souvenir steps and go
  straight to the welcome screen, then back to scanning.
- When auto is on, the welcome screen returns to scanning after 3 s instead
  of 6, and a *Check-in otomatis* badge shows on the scan screen.

## Text size

*Lainnya → Ukuran teks* (or **Aa** on the pairing screen) scales every text in
the app live: a slider from 90% to 150%, plus presets *Kecil / Normal / Besar
/ Sangat besar*. It is remembered per device. The default (*Normal*, 110%) is
a little larger than before.

All UI font sizes are written as `text-[length:calc(<px>*var(--fs))]`, so new
screens must use the same form to follow the setting. Spacing does not scale,
which keeps buttons on screen on a 360 px phone even at 150%.

## Standby screen (layar jeda)

When nobody is at the door, the scan screen can show a slideshow instead of a
live camera hunting for a code: the couple's names, date, venue and hashtag,
the couple's photos, and the latest guest selfies.

- **Enter standby:**
  - automatically after 30 s / 1 / 2 / 5 minutes without activity (on by
    default, 1 minute); or
  - with the screen button on the scan view.
- **Leave standby:** tap anywhere.
- **Camera while in standby** (*Lainnya → Layar jeda*):
  - *Mati* (default): the camera is off. It saves battery and films nothing.
  - *Tetap scan*: the camera keeps decoding behind the slideshow, so a guest
    holding up a QR checks in without anyone touching the screen. Good for a
    tablet on a stand with the front camera.
- **Couple's photos:** *Lainnya → Layar jeda → Foto mempelai*. Up to 20 are
  stored on the device, resized to ≈300 KB each. Choose whether guest selfies
  join the rotation and how long each slide shows (5 / 8 / 12 s).
- Standby only starts from the idle scan view. It never interrupts a result
  sheet, manual entry or a guest mid-activity.

## Exporting

Nothing syncs to a server yet, so *Lainnya → Ekspor* is how data leaves a
device:
- **Check-in CSV:** time, code, name, category, RSVP, allowance, people who
  came, door, override flag, photo count, guestbook message, souvenir.
- **Foto ZIP:** every framed selfie, named `001_1302_Nama Tamu.jpg`.

With several doors, each device exports its own files. Sort by time to merge.

## Demo script (Alex & Ajeng)

1. **Pair** with code `alex-ajeng`, pick a door, then *Hubungkan*.
2. On a **second device**, open `/#/passes`. Tap a card to enlarge its QR.
3. **Scan** it with the first device:
   - **Green:** confirmed guest. Adjust the headcount and tap *Check-in*.
   - **Amber:** already checked in (Bapak & Ibu Hartono and Sekar Ayu were
     pre-checked at "Pintu Samping"), declined, or no RSVP. The usher
     decides, and an override is recorded.
   - **Red:** a code from another event (the last card), or a typo in manual
     entry.
4. **Activities:** selfie (3‑2‑1 countdown, framed), guestbook (message and
   signature), souvenir.
5. **Tamu:** live arrival stats and a searchable list. Tap a guest to check
   them in manually.
6. **Galeri**, then **Layar:** the TV wall.
7. **Lainnya:**
   - reorder, disable or require activities;
   - *Simulasi offline*;
   - export;
   - *Reset perangkat*.

## Camera needs HTTPS

Browsers only allow the camera on `https://` or `localhost`. To use a phone:

- **Quick, no account:** `cloudflared tunnel --url http://localhost:5173`
  prints an `https://….trycloudflare.com` link to open on the phone.
- **Stable link:** run `bun run build`, then deploy `dist/` to any static host
  (Cloudflare Pages, Vercel, Netlify). It is plain static files.

If the camera is blocked, manual entry still works. The selfie step falls back
to the phone's own camera app.

## Status against the Rust API

| Piece | State |
| --- | --- |
| Pair with a dashboard code, download the guest snapshot | Done (`POST /v1/devices/pair`, `GET /v1/events/:id/snapshot`) |
| Outbox sync, idempotent on client ids, with clock-skew correction | Done (`POST /v1/sync`) |
| Other doors' check-ins pulled by cursor → *Sudah check-in* | Done |
| Selfie upload: presign → PUT to R2 → register | Done in code (`POST /v1/uploads/presign`, `POST /v1/photos`); not yet run against a real R2 bucket |
| Wall showing every door's photos (`GET /v1/events/:id/photos`) | API ready; the Wall screen still reads local photos |
| Activity list configured per event in the dashboard | Not yet (still in *Lainnya*) |
| CSV import | Kept as the no-signal fallback (local only) |

`src/domain/codes.ts` is a copy of the invite-code rules (ported again in
Rust, `dwi-api/crates/domain`, and checked against golden vectors), so real
printed codes scan unchanged. The scanner never verifies the QR's HMAC,
because that would put the signing secret on every tablet: a code counts as
valid if it is in the downloaded guest list, and the server matches every
synced code against the event's guest table.

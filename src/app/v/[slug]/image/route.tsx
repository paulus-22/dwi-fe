import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import QRCode from "qrcode";

import { getDictionary, isLocale, format } from "@/i18n/dictionaries";
import { coupleLine } from "@/lib/couple";
import { findPublicEvent, resolveVoucher } from "@/lib/event";
import { resolveTheme } from "@/lib/themes";
import { formatEventDate, formatEventTime } from "@/lib/format";

const WIDTH = 800;
const HEIGHT = 1200;

/**
 * Satori cannot read the woff2 files `next/font` self-hosts, so the image route
 * loads TTF copies of the same faces, once per process. The directory is listed
 * in `outputFileTracingIncludes` (next.config.ts) so serverless bundlers ship it.
 */
const FONT_DIR = join(process.cwd(), "src/assets/fonts");
const loadAsset = (file: string) => readFile(join(FONT_DIR, file));

let fontCache: Array<{ name: string; data: Buffer; weight: 300 | 400; style: "normal" }> | null =
  null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const [displayLight, displayRegular, ui] = await Promise.all([
    loadAsset("CormorantUpright-Light.ttf"),
    loadAsset("CormorantUpright-Regular.ttf"),
    loadAsset("Jost-Regular.ttf"),
  ]);
  fontCache = [
    { name: "Cormorant Upright", data: displayLight, weight: 300, style: "normal" },
    { name: "Cormorant Upright", data: displayRegular, weight: 400, style: "normal" },
    { name: "Jost", data: ui, weight: 400, style: "normal" },
  ];
  return fontCache;
}

const DISPLAY = "Cormorant Upright";
const UI = "Jost";

const PAPER = "#ffffff";

/**
 * Renders the voucher as a PNG.
 *
 * This is what a guest saves and forwards on WhatsApp, and it doubles as the
 * page's og:image so a shared link previews as the pass itself. Satori only
 * supports flexbox, so the layout here is explicit rather than reusing the
 * page's Tailwind classes.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("to") ?? undefined;
  const langParam = url.searchParams.get("lang") ?? undefined;

  const event = await findPublicEvent(slug);
  if (!event || event.kind !== "WEDDING") return new Response("Not found", { status: 404 });

  const voucher = await resolveVoucher(event.slug, token);
  if (voucher.status !== "issued") {
    // No pass, no image — otherwise a pending link would leak a scannable QR.
    return new Response("No voucher issued", { status: 404 });
  }

  const locale = isLocale(langParam)
    ? langParam
    : event.defaultLocale === "EN"
      ? "en"
      : "id";
  const dict = getDictionary(locale);

  const gate = event.ceremonies[event.ceremonies.length - 1] ?? null;
  const couple = coupleLine(event);
  const dateLine = formatEventDate(event.headlineDate, locale, event.timezone);
  const venueLine = gate
    ? `${gate.venueName} · ${formatEventTime(gate.startsAt, locale, event.timezone)}`
    : null;

  // Same palette as the page, so a saved PNG matches the voucher it came from.
  const theme = resolveTheme(event.theme);
  const INK = theme.tokens.ink;
  const INK_SOFT = theme.tokens["ink-soft"];
  const PEACH_INK = theme.tokens["peach-ink"];
  const PEACH_LINE = theme.tokens["peach-line"];
  const OLIVE = theme.tokens["olive-deep"];

  const qr = await QRCode.toDataURL(voucher.qrPayload, {
    margin: 1,
    width: 720,
    color: { dark: INK, light: PAPER },
    errorCorrectionLevel: "M",
  });

  const admitsLine =
    voucher.admits === 1
      ? dict.voucher.admitOne
      : format(dict.voucher.admits, { count: voucher.admits });

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: OLIVE,
          padding: 48,
          fontFamily: UI,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: PAPER,
            border: `2px solid ${PEACH_LINE}`,
            paddingTop: 56,
            paddingBottom: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: PEACH_INK,
            }}
          >
            {dict.voucher.kicker}
          </div>

          <div style={{ display: "flex", fontSize: 76, color: INK, marginTop: 24, fontFamily: DISPLAY, fontWeight: 300 }}>
            {couple}
          </div>

          <div
            style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: INK_SOFT, marginTop: 18, fontFamily: UI }}
          >
            {dateLine}
          </div>

          {venueLine ? (
            <div style={{ display: "flex", fontSize: 22, color: INK_SOFT, marginTop: 10, fontFamily: UI }}>
              {venueLine}
            </div>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders this to the PNG */}
          <img src={qr} width={360} height={360} alt="" style={{ marginTop: 40 }} />

          <div
            style={{ display: "flex", fontSize: 24, letterSpacing: 10, color: PEACH_INK, marginTop: 20, fontFamily: UI }}
          >
            {voucher.guest.token}
          </div>

          <div
            style={{
              display: "flex",
              width: 600,
              borderTop: `2px dashed ${PEACH_LINE}`,
              marginTop: 40,
            }}
          />

          <div
            style={{ display: "flex", fontSize: 18, letterSpacing: 6, color: INK_SOFT, marginTop: 34, fontFamily: UI }}
          >
            {dict.voucher.issuedTo.toUpperCase()}
          </div>

          <div style={{ display: "flex", fontSize: 54, color: INK, marginTop: 16, textAlign: "center", fontFamily: DISPLAY, fontWeight: 400 }}>
            {voucher.guest.displayName}
          </div>

          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: PEACH_INK, marginTop: 18, fontFamily: UI }}>
            {admitsLine}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: INK_SOFT,
              marginTop: 26,
              maxWidth: 520,
              textAlign: "center",
              fontFamily: UI,
            }}
          >
            {dict.voucher.instruction}
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: await loadFonts(),
      headers: {
        // Vouchers are per-guest and change when an RSVP changes.
        "cache-control": "private, max-age=0, must-revalidate",
      },
    },
  );
}

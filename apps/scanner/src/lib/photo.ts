import type { EventInfo } from "../domain/types";

/**
 * Selfie capture and framing.
 *
 * The photo is framed on the device — couple's names, date, hashtag — so what
 * lands on the wall and in the couple's album is already the keepsake. It is
 * resized here too: ~1200×1600 JPEG at 0.85 is 250–450 KB, which uploads over
 * a venue's 4G in a couple of seconds. JPEG rather than WebP because Safari's
 * canvas still cannot encode WebP and silently hands back a PNG.
 */

const OUT_W = 1200;
const OUT_H = 1600;

let fontsReady: Promise<void> | null = null;

/** Canvas only uses a webfont once it has actually loaded. */
export function loadFrameFonts() {
  fontsReady ??= (async () => {
    const faces = [
      new FontFace("Cormorant Upright", "url(/fonts/CormorantUpright-Regular.ttf)"),
      new FontFace("Jost", "url(/fonts/Jost-Regular.ttf)"),
    ];
    await Promise.all(
      faces.map(async (face) => {
        try {
          document.fonts.add(await face.load());
        } catch {
          /* fall back to system serif/sans */
        }
      }),
    );
  })();
  return fontsReady;
}

type Source = HTMLVideoElement | HTMLImageElement | ImageBitmap;

function sourceSize(source: Source) {
  if (source instanceof HTMLVideoElement) return { w: source.videoWidth, h: source.videoHeight };
  if (source instanceof HTMLImageElement) return { w: source.naturalWidth, h: source.naturalHeight };
  return { w: source.width, h: source.height };
}

/** Grabs a frame (or an uploaded photo) and returns the framed JPEG. */
export async function framePhoto(
  source: Source,
  event: EventInfo,
  guestName: string,
  { mirror }: { mirror: boolean },
): Promise<Blob> {
  await loadFrameFonts();

  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d")!;

  // Paper.
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, OUT_W, OUT_H);

  // Photo window: cover-fit the source into it.
  const pad = 60;
  const winX = pad;
  const winY = pad;
  const winW = OUT_W - pad * 2;
  const winH = 1180;
  const { w, h } = sourceSize(source);
  const scale = Math.max(winW / w, winH / h);
  const dw = w * scale;
  const dh = h * scale;

  ctx.save();
  roundRect(ctx, winX, winY, winW, winH, 28);
  ctx.clip();
  ctx.translate(winX + winW / 2, winY + winH / 2);
  if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  // Hairline around the window.
  ctx.strokeStyle = "#d8c3a5";
  ctx.lineWidth = 3;
  roundRect(ctx, winX - 14, winY - 14, winW + 28, winH + 28, 38);
  ctx.stroke();

  // Caption band.
  const cx = OUT_W / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = "#353a20";
  ctx.font = '92px "Cormorant Upright", Georgia, serif';
  ctx.fillText(event.displayName, cx, 1378);

  ctx.fillStyle = "#876550";
  ctx.font = '30px "Jost", system-ui, sans-serif';
  ctx.letterSpacing = "6px";
  ctx.fillText(event.dateLabel.toUpperCase(), cx, 1440);

  ctx.fillStyle = "#786b5d";
  ctx.letterSpacing = "1px";
  ctx.font = '32px "Jost", system-ui, sans-serif';
  const line = [guestName, event.hashtag].filter(Boolean).join("  ·  ");
  ctx.fillText(truncate(ctx, line, OUT_W - 160), cx, 1512);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
}

export async function fileToImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > max) out = out.slice(0, -1);
  return `${out}…`;
}

/**
 * Shrinks a picked photo for the standby slideshow. A phone camera original is
 * 3–6 MB; at 1920px JPEG it is ~300 KB, so a dozen slides cost a few MB of
 * device storage instead of 50.
 */
export async function resizeForSlide(file: Blob, max = 1920): Promise<Blob> {
  const img = await fileToImage(file);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
}

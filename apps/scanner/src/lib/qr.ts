import { BarcodeDetector, prepareZXingModule } from "barcode-detector/ponyfill";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

/**
 * QR decoding.
 *
 * The ponyfill always uses zxing-wasm rather than the native BarcodeDetector,
 * because the native one is missing on iOS Safari and every device should
 * behave the same at the door. The .wasm is served from our own origin (and
 * precached by the service worker) instead of the default CDN, so the first
 * scan works with no network.
 */
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path),
  },
});

let detector: BarcodeDetector | null = null;

function getDetector() {
  detector ??= new BarcodeDetector({ formats: ["qr_code"] });
  return detector;
}

export async function decode(source: ImageBitmapSource): Promise<string | null> {
  try {
    const codes = await getDetector().detect(source);
    return codes[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

/** Warm the wasm up while the usher is still on the pairing screen. */
export function preloadDecoder() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 8;
  void decode(canvas);
}

/**
 * Continuously decodes a playing <video>. Throttled to ~7 fps: plenty for a
 * QR held up to the lens, and it keeps a mid-range Android phone cool.
 */
export function scanLoop(video: HTMLVideoElement, onResult: (text: string) => void) {
  let stopped = false;
  let last = 0;
  let busy = false;

  const frame = async (now: number) => {
    if (stopped) return;
    if (!busy && now - last > 140 && video.readyState >= 2 && video.videoWidth > 0) {
      busy = true;
      last = now;
      const text = await decode(video);
      busy = false;
      if (text && !stopped) onResult(text);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return () => {
    stopped = true;
  };
}

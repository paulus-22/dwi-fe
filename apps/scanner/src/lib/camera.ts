import { useCallback, useEffect, useRef, useState } from "react";

export type Facing = "environment" | "user";

export type CameraState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "live" }
  | { status: "error"; message: string };

/**
 * One camera stream bound to a <video>. Switching facing stops the old
 * tracks first — iOS refuses a second concurrent stream.
 */
export function useCamera(facing: Facing, active = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ status: "idle" });

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState({
          status: "error",
          message: window.isSecureContext
            ? "Browser ini tidak mendukung kamera."
            : "Kamera butuh HTTPS. Buka lewat alamat https://",
        });
        return;
      }
      setState({ status: "starting" });
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          await video.play().catch(() => undefined);
        }
        setState({ status: "live" });
      } catch (error) {
        const name = (error as DOMException)?.name;
        setState({
          status: "error",
          message:
            name === "NotAllowedError"
              ? "Izin kamera ditolak. Izinkan kamera di pengaturan browser."
              : name === "NotFoundError" || name === "OverconstrainedError"
                ? "Kamera tidak ditemukan di perangkat ini."
                : "Kamera tidak bisa dibuka.",
        });
      }
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, active, stop]);

  return { videoRef, state, stop };
}

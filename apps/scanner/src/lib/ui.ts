import { useEffect, useState } from "react";

/** Minimal hash router: `#/scan`, `#/guests`, ... — enough for a PWA. */
export function useRoute(fallback = "scan") {
  const read = () => window.location.hash.replace(/^#\/?/, "") || fallback;
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  });
  return route;
}

export function go(route: string) {
  window.location.hash = `/${route}`;
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function agoLabel(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  return `${Math.floor(minutes / 60)} jam lalu`;
}

/** Toggle real browser fullscreen (hides the OS/address bar on tablets). */
export async function toggleFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement) await el.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    /* unsupported (e.g. iOS Safari standalone) — silently ignore */
  }
}

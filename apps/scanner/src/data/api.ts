import { builtinEvents, resolveBuiltin } from "./demo";
import type { ActivityRecord, CheckIn, EventInfo, PhotoRecord, SnapshotGuest } from "../domain/types";

/**
 * The scanner's only door to a backend.
 *
 * Two implementations behind one interface:
 *  - `httpApi` talks to dwi-api (Rust) when `VITE_API_URL` is set;
 *  - `mockApi` is the offline demo (built-in Alex & Ajeng event) otherwise.
 *
 *   pair     → POST /v1/devices/pair
 *   snapshot → GET  /v1/events/:id/snapshot
 *   sync     → POST /v1/sync            (idempotent on client ids; pulls by cursor)
 *   upload   → POST /v1/uploads/presign, PUT straight to R2, POST /v1/photos
 */

export type RemoteCheckIn = Omit<CheckIn, "synced">;

export interface ScannerApi {
  /** True when talking to a real server (not the built-in demo). */
  readonly live: boolean;
  pair(code: string, deviceName: string): Promise<{ event: EventInfo; deviceToken: string; deviceName: string }>;
  snapshot(eventId: string): Promise<{ guests: SnapshotGuest[]; remoteCheckIns: RemoteCheckIn[]; cursor: number; at: string }>;
  /** R2-backed slides + all doors' selfies, so one door's slideshow matches every other. */
  slideshow(eventId: string): Promise<{
    images: { id: string; url: string; contentType: string }[];
    greeting: string | null;
  }>;
  photos(eventId: string): Promise<{
    photos: { id: string; url: string; householdName: string | null }[];
  }>;
  /** Durable greeting queue for the TV: check-ins since `after` (a seq). */
  greetings(
    eventId: string,
    after: number,
  ): Promise<{ greetings: { seq: number; name: string; selfie: string | null }[]; cursor: number }>;
  sync(batch: {
    checkIns: CheckIn[];
    records: ActivityRecord[];
    cursor: number;
  }): Promise<{ acked: string[]; remoteCheckIns: RemoteCheckIn[]; cursor: number; hasMore: boolean }>;
  uploadPhoto(photo: PhotoRecord): Promise<{ url: string }>;
}

export class OfflineError extends Error {
  constructor() {
    super("offline");
  }
}

/** The server says this device is no longer allowed (revoked, or never paired). */
export class DeviceRevokedError extends Error {}

/** Set from Settings, so the offline story can be shown without pulling wifi. */
export const network = { simulateOffline: false };

/** Device token from pairing. Loaded from IndexedDB at start-up. */
export const session = { token: null as string | null };

function online() {
  return navigator.onLine && !network.simulateOffline;
}

// ------------------------------------------------------------------ http

function httpApi(base: string): ScannerApi {
  const root = base.replace(/\/$/, "");

  async function call<T>(path: string, init: { body?: unknown; auth?: boolean } = {}): Promise<T> {
    if (!online()) throw new OfflineError();
    const headers: Record<string, string> = {};
    if (init.body !== undefined) headers["content-type"] = "application/json";
    if (init.auth !== false) {
      if (!session.token) throw new DeviceRevokedError("Perangkat belum dipasangkan ke server.");
      headers.authorization = `Bearer ${session.token}`;
    }
    let res: Response;
    try {
      res = await fetch(`${root}${path}`, {
        method: init.body !== undefined ? "POST" : "GET",
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new OfflineError(); // DNS, TLS, captive portal, server down: all "try again later"
    }
    if (res.ok) return (await res.json()) as T;
    const payload = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
    const message = payload?.error?.message ?? `Server menolak permintaan (${res.status}).`;
    if (res.status === 401 && init.auth !== false) throw new DeviceRevokedError(message);
    if (res.status >= 500) throw new OfflineError();
    throw new Error(message);
  }

  return {
    live: true,

    pair(code, deviceName) {
      return call("/v1/devices/pair", { body: { code: code.trim(), deviceName }, auth: false });
    },

    snapshot(eventId) {
      return call(`/v1/events/${eventId}/snapshot`);
    },

    slideshow(eventId) {
      return call(`/v1/events/${eventId}/slideshow`);
    },

    photos(eventId) {
      return call(`/v1/events/${eventId}/photos`);
    },

    /** Durable greeting queue for the TV: check-ins since `after` (a seq). */
    greetings(eventId, after) {
      return call(`/v1/events/${eventId}/greetings?after=${after}`);
    },

    sync({ checkIns, records, cursor }) {
      return call("/v1/sync", { body: { deviceNow: new Date().toISOString(), cursor, checkIns, records } });
    },

    async uploadPhoto(photo) {
      const contentType = photo.blob.type || "image/jpeg";
      const presigned = await call<{ url: string; key: string; headers: Record<string, string> }>(
        "/v1/uploads/presign",
        { body: { photoId: photo.id, contentType } },
      );
      let put: Response;
      try {
        put = await fetch(presigned.url, { method: "PUT", headers: presigned.headers, body: photo.blob });
      } catch {
        throw new OfflineError();
      }
      if (!put.ok) throw new OfflineError(); // expired URL or storage hiccup: retry next round
      return call<{ url: string }>("/v1/photos", {
        body: {
          id: photo.id,
          checkInId: photo.checkInId,
          code: photo.code,
          key: presigned.key,
          contentType,
          occurredAt: photo.occurredAt,
        },
      });
    },
  };
}

// ------------------------------------------------------------------ mock

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (base: number) => base + Math.random() * base;

const mockApi: ScannerApi = {
  live: false,

  async pair(code, deviceName) {
    await sleep(jitter(400));
    if (!online()) throw new OfflineError();
    const found = resolveBuiltin(code);
    if (!found) {
      throw new Error(
        "Kode acara tidak dikenal. Tanpa server, hanya acara demo yang tersedia — gunakan Impor CSV untuk acara lain.",
      );
    }
    return { event: found.event, deviceToken: `demo-${deviceName}-${Date.now()}`, deviceName };
  },

  async snapshot(eventId) {
    await sleep(jitter(500));
    if (!online()) throw new OfflineError();
    const found = Object.values(builtinEvents).find((b) => b.event.id === eventId);
    if (!found) throw new Error("Acara tidak ditemukan");
    const now = Date.now();
    return {
      guests: found.guests,
      remoteCheckIns: found.remote.map((r, i) => ({
        id: `remote-${i}`,
        code: r.code,
        headcount: r.headcount,
        occurredAt: new Date(now - r.minutesAgo * 60_000).toISOString(),
        deviceName: r.deviceName,
        override: false,
      })),
      cursor: 0,
      at: new Date(now).toISOString(),
    };
  },

  async slideshow() {
    await sleep(jitter(300));
    return { images: [], greeting: null };
  },

  async photos() {
    await sleep(jitter(300));
    return { photos: [] };
  },

  async greetings() {
    await sleep(jitter(300));
    return { greetings: [], cursor: 0 };
  },

  async sync({ checkIns, records, cursor }) {
    await sleep(jitter(350));
    if (!online()) throw new OfflineError();
    return {
      acked: [...checkIns.map((c) => c.id), ...records.map((r) => r.id)],
      remoteCheckIns: [],
      cursor,
      hasMore: false,
    };
  },

  async uploadPhoto(photo) {
    await sleep(jitter(700));
    if (!online()) throw new OfflineError();
    return { url: `r2://demo/${photo.id}.jpg` };
  },
};

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const api: ScannerApi = API_URL ? httpApi(API_URL) : mockApi;

/** Trailing-slash-free live API root, for the greeter's EventSource. */
export const API_ROOT: string | null = API_URL ? API_URL.replace(/\/$/, "") : null;

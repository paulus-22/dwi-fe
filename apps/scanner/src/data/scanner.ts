import { api, DeviceRevokedError, network, OfflineError, session, type RemoteCheckIn } from "./api";
import { store } from "./store";
import { readScan } from "../domain/codes";
import type {
  EventInfo,
  ActivityConfig,
  ActivityRecord,
  ActivityType,
  CheckIn,
  Pairing,
  PhotoRecord,
  SnapshotGuest,
} from "../domain/types";

/** Scanner use-cases. Screens call these; these call `store` and `api`. */

export const DEFAULT_ACTIVITIES: ActivityConfig[] = [
  { type: "PHOTO", label: "Foto selfie", enabled: true, required: false },
  { type: "GUESTBOOK", label: "Buku tamu", enabled: true, required: false },
  { type: "SOUVENIR", label: "Souvenir", enabled: true, required: false },
];

export function uid() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------- pairing

export async function pairDevice(code: string, deviceName: string): Promise<Pairing> {
  const { event, deviceToken, deviceName: serverName } = await api.pair(code, deviceName);
  session.token = deviceToken;
  await store.setPref("deviceToken", deviceToken);
  const snap = await api.snapshot(event.id);
  await store.replaceGuests(snap.guests);
  await storeRemote(snap.remoteCheckIns);
  await store.setPref("cursor", snap.cursor);
  // The gate is set from the dashboard on the pairing code; the server's name
  // wins (the device-local door pick is only a fallback for the offline demo).
  const resolvedName = serverName?.trim() || deviceName.trim() || "Pintu Utama";
  const pairing: Pairing = {
    event,
    source: "code",
    sourceLabel: code.trim(),
    deviceName: resolvedName,
    pairedAt: new Date().toISOString(),
    snapshotAt: snap.at,
  };
  await store.setPairing(pairing);
  if (!(await store.getActivities())) await store.setActivities(DEFAULT_ACTIVITIES);
  return pairing;
}

/**
 * Pairs from an admin CSV export, entirely on the device. Re-importing the
 * same event later (fresh RSVPs on the morning of the wedding) replaces the
 * guest list but keeps every check-in, record and photo already made.
 */
export async function pairFromCsv(
  event: EventInfo,
  guests: SnapshotGuest[],
  deviceName: string,
  fileName: string,
): Promise<Pairing> {
  const previous = await store.getPairing();
  if (previous && previous.event.id !== event.id) {
    throw new Error(
      `Perangkat ini masih terhubung ke ${previous.event.coupleLine}. Reset dulu di Lainnya sebelum ganti acara.`,
    );
  }
  await store.replaceGuests(guests);
  const now = new Date().toISOString();
  const pairing: Pairing = {
    event,
    source: "csv",
    sourceLabel: fileName,
    deviceName,
    pairedAt: previous?.pairedAt ?? now,
    snapshotAt: now,
  };
  await store.setPairing(pairing);
  if (!(await store.getActivities())) await store.setActivities(DEFAULT_ACTIVITIES);
  return pairing;
}

// ---------------------------------------------------------------- scanning

export type Lookup =
  | { kind: "ok"; guest: SnapshotGuest; previous: CheckIn[] }
  | { kind: "duplicate"; guest: SnapshotGuest; previous: CheckIn[] }
  | { kind: "not_confirmed"; guest: SnapshotGuest; previous: CheckIn[] }
  | { kind: "unknown"; code: string }
  | { kind: "invalid"; raw: string };

export async function lookup(raw: string): Promise<Lookup> {
  const verdict = readScan(raw);
  if (!verdict.ok) return { kind: "invalid", raw };

  const guest = await store.guest(verdict.code);
  if (!guest) return { kind: "unknown", code: verdict.code };

  const previous = (await store.checkInsFor(guest.code)).sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  );
  if (previous.length > 0) return { kind: "duplicate", guest, previous };
  if (guest.attending !== true) return { kind: "not_confirmed", guest, previous };
  return { kind: "ok", guest, previous };
}

export async function checkIn(
  guest: SnapshotGuest,
  headcount: number,
  deviceName: string,
  override: boolean,
  memberName?: string,
): Promise<CheckIn> {
  const row: CheckIn = {
    id: uid(),
    code: guest.code,
    headcount,
    occurredAt: new Date().toISOString(),
    deviceName,
    override,
    synced: false,
    ...(memberName !== undefined ? { memberName } : {}),
  };
  await store.putCheckIn(row);
  // Flush to the backend NOW so the TV greeting queues at check-in, not when the
  // selfie sync later happens to carry it. (Fire-and-forget could batch the
  // check-in with the photo and make the greeting appear only after the picture.)
  await syncNow();
  return row;
}

export async function recordActivity(
  checkIn: CheckIn,
  type: ActivityType,
  data: Record<string, unknown>,
): Promise<ActivityRecord> {
  const row: ActivityRecord = {
    id: uid(),
    checkInId: checkIn.id,
    code: checkIn.code,
    type,
    occurredAt: new Date().toISOString(),
    data,
    synced: false,
  };
  await store.putRecord(row);
  void syncNow();
  return row;
}

export async function savePhoto(checkIn: CheckIn, guest: SnapshotGuest, blob: Blob) {
  const row: PhotoRecord = {
    id: uid(),
    checkInId: checkIn.id,
    code: guest.code,
    householdName: guest.householdName,
    blob,
    occurredAt: new Date().toISOString(),
    synced: false,
  };
  await store.putPhoto(row);
  await recordActivity(checkIn, "PHOTO", { photoId: row.id, bytes: blob.size });
  // Flush NOW so the confirmed selfie lands on R2 + POST /v1/photos right away,
  // triggering the TV greeting immediately after the guest taps "Pakai foto".
  await syncNow();
  return row;
}

// ---------------------------------------------------------------- sync

/** Check-ins made at other doors. Never overwrites a row this device made. */
async function storeRemote(rows: RemoteCheckIn[]) {
  for (const remote of rows) {
    await store.putCheckIn({ ...remote, synced: true });
  }
}

/** Forget the server token (device reset, or the admin revoked it). */
export async function forgetSession() {
  session.token = null;
  await store.setPref("deviceToken", null);
  await store.setPref("cursor", 0);
}

export type SyncState = { pending: number; online: boolean; syncing: boolean; lastSyncedAt: string | null };

let state: SyncState = { pending: 0, online: true, syncing: false, lastSyncedAt: null };
const listeners = new Set<(s: SyncState) => void>();

function emit(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

export function subscribeSync(fn: (s: SyncState) => void) {
  listeners.add(fn);
  fn(state);
  return () => void listeners.delete(fn);
}

async function countPending() {
  const [c, r, p] = await Promise.all([store.checkIns(), store.records(), store.photos()]);
  return (
    c.filter((x) => !x.synced).length +
    r.filter((x) => !x.synced).length +
    p.filter((x) => !x.synced).length
  );
}

let activeRun: Promise<void> | null = null;
let rerunRequested = false;

/**
 * Pushes the outbox and, against a real server, pulls check-ins from the
 * other doors. iOS has no Background Sync, so this runs in the foreground:
 * after every write, on an interval, and when the device comes back online.
 * Safe to call any time; if a write arrives mid-sync, a follow-up pass runs
 * immediately so confirmed check-ins and selfies never wait for the 5s timer.
 *
 * A device paired by CSV has no server token: its data stays on the device
 * (export it from Lainnya) rather than failing to upload forever.
 */
export async function syncNow() {
  if (activeRun) {
    rerunRequested = true;
    await activeRun;
    return;
  }

  activeRun = (async () => {
    do {
      rerunRequested = false;
      const isOnline = navigator.onLine && !network.simulateOffline;
      emit({ online: isOnline, pending: await countPending() });
      if (!isOnline) break;
      if (api.live && !session.token) break;

      emit({ syncing: true });
      try {
        const checkIns = (await store.checkIns()).filter((c) => !c.synced);
        const records = (await store.records()).filter((r) => !r.synced);
        if (checkIns.length || records.length || api.live) {
          let cursor = (await store.getPref<number>("cursor")) ?? 0;
          let res = await api.sync({ checkIns, records, cursor });
          const done = new Set(res.acked);
          for (const c of checkIns) if (done.has(c.id)) await store.putCheckIn({ ...c, synced: true });
          for (const r of records) if (done.has(r.id)) await store.putRecord({ ...r, synced: true });
          // Pull: keep paging while the server says there is more.
          for (;;) {
            await storeRemote(res.remoteCheckIns);
            cursor = res.cursor;
            await store.setPref("cursor", cursor);
            if (!res.hasMore) break;
            res = await api.sync({ checkIns: [], records: [], cursor });
          }
        }
        for (const photo of (await store.photos()).filter((p) => !p.synced)) {
          await api.uploadPhoto(photo);
          await store.putPhoto({ ...photo, synced: true });
        }
        emit({ lastSyncedAt: new Date().toISOString() });
      } catch (error) {
        if (error instanceof DeviceRevokedError) {
          // Revoked by the admin: stop calling the server, keep everything local.
          console.warn("[sync]", error.message);
          await forgetSession();
        } else if (!(error instanceof OfflineError)) {
          console.error("[sync]", error);
        }
        emit({ online: !(error instanceof OfflineError) });
        rerunRequested = false;
      } finally {
        emit({ syncing: false, pending: await countPending() });
      }
    } while (rerunRequested);
  })();

  try {
    await activeRun;
  } finally {
    activeRun = null;
  }
}

export function startSyncLoop() {
  const tick = () => void syncNow();
  window.addEventListener("online", tick);
  window.addEventListener("offline", tick);
  const timer = setInterval(tick, 5000);
  tick();
  return () => {
    clearInterval(timer);
    window.removeEventListener("online", tick);
    window.removeEventListener("offline", tick);
  };
}

export async function setSimulateOffline(value: boolean) {
  network.simulateOffline = value;
  await store.setFlag("simulateOffline", value);
  await syncNow();
}

export async function loadFlags() {
  network.simulateOffline = await store.getFlag("simulateOffline");
  session.token = (await store.getPref<string | null>("deviceToken")) ?? null;
}

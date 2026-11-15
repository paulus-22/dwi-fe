import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type {
  ActivityConfig,
  ActivityRecord,
  CheckIn,
  Pairing,
  PhotoRecord,
  Slide,
  SnapshotGuest,
} from "../domain/types";

/**
 * Everything the device knows lives in IndexedDB, so a reload, a dead battery
 * swap or a lost connection never loses a check-in. Unsynced rows are the
 * outbox: `synced: false` until the server acknowledges them.
 */

interface ScannerDB extends DBSchema {
  kv: { key: string; value: unknown };
  guests: { key: string; value: SnapshotGuest };
  checkins: { key: string; value: CheckIn; indexes: { byCode: string } };
  records: { key: string; value: ActivityRecord; indexes: { byCheckIn: string } };
  photos: { key: string; value: PhotoRecord };
}

let dbPromise: Promise<IDBPDatabase<ScannerDB>> | null = null;

function db() {
  dbPromise ??= openDB<ScannerDB>("dwi-scanner", 1, {
    upgrade(database) {
      database.createObjectStore("kv");
      database.createObjectStore("guests", { keyPath: "code" });
      database.createObjectStore("checkins", { keyPath: "id" }).createIndex("byCode", "code");
      database.createObjectStore("records", { keyPath: "id" }).createIndex("byCheckIn", "checkInId");
      database.createObjectStore("photos", { keyPath: "id" });
    },
  });
  return dbPromise;
}

export const store = {
  async getPairing() {
    return (await (await db()).get("kv", "pairing")) as Pairing | undefined;
  },
  async setPairing(pairing: Pairing) {
    await (await db()).put("kv", pairing, "pairing");
  },

  async getActivities() {
    return (await (await db()).get("kv", "activities")) as ActivityConfig[] | undefined;
  },
  async setActivities(list: ActivityConfig[]) {
    await (await db()).put("kv", list, "activities");
  },

  async getFlag(name: string) {
    return Boolean(await (await db()).get("kv", `flag:${name}`));
  },
  async setFlag(name: string, value: boolean) {
    await (await db()).put("kv", value, `flag:${name}`);
  },

  async getPref<T>(name: string) {
    return (await (await db()).get("kv", `pref:${name}`)) as T | undefined;
  },
  async setPref(name: string, value: unknown) {
    await (await db()).put("kv", value, `pref:${name}`);
  },

  async getSlides() {
    return ((await (await db()).get("kv", "slides")) as Slide[] | undefined) ?? [];
  },
  async setSlides(slides: Slide[]) {
    await (await db()).put("kv", slides, "slides");
  },

  async replaceGuests(guests: SnapshotGuest[]) {
    const tx = (await db()).transaction("guests", "readwrite");
    await tx.store.clear();
    await Promise.all(guests.map((g) => tx.store.put(g)));
    await tx.done;
  },
  async guest(code: string) {
    return (await db()).get("guests", code);
  },
  async guests() {
    return (await db()).getAll("guests");
  },

  async checkInsFor(code: string) {
    return (await db()).getAllFromIndex("checkins", "byCode", code);
  },
  async checkIns() {
    return (await db()).getAll("checkins");
  },
  async putCheckIn(row: CheckIn) {
    await (await db()).put("checkins", row);
  },

  async recordsFor(checkInId: string) {
    return (await db()).getAllFromIndex("records", "byCheckIn", checkInId);
  },
  async records() {
    return (await db()).getAll("records");
  },
  async putRecord(row: ActivityRecord) {
    await (await db()).put("records", row);
  },

  async photos() {
    return (await db()).getAll("photos");
  },
  async putPhoto(row: PhotoRecord) {
    await (await db()).put("photos", row);
  },

  async wipe() {
    const database = await db();
    await Promise.all(
      (["kv", "guests", "checkins", "records", "photos"] as const).map((name) => database.clear(name)),
    );
  },
};

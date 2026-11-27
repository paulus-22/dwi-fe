import type { CategoryCode } from "./codes";

/**
 * Shapes shared by the screens and the data layer. They mirror what the Rust
 * API will return (`GET /v1/events/:id/snapshot`, `POST /v1/sync`), so swapping
 * the mock for real HTTP touches `data/api.ts` only.
 */

export type EventInfo = {
  id: string;
  slug: string;
  coupleLine: string; // "Alex & Ajeng"
  brideShortName: string;
  groomShortName: string;
  dateLabel: string; // "Sabtu, 15 Mei 2027"
  venue: string;
  hashtag: string | null;
};

export type SnapshotGuest = {
  code: string;
  householdName: string;
  category: CategoryCode;
  /** null = no RSVP yet; false = declined; true = attending. */
  attending: boolean | null;
  /** Confirmed headcount when attending, else the invitation's cap. */
  admits: number;
  table: string | null;
  vip: boolean;
  /** Group (kelompok) invitation — no per-person pass; the door records a member name. */
  group?: boolean;
  /** The group's full headcount cap, when it's a group invite. */
  groupCap?: number;
};

export type ActivityType = "PHOTO" | "SOUVENIR" | "GUESTBOOK";

export type ActivityConfig = {
  type: ActivityType;
  label: string;
  enabled: boolean;
  required: boolean;
};

export type CheckIn = {
  id: string; // client-generated → idempotent sync
  code: string;
  headcount: number;
  occurredAt: string; // ISO, device clock
  deviceName: string;
  override: boolean;
  synced: boolean;
  /** GROUP invites: which member arrived (usher-typed name). */
  memberName?: string;
};

export type ActivityRecord = {
  id: string;
  checkInId: string;
  code: string;
  type: ActivityType;
  occurredAt: string;
  data: Record<string, unknown>;
  synced: boolean;
};

export type PhotoRecord = {
  id: string;
  checkInId: string;
  code: string;
  householdName: string;
  blob: Blob;
  occurredAt: string;
  synced: boolean;
};

export type Pairing = {
  event: EventInfo;
  /** "code": downloaded from the server. "csv": imported from an admin export, offline. */
  source: "code" | "csv";
  /** What was used to pair: the event code, or the CSV file name. */
  sourceLabel: string;
  deviceName: string;
  pairedAt: string;
  snapshotAt: string;
};

/**
 * Standby ("layar jeda"): what the scan screen shows when nobody is at the
 * door, instead of a live camera hunting for a code.
 */
export type IdleConfig = {
  /** Enter standby on its own after `afterSec` without activity. */
  auto: boolean;
  afterSec: number;
  /**
   * "off": camera stops; tap the screen to scan again (saves battery, nothing
   * is filmed while the device waits). "watch": camera keeps running hidden
   * behind the slideshow, so a guest holding up a QR checks in straight away.
   */
  camera: "off" | "watch";
  includeSelfies: boolean;
  slideSec: number;
};

export type Slide = { id: string; blob: Blob; addedAt: string };

/**
 * Auto check-in: a green scan (confirmed, first visit) checks in on its own
 * after `delaySec`, with the RSVP headcount. Amber and red never auto-confirm —
 * those are the cases that need a person to look.
 */
export type AutoConfig = {
  on: boolean;
  /** 0 = instantly; otherwise a cancellable countdown. */
  delaySec: number;
  /** Go straight back to scanning instead of running the activities. */
  skipActivities: boolean;
};

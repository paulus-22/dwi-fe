import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side client for the Rust API (dwi-api).
 *
 * The admin's API token lives in an httpOnly cookie and is only ever read
 * here, on the server — browser JavaScript never sees it. Pages and server
 * actions call `api()`; the live stream goes through `/api/live/[id]`.
 */

export const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");
export const SESSION_COOKIE = "dwi_session";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip the session cookie (login). */
  anonymous?: boolean;
};

/**
 * Calls the API and returns parsed JSON. A missing or expired session sends
 * the user to the login page; a pending password change to /admin/password.
 * Every other failure throws an `ApiError` with the API's Indonesian message.
 */
export async function api<T>(path: string, { body, anonymous, headers, ...init }: Options = {}): Promise<T> {
  const token = anonymous ? undefined : await sessionToken();
  if (!anonymous && !token) redirect("/login");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(503, "unreachable", "Server tidak dapat dihubungi. Coba lagi sebentar.");
  }

  // 204 / empty bodies (some DELETE/PUT handlers) resolve to undefined.
  if (res.ok) {
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const payload = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
  const code = payload?.error?.code ?? "unknown";
  if (!anonymous && res.status === 401) redirect("/login?expired=1");
  if (code === "must_change_password") redirect("/admin/password");
  throw new ApiError(res.status, code, payload?.error?.message ?? `Permintaan gagal (${res.status}).`);
}

// ---------------------------------------------------------------- types

export type Role = "VIEWER" | "ORGANIZER" | "OWNER";

export type Admin = {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
};

export type EventKind = "WEDDING" | "GENERIC";

export type EventItem = {
  id: string;
  slug: string;
  /** Absent on APIs that predate migration 0003 — treat as WEDDING. */
  kind?: EventKind;
  /** GENERIC events only (bride/groom names are empty there). */
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  coupleLine: string;
  brideShortName: string;
  groomShortName: string;
  dateLabel: string;
  venue: string;
  hashtag: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  codePrefix: string;
  role: Role;
};

export type Arrival = {
  id: string;
  code: string;
  headcount: number;
  occurredAt: string;
  deviceName: string;
  householdName: string | null;
};

export type Attendance = {
  households: number;
  attendingHouseholds: number;
  expectedPeople: number;
  checkedInHouseholds: number;
  checkedInPeople: number;
  repeatScans: number;
  byDevice: { deviceName: string; checkIns: number }[];
  recent: Arrival[];
  at: string;
};

export type Device = {
  id: string;
  name: string;
  pairedAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  clockOffsetMs: number;
  checkIns: number;
};

export type PairingCode = {
  id: string;
  code: string;
  label: string | null;
  expiresAt: string;
  uses: number;
  lastUsedAt: string | null;
};

export type Guest = {
  id: string;
  code: string;
  householdName: string;
  category: string;
  attending: boolean | null;
  admits: number;
  checkedInAt: string | null;
  checkedInHeadcount: number | null;
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Pemilik",
  ORGANIZER: "Penyelenggara",
  VIEWER: "Pemantau",
};

export function canManage(role: Role) {
  return role === "OWNER" || role === "ORGANIZER";
}

export const eventKind = (e: EventItem): EventKind => e.kind ?? "WEDDING";

/** Display name: the couple line for weddings, the title for generic events. */
export const eventName = (e: EventItem) =>
  eventKind(e) === "GENERIC" ? e.title || e.slug : e.coupleLine;

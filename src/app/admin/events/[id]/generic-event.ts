import "server-only";

import { notFound } from "next/navigation";

import { api, ApiError, canManage, eventKind, type EventItem } from "@/lib/api";

/**
 * Loads an event for the GENERIC-only builder screens. Wedding events, unknown
 * ids and viewers without manage rights all get a 404, so these routes simply
 * don't exist for The Moments.
 */
export async function requireGenericEvent(id: string): Promise<EventItem> {
  let event: EventItem;
  try {
    ({ event } = await api<{ event: EventItem }>(`/v1/events/${id}`));
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
  if (eventKind(event) !== "GENERIC" || !canManage(event.role)) notFound();
  return event;
}

/** Turns an API failure into an inline message; anything else (incl. redirects) propagates. */
export function apiErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.message || fallback;
  throw e;
}

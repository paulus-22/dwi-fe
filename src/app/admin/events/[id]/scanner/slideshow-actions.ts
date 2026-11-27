"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";

type Presign = { method: string; url: string; key: string; headers: Record<string, string>; expiresAt: string };

/** Get a 15-min presigned PUT URL for a slide. WebP-only (enforced server-side). */
export async function presignSlide(eventId: string, photoId: string): Promise<{ id: string; url: string; key: string }> {
  const res = await api<Presign>(`/v1/events/${eventId}/slideshow/presign`, {
    method: "POST",
    body: { photoId, contentType: "image/webp" },
  });
  return { id: photoId, url: res.url, key: res.key };
}

/** Register a slide whose bytes are now in R2. */
export async function completeSlide(eventId: string, payload: { id: string; key: string }) {
  await api(`/v1/events/${eventId}/slideshow`, {
    method: "POST",
    body: { id: payload.id, key: payload.key, contentType: "image/webp" },
  });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

/** Remove a slide from the slideshow (keeps the R2 object for cheap re-add). */
export async function removeSlide(eventId: string, slideId: string) {
  await api(`/v1/slideshow/${slideId}`, { method: "DELETE" });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

/** Get a presigned PUT URL for the TV greeting backdrop (WebP). */
export async function presignGreeting(eventId: string, photoId: string): Promise<{ id: string; url: string; key: string }> {
  const res = await api<Presign>(`/v1/events/${eventId}/greeting/presign`, {
    method: "POST",
    body: { photoId, contentType: "image/webp" },
  });
  return { id: photoId, url: res.url, key: res.key };
}

/** Set which object is the greeting backdrop. */
export async function setGreeting(eventId: string, key: string) {
  await api(`/v1/events/${eventId}/greeting`, { method: "POST", body: { key } });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

/** Clear the greeting backdrop (TV falls back to the title card). */
export async function clearGreeting(eventId: string) {
  await api(`/v1/events/${eventId}/greeting`, { method: "DELETE" });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

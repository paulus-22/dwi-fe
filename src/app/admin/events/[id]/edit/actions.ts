"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, type EventKind } from "@/lib/api";
import type { ActionState } from "@/lib/builder";
import { buildEventBody } from "@/lib/event-form";

import { apiErrorMessage } from "../generic-event";

/** Full replace (the API's PUT has no partial mode). Kind is fixed by the edit page. */
export async function updateEvent(
  id: string,
  kind: EventKind,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const built = buildEventBody(kind, form);
  if (!("body" in built)) return built;
  try {
    await api(`/v1/events/${id}`, { method: "PUT", body: built.body });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menyimpan acara.") };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Archives the event (soft delete) and returns to the matching dashboard tab. */
export async function deleteEvent(id: string, kind: EventKind): Promise<ActionState> {
  try {
    await api(`/v1/events/${id}`, { method: "DELETE" });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal mengarsipkan acara.") };
  }
  revalidatePath("/admin", "layout");
  redirect(kind === "WEDDING" ? "/admin?produk=the-moments" : "/admin?produk=acara");
}

"use server";

import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import type { ActionState } from "@/lib/builder";
import { buildEventBody } from "@/lib/event-form";

import { apiErrorMessage } from "../[id]/generic-event";

/** Creates a WEDDING or GENERIC event (`kind` hidden input) and redirects to it. */
export async function createEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const kind = form.get("kind") === "WEDDING" ? "WEDDING" : "GENERIC";
  const built = buildEventBody(kind, form);
  if (!("body" in built)) return built;

  let id: string;
  try {
    ({
      event: { id },
    } = await api<{ event: { id: string } }>("/v1/events", { method: "POST", body: built.body }));
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal membuat acara.") };
  }
  redirect(`/admin/events/${id}`);
}

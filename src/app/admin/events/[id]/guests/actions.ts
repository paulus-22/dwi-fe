"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";
import type { ActionState } from "@/lib/builder";

import { apiErrorMessage } from "../generic-event";

/** `ActionState` plus the just-created guest, so the form can show their link right away. */
export type CreateGuestState = (NonNullable<ActionState> & { guest?: { name: string; code: string } }) | undefined;

export async function createGuest(eventId: string, _: CreateGuestState, form: FormData): Promise<CreateGuestState> {
  const householdName = String(form.get("householdName") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const allowanceRaw = String(form.get("plusGuestAllowance") ?? "").trim();
  if (!householdName) return { error: "Nama wajib diisi." };
  if (householdName.length > 120) return { error: "Nama maksimal 120 karakter." };
  const plusGuestAllowance = allowanceRaw ? Number(allowanceRaw) : 0;
  if (!Number.isInteger(plusGuestAllowance) || plusGuestAllowance < 0 || plusGuestAllowance > 20) {
    return { error: "Jumlah tambahan harus bilangan bulat antara 0 dan 20." };
  }
  let code: string;
  try {
    const res = await api<{ guest: { code: string; householdName: string } }>(`/v1/events/${eventId}/guests`, {
      method: "POST",
      body: { householdName, phone: phone || null, plusGuestAllowance, category: category || null },
    });
    code = res.guest.code;
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menambah tamu.") };
  }
  revalidatePath(`/admin/events/${eventId}/guests`);
  return { ok: true, guest: { name: householdName, code } };
}

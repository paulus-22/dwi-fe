"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";
import type { ActionState } from "@/lib/builder";
import { parseAllowlist, type RegistrationMode } from "@/lib/tickets";

import { apiErrorMessage } from "../generic-event";

const refresh = (eventId: string) => revalidatePath(`/admin/events/${eventId}/tickets`);

export async function createTicketType(eventId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const quotaRaw = String(form.get("quota") ?? "").trim();
  if (!name) return { error: "Nama jenis tiket wajib diisi." };
  let quota: number | null = null;
  if (quotaRaw) {
    quota = Number(quotaRaw);
    if (!Number.isInteger(quota) || quota < 1) return { error: "Kuota harus bilangan bulat minimal 1 (kosongkan untuk tidak terbatas)." };
  }
  try {
    await api(`/v1/events/${eventId}/ticket-types`, {
      method: "POST",
      body: { name, description: description || null, quota },
    });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal membuat jenis tiket.") };
  }
  refresh(eventId);
  return { ok: true };
}

export async function updateTicketType(
  eventId: string,
  id: string,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const sortOrder = Number(form.get("sortOrder") ?? 0);
  if (!name) return { error: "Nama jenis tiket wajib diisi." };
  if (!Number.isInteger(sortOrder)) return { error: "Urutan harus bilangan bulat." };
  try {
    await api(`/v1/ticket-types/${id}`, { method: "PUT", body: { name, description: description || null, sortOrder } });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menyimpan jenis tiket.") };
  }
  refresh(eventId);
  return { ok: true };
}

export async function expandTicketType(eventId: string, id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const count = Number(form.get("count") ?? 0);
  if (!Number.isInteger(count) || count < 1 || count > 10000) return { error: "Jumlah harus antara 1 dan 10.000." };
  try {
    await api(`/v1/ticket-types/${id}/expand`, { method: "POST", body: { count } });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menambah slot.") };
  }
  refresh(eventId);
  return { ok: true };
}

export async function deleteTicketType(eventId: string, id: string): Promise<ActionState> {
  try {
    await api(`/v1/ticket-types/${id}`, { method: "DELETE" });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menghapus jenis tiket.") };
  }
  refresh(eventId);
  return { ok: true };
}

export async function setRegistrationMode(eventId: string, mode: RegistrationMode): Promise<ActionState> {
  try {
    await api(`/v1/events/${eventId}/registration-mode`, { method: "PUT", body: { mode } });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal mengubah mode pendaftaran.") };
  }
  refresh(eventId);
  return { ok: true };
}

export async function addAllowlist(eventId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const entries = parseAllowlist(String(form.get("entries") ?? ""));
  if (entries.length === 0) return { error: "Tempel minimal satu nomor HP atau email." };
  if (entries.length > 5000) return { error: "Maksimal 5.000 entri sekali tambah." };
  try {
    await api(`/v1/events/${eventId}/allowlist`, { method: "POST", body: { entries } });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menambah daftar izin.") };
  }
  refresh(eventId);
  return { ok: true };
}

export async function removeAllowlistEntry(eventId: string, id: string): Promise<ActionState> {
  try {
    await api(`/v1/allowlist/${id}`, { method: "DELETE" });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menghapus entri.") };
  }
  refresh(eventId);
  return { ok: true };
}

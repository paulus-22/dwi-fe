"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";

export async function createPairingCode(eventId: string, form: FormData) {
  const label = String(form.get("label") ?? "").trim();
  const gate = String(form.get("gate") ?? "Pintu Utama").trim() || "Pintu Utama";
  await api(`/v1/events/${eventId}/pairing-codes`, { method: "POST", body: { label: label || null, gate } });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

export async function revokePairingCode(eventId: string, codeId: string) {
  await api(`/v1/pairing-codes/${codeId}`, { method: "DELETE" });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

export async function revokeDevice(eventId: string, deviceId: string) {
  await api(`/v1/devices/${deviceId}`, { method: "DELETE" });
  revalidatePath(`/admin/events/${eventId}/scanner`);
}

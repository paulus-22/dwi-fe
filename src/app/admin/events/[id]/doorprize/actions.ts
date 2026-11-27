"use server";

import { revalidatePath } from "next/cache";

import { ApiError, api } from "@/lib/api";
import type { DoorprizeState, DoorprizeWinner } from "@/lib/doorprize-types";

export async function fetchDoorprizeAction(
  eventId: string,
): Promise<{ ok: true; data: DoorprizeState } | { ok: false; error: string }> {
  try {
    const data = await api<DoorprizeState>(`/v1/events/${eventId}/doorprize`);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Gagal memuat data peserta hadir." };
  }
}

export async function recordWinnerAction(
  eventId: string,
  input: {
    checkInId: string;
    code: string;
    name: string;
    householdName: string | null;
    prize: string | null;
  },
): Promise<{ ok: true; winner: DoorprizeWinner } | { ok: false; error: string }> {
  try {
    const res = await api<{ winner: DoorprizeWinner }>(`/v1/events/${eventId}/doorprize/winners`, {
      method: "POST",
      body: input,
    });
    revalidatePath(`/admin/events/${eventId}/doorprize`);
    return { ok: true, winner: res.winner };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Gagal menyimpan pemenang." };
  }
}

export async function removeWinnerAction(
  eventId: string,
  winnerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api<void>(`/v1/events/${eventId}/doorprize/winners/${winnerId}`, {
      method: "DELETE",
    });
    revalidatePath(`/admin/events/${eventId}/doorprize`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Gagal menghapus pemenang." };
  }
}

export async function resetWinnersAction(
  eventId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api<void>(`/v1/events/${eventId}/doorprize/winners`, {
      method: "DELETE",
    });
    revalidatePath(`/admin/events/${eventId}/doorprize`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Gagal mereset daftar pemenang." };
  }
}

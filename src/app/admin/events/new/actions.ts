"use server";

import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import type { ActionState } from "@/lib/builder";

/** UTC offset for the three timezones events can be created in. */
const OFFSETS: Record<string, string> = {
  "Asia/Jakarta": "+07:00",
  "Asia/Makassar": "+08:00",
  "Asia/Jayapura": "+09:00",
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Creates a GENERIC event (the only kind supported here — WEDDING events are
 * still created in the old app). Redirects straight to the new event on
 * success, same pattern as `login`. */
export async function createEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const title = String(form.get("title") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const subtitle = String(form.get("subtitle") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const timezone = String(form.get("timezone") ?? "Asia/Jakarta");
  const localDate = String(form.get("headlineDate") ?? "");

  if (!title) return { error: "Judul acara wajib diisi." };
  if (!SLUG_RE.test(slug)) return { error: "Slug hanya boleh huruf kecil, angka, dan tanda hubung (tanpa di awal/akhir)." };
  if (!localDate) return { error: "Tanggal & waktu acara wajib diisi." };
  const offset = OFFSETS[timezone] ?? OFFSETS["Asia/Jakarta"];
  const headlineDate = `${localDate}:00${offset}`;

  let id: string;
  try {
    const { event } = await api<{ event: { id: string } }>("/v1/events", {
      method: "POST",
      body: {
        kind: "GENERIC",
        slug,
        title,
        subtitle: subtitle || null,
        description: description || null,
        headlineDate,
        timezone,
      },
    });
    id = event.id;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message || "Gagal membuat acara." };
    throw e;
  }
  redirect(`/admin/events/${id}`);
}

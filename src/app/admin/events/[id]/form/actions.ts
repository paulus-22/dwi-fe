"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";
import {
  FIELD_TYPES,
  hasOptions,
  nextSortOrder,
  reorder,
  type ActionState,
  type FieldOption,
  type FieldType,
  type FormField,
} from "@/lib/builder";

import { apiErrorMessage } from "../generic-event";

type FieldBody = Omit<FormField, "id">;

const listFields = async (eventId: string) =>
  (await api<{ fields: FormField[] }>(`/v1/events/${eventId}/form-fields`)).fields;

const bodyOf = ({ fieldKey, labelId, labelEn, fieldType, options, required, sortOrder }: FormField): FieldBody => ({
  fieldKey,
  labelId,
  labelEn,
  fieldType,
  options,
  required,
  sortOrder,
});

function parseOptions(raw: string): FieldOption[] | string {
  let rows: unknown;
  try {
    rows = JSON.parse(raw || "[]");
  } catch {
    return "Data pilihan tidak valid.";
  }
  if (!Array.isArray(rows)) return "Data pilihan tidak valid.";
  const options: FieldOption[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    const value = String(r?.value ?? "").trim();
    const labelId = String(r?.labelId ?? "").trim();
    const labelEn = String(r?.labelEn ?? "").trim();
    if (!value || !labelId) return "Setiap pilihan wajib punya nilai dan label (ID).";
    options.push({ value, labelId, labelEn: labelEn || null });
  }
  if (options.length === 0) return "Tambahkan minimal satu pilihan.";
  if (new Set(options.map((o) => o.value)).size !== options.length) return "Nilai pilihan tidak boleh sama.";
  return options;
}

/** Create (fieldId = null) or update one field from the editor form. */
export async function saveField(
  eventId: string,
  fieldId: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const fieldKey = String(form.get("fieldKey") ?? "").trim();
  const labelId = String(form.get("labelId") ?? "").trim();
  const labelEn = String(form.get("labelEn") ?? "").trim();
  const fieldType = String(form.get("fieldType") ?? "") as FieldType;
  const required = form.get("required") === "on";

  if (!/^[a-z][a-z0-9_]*$/.test(fieldKey))
    return { error: "Kunci hanya boleh huruf kecil, angka, dan garis bawah, diawali huruf (mis. ukuran_kaos)." };
  if (!labelId) return { error: "Label (ID) wajib diisi." };
  if (!FIELD_TYPES.includes(fieldType)) return { error: "Jenis field tidak dikenal." };

  let options: FieldOption[] = [];
  if (hasOptions(fieldType)) {
    const parsed = parseOptions(String(form.get("options") ?? ""));
    if (typeof parsed === "string") return { error: parsed };
    options = parsed;
  }

  try {
    const body: FieldBody = { fieldKey, labelId, labelEn: labelEn || null, fieldType, options, required, sortOrder: 0 };
    if (fieldId) {
      body.sortOrder = Number(form.get("sortOrder") ?? 0) || 0;
      await api(`/v1/form-fields/${fieldId}`, { method: "PUT", body });
    } else {
      body.sortOrder = nextSortOrder(await listFields(eventId));
      await api(`/v1/events/${eventId}/form-fields`, { method: "POST", body });
    }
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menyimpan field.") };
  }
  revalidatePath(`/admin/events/${eventId}/form`);
  return { ok: true };
}

export async function deleteField(eventId: string, fieldId: string): Promise<ActionState> {
  try {
    await api(`/v1/form-fields/${fieldId}`, { method: "DELETE" });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menghapus field.") };
  }
  revalidatePath(`/admin/events/${eventId}/form`);
  return { ok: true };
}

export async function moveField(eventId: string, fieldId: string, dir: -1 | 1): Promise<ActionState> {
  try {
    const changed = reorder(await listFields(eventId), fieldId, dir);
    await Promise.all(changed.map((f) => api(`/v1/form-fields/${f.id}`, { method: "PUT", body: bodyOf(f) })));
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal mengubah urutan.") };
  }
  revalidatePath(`/admin/events/${eventId}/form`);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api";
import { BLOCK_TYPES, nextSortOrder, parseConfig, reorder, type ActionState, type BlockType, type PageBlock } from "@/lib/builder";

import { apiErrorMessage } from "../generic-event";

type BlockBody = Omit<PageBlock, "id">;

const listBlocks = async (eventId: string) =>
  (await api<{ blocks: PageBlock[] }>(`/v1/events/${eventId}/page-blocks`)).blocks;

const bodyOf = ({ blockType, config, sortOrder, isVisible }: PageBlock): BlockBody => ({
  blockType,
  config,
  sortOrder,
  isVisible,
});

const putBlock = (b: PageBlock) => api(`/v1/page-blocks/${b.id}`, { method: "PUT", body: bodyOf(b) });

/** Create (blockId = null) or update one block from the editor form. */
export async function saveBlock(
  eventId: string,
  blockId: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blockType = String(form.get("blockType") ?? "") as BlockType;
  const isVisible = form.get("isVisible") === "on";
  if (!BLOCK_TYPES.includes(blockType)) return { error: "Jenis blok tidak dikenal." };
  const parsed = parseConfig(String(form.get("config") ?? ""));
  if ("error" in parsed) return { error: parsed.error };

  try {
    const body: BlockBody = { blockType, config: parsed.config, isVisible, sortOrder: 0 };
    if (blockId) {
      body.sortOrder = Number(form.get("sortOrder") ?? 0) || 0;
      await api(`/v1/page-blocks/${blockId}`, { method: "PUT", body });
    } else {
      body.sortOrder = nextSortOrder(await listBlocks(eventId));
      await api(`/v1/events/${eventId}/page-blocks`, { method: "POST", body });
    }
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menyimpan blok.") };
  }
  revalidatePath(`/admin/events/${eventId}/blocks`);
  return { ok: true };
}

export async function deleteBlock(eventId: string, blockId: string): Promise<ActionState> {
  try {
    await api(`/v1/page-blocks/${blockId}`, { method: "DELETE" });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal menghapus blok.") };
  }
  revalidatePath(`/admin/events/${eventId}/blocks`);
  return { ok: true };
}

export async function moveBlock(eventId: string, blockId: string, dir: -1 | 1): Promise<ActionState> {
  try {
    await Promise.all(reorder(await listBlocks(eventId), blockId, dir).map(putBlock));
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal mengubah urutan.") };
  }
  revalidatePath(`/admin/events/${eventId}/blocks`);
  return { ok: true };
}

export async function toggleBlock(eventId: string, blockId: string): Promise<ActionState> {
  try {
    const block = (await listBlocks(eventId)).find((b) => b.id === blockId);
    if (!block) return { error: "Blok tidak ditemukan." };
    await putBlock({ ...block, isVisible: !block.isVisible });
  } catch (e) {
    return { error: apiErrorMessage(e, "Gagal mengubah tampilan blok.") };
  }
  revalidatePath(`/admin/events/${eventId}/blocks`);
  return { ok: true };
}

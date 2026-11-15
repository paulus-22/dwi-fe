"use client";

import { useActionState, useState } from "react";

import { Button, Card, Notice } from "@/components/ui";
import {
  BLOCK_TYPE_LABELS,
  BLOCK_TYPES,
  parseConfig,
  type ActionState,
  type BlockType,
  type PageBlock,
} from "@/lib/builder";

import { inputCls, RowControls, smallBtn, submitKeepingInput, useRowAction } from "../builder-ui";
import { deleteBlock, moveBlock, saveBlock, toggleBlock } from "./actions";

export function BlockBuilder({ eventId, blocks }: { eventId: string; blocks: PageBlock[] }) {
  // "new" = the add form is open; a block id = that block's editor is open.
  const [open, setOpen] = useState<string | null>(null);
  const row = useRowAction();

  return (
    <div className="space-y-4">
      {row.error ? <Notice tone="error">{row.error}</Notice> : null}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Susunan halaman</h2>
            <p className="text-sm text-admin-muted">Blok tampil di halaman acara sesuai urutan di bawah.</p>
          </div>
          {open === "new" ? null : <Button onClick={() => setOpen("new")}>Tambah blok</Button>}
        </div>

        {blocks.length === 0 && open !== "new" ? (
          <p className="text-sm text-admin-muted">Belum ada blok. Tambahkan blok pertama.</p>
        ) : (
          <ol className="divide-y divide-panel-border">
            {blocks.map((b, i) => (
              <li key={b.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={`min-w-0 ${b.isVisible ? "" : "opacity-50"}`}>
                    <p className="font-medium">
                      <span className="mr-2 text-admin-faint tabular-nums">{i + 1}.</span>
                      {BLOCK_TYPE_LABELS[b.blockType] ?? b.blockType}
                    </p>
                    <p className="text-xs text-admin-muted">
                      <code>{b.blockType}</code> · {b.isVisible ? "Tampil" : "Disembunyikan"}
                    </p>
                  </div>
                  <RowControls
                    index={i}
                    count={blocks.length}
                    pending={row.pending}
                    editing={open === b.id}
                    onMove={(dir) => row.run(() => moveBlock(eventId, b.id, dir))}
                    onEdit={() => setOpen(open === b.id ? null : b.id)}
                    onDelete={() => {
                      if (confirm(`Hapus blok "${BLOCK_TYPE_LABELS[b.blockType] ?? b.blockType}"?`))
                        row.run(() => deleteBlock(eventId, b.id));
                    }}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className={smallBtn}
                      disabled={row.pending}
                      onClick={() => row.run(() => toggleBlock(eventId, b.id))}
                    >
                      {b.isVisible ? "Sembunyikan" : "Tampilkan"}
                    </Button>
                  </RowControls>
                </div>
                {open === b.id ? (
                  <BlockEditor key={b.id} eventId={eventId} block={b} onDone={() => setOpen(null)} />
                ) : null}
              </li>
            ))}
          </ol>
        )}

        {open === "new" ? (
          <div className="mt-4 border-t border-panel-border pt-4">
            <h3 className="mb-1 font-medium">Blok baru</h3>
            <BlockEditor key="new" eventId={eventId} onDone={() => setOpen(null)} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function BlockEditor({ eventId, block, onDone }: { eventId: string; block?: PageBlock; onDone: () => void }) {
  const [config, setConfig] = useState(() => JSON.stringify(block?.config ?? {}, null, 2));
  const [touched, setTouched] = useState(false);
  const parsed = parseConfig(config);
  const jsonError = "error" in parsed ? parsed.error : undefined;

  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    // Never send invalid JSON: surface the parse error inline instead.
    const check = parseConfig(String(form.get("config") ?? ""));
    if ("error" in check) return { error: check.error };
    const res = await saveBlock(eventId, block?.id ?? null, prev, form);
    if (res?.ok) onDone();
    return res;
  }, undefined);

  return (
    <form
      onSubmit={(e) => {
        setTouched(true);
        submitKeepingInput(e, action);
      }}
      className="mt-3 space-y-4 rounded-[var(--radius-control)] border border-gold-line bg-white/60 p-4"
    >
      {state?.error && state.error !== jsonError ? <Notice tone="error">{state.error}</Notice> : null}
      {block ? <input type="hidden" name="sortOrder" value={block.sortOrder} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Jenis blok</span>
          <select name="blockType" defaultValue={block?.blockType ?? "COVER"} className={inputCls}>
            {BLOCK_TYPES.map((t: BlockType) => (
              <option key={t} value={t}>
                {BLOCK_TYPE_LABELS[t]} ({t})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input type="checkbox" name="isVisible" defaultChecked={block?.isVisible ?? true} className="size-4 accent-gold" />
          Tampilkan di halaman
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Konfigurasi (JSON)</span>
        <textarea
          name="config"
          value={config}
          onChange={(e) => {
            setConfig(e.target.value);
            setTouched(true);
          }}
          rows={Math.min(Math.max(config.split("\n").length + 1, 6), 24)}
          spellCheck={false}
          aria-invalid={jsonError ? true : undefined}
          className={`w-full rounded-[var(--radius-control)] border bg-white px-3 py-2 font-mono text-sm outline-none focus:border-gold ${
            jsonError && touched ? "border-danger" : "border-panel-border"
          }`}
        />
        {jsonError && touched ? (
          <span role="alert" className="block text-sm text-danger">
            {jsonError}
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !!jsonError}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending || !!jsonError}
          onClick={() => "config" in parsed && setConfig(JSON.stringify(parsed.config, null, 2))}
        >
          Rapikan JSON
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Batal
        </Button>
      </div>
    </form>
  );
}

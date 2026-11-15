"use client";

import { useActionState, useState } from "react";

import { Button, Card, Notice } from "@/components/ui";
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  hasOptions,
  type ActionState,
  type FieldType,
  type FormField,
} from "@/lib/builder";

import { inputCls, RowControls, smallBtn, submitKeepingInput, useRowAction } from "../builder-ui";
import { deleteField, moveField, saveField } from "./actions";

export function FormBuilder({ eventId, fields }: { eventId: string; fields: FormField[] }) {
  // "new" = the add form is open; a field id = that field's editor is open.
  const [open, setOpen] = useState<string | null>(null);
  const row = useRowAction();

  return (
    <div className="space-y-4">
      {row.error ? <Notice tone="error">{row.error}</Notice> : null}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Pertanyaan</h2>
            <p className="text-sm text-admin-muted">Diisi peserta saat mendaftar, tampil sesuai urutan di bawah.</p>
          </div>
          {open === "new" ? null : <Button onClick={() => setOpen("new")}>Tambah field</Button>}
        </div>

        {fields.length === 0 && open !== "new" ? (
          <p className="text-sm text-admin-muted">Belum ada field. Tambahkan pertanyaan pertama.</p>
        ) : (
          <ol className="divide-y divide-panel-border">
            {fields.map((f, i) => (
              <li key={f.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      <span className="mr-2 text-admin-faint tabular-nums">{i + 1}.</span>
                      {f.labelId}
                      {f.required ? <span className="ml-1 text-danger">*</span> : null}
                    </p>
                    <p className="text-xs text-admin-muted">
                      <code>{f.fieldKey}</code> · {FIELD_TYPE_LABELS[f.fieldType] ?? f.fieldType}
                      {hasOptions(f.fieldType) ? ` · ${f.options.length} pilihan` : ""}
                      {f.labelEn ? ` · EN: ${f.labelEn}` : ""}
                    </p>
                  </div>
                  <RowControls
                    index={i}
                    count={fields.length}
                    pending={row.pending}
                    editing={open === f.id}
                    onMove={(dir) => row.run(() => moveField(eventId, f.id, dir))}
                    onEdit={() => setOpen(open === f.id ? null : f.id)}
                    onDelete={() => {
                      if (confirm(`Hapus field "${f.labelId}"? Jawaban peserta untuk field ini ikut terhapus.`))
                        row.run(() => deleteField(eventId, f.id));
                    }}
                  />
                </div>
                {open === f.id ? (
                  <FieldEditor key={f.id} eventId={eventId} field={f} onDone={() => setOpen(null)} />
                ) : null}
              </li>
            ))}
          </ol>
        )}

        {open === "new" ? (
          <div className="mt-4 border-t border-panel-border pt-4">
            <h3 className="mb-1 font-medium">Field baru</h3>
            <FieldEditor key="new" eventId={eventId} onDone={() => setOpen(null)} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

type OptionRow = { key: number; value: string; labelId: string; labelEn: string };

function FieldEditor({ eventId, field, onDone }: { eventId: string; field?: FormField; onDone: () => void }) {
  const [fieldType, setFieldType] = useState<FieldType>(field?.fieldType ?? "TEXT");
  const [options, setOptions] = useState<OptionRow[]>(() =>
    (field?.options ?? []).map((o, i) => ({ key: i, value: o.value, labelId: o.labelId, labelEn: o.labelEn ?? "" })),
  );
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await saveField(eventId, field?.id ?? null, prev, form);
    if (res?.ok) onDone();
    return res;
  }, undefined);

  const update = (key: number, patch: Partial<OptionRow>) =>
    setOptions((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addOption = () =>
    setOptions((rows) => [...rows, { key: rows.reduce((m, r) => Math.max(m, r.key), -1) + 1, value: "", labelId: "", labelEn: "" }]);

  return (
    <form onSubmit={(e) => submitKeepingInput(e, action)} className="mt-3 space-y-4 rounded-[var(--radius-control)] border border-gold-line bg-white/60 p-4">
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {field ? <input type="hidden" name="sortOrder" value={field.sortOrder} /> : null}
      <input
        type="hidden"
        name="options"
        value={JSON.stringify(options.map(({ value, labelId, labelEn }) => ({ value, labelId, labelEn })))}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Kunci (huruf kecil, tanpa spasi)</span>
          <input name="fieldKey" defaultValue={field?.fieldKey} required placeholder="ukuran_kaos" className={`${inputCls} font-mono`} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Jenis</span>
          <select
            name="fieldType"
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as FieldType)}
            className={inputCls}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Label (Indonesia)</span>
          <input name="labelId" defaultValue={field?.labelId} required placeholder="Ukuran kaos" className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Label (English, opsional)</span>
          <input name="labelEn" defaultValue={field?.labelEn ?? ""} placeholder="T-shirt size" className={inputCls} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="required" defaultChecked={field?.required ?? false} className="size-4 accent-gold" />
        Wajib diisi
      </label>

      {hasOptions(fieldType) ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm text-admin-muted">Pilihan</legend>
          {options.length === 0 ? <p className="text-sm text-admin-faint">Belum ada pilihan.</p> : null}
          {options.map((o) => (
            <div key={o.key} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <input
                aria-label="Nilai"
                placeholder="Nilai (mis. xl)"
                value={o.value}
                onChange={(e) => update(o.key, { value: e.target.value })}
                className={`${inputCls} font-mono`}
              />
              <input
                aria-label="Label (ID)"
                placeholder="Label (ID)"
                value={o.labelId}
                onChange={(e) => update(o.key, { labelId: e.target.value })}
                className={inputCls}
              />
              <input
                aria-label="Label (EN)"
                placeholder="Label (EN, opsional)"
                value={o.labelEn}
                onChange={(e) => update(o.key, { labelEn: e.target.value })}
                className={inputCls}
              />
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-3"
                onClick={() => setOptions((rows) => rows.filter((r) => r.key !== o.key))}
                aria-label="Hapus pilihan"
              >
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" className={smallBtn} onClick={addOption}>
            + Tambah pilihan
          </Button>
        </fieldset>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Batal
        </Button>
      </div>
    </form>
  );
}

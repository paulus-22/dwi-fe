"use client";

import { useState } from "react";

import { Button, Notice } from "@/components/ui";
import { hasOptions, type FormField } from "@/lib/builder";
import { submitRsvp, type RsvpResponseValue } from "@/lib/public-client";

import { fieldCls, NeedsInvitation, type BlockGuest } from "./rsvp-block";

type Value = string | string[];

/**
 * Renders the event's dynamic registration form (`/form-fields`) and submits
 * the answers as `responses` on the RSVP call. Registering counts as attending,
 * so it posts `attending: true` with the guest's existing headcount (or 1).
 */
export function RegistrationBlock({
  slug,
  guest,
  fields,
  description,
}: {
  slug: string;
  guest: BlockGuest | null;
  fields: FormField[];
  description?: string;
}) {
  const [name, setName] = useState(guest?.householdName ?? "");
  const [values, setValues] = useState<Record<string, Value>>({});
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  if (!guest) return <NeedsInvitation />;
  if (fields.length === 0) return <p className="text-admin-muted">Formulir pendaftaran belum tersedia.</p>;

  const set = (key: string, v: Value) => setValues((cur) => ({ ...cur, [key]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest) return;
    if (!name.trim()) return setError("Nama wajib diisi.");
    const responses: RsvpResponseValue[] = [];
    for (const f of fields) {
      const v = values[f.fieldKey];
      const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) {
        if (f.required) return setError(`"${f.labelId}" wajib diisi.`);
        continue;
      }
      responses.push({ fieldKey: f.fieldKey, value: f.fieldType === "NUMBER" ? Number(v) : v });
    }
    setError(null);
    setState("sending");
    const failure = await submitRsvp(slug, guest.token, {
      name: name.trim(),
      attending: true,
      guestCount: guest.rsvp?.attending ? guest.rsvp.guestCount : 1,
      responses,
    });
    if (failure !== null) {
      setState("idle");
      setError(failure || "Gagal mengirim. Coba lagi sebentar.");
      return;
    }
    setState("done");
  }

  if (state === "done") return <Notice>Terima kasih! Pendaftaran Anda sudah kami terima.</Notice>;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {description ? <p className="text-admin-muted">{description}</p> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Nama</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={fieldCls} />
      </label>
      {fields.map((f) => (
        <FieldInput key={f.id} field={f} value={values[f.fieldKey]} onChange={(v) => set(f.fieldKey, v)} />
      ))}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Mengirim…" : "Daftar"}
      </Button>
    </form>
  );
}

function FieldInput({ field: f, value, onChange }: { field: FormField; value: Value | undefined; onChange: (v: Value) => void }) {
  const label = (
    <span className="text-sm text-admin-muted">
      {f.labelId}
      {f.required ? <span className="text-danger"> *</span> : null}
    </span>
  );
  const options = hasOptions(f.fieldType) ? (f.options ?? []) : [];
  const str = typeof value === "string" ? value : "";

  switch (f.fieldType) {
    case "TEXTAREA":
      return (
        <label className="block space-y-1.5">
          {label}
          <textarea value={str} onChange={(e) => onChange(e.target.value)} rows={3} className={fieldCls} />
        </label>
      );
    case "NUMBER":
      return (
        <label className="block space-y-1.5">
          {label}
          <input type="number" value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
        </label>
      );
    case "DATE":
      return (
        <label className="block space-y-1.5">
          {label}
          <input type="date" value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
        </label>
      );
    case "SELECT":
      return (
        <label className="block space-y-1.5">
          {label}
          <select value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls}>
            <option value="">— Pilih —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.labelId}
              </option>
            ))}
          </select>
        </label>
      );
    case "RADIO":
      return (
        <fieldset className="space-y-1.5">
          <legend>{label}</legend>
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2">
              <input type="radio" name={f.fieldKey} checked={str === o.value} onChange={() => onChange(o.value)} className="accent-gold" />
              {o.labelId}
            </label>
          ))}
        </fieldset>
      );
    case "CHECKBOX": {
      const picked = Array.isArray(value) ? value : [];
      return (
        <fieldset className="space-y-1.5">
          <legend>{label}</legend>
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={picked.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...picked, o.value] : picked.filter((x) => x !== o.value))}
                className="size-4 accent-gold"
              />
              {o.labelId}
            </label>
          ))}
        </fieldset>
      );
    }
    default:
      return (
        <label className="block space-y-1.5">
          {label}
          <input value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
        </label>
      );
  }
}

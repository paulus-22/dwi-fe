"use client";

import { useState } from "react";

import { hasOptions, type FormField } from "@/lib/builder";
import { register, submitRsvp, type RsvpResponseValue } from "@/lib/public-client";
import type { PublicTicketType } from "@/lib/tickets";

import { fieldCls, FormNotice, labelCls, NeedsInvitation, type BlockGuest, type Shape } from "./rsvp-block";

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
  ticketTypes = [],
  registrationMode,
  description,
  shape = "sharp",
}: {
  slug: string;
  guest: BlockGuest | null;
  fields: FormField[];
  ticketTypes?: PublicTicketType[];
  registrationMode?: "CLOSED" | "OPEN" | "ALLOWLIST";
  description?: string;
  shape?: Shape;
}) {
  if (guest) return <GuestRegistration slug={slug} guest={guest} fields={fields} description={description} shape={shape} />;
  // No personal link: self-register if there are ticket types, else invite-only as before.
  if (ticketTypes.length === 0) return <NeedsInvitation />;
  return (
    <SelfRegistration
      slug={slug}
      fields={fields}
      ticketTypes={ticketTypes}
      allowlist={registrationMode === "ALLOWLIST"}
      description={description}
      shape={shape}
    />
  );
}

function Check() {
  return (
    <span aria-hidden="true" className="mx-auto grid size-[60px] place-items-center rounded-full bg-[#f1dfbb] text-[29px] text-[#76511d]">
      ✓
    </span>
  );
}

/** Validates the dynamic fields into API `responses`, or returns an error message. */
function collectResponses(fields: FormField[], values: Record<string, Value>): RsvpResponseValue[] | string {
  const responses: RsvpResponseValue[] = [];
  for (const f of fields) {
    const v = values[f.fieldKey];
    const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (f.required) return `"${f.labelId}" wajib diisi.`;
      continue;
    }
    responses.push({
      fieldKey: f.fieldKey,
      value: f.fieldType === "NUMBER" ? Number(v) : v,
    });
  }
  return responses;
}

const REGISTER_ERRORS: Record<string, string> = {
  sold_out: "Maaf, tiket jenis ini sudah habis. Silakan pilih jenis tiket lain.",
  not_allowlisted:
    "Nomor HP / email ini tidak terdaftar di daftar peserta, atau sudah pernah dipakai untuk mendaftar. Hubungi penyelenggara jika Anda merasa ini keliru.",
};

function SelfRegistration({
  slug,
  fields,
  ticketTypes,
  allowlist,
  description,
  shape,
}: {
  slug: string;
  fields: FormField[];
  ticketTypes: PublicTicketType[];
  allowlist: boolean;
  description?: string;
  shape: Shape;
}) {
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes.length === 1 ? ticketTypes[0].id : "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [values, setValues] = useState<Record<string, Value>>({});
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [token, setToken] = useState<string | null>(null);

  if (token) {
    return (
      <div className={`space-y-3 ${shape === "soft" ? "text-center" : ""}`}>
        {shape === "soft" ? <Check /> : null}
        <FormNotice>Pendaftaran berhasil! Tiket dan kode QR Anda sudah siap.</FormNotice>
        <a href={`/v/${encodeURIComponent(slug)}?to=${encodeURIComponent(token)}`} className="gt-btn !w-auto px-6">
          Lihat tiket &amp; QR
        </a>
        <p className="text-sm text-[var(--g-muted)]">Simpan tautan tersebut. Konfirmasi juga dikirim lewat WhatsApp jika nomor diisi.</p>
      </div>
    );
  }

  const set = (key: string, v: Value) => setValues((cur) => ({ ...cur, [key]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketTypeId) return setError("Pilih jenis tiket.");
    if (!name.trim()) return setError("Nama wajib diisi.");
    if (allowlist && !phone.trim() && !email.trim()) return setError("Isi nomor HP atau email yang terdaftar.");
    const responses = collectResponses(fields, values);
    if (typeof responses === "string") return setError(responses);
    setError(null);
    setState("sending");
    const res = await register(slug, {
      ticketTypeId,
      name: name.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      responses,
    });
    setState("idle");
    if (res.ok) return setToken(res.token);
    setError(REGISTER_ERRORS[res.code] ?? (res.message || "Gagal mendaftar. Coba lagi sebentar."));
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {description ? <p className="text-sm leading-relaxed text-[var(--g-muted)]">{description}</p> : null}
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <fieldset className="space-y-2">
        <legend className={labelCls}>
          Jenis tiket<span className="text-danger"> *</span>
        </legend>
        {ticketTypes.map((t) => (
          <label key={t.id} className="flex items-start gap-2">
            <input
              type="radio"
              name="ticketType"
              checked={ticketTypeId === t.id}
              onChange={() => setTicketTypeId(t.id)}
              className="mt-1 accent-[var(--g-gold-ink)]"
            />
            <span>
              <span className="font-medium">{t.name}</span>
              {t.description ? <span className="block text-sm text-[var(--g-muted)]">{t.description}</span> : null}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className={labelCls}>
          Nama<span className="text-danger"> *</span>
        </span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={fieldCls} />
      </label>
      <label className="block">
        <span className={labelCls}>
          Nomor HP
          {allowlist ? <span className="text-danger"> * (atau email)</span> : " (opsional)"}
        </span>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls} />
      </label>
      <label className="block">
        <span className={labelCls}>Email{allowlist ? "" : " (opsional)"}</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
      </label>
      {fields.map((f) => (
        <FieldInput key={f.id} field={f} value={values[f.fieldKey]} onChange={(v) => set(f.fieldKey, v)} />
      ))}
      <button type="submit" disabled={state === "sending"} className="gt-btn">
        {state === "sending" ? "Mengirim…" : "Daftar"}
        {shape === "soft" && state !== "sending" ? "　›" : null}
        {shape === "editorial" && state !== "sending" ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}

function GuestRegistration({
  slug,
  guest,
  fields,
  description,
  shape,
}: {
  slug: string;
  guest: BlockGuest;
  fields: FormField[];
  description?: string;
  shape: Shape;
}) {
  const [name, setName] = useState(guest?.householdName ?? "");
  const [values, setValues] = useState<Record<string, Value>>({});
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  if (fields.length === 0) return <p className="text-[var(--g-muted)]">Formulir pendaftaran belum tersedia.</p>;

  const set = (key: string, v: Value) => setValues((cur) => ({ ...cur, [key]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Nama wajib diisi.");
    const responses = collectResponses(fields, values);
    if (typeof responses === "string") return setError(responses);
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

  if (state === "done")
    return (
      <div className={`space-y-3 ${shape === "soft" ? "text-center" : ""}`}>
        {shape === "soft" ? <Check /> : null}
        <FormNotice>Terima kasih! Pendaftaran Anda sudah kami terima.</FormNotice>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {description ? <p className="text-sm leading-relaxed text-[var(--g-muted)]">{description}</p> : null}
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <label className="block">
        <span className={labelCls}>Nama</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={fieldCls} />
      </label>
      {fields.map((f) => (
        <FieldInput key={f.id} field={f} value={values[f.fieldKey]} onChange={(v) => set(f.fieldKey, v)} />
      ))}
      <button type="submit" disabled={state === "sending"} className="gt-btn">
        {state === "sending" ? "Mengirim…" : "Daftar"}
        {shape === "soft" && state !== "sending" ? "　›" : null}
        {shape === "editorial" && state !== "sending" ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}

function FieldInput({ field: f, value, onChange }: { field: FormField; value: Value | undefined; onChange: (v: Value) => void }) {
  const label = (
    <span className={labelCls}>
      {f.labelId}
      {f.required ? <span className="text-danger"> *</span> : null}
    </span>
  );
  const options = hasOptions(f.fieldType) ? (f.options ?? []) : [];
  const str = typeof value === "string" ? value : "";

  switch (f.fieldType) {
    case "TEXTAREA":
      return (
        <label className="block">
          {label}
          <textarea value={str} onChange={(e) => onChange(e.target.value)} rows={3} className={fieldCls} />
        </label>
      );
    case "NUMBER":
      return (
        <label className="block">
          {label}
          <input type="number" value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
        </label>
      );
    case "DATE":
      return (
        <label className="block">
          {label}
          <input type="date" value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
        </label>
      );
    case "SELECT":
      return (
        <label className="block">
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
              <input
                type="radio"
                name={f.fieldKey}
                checked={str === o.value}
                onChange={() => onChange(o.value)}
                className="accent-[var(--g-gold-ink)]"
              />
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
                className="size-4 accent-[var(--g-gold-ink)]"
              />
              {o.labelId}
            </label>
          ))}
        </fieldset>
      );
    }
    default:
      return (
        <label className="block">
          {label}
          <input value={str} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
        </label>
      );
  }
}

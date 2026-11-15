"use client";

import { useActionState, useState } from "react";

import { CopyLinkButton } from "@/components/copy-link-button";
import { Button, Card, Notice } from "@/components/ui";
import { guestLink, voucherLink, type GuestItem } from "@/lib/guests";

import { inputCls, submitKeepingInput } from "../builder-ui";
import { createGuest, type CreateGuestState } from "./actions";

function rsvp(attending: boolean | null) {
  if (attending === null) return { label: "Belum konfirmasi", cls: "text-admin-muted" };
  return attending ? { label: "Hadir", cls: "text-gold-strong" } : { label: "Tidak hadir", cls: "text-danger" };
}

export function GuestManager({
  eventId,
  slug,
  guests,
  noun,
}: {
  eventId: string;
  slug: string;
  guests: GuestItem[];
  noun: string;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-1 font-medium">Tambah {noun}</h2>
        <p className="mb-4 text-sm text-admin-muted">
          Daftar tertutup: Anda menentukan siapa yang diundang, dan masing-masing mendapat satu tautan pribadi.
        </p>
        <AddForm eventId={eventId} slug={slug} noun={noun} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Daftar {noun} ({guests.length})</h2>
        {guests.length === 0 ? (
          <p className="text-sm text-admin-muted">Belum ada {noun}.</p>
        ) : (
          <ul className="divide-y divide-panel-border">
            {guests.map((g) => {
              const s = rsvp(g.attending);
              return (
                <li key={g.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{g.householdName}</p>
                    <p className="text-xs text-admin-muted">
                      {g.category} · <span className={s.cls}>{s.label}</span> · {g.admits} orang
                      {g.checkedInAt ? " · sudah check-in" : ""}
                    </p>
                    <CopyLinkButton path={guestLink(slug, g.code)} label="Tautan undangan" />
                    {g.attending ? (
                      <p className="mt-0.5 text-xs">
                        <CopyLinkButton path={voucherLink(slug, g.code)} label="Tautan QR tiket" />
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AddForm({ eventId, slug, noun }: { eventId: string; slug: string; noun: string }) {
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<CreateGuestState, FormData>(async (prev, form) => {
    const res = await createGuest(eventId, prev, form);
    if (res?.ok) setFormKey((k) => k + 1); // remount to clear the inputs
    return res;
  }, undefined);

  return (
    <form key={formKey} onSubmit={(e) => submitKeepingInput(e, action)} className="space-y-3">
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.guest ? (
        <Notice>
          <span className="block">
            {state.guest.name} ditambahkan. Tautan pribadi (klik untuk menyalin):
          </span>
          <CopyLinkButton path={guestLink(slug, state.guest.code)} label="Tautan undangan" />
        </Notice>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Nama</span>
          <input name="householdName" required maxLength={120} placeholder={`Nama ${noun}`} className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">No. HP (opsional)</span>
          <input name="phone" type="tel" placeholder="081234567890" className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Kategori (opsional)</span>
          <input name="category" maxLength={40} placeholder="Keluarga, VIP, Teman…" className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-admin-muted">Tambahan orang (opsional)</span>
          <input name="plusGuestAllowance" type="number" min={0} max={20} step={1} defaultValue={0} className={inputCls} />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : `Tambah ${noun}`}
      </Button>
    </form>
  );
}

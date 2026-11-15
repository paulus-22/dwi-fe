"use client";

import { useActionState, type ReactNode } from "react";

import { Button, Card, Notice } from "@/components/ui";
import type { EventKind } from "@/lib/api";
import type { ActionState } from "@/lib/builder";
import type { EventDefaults } from "@/lib/event-form";
import { GENERIC_THEME_LIST, resolveGenericTheme } from "@/lib/generic-themes";
import { DEFAULT_THEME, THEME_LIST } from "@/lib/themes";

const field =
  "h-11 w-full rounded-[var(--radius-control)] border border-panel-border bg-white px-3 text-base outline-none focus:border-gold";
const area = `${field} h-auto py-2`;
const label = "block space-y-1.5";
const cap = "text-sm text-admin-muted";

function Input({
  text,
  name,
  defaults,
  hint,
  ...rest
}: {
  text: string;
  name: string;
  defaults?: string | null;
  hint?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  pattern?: string;
}) {
  return (
    <label className={label}>
      <span className={cap}>{text}</span>
      <input name={name} defaultValue={defaults ?? ""} className={field} {...rest} />
      {hint ? <span className="block text-xs text-admin-muted">{hint}</span> : null}
    </label>
  );
}

function Area({
  text,
  name,
  defaults,
  rows = 2,
  hint,
}: {
  text: string;
  name: string;
  defaults?: string | null;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className={label}>
      <span className={cap}>{text}</span>
      <textarea name={name} rows={rows} defaultValue={defaults ?? ""} className={area} />
      {hint ? <span className="block text-xs text-admin-muted">{hint}</span> : null}
    </label>
  );
}

function Pick({
  text,
  name,
  defaults,
  options,
  hint,
}: {
  text: string;
  name: string;
  defaults: string;
  options: [string, string][];
  hint?: string;
}) {
  return (
    <label className={label}>
      <span className={cap}>{text}</span>
      <select name={name} defaultValue={defaults} className={field}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {hint ? <span className="block text-xs text-admin-muted">{hint}</span> : null}
    </label>
  );
}

/** Theme chooser for GENERIC events: radio cards with a swatch + corner-shape hint. */
function GenericThemePick({ defaults }: { defaults?: string }) {
  const current = resolveGenericTheme(defaults).key;
  return (
    <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
      <legend className="sr-only">Tema halaman</legend>
      {GENERIC_THEME_LIST.map((t) => (
        <label
          key={t.key}
          className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-panel-border bg-white p-3 has-[:checked]:border-gold has-[:checked]:ring-2 has-[:checked]:ring-gold/30"
        >
          <input type="radio" name="theme" value={t.key} defaultChecked={t.key === current} className="mt-1 accent-gold" />
          <span className="min-w-0">
            <span className="mb-2 flex gap-1.5" aria-hidden="true">
              {(t.key === "editorial" ? [t.navy, "#ffffff", "#aab3be"] : [t.navy, t.gold, t.cream]).map((c) => (
                <span
                  key={c}
                  className="h-7 w-9 border border-black/10"
                  style={{
                    background: c,
                    borderRadius: t.shape === "soft" ? 999 : t.shape === "editorial" ? 0 : 2,
                  }}
                />
              ))}
            </span>
            <span className="block font-medium">{t.label}</span>
            <span className="block text-sm text-admin-muted">{t.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description ? <p className="mt-1 text-sm text-admin-muted">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

/**
 * Create/edit form for both event kinds. `kind` is fixed per mount (the create
 * page switches it with tabs and remounts; the edit page passes the stored
 * kind) and is submitted as a hidden input.
 */
export function EventForm({
  kind,
  action,
  defaults = {},
  submitLabel,
  pendingLabel,
}: {
  kind: EventKind;
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  defaults?: EventDefaults;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const d = defaults;
  const generic = kind === "GENERIC";

  const basics = (
    <>
      <Input
        text="Slug (untuk tautan publik)"
        name="slug"
        required
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        defaults={d.slug}
        placeholder={generic ? "konferensi-tahunan-2026" : "ayu-bram"}
        hint="Huruf kecil, angka, dan tanda hubung. Mengubahnya mengubah tautan undangan."
      />
      <Input text="Tanggal & waktu" name="headlineDate" type="datetime-local" required defaults={d.headlineDate} />
      <Pick
        text="Zona waktu"
        name="timezone"
        defaults={d.timezone ?? "Asia/Jakarta"}
        options={[
          ["Asia/Jakarta", "WIB (Jakarta)"],
          ["Asia/Makassar", "WITA (Makassar)"],
          ["Asia/Jayapura", "WIT (Jayapura)"],
        ]}
      />
      <Pick
        text="Status"
        name="status"
        defaults={d.status ?? "DRAFT"}
        options={[
          ["DRAFT", "Draf"],
          ["PUBLISHED", "Terbit"],
          ["ARCHIVED", "Arsip"],
        ]}
      />
    </>
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <input type="hidden" name="kind" value={kind} />
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice>Tersimpan.</Notice> : null}

      {generic ? (
        <>
          <Section title="Acara">
            <div className="sm:col-span-2">
              <Input text="Judul acara" name="title" required defaults={d.title} placeholder="Konferensi Tahunan 2026" />
            </div>
            <div className="sm:col-span-2">
              <Input text="Subjudul (opsional)" name="subtitle" defaults={d.subtitle} placeholder="Jakarta Convention Center" />
            </div>
            <div className="sm:col-span-2">
              <Area text="Deskripsi (opsional)" name="description" rows={3} defaults={d.description} />
            </div>
            {basics}
          </Section>
          <Section title="Tema" description="Tampilan halaman publik acara. Warna dan bentuk sudut mengikuti pilihan ini.">
            <GenericThemePick defaults={d.theme} />
          </Section>
        </>
      ) : (
        <>
          <Section title="Dasar">
            {basics}
            <Pick
              text="Bahasa utama"
              name="defaultLocale"
              defaults={d.defaultLocale ?? "ID"}
              options={[
                ["ID", "Indonesia"],
                ["EN", "English"],
              ]}
            />
            <Pick
              text="Pilihan bahasa"
              name="languageMode"
              defaults={d.bilingual === false ? "single" : "bilingual"}
              hint="Satu bahasa menyembunyikan tombol ID/EN pada undangan."
              options={[
                ["bilingual", "Dua bahasa (ID & EN)"],
                ["single", "Satu bahasa saja"],
              ]}
            />
            <Input text="URL musik (opsional)" name="musicUrl" defaults={d.musicUrl} placeholder="/music/song.mp3" />
            <Input text="Tagar" name="hashtag" defaults={d.hashtag} placeholder="#AyuToBram" />
          </Section>

          <Section title="Mempelai">
            <Input text="Nama panggilan mempelai wanita" name="brideShortName" required defaults={d.brideShortName} />
            <Input text="Nama panggilan mempelai pria" name="groomShortName" required defaults={d.groomShortName} />
            <Input text="Nama lengkap mempelai wanita" name="brideFullName" required defaults={d.brideFullName} />
            <Input text="Nama lengkap mempelai pria" name="groomFullName" required defaults={d.groomFullName} />
            <Area text="Orang tua mempelai wanita" name="brideParents" defaults={d.brideParents} />
            <Area text="Orang tua mempelai pria" name="groomParents" defaults={d.groomParents} />
            <Input text="Instagram mempelai wanita" name="brideInstagram" defaults={d.brideInstagram} placeholder="@ayu" />
            <Input text="Instagram mempelai pria" name="groomInstagram" defaults={d.groomInstagram} placeholder="@bram" />
          </Section>

          <Section title="Tema" description="Warna undangan, kartu masuk, dan ilustrasi bunga mengikuti pilihan ini.">
            <div className="sm:col-span-2">
              <Pick text="Tema" name="theme" defaults={d.theme ?? DEFAULT_THEME} options={THEME_LIST.map((t) => [t.key, t.label])} />
            </div>
          </Section>

          <Section title="Konten">
            <Area text="Kutipan pembuka (ID)" name="quoteTextId" defaults={d.quoteTextId} />
            <Area text="Opening quote (EN)" name="quoteTextEn" defaults={d.quoteTextEn} />
            <Area text="Pembuka cerita (ID)" name="storyIntroId" rows={3} defaults={d.storyIntroId} />
            <Area text="Story intro (EN)" name="storyIntroEn" rows={3} defaults={d.storyIntroEn} />
            <Area text="Penutup (ID)" name="closingNoteId" rows={3} defaults={d.closingNoteId} />
            <Area text="Closing note (EN)" name="closingNoteEn" rows={3} defaults={d.closingNoteEn} />
            <Area text="Dress code (ID)" name="dressCodeNoteId" defaults={d.dressCodeNoteId} />
            <Area text="Dress code (EN)" name="dressCodeNoteEn" defaults={d.dressCodeNoteEn} />
            <Input text="Penulis kutipan" name="quoteAuthor" defaults={d.quoteAuthor} placeholder="Maya Angelou" />
            <Input
              text="Warna dress code"
              name="dressCodeColors"
              defaults={d.dressCodeColors}
              placeholder="#8C8D6C, #E9AF8A, #D9D3C4"
              hint="Pisahkan dengan koma."
            />
          </Section>

          <Section
            title="Foto"
            description="Isi jalur berkas (mis. /photos/slug/couple.webp) atau URL lengkap. URL eksternal ditampilkan apa adanya."
          >
            <Input text="Foto mempelai (hero)" name="coverPhotoUrl" defaults={d.coverPhotoUrl} placeholder="/photos/slug/couple.webp" />
            <Input
              text="Foto latar sampul"
              name="coverBackgroundUrl"
              defaults={d.coverBackgroundUrl}
              placeholder="/photos/slug/background.webp"
            />
            <Input text="Foto penutup" name="closingPhotoUrl" defaults={d.closingPhotoUrl} placeholder="/photos/slug/closing.webp" />
            <Input text="Acuan busana" name="dressCodeImageUrl" defaults={d.dressCodeImageUrl} placeholder="/photos/slug/dresscode.webp" />
            <div className="sm:col-span-2">
              <Area
                text="Foto sela"
                name="interludePhotos"
                rows={3}
                defaults={d.interludePhotos}
                hint="Satu jalur per baris. Maksimal 4 yang ditampilkan."
              />
            </div>
          </Section>
        </>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

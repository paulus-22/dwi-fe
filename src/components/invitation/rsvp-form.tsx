"use client";

import { useState } from "react";

import { format, type Dictionary } from "@/i18n/dictionaries";
import { submitRsvp } from "@/lib/public-client";

import { GhostButton, Hairline, UnderlineField, underlineInput } from "./ui";

type ExistingRsvp = {
  attending: boolean;
  guestCount: number;
  message: string | null;
} | null;

export function RsvpForm({
  eventSlug,
  token,
  defaultName,
  maxGuests,
  existing,
  group = false,
  dict,
}: {
  eventSlug: string;
  token: string;
  defaultName: string;
  maxGuests: number;
  existing: ExistingRsvp;
  /** Group invitation — no per-person pass, so no QR/ticket link. */
  group?: boolean;
  dict: Dictionary;
}) {
  const [name, setName] = useState(defaultName);
  const [attending, setAttending] = useState<boolean | null>(
    existing ? existing.attending : null,
  );
  const [guestCount, setGuestCount] = useState(existing?.guestCount || 1);
  const [message, setMessage] = useState(existing?.message ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">(
    existing ? "done" : "idle",
  );
  const [editing, setEditing] = useState(!existing);

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = dict.rsvp.errors.nameRequired;
    if (attending === null) nextErrors.attending = dict.rsvp.errors.attendanceRequired;
    if (attending && (guestCount < 1 || guestCount > maxGuests)) {
      nextErrors.guestCount = format(dict.rsvp.errors.countRange, { max: maxGuests });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    const failure = await submitRsvp(eventSlug, token, {
      name: name.trim(),
      attending: attending === true,
      guestCount: attending ? guestCount : 1,
      message: message.trim(),
    });

    if (failure !== null) {
      setStatus("idle");
      setErrors({ form: failure || dict.rsvp.errors.generic });
      return;
    }

    setStatus("done");
    setEditing(false);
  }

  if (status === "done" && !editing) {
    return (
      <div className="mx-auto max-w-[22rem] text-center">
        <Hairline tone="olive" />
        <p className="mt-7 font-body text-[18px] italic leading-relaxed text-cream">
          {attending ? dict.rsvp.successAttending : dict.rsvp.successDeclined}
        </p>
        {!group ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-7 font-ui text-[10px] uppercase tracking-[0.22em] text-cream/70 underline underline-offset-[6px]"
          >
            {dict.rsvp.update}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-[22rem]">
      <UnderlineField id="rsvp-name" label={dict.rsvp.nameLabel} tone="olive" error={errors.name}>
        <input
          id="rsvp-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={underlineInput.olive}
        />
      </UnderlineField>

      <fieldset className="mb-7">
        <legend className="kicker mb-3 block text-cream/70">
          {dict.rsvp.attendanceLabel}
        </legend>
        <div className="flex flex-col gap-3">
          <RadioRow
            checked={attending === true}
            onSelect={() => setAttending(true)}
            label={dict.rsvp.attending}
          />
          <RadioRow
            checked={attending === false}
            onSelect={() => setAttending(false)}
            label={dict.rsvp.notAttending}
          />
        </div>
        {errors.attending ? (
          <p className="mt-2 font-ui text-[11px] text-rose">{errors.attending}</p>
        ) : null}
      </fieldset>

      {attending && maxGuests > 1 ? (
        <UnderlineField
          id="rsvp-count"
          label={dict.rsvp.countLabel}
          tone="olive"
          hint={format(dict.rsvp.countHint, { max: maxGuests })}
          error={errors.guestCount}
        >
          <select
            id="rsvp-count"
            value={guestCount}
            onChange={(event) => setGuestCount(Number(event.target.value))}
            className={`${underlineInput.olive} appearance-none`}
          >
            {Array.from({ length: maxGuests }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value} className="bg-olive-deep">
                {value}
              </option>
            ))}
          </select>
        </UnderlineField>
      ) : null}

      <UnderlineField id="rsvp-message" label={dict.rsvp.messageLabel} tone="olive">
        <textarea
          id="rsvp-message"
          rows={2}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${underlineInput.olive} resize-none`}
        />
      </UnderlineField>

      {errors.form ? (
        <p className="mb-4 font-ui text-[11px] text-rose">{errors.form}</p>
      ) : null}

      <div className="text-center">
        <GhostButton type="submit" tone="olive" disabled={status === "sending"}>
          {status === "sending" ? dict.rsvp.submitting : dict.rsvp.submit}
        </GhostButton>
      </div>
    </form>
  );
}

/** A ruled radio row — a filled dot and a label, no button chrome. */
function RadioRow({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={`flex size-[15px] shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? "border-peach" : "border-cream/40"
        }`}
      >
        {checked ? <span className="size-[7px] rounded-full bg-peach" /> : null}
      </span>
      <span
        className={`font-body text-[16px] transition-colors ${
          checked ? "text-cream" : "text-cream/60"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

"use client";

import { useState } from "react";

import type { AppLocale, Dictionary } from "@/i18n/dictionaries";
import { formatWishDate } from "@/lib/format";
import { wishesUrl } from "@/lib/public-client";

import { GhostButton, UnderlineField, underlineInput } from "./ui";

type Wish = {
  id: string;
  name: string;
  message: string;
  createdAt: string | Date;
};

export function WishesWall({
  eventSlug,
  token,
  defaultName,
  initialWishes,
  initialCursor,
  locale,
  dict,
}: {
  eventSlug: string;
  token: string | null;
  defaultName: string;
  initialWishes: Wish[];
  initialCursor: string | null;
  locale: AppLocale;
  dict: Dictionary;
}) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = dict.wishes.errors.nameRequired;
    if (!message.trim()) nextErrors.message = dict.wishes.errors.messageRequired;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSending(true);
    const response = await fetch(wishesUrl(eventSlug), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: token ?? undefined,
        name: name.trim(),
        message: message.trim(),
      }),
    }).catch(() => null);
    setSending(false);

    if (!response?.ok) {
      setErrors({
        form:
          response?.status === 429
            ? dict.wishes.errors.rateLimited
            : dict.wishes.errors.generic,
      });
      return;
    }

    const { wish } = (await response.json()) as { wish: Wish };
    setWishes((current) => [wish, ...current]);
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const response = await fetch(
      wishesUrl(eventSlug, `?cursor=${encodeURIComponent(cursor)}&limit=10`),
    ).catch(() => null);
    setLoadingMore(false);
    if (!response?.ok) return;

    const data = (await response.json()) as { wishes: Wish[]; nextCursor: string | null };
    setWishes((current) => [...current, ...data.wishes]);
    setCursor(data.nextCursor);
  }

  return (
    <div>
      <form onSubmit={submit} noValidate className="mx-auto max-w-[22rem]">
        <UnderlineField id="wish-name" label={dict.wishes.nameLabel} error={errors.name}>
          <input
            id="wish-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={underlineInput.paper}
          />
        </UnderlineField>

        <UnderlineField
          id="wish-message"
          label={dict.wishes.messageLabel}
          error={errors.message ?? errors.form}
        >
          <textarea
            id="wish-message"
            rows={2}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={`${underlineInput.paper} resize-none`}
          />
        </UnderlineField>

        <div className="text-center">
          <GhostButton type="submit" disabled={sending}>
            {sending ? dict.wishes.submitting : dict.wishes.submit}
          </GhostButton>
          {sent ? (
            <p className="mt-3 font-ui text-[11px] text-peach-ink">{dict.wishes.success}</p>
          ) : null}
        </div>
      </form>

      <div className="mt-12 space-y-9">
        {wishes.length === 0 ? (
          <p className="text-center text-[15px] text-ink-soft">{dict.wishes.empty}</p>
        ) : null}
        {wishes.map((wish) => (
          <article key={wish.id} className="text-center">
            <p className="mx-auto max-w-[32ch] whitespace-pre-line font-body text-[16px] italic leading-relaxed text-ink">
              &ldquo;{wish.message}&rdquo;
            </p>
            <p className="kicker mt-4 text-peach-ink">{wish.name}</p>
            <time className="mt-1 block font-ui text-[10px] tracking-wider text-ink-soft">
              {formatWishDate(new Date(wish.createdAt), locale)}
            </time>
            <span className="mx-auto mt-7 block h-px w-10 bg-champagne" />
          </article>
        ))}
      </div>

      {cursor ? (
        <div className="mt-9 text-center">
          <GhostButton onClick={loadMore} disabled={loadingMore}>
            {dict.wishes.loadMore}
          </GhostButton>
        </div>
      ) : null}
    </div>
  );
}

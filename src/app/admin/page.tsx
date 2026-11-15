import Link from "next/link";

import { CopyLinkButton } from "@/components/copy-link-button";
import { Card, PageTitle } from "@/components/ui";
import { api, eventKind, eventName, ROLE_LABELS, type EventItem, type EventKind } from "@/lib/api";

export const metadata = { title: "Acara · The Moments by Bizzmo" };

const STATUS: Record<EventItem["status"], string> = { DRAFT: "Draf", PUBLISHED: "Terbit", ARCHIVED: "Arsip" };

/** One tab per product line. "Acara" is a placeholder name for GENERIC events. */
const PRODUCTS: { kind: EventKind; param: string; label: string; empty: string }[] = [
  { kind: "WEDDING", param: "the-moments", label: "The Moments", empty: "Belum ada acara pernikahan yang bisa Anda akses." },
  { kind: "GENERIC", param: "acara", label: "Acara", empty: "Belum ada acara umum yang bisa Anda akses." },
];

export default async function EventsPage({ searchParams }: PageProps<"/admin">) {
  const { produk } = await searchParams;
  const product = PRODUCTS.find((p) => p.param === produk) ?? PRODUCTS[0];
  const { events: all } = await api<{ events: EventItem[] }>("/v1/events");
  const events = all.filter((e) => eventKind(e) === product.kind);

  return (
    <>
      <PageTitle kicker="Dashboard" title={product.label}>
        <Link
            href={`/admin/events/new?produk=${product.param}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-admin-ink px-4 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            + Acara baru
        </Link>
      </PageTitle>

      <nav aria-label="Produk" className="mb-6 flex gap-1 border-b border-panel-border">
        {PRODUCTS.map((p) => {
          const active = p.kind === product.kind;
          const count = all.filter((e) => eventKind(e) === p.kind).length;
          return (
            <Link
              key={p.kind}
              href={`/admin?produk=${p.param}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active ? "border-gold text-admin-ink" : "border-transparent text-admin-muted hover:text-admin-ink"
              }`}
            >
              {p.label} <span className="text-admin-faint tabular-nums">({count})</span>
            </Link>
          );
        })}
      </nav>

      {events.length === 0 ? (
        <Card>
          <p className="text-admin-muted">{product.empty}</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-[var(--radius-card)] border border-panel-border bg-panel transition-colors hover:border-gold-line hover:bg-panel-hover"
            >
              <Link href={`/admin/events/${e.id}`} className="block p-5 pb-3">
                <p className="text-xs tracking-wide text-admin-muted uppercase">
                  {STATUS[e.status]} · {ROLE_LABELS[e.role]}
                </p>
                <h2 className="mt-1 font-display text-3xl leading-tight">{eventName(e)}</h2>
                {eventKind(e) === "GENERIC" && e.subtitle ? (
                  <p className="mt-1 text-sm">{e.subtitle}</p>
                ) : null}
                <p className="mt-2 text-sm text-admin-muted">{e.dateLabel}</p>
                {e.venue ? <p className="text-sm text-admin-muted">{e.venue}</p> : null}
              </Link>
              <div className="px-5 pb-4">
                <CopyLinkButton path={`/e/${e.slug}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

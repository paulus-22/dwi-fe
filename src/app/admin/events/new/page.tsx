import Link from "next/link";

import { EventForm } from "@/components/admin/event-form";
import { PageTitle } from "@/components/ui";
import type { EventKind } from "@/lib/api";

import { createEvent } from "./actions";

export const metadata = { title: "Acara baru · The Moments by Bizzmo" };

const KINDS: { kind: EventKind; param: string; label: string }[] = [
  { kind: "WEDDING", param: "the-moments", label: "The Moments (pernikahan)" },
  { kind: "GENERIC", param: "acara", label: "Acara umum" },
];

/** `?produk=the-moments|acara` picks the kind (same param as the dashboard tabs). */
export default async function NewEventPage({ searchParams }: PageProps<"/admin/events/new">) {
  const { produk } = await searchParams;
  const current = KINDS.find((k) => k.param === produk) ?? KINDS[1];

  return (
    <>
      <PageTitle kicker="Acara" title="Buat acara baru">
        <Link href={`/admin?produk=${current.param}`} className="text-sm text-admin-muted transition-colors hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>

      <nav aria-label="Jenis acara" className="mb-6 flex gap-1 border-b border-panel-border">
        {KINDS.map((k) => {
          const active = k.kind === current.kind;
          return (
            <Link
              key={k.kind}
              href={`/admin/events/new?produk=${k.param}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active ? "border-accent text-admin-ink" : "border-transparent text-admin-muted hover:text-admin-ink"
              }`}
            >
              {k.label}
            </Link>
          );
        })}
      </nav>

      <EventForm key={current.kind} kind={current.kind} action={createEvent} submitLabel="Buat acara" pendingLabel="Membuat…" />
    </>
  );
}

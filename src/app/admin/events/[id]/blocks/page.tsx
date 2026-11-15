import Link from "next/link";

import { PageTitle } from "@/components/ui";
import { api, eventName } from "@/lib/api";
import type { PageBlock } from "@/lib/builder";

import { requireGenericEvent } from "../generic-event";
import { BlockBuilder } from "./block-builder";

export const metadata = { title: "Blok halaman · The Moments by Bizzmo" };

export default async function BlockBuilderPage({ params }: PageProps<"/admin/events/[id]/blocks">) {
  const { id } = await params;
  const event = await requireGenericEvent(id);
  const { blocks } = await api<{ blocks: PageBlock[] }>(`/v1/events/${id}/page-blocks`);

  return (
    <>
      <PageTitle kicker={eventName(event)} title="Blok halaman">
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>
      <BlockBuilder eventId={id} blocks={[...blocks].sort((a, b) => a.sortOrder - b.sortOrder)} />
    </>
  );
}

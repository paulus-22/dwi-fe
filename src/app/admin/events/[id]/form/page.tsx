import Link from "next/link";

import { PageTitle } from "@/components/ui";
import { api, eventName } from "@/lib/api";
import type { FormField } from "@/lib/builder";

import { requireGenericEvent } from "../generic-event";
import { FormBuilder } from "./form-builder";

export const metadata = { title: "Form pendaftaran · The Moments by Bizzmo" };

export default async function FormBuilderPage({ params }: PageProps<"/admin/events/[id]/form">) {
  const { id } = await params;
  const event = await requireGenericEvent(id);
  const { fields } = await api<{ fields: FormField[] }>(`/v1/events/${id}/form-fields`);

  return (
    <>
      <PageTitle kicker={eventName(event)} title="Form pendaftaran">
        <Link href={`/admin/events/${id}`} className="text-sm text-admin-muted hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>
      <FormBuilder eventId={id} fields={[...fields].sort((a, b) => a.sortOrder - b.sortOrder)} />
    </>
  );
}

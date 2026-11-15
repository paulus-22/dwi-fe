import Link from "next/link";

import { PageTitle } from "@/components/ui";

import { CreateEventForm } from "./create-event-form";

export const metadata = { title: "Acara baru · The Moments by Bizzmo" };

export default function NewEventPage() {
  return (
    <>
      <PageTitle kicker="Acara" title="Buat acara baru">
        <Link href="/admin?produk=acara" className="text-sm text-admin-muted hover:text-admin-ink">
          ← Kembali ke dashboard
        </Link>
      </PageTitle>
      <CreateEventForm />
    </>
  );
}

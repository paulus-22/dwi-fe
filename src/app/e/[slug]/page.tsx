import type { Metadata } from "next";

import { coupleLine } from "@/lib/couple";
import { findPublicEvent, getPublicEvent } from "@/lib/event";
import { safeUrl } from "@/components/generic/config";

import { GenericInvitation } from "./generic";
import { WeddingInvitation } from "./wedding";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await findPublicEvent(slug);
  if (!event) return { title: "Undangan" };

  // Per-event custom favicon — a small distinct "vibe" per event's tab icon.
  // Falls back to the app's own favicon.ico when unset or invalid.
  const favicon = safeUrl(event.faviconUrl);
  const icons = favicon ? { icon: favicon } : undefined;

  if (event.kind === "GENERIC") {
    return {
      title: event.title,
      description: event.subtitle ?? event.description ?? undefined,
      openGraph: { title: event.title, type: "website" },
      icons,
    };
  }
  const title = coupleLine(event);
  return { title, description: `The wedding of ${title}`, openGraph: { title, type: "website" }, icons };
}

export default async function InvitationPage({ params, searchParams }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const event = await getPublicEvent(slug);

  return event.kind === "GENERIC" ? (
    <GenericInvitation event={event} query={query} />
  ) : (
    <WeddingInvitation event={event} query={query} />
  );
}

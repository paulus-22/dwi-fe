import type { Metadata } from "next";

import { coupleLine } from "@/lib/couple";
import { findPublicEvent, getPublicEvent } from "@/lib/event";

import { GenericInvitation } from "./generic";
import { WeddingInvitation } from "./wedding";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await findPublicEvent(slug);
  if (!event) return { title: "Undangan" };

  if (event.kind === "GENERIC") {
    return {
      title: event.title,
      description: event.subtitle ?? event.description ?? undefined,
      openGraph: { title: event.title, type: "website" },
    };
  }
  const title = coupleLine(event);
  return { title, description: `The wedding of ${title}`, openGraph: { title, type: "website" } };
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

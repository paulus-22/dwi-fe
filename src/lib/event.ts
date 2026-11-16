import "server-only";

import { notFound } from "next/navigation";

import { ApiError, publicApi } from "./api";
import {
  PREVIEW_SLUG,
  isPreviewMode,
  previewEvent,
  previewGuest,
  previewVoucher,
  previewWishes,
} from "./preview";
import type { PageBlock } from "./builder";

/**
 * Public event data, read from dwi-be's `/v1/public/events/{slug}` endpoints.
 * Dates arrive as ISO strings and are revived into `Date`s here so the ported
 * components can stay as they were when they read from Prisma.
 */

export type PublicCeremony = {
  id: string;
  nameId: string;
  nameEn: string | null;
  startsAt: Date;
  endsAt: Date | null;
  venueName: string;
  venueAddress: string | null;
  mapsUrl: string | null;
  mapsEmbedUrl: string | null;
  sortOrder: number;
};

export type PublicMilestone = {
  id: string;
  periodLabel: string | null;
  titleId: string;
  titleEn: string | null;
  bodyId: string | null;
  bodyEn: string | null;
  photoUrl: string | null;
  sortOrder: number;
};

export type PublicRundownItem = {
  id: string;
  timeLabel: string;
  titleId: string;
  titleEn: string | null;
  sortOrder: number;
};

export type PublicGiftAccount = {
  id: string;
  kind: "BANK" | "EWALLET";
  institution: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl: string | null;
  sortOrder: number;
};

export type PublicEvent = {
  kind: "WEDDING";
  slug: string;
  brideShortName: string;
  brideFullName: string;
  brideParents: string | null;
  brideInstagram: string | null;
  groomShortName: string;
  groomFullName: string;
  groomParents: string | null;
  groomInstagram: string | null;
  headlineDate: Date;
  timezone: string;
  defaultLocale: "ID" | "EN";
  bilingual: boolean;
  hashtag: string | null;
  theme: string;
  themeTokens: Record<string, string> | null;
  /** Browser-tab icon for this event's public page; absent on older APIs. */
  faviconUrl?: string | null;
  quoteTextId: string | null;
  quoteTextEn: string | null;
  quoteAuthor: string | null;
  storyIntroId: string | null;
  storyIntroEn: string | null;
  closingNoteId: string | null;
  closingNoteEn: string | null;
  dressCodeNoteId: string | null;
  dressCodeNoteEn: string | null;
  dressCodeColors: string[];
  musicUrl: string | null;
  coverPhotoUrl: string | null;
  coverBackgroundUrl: string | null;
  closingPhotoUrl: string | null;
  dressCodeImageUrl: string | null;
  giftImageUrl: string | null;
  giftAddress: string | null;
  interludePhotos: string[];
  ceremonies: PublicCeremony[];
  milestones: PublicMilestone[];
  rundown: PublicRundownItem[];
  giftAccounts: PublicGiftAccount[];
};

export type PublicGenericEvent = {
  kind: "GENERIC";
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  headlineDate: Date;
  timezone: string;
  pageBlocks: PageBlock[];
  /** `corporate-classic` | `corporate-soft` | `editorial`; absent on older APIs (→ classic). */
  theme?: string;
  /** Browser-tab icon for this event's public page; absent on older APIs. */
  faviconUrl?: string | null;
  /** Absent on APIs that predate self-registration — treat as CLOSED. */
  registrationMode?: "CLOSED" | "OPEN" | "ALLOWLIST";
};

export type AnyPublicEvent = PublicEvent | PublicGenericEvent;

/** Raw JSON: same shapes, dates as strings, arrays possibly absent. */
type Raw = Record<string, unknown> & { kind?: string };

const bySort = <T extends { sortOrder: number }>(items: T[] | undefined) =>
  [...(items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

function revive(slug: string, raw: Raw): AnyPublicEvent {
  const headlineDate = new Date(raw.headlineDate as string);
  if (raw.kind === "GENERIC") {
    return {
      ...(raw as unknown as PublicGenericEvent),
      slug,
      headlineDate,
      pageBlocks: bySort((raw.pageBlocks as PageBlock[] | undefined) ?? []),
    };
  }
  const r = raw as unknown as PublicEvent;
  return {
    ...r,
    kind: "WEDDING",
    slug,
    headlineDate,
    themeTokens: r.themeTokens ?? null,
    dressCodeColors: r.dressCodeColors ?? [],
    interludePhotos: r.interludePhotos ?? [],
    ceremonies: bySort(r.ceremonies).map((c) => ({
      ...c,
      startsAt: new Date(c.startsAt as unknown as string),
      endsAt: c.endsAt ? new Date(c.endsAt as unknown as string) : null,
    })),
    milestones: bySort(r.milestones),
    rundown: bySort(r.rundown),
    giftAccounts: bySort(r.giftAccounts),
  };
}

/** Event for the public pages. Unknown / unpublished slugs 404. */
export async function getPublicEvent(slug: string): Promise<AnyPublicEvent> {
  if (isPreviewMode()) {
    if (slug !== PREVIEW_SLUG) notFound();
    return previewEvent;
  }
  try {
    const raw = await publicApi<Raw & { event?: Raw }>(`/v1/public/events/${encodeURIComponent(slug)}`);
    // dwi-be wraps the event and returns wedding relations (ceremonies,
    // milestones, rundown, giftAccounts) and generic blocks (`blocks`) as
    // siblings of `event`, not nested inside it — merge them back in before
    // reviving, so the rest of this module can keep treating them as if they
    // were nested (matching the old app's Prisma `include` shape).
    const base = raw.event && typeof raw.event === "object" ? raw.event : raw;
    const merged: Raw = {
      ...base,
      ceremonies: base.ceremonies ?? raw.ceremonies,
      milestones: base.milestones ?? raw.milestones,
      rundown: base.rundown ?? raw.rundown,
      giftAccounts: base.giftAccounts ?? raw.giftAccounts,
      pageBlocks: base.pageBlocks ?? raw.blocks,
    };
    return revive(slug, merged);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
}

/** Same, but for metadata: never throws, returns null when unavailable. */
export async function findPublicEvent(slug: string): Promise<AnyPublicEvent | null> {
  try {
    return await getPublicEvent(slug);
  } catch {
    return null;
  }
}

export const normalizeToken = (raw: string) => raw.trim().toUpperCase();

export type ResolvedGuest = {
  id: string;
  token: string;
  householdName: string;
  plusGuestAllowance: number;
  rsvp: { attending: boolean; guestCount: number; respondentName?: string | null; message: string | null } | null;
};

/**
 * Resolves the `?to=` token. A bad or foreign token is not an error: the
 * invitation still renders, just without a personalised name or RSVP form.
 */
export async function resolveGuest(slug: string, rawToken: string | undefined): Promise<ResolvedGuest | null> {
  if (!rawToken) return null;
  const token = normalizeToken(rawToken);
  if (isPreviewMode()) return token === previewGuest.token ? previewGuest : null;
  try {
    const { guest } = await publicApi<{ guest: ResolvedGuest | null }>(
      `/v1/public/events/${encodeURIComponent(slug)}/guest?token=${encodeURIComponent(token)}`,
    );
    return guest ?? null;
  } catch (e) {
    if (e instanceof ApiError && e.status < 500) return null;
    throw e;
  }
}

export type Wish = { id: string; name: string; message: string; createdAt: string | Date };

/** First page of public wishes, plus a cursor if there are more. */
export async function getWishesPage(slug: string, pageSize: number): Promise<{ wishes: Wish[]; nextCursor: string | null }> {
  if (isPreviewMode()) return { wishes: previewWishes.slice(0, pageSize), nextCursor: null };
  try {
    const data = await publicApi<{ wishes: Wish[]; nextCursor: string | null }>(
      `/v1/public/events/${encodeURIComponent(slug)}/wishes?limit=${pageSize}`,
    );
    return { wishes: data.wishes ?? [], nextCursor: data.nextCursor ?? null };
  } catch {
    // A wishes hiccup must not take the whole invitation down.
    return { wishes: [], nextCursor: null };
  }
}

// ---------------------------------------------------------------- voucher

export type VoucherGuest = {
  id: string;
  householdName: string;
  token: string;
  plusGuestAllowance: number;
  /** What the guest called themselves when confirming; falls back to the household. */
  displayName: string;
};

/**
 * Voucher access has three outcomes: unknown (no/foreign token), pending (not
 * confirmed, or declined), issued (confirmed; the pass is valid). The QR
 * payload is signed by the API — this app never builds one.
 */
export type VoucherState =
  | { status: "unknown" }
  | { status: "pending"; guest: VoucherGuest; declined: boolean }
  | { status: "issued"; guest: VoucherGuest; admits: number; qrPayload: string };

type RawVoucherGuest = Omit<VoucherGuest, "displayName"> & {
  displayName?: string | null;
  rsvp?: { respondentName?: string | null } | null;
};

const toVoucherGuest = (g: RawVoucherGuest): VoucherGuest => ({
  id: g.id,
  householdName: g.householdName,
  token: g.token,
  plusGuestAllowance: g.plusGuestAllowance,
  displayName: g.displayName?.trim() || g.rsvp?.respondentName?.trim() || g.householdName,
});

export async function resolveVoucher(slug: string, rawToken: string | undefined): Promise<VoucherState> {
  if (!rawToken) return { status: "unknown" };
  const token = normalizeToken(rawToken);
  if (isPreviewMode()) return token === previewGuest.token ? previewVoucher : { status: "unknown" };
  try {
    const v = await publicApi<
      | { status: "unknown" }
      | { status: "pending"; guest: RawVoucherGuest; declined: boolean }
      | { status: "issued"; guest: RawVoucherGuest; admits: number; qrPayload: string }
    >(`/v1/public/events/${encodeURIComponent(slug)}/voucher?token=${encodeURIComponent(token)}`);
    if (v.status === "unknown") return v;
    return { ...v, guest: toVoucherGuest(v.guest) };
  } catch (e) {
    if (e instanceof ApiError && e.status < 500) return { status: "unknown" };
    throw e;
  }
}

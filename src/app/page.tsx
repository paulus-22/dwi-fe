import Link from "next/link";

/**
 * Placeholder home. The public invitation pages (`/e/[slug]`, `/v/[slug]`)
 * move here from the original app in the next phase; until then they keep
 * being served by the original deployment.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs tracking-[0.18em] text-admin-muted uppercase">The Moments by Bizzmo</p>
      <h1 className="font-display text-5xl">Dashboard acara</h1>
      <Link
        href="/admin"
        className="inline-flex h-11 items-center rounded-[var(--radius-control)] bg-admin-ink px-5 text-sm font-medium text-white hover:bg-black"
      >
        Masuk ke dashboard
      </Link>
    </main>
  );
}

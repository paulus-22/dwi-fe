import { LinkButton } from "@/components/ui";

/**
 * Placeholder home. The public invitation pages (`/e/[slug]`, `/v/[slug]`)
 * move here from the original app in the next phase; until then they keep
 * being served by the original deployment.
 */
export default function Home() {
  return (
    <main className="admin-chrome flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs font-medium tracking-wide text-admin-faint uppercase">The Moments by Bizzmo</p>
      <h1 className="text-4xl font-semibold tracking-tight">Dashboard acara</h1>
      <LinkButton href="/admin">Masuk ke dashboard</LinkButton>
    </main>
  );
}

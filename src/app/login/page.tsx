import Image from "next/image";

import logo from "@/assets/logo/the_moments_by_bizzmo_no_tagline_transparent.png";

import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk · The Moments by Bizzmo" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  return (
    <main className="admin-chrome flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-panel-border bg-panel p-7 shadow-[0_4px_16px_rgb(16_24_40/0.06)]">
        <Image src={logo} alt="The Moments by Bizzmo" priority className="mx-auto mb-6 h-auto w-48" />
        <p className="text-center text-xs font-medium tracking-wide text-admin-faint uppercase">Dashboard</p>
        <h1 className="mb-6 text-center text-3xl font-semibold tracking-tight">Masuk</h1>
        <LoginForm next={next} expired={params.expired === "1"} />
      </div>
    </main>
  );
}

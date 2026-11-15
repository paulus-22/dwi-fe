import Image from "next/image";
import Link from "next/link";

import { logout } from "@/app/login/actions";
import logo from "@/assets/logo/the_moments_by_bizzmo_no_tagline_icon.png";
import { api, type Admin } from "@/lib/api";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { admin } = await api<{ admin: Admin }>("/v1/me");
  return (
    <div className="min-h-dvh">
      <header className="border-b border-panel-border bg-panel">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src={logo} alt="The Moments by Bizzmo" priority className="size-9 rounded-[8px]" />
            <span className="font-display text-2xl">The Moments</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-admin-muted sm:inline">{admin.name}</span>
            <form action={logout}>
              <button type="submit" className="rounded px-2 py-1 text-admin-muted hover:text-admin-ink">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

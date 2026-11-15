"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api, ApiError, SESSION_COOKIE, type Admin } from "@/lib/api";

export type FormState = { error?: string } | undefined;

/** Only same-site paths, so `?next=` cannot bounce someone off-site. */
function safeNext(raw: FormDataEntryValue | null) {
  const next = typeof raw === "string" ? raw : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Isi email dan kata sandi." };

  let session: { token: string; expiresAt: string; admin: Admin };
  try {
    session = await api("/v1/auth/login", { method: "POST", body: { email, password }, anonymous: true });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal masuk." };
  }

  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  redirect(session.admin.mustChangePassword ? "/admin/password" : safeNext(form.get("next")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("confirm") ?? "")) return { error: "Konfirmasi kata sandi tidak sama." };
  try {
    await api("/v1/auth/password", { method: "POST", body: { current, next } });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengganti kata sandi." };
  }
  redirect("/admin");
}

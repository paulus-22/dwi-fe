"use client";

import { useActionState } from "react";

import { Button, Notice } from "@/components/ui";

import { login, type FormState } from "./actions";

const field =
  "h-11 w-full rounded-[var(--radius-control)] border border-panel-border bg-white px-3 text-base outline-none focus:border-gold";

export function LoginForm({ next, expired }: { next?: string; expired: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  return (
    <form action={action} className="space-y-4">
      {expired && !state?.error ? <Notice>Sesi berakhir. Silakan masuk lagi.</Notice> : null}
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Email</span>
        <input name="email" type="email" autoComplete="username" required className={field} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-admin-muted">Kata sandi</span>
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}

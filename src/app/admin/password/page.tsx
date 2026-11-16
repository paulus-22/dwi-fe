"use client";

import { useActionState } from "react";

import { changePassword, type FormState } from "@/app/login/actions";
import { Button, Card, Notice, PageTitle, inputCls } from "@/components/ui";

const field = inputCls;

export default function PasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <div className="max-w-md">
      <PageTitle kicker="Akun" title="Ganti kata sandi" />
      <Card>
        <form action={action} className="space-y-4">
          {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
          <label className="block space-y-1.5">
            <span className="text-sm text-admin-muted">Kata sandi saat ini</span>
            <input name="current" type="password" autoComplete="current-password" required className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-admin-muted">Kata sandi baru (min. 10 karakter)</span>
            <input name="next" type="password" autoComplete="new-password" minLength={10} required className={field} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-admin-muted">Ulangi kata sandi baru</span>
            <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className={field} />
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

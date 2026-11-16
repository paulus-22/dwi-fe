"use client";

import { startTransition, useState, useTransition, type FormEvent, type ReactNode } from "react";

import { Button, inputCls } from "@/components/ui";
import type { ActionState } from "@/lib/builder";

/** Shared bits for the form-field and page-block builders. */

export { inputCls };

/**
 * Submits through the action without React's automatic form reset, so a
 * validation error doesn't wipe what the admin typed.
 */
export function submitKeepingInput(e: FormEvent<HTMLFormElement>, action: (form: FormData) => void) {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  startTransition(() => action(form));
}

export const smallBtn = "h-8 px-2.5 text-xs";

/** Runs a row-level server action (move/delete/toggle) and keeps its error inline. */
export function useRowAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const run = (action: () => Promise<ActionState>) =>
    start(async () => {
      setError(undefined);
      const res = await action();
      if (res?.error) setError(res.error);
    });
  return { pending, error, run };
}

export function RowControls({
  index,
  count,
  pending,
  editing,
  onMove,
  onEdit,
  onDelete,
  children,
}: {
  index: number;
  count: number;
  pending: boolean;
  editing: boolean;
  onMove: (dir: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="secondary"
        className={smallBtn}
        disabled={pending || index === 0}
        onClick={() => onMove(-1)}
        aria-label="Naikkan"
        title="Naikkan"
      >
        ↑
      </Button>
      <Button
        type="button"
        variant="secondary"
        className={smallBtn}
        disabled={pending || index === count - 1}
        onClick={() => onMove(1)}
        aria-label="Turunkan"
        title="Turunkan"
      >
        ↓
      </Button>
      {children}
      <Button type="button" variant="secondary" className={smallBtn} disabled={pending} onClick={onEdit}>
        {editing ? "Tutup" : "Ubah"}
      </Button>
      <Button type="button" variant="danger" className={smallBtn} disabled={pending} onClick={onDelete}>
        Hapus
      </Button>
    </div>
  );
}

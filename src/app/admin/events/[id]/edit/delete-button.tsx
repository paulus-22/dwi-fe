"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui";
import type { EventKind } from "@/lib/api";

import { deleteEvent } from "./actions";

/** Archives the event after a native confirm(); the action redirects on success. */
export function DeleteEventButton({ id, kind }: { id: string; kind: EventKind }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!confirm("Arsipkan acara ini? Acara akan hilang dari dashboard dan tidak bisa diakses lagi.")) return;
          setError(undefined);
          start(async () => {
            const res = await deleteEvent(id, kind);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Mengarsipkan…" : "Arsipkan acara"}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

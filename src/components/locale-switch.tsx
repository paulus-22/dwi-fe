"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { rememberLocale } from "@/i18n/actions";
import type { AppLocale } from "@/i18n/dictionaries";

export function LocaleSwitch({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: AppLocale) {
    if (next === locale) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", next);

    startTransition(async () => {
      // Remembering the choice means the guest keeps their language if they
      // reopen the invitation from a link without ?lang=.
      await rememberLocale(next);
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-pill border border-olive-deep/25 bg-paper font-ui text-[10px] uppercase tracking-[0.18em] backdrop-blur"
      data-pending={isPending || undefined}
    >
      {(["id", "en"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => switchTo(value)}
          aria-pressed={locale === value}
          // The inactive label is at full strength: a tint of it was 4.34:1 on
          // the lighter theme bands. The filled pill already carries the
          // distinction, so the opacity was buying nothing.
          className={
            locale === value
              ? "bg-olive-deep px-3 py-1.5 text-cream"
              : "px-3 py-1.5 text-olive-deep"
          }
        >
          {value}
        </button>
      ))}
    </div>
  );
}

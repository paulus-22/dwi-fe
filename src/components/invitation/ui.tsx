import type { ReactNode } from "react";

type Tone = "paper" | "olive";

/**
 * Wedding-stationery button: transparent with a hairline border, filling peach
 * on hover. Buttons must read as part of the stationery rather than as app
 * chrome, so there is no solid default.
 */
const ghostBase =
  "inline-block px-8 py-3 font-ui text-[10px] uppercase tracking-[0.24em] transition-colors duration-300";

const ghostTone: Record<Tone, string> = {
  paper: "border border-champagne text-ink hover:border-peach hover:bg-peach hover:text-peach-text",
  olive: "border border-cream/40 text-cream hover:border-peach hover:bg-peach hover:text-peach-text",
};

export function GhostLink({
  href,
  children,
  tone = "paper",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`${ghostBase} ${ghostTone[tone]} ${className}`}
    >
      {children}
    </a>
  );
}

export function GhostButton({
  children,
  tone = "paper",
  type = "button",
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${ghostBase} ${ghostTone[tone]} disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/** Short centred hairline, used to separate blocks inside a section. */
export function Hairline({ tone = "paper" }: { tone?: Tone }) {
  return (
    <span
      className={`mx-auto block h-px w-16 ${
        tone === "olive" ? "bg-cream/30" : "bg-champagne"
      }`}
    />
  );
}

/**
 * Underline field. The spec calls for these over boxed inputs — a bordered box
 * reads as a form, a ruled line reads as a card you write on.
 */
export function UnderlineField({
  id,
  label,
  tone = "paper",
  children,
  error,
  hint,
}: {
  id?: string;
  label: string;
  tone?: Tone;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="mb-7">
      <label
        htmlFor={id}
        className={`kicker mb-2 block ${tone === "olive" ? "text-cream/70" : "text-ink-soft"}`}
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p
          className={`mt-2 font-ui text-[10px] ${
            tone === "olive" ? "text-cream/70" : "text-ink-soft"
          }`}
        >
          {hint}
        </p>
      ) : null}
      {error ? <p className="mt-2 font-ui text-[11px] text-rose">{error}</p> : null}
    </div>
  );
}

export const underlineInput: Record<Tone, string> = {
  paper:
    "w-full border-0 border-b border-champagne bg-transparent py-2 font-body text-[16px] text-ink outline-none transition-colors focus:border-peach",
  olive:
    "w-full border-0 border-b border-cream/35 bg-transparent py-2 font-body text-[16px] text-cream outline-none transition-colors focus:border-peach",
};

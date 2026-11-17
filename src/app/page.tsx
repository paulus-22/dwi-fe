"use client";

import { useState } from "react";

/** Landing page for themoments.id — product description + a simple "notify me". */
export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--color-stone-bg)] text-[var(--color-stone-ink)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-stone-border)] bg-[var(--color-stone-panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-[var(--font-stone-heading)] text-sm font-semibold tracking-tight">
            The&nbsp;Moments
            <span className="text-[var(--color-stone-text-muted)]"> · by Bizzmo</span>
          </span>
          <a href="/login" className="text-sm text-[var(--color-stone-text-muted)] underline-offset-4 hover:text-[var(--color-stone-ink)] hover:underline">
            Ke aplikasi
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 pb-20 pt-20 text-center sm:pt-28">
          <p className="mx-auto max-w-xs text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-stone-text-muted)]">
            Undangan digital &amp; registrasi acara
          </p>
          <h1 className="font-[var(--font-stone-heading)] mx-auto mt-5 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-[var(--color-stone-ink)] sm:text-6xl sm:leading-[1.08]">
            Satu undangan untuk{" "}
            <span className="text-[var(--color-stone-accent)]">setiap momen</span> yang berarti.
          </h1>
          <p className="font-[var(--font-stone-body)] mx-auto mt-6 max-w-xl text-base text-[var(--color-stone-text-muted)] sm:text-lg">
            Undangan digital yang dapat disesuaikan, konfirmasi kehadiran (RSVP),
            dan pemindaian QR saat hari-H — untuk pernikahan dan acara apa pun.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#notify"
              className="rounded-[20px] bg-[var(--color-stone-accent)] px-6 py-3 text-sm font-medium text-[var(--color-stone-ink-safe)] shadow-sm transition-opacity hover:opacity-90"
            >
              Daftar untuk mendapat info
            </a>
            <a
              href="#features"
              className="rounded-[20px] border border-[var(--color-stone-border)] bg-[var(--color-stone-panel)] px-6 py-3 text-sm font-medium text-[var(--color-stone-ink)] transition-colors hover:bg-[var(--color-stone-muted)]"
            >
              Lihat fitur
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[var(--color-stone-border)] bg-[var(--color-stone-panel)] p-6">
                <div className="grid size-10 place-items-center rounded-xl border border-[var(--color-stone-muted)] bg-[var(--color-stone-bg)] text-lg text-[var(--color-stone-text-muted)]">
                  {f.icon}
                </div>
                <h3 className="font-[var(--font-stone-heading)] mt-4 font-semibold tracking-tight text-[var(--color-stone-ink)]">{f.title}</h3>
                <p className="font-[var(--font-stone-body)] mt-2 text-sm leading-relaxed text-[var(--color-stone-text-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-[var(--color-stone-border)] bg-[var(--color-stone-panel)]">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="font-[var(--font-stone-heading)] text-center text-3xl font-semibold tracking-tight text-[var(--color-stone-ink)]">Cara kerjanya</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="text-center sm:text-left">
                  <p className="font-[var(--font-stone-heading)] text-sm font-medium text-[var(--color-stone-text-muted)]">0{i + 1}</p>
                  <h3 className="font-[var(--font-stone-heading)] mt-2 font-semibold text-[var(--color-stone-ink)]">{s.title}</h3>
                  <p className="font-[var(--font-stone-body)] mt-1.5 text-sm leading-relaxed text-[var(--color-stone-text-muted)]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notify */}
        <section id="notify" className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="font-[var(--font-stone-heading)] text-3xl font-semibold tracking-tight text-[var(--color-stone-ink)]">Kabari saya</h2>
          <p className="font-[var(--font-stone-body)] mt-3 text-[var(--color-stone-text-muted)]">
            Tinggalkan email Anda — kami akan menghubungi Anda saat siap.
          </p>
          <NotifyForm />
        </section>
      </main>

      <footer className="border-t border-[var(--color-stone-border)] px-6 py-8 text-center">
        <p className="font-[var(--font-stone-body)] text-sm text-[var(--color-stone-text-faint)]">© {new Date().getFullYear()} The Moments by Bizzmo</p>
      </footer>
    </div>
  );
}

function NotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email wajib diisi.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || "Terjadi kesalahan. Coba lagi.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-6 rounded-2xl border border-[var(--color-stone-border)] bg-[var(--color-stone-muted)] px-4 py-3 text-sm font-medium text-[var(--color-stone-ink)]">
        Terima kasih! Kami akan memberi kabar.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@email.com"
        className="font-[var(--font-stone-body)] min-w-0 flex-1 rounded-xl border border-[var(--color-stone-border)] bg-[var(--color-stone-panel)] px-4 py-3 text-sm text-[var(--color-stone-ink)] outline-none focus:border-[var(--color-stone-ink)] focus:ring-2 focus:ring-[var(--color-stone-ink)]/20"
        aria-label="Email"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[var(--color-stone-accent)] px-5 py-3 text-sm font-medium text-[var(--color-stone-ink-safe)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Mengirim…" : "Beri tahu saya"}
      </button>
      {status === "error" && (
        <p className="text-sm text-[var(--color-stone-ink)] sm:col-start-1 sm:col-end-3">{error}</p>
      )}
    </form>
  );
}

const FEATURES = [
  { icon: "✉", title: "Undangan digital", body: "Undangan yang dapat disesuaikan untuk pernikahan maupun acara umum — mulai dari undangan pernikahan klasik hingga tema korporat." },
  { icon: "☑", title: "Konfirmasi (RSVP)", body: "Tamu mengonfirmasi kehadiran dengan mudah, memilih jumlah tamu, dan mengisi data peserta langsung di undangan." },
  { icon: "◫", title: "Scan QR saat hari-H", body: "Kode QR pribadi untuk setiap tamu — validasi kehadiran Anda di meja penerima tamu dengan aplikasi scanner." },
] as const;

const STEPS = [
  { title: "Buat acara", body: "Pilih jenis acara, tambahkan detail, dan pilih tema tampilan." },
  { title: "Kirim undangan", body: "Setiap tamu menerima tautan pribadi beserta kode QR mereka." },
  { title: "Terima & verifikasi", body: "Tamu mengonfirmasi kehadiran; tim memindai QR saat acara berlangsung." },
] as const;

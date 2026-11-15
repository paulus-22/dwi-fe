import { useEffect, useMemo, useState } from "react";

import { queueLookup } from "./Scan";
import { Chip, Header, Icon } from "../components/ui";
import { store } from "../data/store";
import { CATEGORIES, type CategoryCode } from "../domain/codes";
import type { CheckIn, SnapshotGuest } from "../domain/types";
import { go, timeLabel } from "../lib/ui";
import { useApp } from "../state";

type Row = SnapshotGuest & { checkIn: CheckIn | null };
type Filter = "all" | "in" | "out";

export function GuestsScreen() {
  const { version } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    void (async () => {
      const [guests, checkIns] = await Promise.all([store.guests(), store.checkIns()]);
      const first = new Map<string, CheckIn>();
      for (const c of checkIns.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) {
        if (!first.has(c.code)) first.set(c.code, c);
      }
      setRows(guests.map((g) => ({ ...g, checkIn: first.get(g.code) ?? null })));
    })();
  }, [version]);

  const stats = useMemo(() => {
    const expected = rows.filter((r) => r.attending === true);
    const arrived = rows.filter((r) => r.checkIn);
    const people = arrived.reduce((n, r) => n + (r.checkIn?.headcount ?? 0), 0);
    const expectedPeople = expected.reduce((n, r) => n + r.admits, 0);
    const byCat = (Object.keys(CATEGORIES) as CategoryCode[]).map((cat) => {
      const all = rows.filter((r) => r.category === cat && (r.attending === true || r.checkIn));
      return { cat, total: all.length, in: all.filter((r) => r.checkIn).length };
    });
    return { arrived: arrived.length, expected: expected.length, people, expectedPeople, byCat };
  }, [rows]);

  const visible = rows
    .filter((r) => (filter === "in" ? r.checkIn : filter === "out" ? !r.checkIn : true))
    .filter((r) => {
      const q = query.trim().toLowerCase();
      return !q || r.householdName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.checkIn && b.checkIn) return b.checkIn.occurredAt.localeCompare(a.checkIn.occurredAt);
      if (a.checkIn !== b.checkIn) return a.checkIn ? -1 : 1;
      return a.householdName.localeCompare(b.householdName);
    });

  const pct = stats.expectedPeople ? Math.min(100, Math.round((stats.people / stats.expectedPeople) * 100)) : 0;

  return (
    <div className="flex h-full flex-col bg-ground">
      <Header title="Daftar tamu" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Undangan hadir" value={`${stats.arrived}`} sub={`dari ${stats.expected} konfirmasi`} />
          <Stat label="Orang hadir" value={`${stats.people}`} sub={`dari ${stats.expectedPeople} diharapkan`} />
        </div>
        <div className="mt-3 rounded-2xl bg-panel p-4">
          <div className="flex items-center justify-between text-[length:calc(13px*var(--fs))] text-cream-dim">
            <span>Kedatangan</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ground">
            <div className="h-full rounded-full bg-peach transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center">
            {stats.byCat.map((c) => (
              <div key={c.cat} className="min-w-0">
                <p className="text-[length:calc(17px*var(--fs))] text-cream">
                  {c.in}<span className="text-mute">/{c.total}</span>
                </p>
                <p className="truncate text-[length:calc(11px*var(--fs))] text-mute">{CATEGORIES[c.cat]}</p>
              </div>
            ))}
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau kode…"
          className="mt-5 w-full rounded-2xl border border-edge bg-panel px-4 py-3.5 text-[length:calc(16px*var(--fs))] text-cream outline-none placeholder:text-mute focus:border-peach"
        />
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {([["all", "Semua"], ["in", "Sudah hadir"], ["out", "Belum"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[length:calc(14px*var(--fs))] ${filter === key ? "bg-peach text-peach-ink" : "bg-panel text-cream-dim"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-4 divide-y divide-edge/60 overflow-hidden rounded-2xl bg-panel">
          {visible.map((r) => (
            <li key={r.code}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-panel-2"
                onClick={() => {
                  queueLookup(r.code);
                  go("scan");
                }}
              >
                <span className={`size-2.5 shrink-0 rounded-full ${r.checkIn ? "bg-ok" : r.attending === false ? "bg-bad/70" : r.attending === null ? "bg-mute" : "bg-edge"}`} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block break-words text-[length:calc(16px*var(--fs))] leading-snug text-cream">{r.householdName}</span>
                  <span className="block truncate text-[length:calc(12px*var(--fs))] text-mute">
                    {r.code} · {CATEGORIES[r.category]}
                    {r.table ? ` · Meja ${r.table}` : ""}
                  </span>
                </span>
                {r.checkIn ? (
                  <span className="text-right text-[length:calc(12px*var(--fs))] text-cream-dim">
                    {timeLabel(r.checkIn.occurredAt)}
                    <br />
                    <span className="text-mute">{r.checkIn.headcount} org · {r.checkIn.deviceName}</span>
                  </span>
                ) : (
                  <Chip className={r.attending === false ? "bg-bad-deep text-cream-dim" : r.attending === null ? "bg-panel-2 text-mute" : "bg-panel-2 text-cream-dim"}>
                    {r.attending === false ? "Tidak hadir" : r.attending === null ? "Belum RSVP" : `${r.admits} org`}
                  </Chip>
                )}
                <Icon name="chevron" className="size-4 text-mute" />
              </button>
            </li>
          ))}
          {visible.length === 0 ? <li className="px-4 py-8 text-center text-[length:calc(14px*var(--fs))] text-mute">Tidak ada tamu.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-panel p-4">
      <p className="kicker text-mute">{label}</p>
      <p className="mt-1 font-display text-[length:calc(44px*var(--fs))] leading-none text-cream">{value}</p>
      <p className="mt-1 text-[length:calc(12px*var(--fs))] text-cream-dim">{sub}</p>
    </div>
  );
}

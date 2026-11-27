import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "../components/ui";
import { API_ROOT, api, session } from "../data/api";
import { go, toggleFullscreen } from "../lib/ui";
import { useApp } from "../state";

type Slide = { id: string; url: string };
type Selfie = { id: string; url: string; householdName: string | null };
type Greeting = { name: string; selfie?: string | null; seq: number };

/** On first mount, only replay confirmed-photo greetings from the last 2 minutes
 *  so refreshing the TV mid-wedding does not replay hours-old check-ins. */
const INITIAL_REPLAY_WINDOW_MS = 120_000;

type LiveMsg = {
  type?: string;
  id?: string;
  activity?: string;
  code?: string;
  seq?: number;
  householdName?: string | null;
  memberName?: string | null;
  household_name?: string | null;
  member_name?: string | null;
  url?: string;
};

/**
 * Peach-and-gold corner spray for the TV intro — echoes the invitation's floral
 * cover. Warm tones on purpose: the scanner's default "night" theme is sage-olive,
 * which made TV mode read as a waiting state.
 */
function TVFloral({ className, mirrored = false }: { className?: string; mirrored?: boolean }) {
  const petals = [0, 51, 103, 154, 206, 257, 309];
  const core = [26, 96, 166, 236, 306];
  const rose = "M0,2 C-9,-1 -13,-10 -9,-17 C-5,-23 5,-23 9,-17 C13,-10 9,-1 0,2 Z";
  return (
    <svg
      viewBox="0 0 120 150"
      className={className}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {/* foliage (sage, not brown) */}
      <path d="M6,148 C24,118 58,112 92,130 C58,158 20,160 6,148 Z" fill="#3a4628" opacity="0.85" />
      <path d="M4,136 C20,112 52,108 82,122 C52,146 18,148 4,136 Z" fill="#465437" opacity="0.8" />
      <path d="M70,150 C62,118 60,84 66,50" fill="none" stroke="#53633c" strokeWidth="3" strokeLinecap="round" />
      {/* rose — sage-tinted instead of peach */}
      <g transform="translate(52 44)">
        {petals.map((a) => (
          <path key={`o${a}`} d={rose} fill="#a9b98a" opacity="0.95" transform={`rotate(${a}) translate(0 -8) scale(1.12)`} />
        ))}
        {core.map((a) => (
          <path key={`m${a}`} d={rose} fill="#8ba06a" transform={`rotate(${a}) translate(0 -3) scale(0.8)`} />
        ))}
        <circle cx="0" cy="0" r="6.5" fill="#cdd6ae" />
      </g>
      {/* buds */}
      <path d="M24,98 C17,92 17,81 25,75 C33,81 33,92 24,98 Z" fill="#8ba06a" />
      <path d="M88,116 C96,106 98,90 90,84 C82,92 81,104 88,116 Z" fill="#a9b98a" />
      {/* gold blossoms (unchanged — gold isn't red) */}
      {[
        [94, 60, 9],
        [18, 132, 8],
        [100, 140, 7],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy={-r * 0.7} rx={r * 0.42} ry={r * 0.6} fill="#d8c3a5" opacity="0.9" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r={r * 0.26} fill="#bdca9f" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Dedicated TV/greeter display. Paired like any scanner but never scans: it
 * shows the event's slideshow (R2 slides + every door's selfies) full-screen,
 * and when a guest checks in at a scanner it cuts to a welcome card — the
 * event's greeting backdrop, the guest's name, and (once it arrives) their
 * selfie — then resumes. It shares the same R2 content as the scanners.
 */
export function GreeterScreen() {
  const { pairing, tvSlideSec, tvGreetSec, tvShowSelfie } = useApp();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [backdrop, setBackdrop] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  /** The photo URL the TV has actually loaded — until it does, the intro shows. */
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const skippedRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Greeting[]>([]);
  const selfiesByCodeRef = useRef<Record<string, string>>({});
  /** Highest `GREET` `scanner_event.seq` already shown/queued — shared dedupe for SSE + poll. */
  const lastSeqRef = useRef(0);
  /** True after the initial cursor sync on mount. */
  const initializedRef = useRef(false);

  const eventId = pairing?.event.id;

  // Slideshow content: R2 slides + all devices' selfies, refreshed in case the
  // organiser uploads new slides or a fresh guest photo lands.
  useEffect(() => {
    if (!eventId) return;
    const id = eventId; // narrowed for use inside the async tick
    let stop = false;
    async function tick() {
      try {
        const [s, p] = await Promise.all([api.slideshow(id), api.photos(id)]);
        if (stop) return;
        setSlides(s.images.map((i) => ({ id: i.id, url: i.url })));
        setSelfies(p.photos);
        setBackdrop(s.greeting ?? null);
      } catch {
        /* offline: keep whatever we have */
      }
    }
    void tick();
    const t = setInterval(tick, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [eventId]);

  // Warm every slide + selfie image in parallel so none is still downloading
  // when its turn comes — the slideshow then advances cleanly (no parking on
  // the intro card, no blank wait) even on a slow media host.
  useEffect(() => {
    const imgs = [...slides, ...selfies].map((s) => {
      const i = new Image();
      i.src = s.url;
      return i;
    });
    return () => {
      for (const i of imgs) i.src = "";
    };
  }, [slides, selfies]);

  // Live stream: remember fresh selfies, and queue a greeting ONLY when `GREET`
  // arrives (emitted strictly after the guest confirms "Pakai foto" or skips).
  useEffect(() => {
    if (!eventId || !api.live || !API_ROOT || !session.token) return;
    const es = new EventSource(`${API_ROOT}/v1/events/${eventId}/live?access_token=${encodeURIComponent(session.token)}`);
    es.onmessage = (e) => {
      let m: LiveMsg;
      try {
        m = JSON.parse(e.data) as LiveMsg;
      } catch {
        return;
      }
      if (m.type === "photo" && m.url) {
        const photoUrl = m.url;
        if (m.code) selfiesByCodeRef.current[m.code] = photoUrl;
        const pName = (m.memberName || m.member_name || m.householdName || m.household_name || "").trim();
        if (m.id) {
          const photoId = m.id;
          setSelfies((prev) =>
            prev.some((s) => s.id === photoId)
              ? prev
              : [...prev, { id: photoId, url: photoUrl, householdName: pName || null }],
          );
        }
      }
      if (m.type === "scan" && m.activity === "GREET") {
        const name = (m.memberName || m.member_name || m.householdName || m.household_name || "").trim();
        if (!name) return;
        if (m.seq != null && m.seq <= lastSeqRef.current) return; // the poll already handled it
        if (m.seq != null) lastSeqRef.current = Math.max(lastSeqRef.current, m.seq);
        initializedRef.current = true;
        const selfie = m.code ? (selfiesByCodeRef.current[m.code] ?? null) : null;
        enqueue({ name, selfie, seq: m.seq ?? 0 });
      }
    };
    return () => es.close();
  }, [eventId]);

  // Durable backstop: drain any confirmed-photo greeting we missed (offline /
  // reconnect) from the server queue so no welcome is ever dropped. `seq`
  // dedupes with the SSE `photo` stream above.
  useEffect(() => {
    if (!eventId || !api.live) return;
    const id = eventId;
    let stop = false;
    async function drain() {
      try {
        const res = await api.greetings(id, lastSeqRef.current);
        const firstLoad = !initializedRef.current;
        initializedRef.current = true;
        const cutoff = Date.now() - INITIAL_REPLAY_WINDOW_MS;
        for (const g of res.greetings) {
          if (stop || g.seq <= lastSeqRef.current) continue;
          lastSeqRef.current = Math.max(lastSeqRef.current, g.seq);
          if (firstLoad && g.occurredAt) {
            const ts = Date.parse(g.occurredAt);
            if (!Number.isNaN(ts) && ts < cutoff) continue;
          }
          enqueue({ name: g.name, selfie: g.selfie, seq: g.seq });
        }
      } catch {
        /* offline: the SSE rides us live; this tick retries in a bit */
      }
    }
    void drain();
    const t = setInterval(drain, 6000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [eventId]);

  function enqueue(g: Greeting) {
    // Functional update so the queue actually fills when one card is showing
    // (a naive `greeting` closure would always overwrite the current card).
    setGreeting((cur) => {
      if (cur) {
        queueRef.current.push(g);
        return cur;
      }
      return g;
    });
  }

  // When a greeting ends, show the next in the queue (if any).
  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => {
      const next = queueRef.current.shift();
      setGreeting(next ?? null);
    }, tvGreetSec * 1000);
    return () => clearTimeout(t);
  }, [greeting, tvGreetSec]);

  // Slideshow timer (skips while a greeting is showing). Loops over just the
  // photos (indices 1..end) so the intro never comes back mid-show.
  useEffect(() => {
    if (greeting) return;
    const total = 1 + slides.length + selfies.length; // title + photos
    const t = setInterval(() => setIndex((i) => (i + 1 >= total ? 1 : i + 1)), tvSlideSec * 1000);
    return () => clearInterval(t);
  }, [greeting, tvSlideSec, slides.length, selfies.length]);

  // Tap anywhere to skip the current moment: a greeting card ends early, and
  // the intro/title (or any slide) advances immediately. Debounced so rapid
  // taps don't double-fire.
  const lastTapRef = useRef(0);
  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;
    if (greeting) {
      const next = queueRef.current.shift();
      setGreeting(next ?? null);
    } else {
      setIndex((i) => (i + 1 >= items.length ? 1 : i + 1));
    }
  }

  const items = useMemo(() => {
    const photos: Slide[] = [...slides, ...selfies.map((s) => ({ id: `p-${s.id}`, url: s.url }))];
    // The intro shows once, as the opening card, then the photos loop on their
    // own — the title is NOT re-inserted every few slides (that read as the TV
    // "going back to the couple's intro" mid-show).
    const out: ({ kind: "title" } | { kind: "photo"; id: string; url: string; caption: string | null })[] = [
      { kind: "title" },
      ...photos.map((s) => ({ kind: "photo" as const, id: s.id, url: s.url, caption: null })),
    ];
    return out;
  }, [slides, selfies]);

  // Each new slide starts "not ready" — the intro shows until its image lands.
  useEffect(() => {
    setReadyUrl(null);
  }, [index]);

  const current = items[index % Math.max(items.length, 1)];
  const event = pairing?.event;
  const fsSupported = typeof document !== "undefined" && "requestFullscreen" in document.documentElement;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0f140d]" onClick={handleTap}>
      {items.map((item, i) =>
        item.kind === "photo" ? (
          <div
            key={`${item.id}-${i}`}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ${i === index && readyUrl === item.url ? "opacity-100" : "opacity-0"}`}
          >
            {i === index ? (
              <>
                <img
                  src={item.url}
                  alt=""
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
                  onLoad={() => setReadyUrl(item.url)}
                  onError={() => {
                    if (!skippedRef.current.has(item.url)) {
                      skippedRef.current.add(item.url);
                      setIndex((v) => v + 1); // skip a photo that fails to load
                    }
                  }}
                />
                <img src={item.url} alt="" className="kenburns absolute inset-0 h-full w-full object-contain" />
              </>
            ) : null}
          </div>
        ) : null,
      )}

      {/* The intro card doubles as the loading/fallback frame: it shows while a
          photo is still loading OR instead of one that failed — no blank waits. */}
      {current.kind === "title" || (current.kind === "photo" && readyUrl !== current.url) ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <div
            className="absolute inset-0 bg-[radial-gradient(110%_75%_at_50%_0%,#20291a_0%,#151b11_58%,#0c1009_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_38%,rgba(168,188,128,0.26),transparent_70%)]"
            aria-hidden
          />
          <TVFloral className="absolute left-4 top-[max(env(safe-area-inset-top),20px)] h-36 w-28 opacity-90" />
          <TVFloral className="absolute right-4 top-[max(env(safe-area-inset-top),20px)] h-36 w-28 opacity-90" mirrored />
          <p className="kicker relative text-[#bdca9f]">The wedding of</p>
          <h1 className="relative mt-4 font-display text-[clamp(52px,13vw,120px)] font-light leading-[0.95] text-cream">
            {event?.coupleLine?.split("&").map((n, i, all) => (
              <span key={n} className="block">
                {n.trim()}
                {i < all.length - 1 ? <span className="block py-2 text-[0.45em] text-gold">&amp;</span> : null}
              </span>
            ))}
          </h1>
          <div className="relative mt-7 flex items-center gap-3" role="presentation">
            <span className="h-px w-16 bg-gold/50" />
            <span className="size-1.5 rounded-full bg-gold" />
            <span className="h-px w-16 bg-gold/50" />
          </div>
          {event?.dateLabel ? <p className="kicker relative mt-6 text-gold">{event.dateLabel}</p> : null}
          {event?.venue ? <p className="relative mt-2 text-[length:calc(15px*var(--fs))] text-cream-dim">{event.venue}</p> : null}
          {event?.hashtag ? <p className="relative mt-6 font-display text-[length:calc(24px*var(--fs))] text-[#bdca9f]">{event.hashtag}</p> : null}
        </div>
      ) : null}

      {greeting ? (
        <div className="rise absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#141a10]/95 px-8 text-center">
          {backdrop ? (
            <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          ) : null}
          <div className="relative">
            <p className="kicker text-[#bdca9f]">Selamat datang</p>
            <h2 className="mt-4 font-display text-[clamp(56px,14vw,130px)] font-light leading-none text-cream">
              {greeting.name}
            </h2>
            {tvShowSelfie && greeting.selfie ? (
              <img
                src={greeting.selfie}
                alt={greeting.name}
                className="mx-auto mt-8 aspect-[4/3] w-[min(82vw,24rem)] rounded-3xl border-4 border-[#bdca9f]/60 object-cover shadow-2xl shadow-black/40"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="absolute right-6 top-[max(env(safe-area-inset-top),20px)] z-40 flex gap-2">
        {fsSupported ? (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label="Layar penuh"
            className="rounded-full bg-night/60 p-2 text-cream-dim backdrop-blur"
          >
            <Icon name="expand" className="size-5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => go("scan")}
          aria-label="Keluar mode TV"
          className="rounded-full bg-night/60 p-2 text-cream-dim backdrop-blur"
        >
          <Icon name="back" className="size-5" />
        </button>
      </div>
    </div>
  );
}

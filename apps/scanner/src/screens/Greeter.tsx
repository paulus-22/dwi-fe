import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "../components/ui";
import { API_ROOT, api, session } from "../data/api";
import { go, toggleFullscreen } from "../lib/ui";
import { useApp } from "../state";

type Slide = { id: string; url: string };
type Selfie = { id: string; url: string; householdName: string | null };
type Greeting = { name: string; selfie?: string | null; seq: number };

type LiveMsg = {
  type?: string;
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
 * Dedicated TV/greeter display. Paired like any scanner but never scans: it
 * shows the event's slideshow (R2 slides + every door's selfies) full-screen,
 * and when a guest checks in at a scanner it cuts to a welcome card — the
 * event's greeting backdrop, the guest's name, and (once it arrives) their
 * selfie — then resumes. It shares the same R2 content as the scanners.
 */
export function GreeterScreen() {
  const { pairing, tvSlideSec, tvGreetSec } = useApp();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [backdrop, setBackdrop] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const queueRef = useRef<Greeting[]>([]);
  const selfiesByCodeRef = useRef<Record<string, string>>({});
  /** Highest check-in `seq` already shown/queued — shared dedupe for SSE + poll. */
  const lastSeqRef = useRef(0);

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

  // Live stream: queue a greeting on confirmed check-in; remember selfie URLs.
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
      if (m.type === "photo" && m.code && m.url) {
        selfiesByCodeRef.current[m.code] = m.url;
      }
      if (m.type === "scan" && m.activity === "CHECK_IN") {
        // The backend live payload uses snake_case (household_name/member_name);
        // accept both cases in case that ever changes.
        const name =
          (m.memberName || m.member_name || m.householdName || m.household_name || "").trim();
        if (!name) return;
        if (m.seq != null && m.seq <= lastSeqRef.current) return; // the poll already handled it
        if (m.seq != null) lastSeqRef.current = Math.max(lastSeqRef.current, m.seq);
        const selfie = selfiesByCodeRef.current[m.code ?? ""];
        enqueue({ name, selfie, seq: m.seq ?? 0 });
      }
    };
    return () => es.close();
  }, [eventId]);

  // Durable backstop: drain any check-in we missed (offline/reconnect) from the
  // server queue so no welcome is ever dropped. `seq` dedupes with the SSE above.
  useEffect(() => {
    if (!eventId || !api.live) return;
    const id = eventId;
    let stop = false;
    async function drain() {
      try {
        const res = await api.greetings(id, lastSeqRef.current);
        for (const g of res.greetings) {
          if (stop || g.seq <= lastSeqRef.current) continue;
          lastSeqRef.current = Math.max(lastSeqRef.current, g.seq);
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
    // (the naive `greeting` closure would always overwrite the current card).
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

  // Slideshow timer (skips while a greeting is showing).
  useEffect(() => {
    if (greeting) return;
    const t = setInterval(() => setIndex((i) => i + 1), tvSlideSec * 1000);
    return () => clearInterval(t);
  }, [greeting, tvSlideSec]);

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
      setIndex((i) => i + 1);
    }
  }

  const items = useMemo(() => {
    const photos: Slide[] = [...slides, ...selfies.map((s) => ({ id: `p-${s.id}`, url: s.url }))];
    const out: ({ kind: "title" } | { kind: "photo"; id: string; url: string; caption: string | null })[] = [
      { kind: "title" },
    ];
    photos.forEach((s, i) => {
      out.push({ kind: "photo", id: s.id, url: s.url, caption: null });
      if ((i + 1) % 4 === 0 && i + 1 < photos.length) out.push({ kind: "title" });
    });
    return out;
  }, [slides, selfies]);

  const current = items[index % Math.max(items.length, 1)];
  const event = pairing?.event;
  const fsSupported = typeof document !== "undefined" && "requestFullscreen" in document.documentElement;

  return (
    <div className="absolute inset-0 overflow-hidden bg-night" onClick={handleTap}>
      {items.map((item, i) =>
        item.kind === "photo" ? (
          <div
            key={`${item.id}-${i}`}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ${i === index ? "opacity-100" : "opacity-0"}`}
          >
            {i === index ? (
              <>
                <img src={item.url} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
                <img src={item.url} alt="" className="kenburns absolute inset-0 h-full w-full object-contain" />
              </>
            ) : null}
          </div>
        ) : null,
      )}

      {current?.kind === "title" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(233,175,138,0.12),transparent_65%)]" />
          <p className="kicker relative text-peach">The wedding of</p>
          <h1 className="relative mt-4 font-display text-[clamp(52px,13vw,120px)] font-light leading-[0.95] text-cream">
            {event?.coupleLine?.split("&").map((n, i, all) => (
              <span key={n} className="block">
                {n.trim()}
                {i < all.length - 1 ? <span className="block py-2 text-[0.45em] text-gold">&amp;</span> : null}
              </span>
            ))}
          </h1>
          {event?.dateLabel ? <p className="kicker relative mt-8 text-gold">{event.dateLabel}</p> : null}
          {event?.venue ? <p className="relative mt-2 text-[length:calc(15px*var(--fs))] text-cream-dim">{event.venue}</p> : null}
          {event?.hashtag ? <p className="relative mt-6 font-display text-[length:calc(24px*var(--fs))] text-peach">{event.hashtag}</p> : null}
        </div>
      ) : null}

      {greeting ? (
        <div className="rise absolute inset-0 z-30 flex flex-col items-center justify-center bg-night/95 px-8 text-center">
          {backdrop ? (
            <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          ) : null}
          <div className="relative">
            <p className="kicker text-peach">Selamat datang</p>
            <h2 className="mt-4 font-display text-[clamp(56px,14vw,130px)] font-light leading-none text-cream">
              {greeting.name}
            </h2>
            {greeting.selfie ? (
              <img
                src={greeting.selfie}
                alt={greeting.name}
                className="mx-auto mt-8 h-56 w-44 rounded-3xl border-4 border-peach/60 object-cover"
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

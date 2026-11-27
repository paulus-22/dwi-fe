import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "../components/ui";
import { API_ROOT, api, session } from "../data/api";
import { go, toggleFullscreen } from "../lib/ui";
import { useApp } from "../state";

type Slide = { id: string; url: string };
type Selfie = { id: string; url: string; householdName: string | null };
type Greeting = { name: string; selfie?: string | null };

const GREETING_MS = 7000;
const SLIDE_SEC = 8;

type LiveMsg = {
  type?: string;
  activity?: string;
  code?: string;
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
  const { pairing } = useApp();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [backdrop, setBackdrop] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const queueRef = useRef<Greeting[]>([]);
  const selfiesByCodeRef = useRef<Record<string, string>>({});

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
        const selfie = selfiesByCodeRef.current[m.code ?? ""];
        enqueue({ name, selfie });
      }
    };
    return () => es.close();
  }, [eventId]);

  function enqueue(g: Greeting) {
    if (!greeting) {
      setGreeting(g);
    } else {
      queueRef.current.push(g);
    }
  }

  // When a greeting ends, show the next in the queue (if any).
  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => {
      const next = queueRef.current.shift();
      setGreeting(next ?? null);
    }, GREETING_MS);
    return () => clearTimeout(t);
  }, [greeting]);

  // Slideshow timer (skips while a greeting is showing).
  useEffect(() => {
    if (greeting) return;
    const t = setInterval(() => setIndex((i) => i + 1), SLIDE_SEC * 1000);
    return () => clearInterval(t);
  }, [greeting]);

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
    <div className="absolute inset-0 overflow-hidden bg-night">
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
        <div className="rise absolute inset-0 z-30 flex flex-col items-center justify-center bg-night/85 px-8 text-center">
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

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { DEFAULT_ACTIVITIES, loadFlags, startSyncLoop, subscribeSync, type SyncState } from "./data/scanner";
import { store } from "./data/store";
import type { ActivityConfig, AutoConfig, IdleConfig, Pairing } from "./domain/types";
import type { Facing } from "./lib/camera";

type FacingPrefs = { scan: Facing; photo: Facing };
const DEFAULT_FACING: FacingPrefs = { scan: "environment", photo: "user" };
export const DEFAULT_FONT_SCALE = 1.1;
export const FONT_SCALE_MIN = 0.9;
export const FONT_SCALE_MAX = 1.5;
/** How a group (kelompok) QR's arriving member name is captured. */
export type GroupNameMode = "usher" | "guest";
export const DEFAULT_GROUP_NAME_MODE: GroupNameMode = "usher";
/** Selfie countdown in seconds before capture: 0 = instant, 1–5 = timer. */
export const DEFAULT_PHOTO_DELAY = 0;
export const PHOTO_DELAY_MAX = 5;
/** TV mode slideshow / greeting durations in seconds (per device). */
export const DEFAULT_TV_SLIDE_SEC = 8;
export const TV_SLIDE_SEC_MAX = 20;
export const DEFAULT_TV_GREET_SEC = 7;
export const TV_GREET_SEC_MAX = 15;

/** Scanner UI theme. `data-scanner-theme` on <html> re-colours the whole app. */
export type ScannerTheme = "night" | "day" | "midnight" | "terracotta";
export const DEFAULT_SCANNER_THEME: ScannerTheme = "night";

function applyFontScale(scale: number) {
  document.documentElement.style.setProperty("--fs", String(scale));
}

function applyTheme(theme: ScannerTheme) {
  document.documentElement.setAttribute("data-scanner-theme", theme);
}

export const DEFAULT_AUTO: AutoConfig = { on: false, delaySec: 2, skipActivities: false };

export const DEFAULT_IDLE: IdleConfig = { auto: true, afterSec: 60, camera: "off", includeSelfies: true, slideSec: 8 };

type AppState = {
  pairing: Pairing | null;
  activities: ActivityConfig[];
  sync: SyncState;
  /** Bumped after any write, so lists re-read IndexedDB. */
  version: number;
  /** True while a guest is mid-flow; the tab bar hides so nothing is tapped by accident. */
  immersive: boolean;
  setImmersive(on: boolean): void;
  /** Which camera each step opens with; remembered per device. */
  facing: FacingPrefs;
  setFacing(kind: keyof FacingPrefs, value: Facing): void;
  idle: IdleConfig;
  setIdle(patch: Partial<IdleConfig>): void;
  /** Multiplier on every UI font size; remembered per device. */
  fontScale: number;
  setFontScale(scale: number): void;
  auto: AutoConfig;
  setAuto(patch: Partial<AutoConfig>): void;
  groupNameMode: GroupNameMode;
  setGroupNameMode(mode: GroupNameMode): void;
  /** Seconds of countdown before a photo is taken: 0 = instant, 1–5 = timer. */
  photoDelay: number;
  setPhotoDelay(sec: number): void;
  /** TV mode: seconds per slide and seconds a greeting card stays up. */
  tvSlideSec: number;
  setTvSlideSec(sec: number): void;
  tvGreetSec: number;
  setTvGreetSec(sec: number): void;
  /** Which UI theme the device renders with; remembered per device. */
  theme: ScannerTheme;
  setTheme(theme: ScannerTheme): void;
  refresh(): void;
  setPairing(p: Pairing | null): void;
  setActivities(list: ActivityConfig[]): Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useApp outside provider");
  return value;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [activities, setActivitiesState] = useState<ActivityConfig[]>(DEFAULT_ACTIVITIES);
  const [sync, setSync] = useState<SyncState>({ pending: 0, online: true, syncing: false, lastSyncedAt: null });
  const [version, setVersion] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [facing, setFacingState] = useState<FacingPrefs>(DEFAULT_FACING);
  const [idle, setIdleState] = useState<IdleConfig>(DEFAULT_IDLE);
  const [fontScale, setFontScaleState] = useState(DEFAULT_FONT_SCALE);
  const [auto, setAutoState] = useState<AutoConfig>(DEFAULT_AUTO);
  const [groupNameMode, setGroupNameModeState] = useState<GroupNameMode>(DEFAULT_GROUP_NAME_MODE);
  const [photoDelay, setPhotoDelayState] = useState(DEFAULT_PHOTO_DELAY);
  const [tvSlideSec, setTvSlideSecState] = useState(DEFAULT_TV_SLIDE_SEC);
  const [tvGreetSec, setTvGreetSecState] = useState(DEFAULT_TV_GREET_SEC);
  const [theme, setThemeState] = useState<ScannerTheme>(DEFAULT_SCANNER_THEME);

  useEffect(() => {
    void (async () => {
      await loadFlags();
      setPairing((await store.getPairing()) ?? null);
      setActivitiesState((await store.getActivities()) ?? DEFAULT_ACTIVITIES);
      setFacingState({ ...DEFAULT_FACING, ...((await store.getPref<FacingPrefs>("facing")) ?? {}) });
      setIdleState({ ...DEFAULT_IDLE, ...((await store.getPref<IdleConfig>("idle")) ?? {}) });
      setAutoState({ ...DEFAULT_AUTO, ...((await store.getPref<AutoConfig>("auto")) ?? {}) });
      setGroupNameModeState((await store.getPref<GroupNameMode>("groupNameMode")) ?? DEFAULT_GROUP_NAME_MODE);
      setPhotoDelayState((await store.getPref<number>("photoDelay")) ?? DEFAULT_PHOTO_DELAY);
      setTvSlideSecState((await store.getPref<number>("tvSlideSec")) ?? DEFAULT_TV_SLIDE_SEC);
      setTvGreetSecState((await store.getPref<number>("tvGreetSec")) ?? DEFAULT_TV_GREET_SEC);
      const t = (await store.getPref<ScannerTheme>("theme")) ?? DEFAULT_SCANNER_THEME;
      applyTheme(t);
      setThemeState(t);
      const scale = (await store.getPref<number>("fontScale")) ?? DEFAULT_FONT_SCALE;
      applyFontScale(scale);
      setFontScaleState(scale);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const stopLoop = startSyncLoop();
    const unsubscribe = subscribeSync((s) => {
      setSync(s);
    });
    return () => {
      stopLoop();
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const setFacing = useCallback((kind: keyof FacingPrefs, value: Facing) => {
    setFacingState((prev) => {
      const next = { ...prev, [kind]: value };
      void store.setPref("facing", next);
      return next;
    });
  }, []);

  const setIdle = useCallback((patch: Partial<IdleConfig>) => {
    setIdleState((prev) => {
      const next = { ...prev, ...patch };
      void store.setPref("idle", next);
      return next;
    });
  }, []);

  const setFontScale = useCallback((scale: number) => {
    const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(scale * 100) / 100));
    applyFontScale(clamped);
    setFontScaleState(clamped);
    void store.setPref("fontScale", clamped);
  }, []);

  const setAuto = useCallback((patch: Partial<AutoConfig>) => {
    setAutoState((prev) => {
      const next = { ...prev, ...patch };
      void store.setPref("auto", next);
      return next;
    });
  }, []);

  const setGroupNameMode = useCallback((mode: GroupNameMode) => {
    setGroupNameModeState(mode);
    void store.setPref("groupNameMode", mode);
  }, []);

  const setPhotoDelay = useCallback((sec: number) => {
    const clamped = Math.min(PHOTO_DELAY_MAX, Math.max(0, Math.round(sec)));
    setPhotoDelayState(clamped);
    void store.setPref("photoDelay", clamped);
  }, []);

  const setTvSlideSec = useCallback((sec: number) => {
    const clamped = Math.min(TV_SLIDE_SEC_MAX, Math.max(3, Math.round(sec)));
    setTvSlideSecState(clamped);
    void store.setPref("tvSlideSec", clamped);
  }, []);

  const setTvGreetSec = useCallback((sec: number) => {
    const clamped = Math.min(TV_GREET_SEC_MAX, Math.max(3, Math.round(sec)));
    setTvGreetSecState(clamped);
    void store.setPref("tvGreetSec", clamped);
  }, []);

  const setTheme = useCallback((t: ScannerTheme) => {
    applyTheme(t);
    setThemeState(t);
    void store.setPref("theme", t);
  }, []);

  const setActivities = useCallback(async (list: ActivityConfig[]) => {
    setActivitiesState(list);
    await store.setActivities(list);
  }, []);

  if (!ready) return <div className="h-full bg-night" />;

  return (
    <Ctx.Provider
      value={{
        pairing,
        activities,
        sync,
        version,
        refresh,
        setPairing,
        setActivities,
        immersive,
        setImmersive,
        facing,
        setFacing,
        idle,
        setIdle,
        fontScale,
        setFontScale,
        auto,
        setAuto,
        groupNameMode,
        setGroupNameMode,
        photoDelay,
        setPhotoDelay,
        tvSlideSec,
        setTvSlideSec,
        tvGreetSec,
        setTvGreetSec,
        theme,
        setTheme,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

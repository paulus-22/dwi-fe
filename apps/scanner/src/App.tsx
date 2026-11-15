import { Icon } from "./components/ui";
import { GalleryScreen } from "./screens/Gallery";
import { GuestsScreen } from "./screens/Guests";
import { MoreScreen } from "./screens/More";
import { PairScreen } from "./screens/Pair";
import { PassesScreen } from "./screens/Passes";
import { ScanScreen } from "./screens/Scan";
import { WallScreen } from "./screens/Wall";
import { go, useRoute } from "./lib/ui";
import { AppProvider, useApp } from "./state";

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

const TABS = [
  { route: "scan", label: "Scan", icon: "scan" },
  { route: "guests", label: "Tamu", icon: "users" },
  { route: "gallery", label: "Galeri", icon: "image" },
  { route: "more", label: "Lainnya", icon: "menu" },
] as const;

function Shell() {
  const { pairing, immersive } = useApp();
  const route = useRoute();

  // The demo passes need no pairing: they are opened on a *second* device.
  if (route === "passes") return <PassesScreen />;
  if (!pairing) return <PairScreen />;
  if (route === "wall") return <WallScreen />;

  return (
    <div className="relative h-full">
      <main className="h-full">
        {route === "guests" ? <GuestsScreen /> : null}
        {route === "gallery" ? <GalleryScreen /> : null}
        {route === "more" ? <MoreScreen /> : null}
        {route !== "guests" && route !== "gallery" && route !== "more" ? <ScanScreen key="scan" /> : null}
      </main>
      <nav hidden={immersive} className="safe-bottom absolute inset-x-0 bottom-0 z-20 border-t border-edge/60 bg-night/90 backdrop-blur">
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((t) => {
            const active = route === t.route || (t.route === "scan" && !TABS.some((x) => x.route === route));
            return (
              <li key={t.route} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(t.route)}
                  className={`flex w-full flex-col items-center gap-1 pb-1 pt-2.5 text-[length:calc(11px*var(--fs))] tracking-wide ${active ? "text-peach" : "text-mute"}`}
                >
                  <Icon name={t.icon} className="size-6" />
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

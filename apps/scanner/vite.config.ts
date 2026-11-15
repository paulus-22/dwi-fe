import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// The scanner is a static, client-only app: no SSR, nothing to gain from it.
// It installs to the home screen and keeps working with no network, which is
// the whole point — venue wifi is the thing most likely to fail on the day.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-icon.png", "fonts/*.ttf"],
      manifest: {
        name: "Undangan Digital — Scanner",
        short_name: "Scanner",
        description: "Check-in tamu dan foto di pintu masuk.",
        theme_color: "#23261a",
        background_color: "#23261a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        // The QR decoder is a ~1 MB wasm binary; it must be precached or the
        // first scan after a cold, offline start would fail.
        globPatterns: ["**/*.{js,css,html,svg,png,ttf,wasm}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});

import type { Metadata, Viewport } from "next";

import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "The Moments by Bizzmo",
  description: "Digital wedding invitation platform",
  other: {
    "color-scheme": "only light",
    "supported-color-schemes": "light",
  },
};

export const viewport: Viewport = {
  colorScheme: "only light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" style={{ colorScheme: "only light" }} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "The Moments by Bizzmo",
  description: "Digital wedding invitation platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

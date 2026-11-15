import type { Metadata } from "next";
import { Cormorant_Upright, Jost } from "next/font/google";

import "./globals.css";

const cormorant = Cormorant_Upright({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Moments by Bizzmo",
  description: "Digital wedding invitation platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

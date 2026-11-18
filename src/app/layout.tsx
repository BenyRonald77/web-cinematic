import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import SmoothScroll from "@/components/layout/SmoothScroll";
import "lenis/dist/lenis.css";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pelan Coffee — Make time taste better",
  description:
    "Single-origin beans from across the archipelago, roasted in small batches every week.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} antialiased`}>
      <body className="bg-cream font-sans text-espresso">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

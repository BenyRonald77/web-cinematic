"use client";

import Lenis from "lenis";
import type { ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type SmoothScrollProps = {
  children: ReactNode;
};

/**
 * Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger stays in sync.
 * Disabled (native scroll) when the user prefers reduced motion.
 */
export default function SmoothScroll({ children }: SmoothScrollProps) {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ autoRaf: false });
      const tick = (time: number) => lenis.raf(time * 1000);

      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    });

    return () => mm.revert();
  });

  return <>{children}</>;
}

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
 *
 * Also keeps the reading position when the width changes (rotation, window resize): scene
 * heights scale with the viewport, so the same share of the page is the same scene and progress.
 */
export default function SmoothScroll({ children }: SmoothScrollProps) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    let width = window.innerWidth;
    let ratio = 0;

    const saveRatio = () => {
      // Ignore scroll events caused by the resize itself (width already changed).
      if (window.innerWidth !== width) return;
      const max = maxScroll();
      ratio = max > 0 ? window.scrollY / max : 0;
    };
    const restoreRatio = () => {
      if (window.innerWidth === width) return; // height-only change (e.g. mobile toolbar): leave it
      width = window.innerWidth;
      window.scrollTo(0, Math.round(ratio * maxScroll()));
      ScrollTrigger.update();
    };

    saveRatio();
    window.addEventListener("scroll", saveRatio, { passive: true });
    ScrollTrigger.addEventListener("refresh", restoreRatio);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // syncTouch: false keeps touch scrolling native on phones; only wheel scrolling is smoothed.
      const lenis = new Lenis({ autoRaf: false, syncTouch: false });
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

    return () => {
      window.removeEventListener("scroll", saveRatio);
      ScrollTrigger.removeEventListener("refresh", restoreRatio);
      mm.revert();
    };
  });

  return <>{children}</>;
}

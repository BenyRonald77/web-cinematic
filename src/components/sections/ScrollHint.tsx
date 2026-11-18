"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** "SCROLL" cue for the first scene. Fades out once the page scrolls, back in at the very top. */
export default function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const hint = ref.current!;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-hint-line]",
          { yPercent: -100 },
          { yPercent: 100, duration: 1.6, ease: "power1.inOut", repeat: -1 },
        );
        ScrollTrigger.create({
          start: 10,
          end: "max",
          onEnter: () => gsap.to(hint, { autoAlpha: 0, duration: 0.3, overwrite: true }),
          onLeaveBack: () => gsap.to(hint, { autoAlpha: 1, duration: 0.3, overwrite: true }),
        });
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-semibold tracking-[0.3em]"
    >
      <span>SCROLL</span>
      <span className="relative h-10 w-px overflow-hidden bg-espresso/20">
        <span data-hint-line className="absolute inset-0 bg-espresso" />
      </span>
    </div>
  );
}

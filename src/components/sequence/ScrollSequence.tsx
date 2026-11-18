"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { drawCover } from "./drawCover";
import {
  frameSrc,
  MOBILE_BREAKPOINT,
  useFramePreloader,
  type SequenceFrames,
} from "./useFramePreloader";

/** On touch devices, height-only resizes smaller than this are the toolbar showing/hiding. */
const TOOLBAR_TOLERANCE = 160;
/** Writes data-frame / data-resizes on the canvas for tests. On in dev, or with NEXT_PUBLIC_SEQUENCE_DEBUG=1. */
const DEBUG =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SEQUENCE_DEBUG === "1";

type ScrollSequenceProps = {
  sceneId: string;
  frames: SequenceFrames;
  /** Horizontal crop point 0–1, same meaning as CSS `object-position: X%`. */
  focusX: number;
  /** Load this scene first and fetch its poster at high priority (first scene). */
  priority?: boolean;
  /** Text is on screen at load and plays an intro instead of entering on scroll (first scene). */
  intro?: boolean;
  /**
   * Overlap the previous scene's last screen so the cut happens in place: this scene stays
   * hidden until its pin starts, then replaces the previous scene on the identical frame.
   */
  joinPrevious?: boolean;
  /** id of the heading inside `children`. */
  titleId?: string;
  /** Text overlay. Mark elements with data-split="words" | "lines" or data-reveal to animate them. */
  children: ReactNode;
};

/**
 * Scroll-scrubbed text timeline, duration 1 so `progress` maps 1:1 to the scene's scroll progress.
 * In: 6–30 % (skipped for intro scenes). Out: 72–88 %, so text is gone before the next scene cuts in.
 */
function buildTextTimeline(pieces: Element[], intro: boolean) {
  const tl = gsap.timeline({ paused: true });
  if (!intro) {
    tl.fromTo(
      pieces,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.16, ease: "power2.out", stagger: { amount: 0.08 } },
      0.06,
    );
  }
  tl.fromTo(
    pieces,
    { yPercent: 0, opacity: 1 },
    {
      yPercent: -110,
      opacity: 0,
      duration: 0.1,
      ease: "power2.in",
      stagger: { amount: 0.06 },
      immediateRender: false,
    },
    0.72,
  );
  tl.set({}, {}, 1);
  return tl;
}

export default function ScrollSequence({
  sceneId,
  frames,
  focusX,
  priority = false,
  intro = false,
  joinPrevious = false,
  titleId,
  children,
}: ScrollSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const preloader = useFramePreloader(sceneId, frames, priority);

  useGSAP(
    () => {
      const section = sectionRef.current!;
      const layer = layerRef.current!;
      const canvas = canvasRef.current!;
      const overlay = overlayRef.current!;
      const mm = gsap.matchMedia();

      // Reduced motion gets no pin, scrub, text animation or frame loading: CSS shows the
      // last frame as a static <picture> with plain text.
      mm.add("(prefers-reduced-motion: no-preference)", (context) => {
        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) return;

        const count = preloader.count();
        let target = 0; // frame the scroll position asks for
        let drawn = -1; // frame currently on the canvas (-1: none, poster shows through)
        let sizeDirty = true;
        let rafId = 0;
        let textTl: gsap.core.Timeline | null = null;
        let introTl: gsap.core.Timeline | null = null;
        let cancelled = false;

        // --- Drawing: only when the nearest loaded frame changes ---------------------------
        const render = () => {
          rafId = 0;
          const index = preloader.nearest(target);
          if (index < 0 || (index === drawn && !sizeDirty)) return;
          drawCover(ctx2d, preloader.image(index)!, focusX);
          drawn = index;
          sizeDirty = false;
          if (DEBUG) canvas.dataset.frame = String(index);
        };
        const requestRender = () => {
          rafId ||= requestAnimationFrame(render);
        };

        // --- Canvas size = CSS size × DPR (max 2) ------------------------------------------
        const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
        let lastWidth = 0;
        let lastHeight = 0;
        const resizeObserver = new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          const toolbarOnly =
            coarsePointer &&
            lastWidth > 0 &&
            width === lastWidth &&
            Math.abs(height - lastHeight) < TOOLBAR_TOLERANCE;
          if (toolbarOnly) return;
          lastWidth = width;
          lastHeight = height;

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.round(width * dpr);
          const h = Math.round(height * dpr);
          if (w === canvas.width && h === canvas.height) return;
          canvas.width = w; // resizing clears the canvas…
          canvas.height = h;
          sizeDirty = true;
          render(); // …so redraw right away, before the next paint
          if (DEBUG) canvas.dataset.resizes = String(Number(canvas.dataset.resizes ?? 0) + 1);
        });
        resizeObserver.observe(canvas);

        // --- In-place cut: a joined scene is hidden until its pin starts --------------------
        let shown = true;
        const setShown = (value: boolean) => {
          if (!joinPrevious || value === shown) return;
          shown = value;
          gsap.set(layer, { autoAlpha: value ? 1 : 0 });
        };

        // --- Scroll progress → frame index + text timeline ---------------------------------
        const update = (progress: number) => {
          const next = Math.round(progress * (count - 1));
          if (next !== target) {
            target = next;
            requestRender();
          }
          if (introTl?.isActive() && progress > 0.02) introTl.progress(1);
          textTl?.progress(progress);
        };

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          // Pinned distance = section height − sticky layer height (both lvh), read from the DOM
          // so JS and CSS always agree, whatever the mobile toolbar is doing.
          end: () => `+=${section.offsetHeight - layer.offsetHeight}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => {
            update(self.progress);
            setShown(self.scroll() >= self.start);
          },
          onEnter: () => setShown(true),
          onLeaveBack: () => setShown(false),
        });
        update(trigger.progress);
        setShown(trigger.scroll() >= trigger.start);

        // --- Frames ------------------------------------------------------------------------
        const stopLoading = preloader.start(section, (index) => {
          if (drawn < 0 || Math.abs(index - target) < Math.abs(drawn - target)) requestRender();
        });

        // --- Text (after fonts, so lines are measured with the real font) ------------------
        const setupText = () => {
          const sources = gsap.utils.toArray<HTMLElement>("[data-split], [data-reveal]", overlay);
          const splits = new Map<HTMLElement, SplitText>();
          let ready = false;

          const pieces = () =>
            sources.flatMap((el): Element[] => {
              const split = splits.get(el);
              if (!split) return [el];
              return el.dataset.split === "lines" ? split.lines : split.words;
            });

          const rebuild = () => {
            if (!ready) return;
            context.add(() => {
              introTl?.progress(1);
              textTl?.revert();
              textTl = buildTextTimeline(pieces(), intro);
              textTl.progress(trigger.progress);
            });
          };

          for (const el of sources) {
            if (el.dataset.split === "words") {
              splits.set(el, SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" }));
            } else if (el.dataset.split === "lines") {
              splits.set(
                el,
                SplitText.create(el, {
                  type: "lines",
                  mask: "lines",
                  linesClass: "split-line",
                  aria: "none",
                  autoSplit: true, // re-split when the width changes (resize, rotation)
                  onSplit: rebuild,
                }),
              );
            }
          }
          ready = true;
          rebuild();

          if (intro) {
            if (trigger.progress < 0.02) {
              introTl = gsap.timeline({ delay: 0.15 }).fromTo(
                pieces(),
                { yPercent: 110, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.06 },
              );
            }
            gsap.set(overlay, { visibility: "visible" }); // CSS hides [data-intro] until now
          }
        };

        document.fonts.ready.then(() => {
          if (!cancelled) context.add(setupText);
        });

        return () => {
          cancelled = true;
          resizeObserver.disconnect();
          cancelAnimationFrame(rafId);
          stopLoading();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  const mobileQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

  return (
    <section
      ref={sectionRef}
      id={sceneId}
      aria-labelledby={titleId}
      // Heights and offsets use lvh so the mobile toolbar never changes them.
      className={`relative h-[300lvh] motion-reduce:h-auto ${
        joinPrevious ? "-mt-[100lvh] motion-reduce:mt-0" : ""
      }`}
    >
      <div
        ref={layerRef}
        className="sticky top-0 h-lvh overflow-hidden bg-cream motion-reduce:relative motion-reduce:h-svh"
      >
        {/* Poster: frame 1 until the canvas draws; last frame for reduced motion. Picked by the browser before JS runs. */}
        <picture>
          <source
            media={`(prefers-reduced-motion: reduce) and ${mobileQuery}`}
            srcSet={frameSrc(sceneId, "mobile", frames.mobile.count - 1)}
          />
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet={frameSrc(sceneId, "desktop", frames.desktop.count - 1)}
          />
          <source media={mobileQuery} srcSet={frameSrc(sceneId, "mobile", 0)} />
          {/* Plain <img> (not next/image): frames are pre-optimized and <picture> does the art direction. */}
          <img
            src={frameSrc(sceneId, "desktop", 0)}
            alt=""
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: `${focusX * 100}% 50%` }}
          />
        </picture>

        {/* object-cover: if the box changes without a bitmap resize (toolbar), it crops instead of stretching. */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover motion-reduce:hidden"
          style={{ objectPosition: `${focusX * 100}% 50%` }}
        />

        {/* Text lives inside the small viewport (svh) so the mobile toolbar never covers it. */}
        <div
          ref={overlayRef}
          data-intro={intro ? "" : undefined}
          className="absolute inset-x-0 top-0 h-svh"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

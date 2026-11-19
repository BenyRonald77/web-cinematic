"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
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

/** Fade of the last scene into the page, in % of the screen height. */
const FADE_OUT = 14;

/** Image mask: fade in over the seam at the top (if any), fade out into the page at the bottom (last scene). */
function edgeMask(seamTop: number, fadeBottom: boolean) {
  const top = seamTop > 0 ? `transparent, black ${seamTop}%` : "black, black";
  const bottom = fadeBottom ? `black ${100 - FADE_OUT}%, transparent` : "black";
  return `linear-gradient(to bottom, ${top}, ${bottom})`;
}

type ScrollSequenceProps = {
  sceneId: string;
  frames: SequenceFrames;
  /** Horizontal crop point 0–1, same meaning as CSS `object-position: X%`. */
  focusX: number;
  /** Sideways shift as a share of the drawn image width (see drawCover). */
  offsetX?: number;
  /** Smallest and largest offsetX of all scenes, so every scene is drawn at the same size. */
  offsetRange?: readonly [number, number];
  /** Load this scene first and fetch its poster at high priority (first scene). */
  priority?: boolean;
  /** Text is already on screen at load (its intro is CSS, see IntroWords), so GSAP doesn't reveal it. */
  intro?: boolean;
  /**
   * Seam with the scene above, in % of the screen height: overlap it by that much and fade in over
   * it (0 for the first scene). Thin where a flow crosses the border, wider for a plain gradient.
   */
  seamTop?: number;
  /** The next scene's seamTop (0 if there is none), so this scene's frames stop before it appears. */
  seamBottom?: number;
  /** Fade the bottom edge into the page (the last scene). */
  fadeBottom?: boolean;
  /** id of the heading inside `children`. */
  titleId?: string;
  /** Text overlay. Mark elements with data-split="words" | "lines", data-reveal or data-scrim to animate them. */
  children: ReactNode;
};

/** Text reveal while the text enters the screen (scrubbed): scrim first, then the pieces. */
function buildTextTimeline(pieces: Element[], scrims: Element[]) {
  const tl = gsap.timeline({ paused: true });
  if (scrims.length) tl.fromTo(scrims, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "none" }, 0);
  tl.fromTo(
    pieces,
    { yPercent: 125, opacity: 0 }, // 125: clears the mask's bottom padding
    { yPercent: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: { amount: 0.3 } },
    0.1,
  );
  return tl;
}

/**
 * One cinematic scene. The image holds still on screen (sticky) while the frames play, then
 * scrolls away with the page; the text scrolls with the page the whole time. So whenever a scene
 * border crosses the screen, the scene above shows its LAST frame and the scene below its FIRST
 * frame: the two frames made to continue each other's flow.
 */
export default function ScrollSequence({
  sceneId,
  frames,
  focusX,
  offsetX = 0,
  offsetRange = [offsetX, offsetX],
  priority = false,
  intro = false,
  seamTop = 0,
  seamBottom = 0,
  fadeBottom = false,
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

      // Reduced motion gets no hold, scrub, text animation or frame loading: CSS shows the last
      // frame as a static <picture> with plain text.
      mm.add("(prefers-reduced-motion: no-preference)", (context) => {
        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) return;

        const count = preloader.count();
        let target = 0; // frame the scroll position asks for
        let drawn = -1; // frame currently on the canvas (-1: none, poster shows through)
        let sizeDirty = true;
        let rafId = 0;
        let cancelled = false;

        // --- Drawing: only when the nearest loaded frame changes ---------------------------
        const render = () => {
          rafId = 0;
          const index = preloader.nearest(target);
          if (index < 0 || (index === drawn && !sizeDirty)) return;
          drawCover(ctx2d, preloader.image(index)!, focusX, offsetX, offsetRange);
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

        // --- Hold: frames play while the sticky image fills the screen ---------------------
        const update = (progress: number) => {
          const next = Math.round(progress * (count - 1));
          if (next !== target) {
            target = next;
            requestRender();
          }
        };
        // Hold = section height − sticky image height (both lvh, read from the DOM so JS and
        // CSS agree), minus the seam strips: frames only move while no neighbour is on screen,
        // so a crossing border always shows this scene's first or last frame.
        const seamBefore = () => (layer.offsetHeight * seamTop) / 100;
        const seamAfter = () => (fadeBottom ? 0 : (layer.offsetHeight * seamBottom) / 100);
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: () => `top+=${seamBefore()} top`,
          end: () => `+=${section.offsetHeight - layer.offsetHeight - seamBefore() - seamAfter()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });
        update(trigger.progress);

        // --- Frames ------------------------------------------------------------------------
        const stopLoading = preloader.start(section, (index) => {
          if (drawn < 0 || Math.abs(index - target) < Math.abs(drawn - target)) requestRender();
        });

        // --- Text --------------------------------------------------------------------------
        // Scene 01's text is on screen from the first paint (CSS intro): nothing to do.
        // Elsewhere: [data-reveal] elements animate as they are; [data-split] ones are split by
        // SplitText first (after fonts load, so lines are measured with the real font). The
        // reveal is scrubbed by the text entering the screen.
        const setupText = () => {
          const sources = gsap.utils.toArray<HTMLElement>("[data-split], [data-reveal]", overlay);
          const scrims = gsap.utils.toArray<HTMLElement>("[data-scrim]", overlay);
          const splits = new Map<HTMLElement, SplitText>();
          let ready = false;
          let textTrigger: ScrollTrigger | null = null;

          const pieces = () =>
            sources.flatMap((el): Element[] => {
              const split = splits.get(el);
              if (!split) return [el];
              return el.dataset.split === "lines" ? split.lines : split.words;
            });

          const rebuild = () => {
            if (!ready) return;
            context.add(() => {
              const progress = textTrigger?.progress ?? 0;
              textTrigger?.animation?.revert();
              textTrigger?.kill();
              const tl = buildTextTimeline(pieces(), scrims);
              textTrigger = ScrollTrigger.create({
                // The first text element (e.g. the "02 —" label), not the screen-high box: the
                // reveal plays while the copy itself comes into view.
                trigger: sources[0] ?? overlay,
                start: "top 95%",
                end: "top 50%",
                scrub: true,
                animation: tl,
              });
              tl.progress(textTrigger.progress || progress);
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
        };

        if (!intro) {
          if (overlay.querySelector("[data-split]")) {
            document.fonts.ready.then(() => {
              if (!cancelled) context.add(setupText);
            });
          } else {
            setupText();
          }
        }

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
  const mask = edgeMask(seamTop, fadeBottom);
  // Poster: same crop as the canvas. The offset is a share of the cover-fitted image width,
  // max(screen width, screen height × image ratio); the canvas may also grow a little to keep
  // the edges covered, which the poster skips (it only shows until the first frame is drawn).
  const ratio = frames.desktop.width / frames.desktop.height;
  const objectPosition = offsetX
    ? `calc(${focusX * 100}% + ${offsetX} * max(100vw, ${(ratio * 100).toFixed(3)}lvh)) 50%`
    : `${focusX * 100}% 50%`;

  return (
    <section
      ref={sectionRef}
      id={sceneId}
      aria-labelledby={titleId}
      // 200lvh = the screen-high image + a one-screen hold. lvh: the mobile toolbar never
      // changes the page height. Pulled up by the seam height (--seam-top); no background, so in
      // that overlap the faded top edge shows the previous scene underneath.
      className={`relative h-[200lvh] motion-reduce:h-auto ${seamTop > 0 ? "-mt-(--seam-top) motion-reduce:mt-0" : ""}`}
      style={seamTop > 0 ? ({ "--seam-top": `${seamTop}lvh` } as CSSProperties) : undefined}
    >
      <div
        ref={layerRef}
        className="sticky top-0 h-lvh overflow-hidden motion-reduce:relative motion-reduce:h-svh"
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
            className="pointer-events-none absolute inset-0 size-full object-cover"
            style={{ objectPosition, maskImage: mask }}
          />
        </picture>

        {/* object-cover: if the box changes without a bitmap resize (toolbar), it crops instead of stretching. */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover motion-reduce:hidden"
          style={{ objectPosition: `${focusX * 100}% 50%`, maskImage: mask }}
        />
      </div>

      {/* Text: a screen-high box at the top of the section that scrolls with the page over the
          held image. Click-through, so links underneath stay usable; the text block opts back in. */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-x-0 top-0 h-lvh motion-reduce:h-svh"
      >
        {children}
      </div>
    </section>
  );
}

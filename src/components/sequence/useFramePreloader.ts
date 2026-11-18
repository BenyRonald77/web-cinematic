import { useState } from "react";

export type FrameSet = { count: number; width: number; height: number };
export type SequenceFrames = { desktop: FrameSet; mobile: FrameSet };
export type FrameVariant = keyof SequenceFrames;

/** Viewports narrower than this use the mobile frame set. Keep in sync with the poster <source>. */
export const MOBILE_BREAKPOINT = 768;

/** Frames loaded first, at high priority, for the priority (first) scene. */
const PRIORITY_COUNT = 20;
/** Max parallel image requests per scene. */
const CONCURRENCY = 6;

export function frameSrc(sceneId: string, variant: FrameVariant, index: number) {
  return `/sequences/${sceneId}/${variant}/${String(index + 1).padStart(4, "0")}.webp`;
}

// The frame set is picked once per page load, so every scene agrees and rotating
// the phone never swaps sets mid-scroll.
let pageVariant: FrameVariant | null = null;
function getVariant(): FrameVariant {
  pageVariant ??= window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "desktop";
  return pageVariant;
}

// Non-priority scenes wait until the priority scene's first frames are in.
let priorityGate: Promise<void> = Promise.resolve();

/**
 * Load order: the first frame(s) (where the scene starts / cuts in), the last frame (where the
 * next scene takes over), then the rest coarse-to-fine (every 8th, 4th, 2nd, then all) so a
 * fast scroll on a slow connection always finds a nearby frame instead of freezing.
 */
function loadOrder(count: number, head: number) {
  head = Math.max(head, 1);
  const seen = new Uint8Array(count);
  const order: number[] = [];
  const push = (i: number) => {
    if (i >= 0 && i < count && !seen[i]) {
      seen[i] = 1;
      order.push(i);
    }
  };
  for (let i = 0; i < head; i++) push(i);
  push(count - 1);
  for (let step = 8; step >= 1; step /= 2) {
    for (let i = 0; i < count; i += step) push(i);
  }
  return order;
}

export type FramePreloader = {
  /** Frame count of the chosen set (desktop or mobile). Client only. */
  count(): number;
  /** Index of the loaded frame nearest to `index`, or -1 if none is ready yet. */
  nearest(index: number): number;
  /** A fully loaded and decoded frame, or null. */
  image(index: number): HTMLImageElement | null;
  /**
   * Starts loading: right away for the priority scene, otherwise once `target` is within
   * about one viewport. `onReady` runs after each frame is decoded. Returns a stop function;
   * calling start again later resumes where it stopped.
   */
  start(target: Element, onReady: (index: number) => void): () => void;
};

function createFramePreloader(sceneId: string, frames: SequenceFrames, priority: boolean): FramePreloader {
  let images: (HTMLImageElement | undefined)[] = [];
  let pending = new Uint8Array(0); // request in flight
  let settled = new Uint8Array(0); // request finished (loaded or failed)
  let queue: number[] = [];
  let inFlight = 0;
  let running = false;
  let listener: ((index: number) => void) | null = null;
  let releaseGate: (() => void) | null = null;

  const set = () => frames[getVariant()];
  const isReady = (i: number) => {
    const img = images[i];
    return !!img && img.complete && img.naturalWidth > 0;
  };

  // Track settled frames rather than counting, so a stop/start in between (React Strict Mode
  // re-runs effects in dev) can never leave the gate closed.
  const headSettled = () => {
    const head = Math.min(PRIORITY_COUNT, settled.length);
    for (let i = 0; i < head; i++) if (!settled[i]) return false;
    return true;
  };
  const openGateIfReady = () => {
    if (releaseGate && headSettled()) {
      releaseGate();
      releaseGate = null;
    }
  };

  const pump = () => {
    while (running && inFlight < CONCURRENCY && queue.length) {
      const i = queue.shift()!;
      if (isReady(i) || pending[i]) continue;
      pending[i] = 1;
      const img = new Image();
      img.decoding = "async";
      img.fetchPriority = priority && i < PRIORITY_COUNT ? "high" : "low";
      img.src = frameSrc(sceneId, getVariant(), i);
      inFlight++;
      img
        .decode()
        .then(() => {
          images[i] = img;
          listener?.(i);
        })
        .catch(() => {
          // Missing or broken frame: skip it, the nearest-frame fallback covers the gap.
        })
        .finally(() => {
          pending[i] = 0;
          settled[i] = 1;
          inFlight--;
          openGateIfReady();
          pump();
        });
    }
  };

  const begin = async () => {
    const { count } = set();
    if (images.length !== count) {
      images = new Array(count);
      pending = new Uint8Array(count);
      settled = new Uint8Array(count);
    }
    queue = loadOrder(count, priority ? PRIORITY_COUNT : 0).filter((i) => !isReady(i) && !pending[i]);

    if (priority) {
      if (!releaseGate && !headSettled()) {
        priorityGate = new Promise((resolve) => (releaseGate = resolve));
      }
    } else {
      await priorityGate;
    }
    if (running) pump();
  };

  return {
    count: () => set().count,
    nearest(index) {
      const count = images.length;
      for (let d = 0; d < count; d++) {
        if (index - d >= 0 && isReady(index - d)) return index - d;
        if (index + d < count && isReady(index + d)) return index + d;
      }
      return -1;
    },
    image: (index) => (isReady(index) ? images[index]! : null),
    start(target, onReady) {
      listener = onReady;
      running = true;
      let observer: IntersectionObserver | null = null;

      if (priority) {
        void begin();
      } else {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              observer?.disconnect();
              void begin();
            }
          },
          { rootMargin: "100% 0px 100% 0px" },
        );
        observer.observe(target);
      }

      return () => {
        running = false;
        listener = null;
        observer?.disconnect();
        releaseGate?.();
        releaseGate = null;
      };
    },
  };
}

/** Progressive frame loader for one scene. See CLAUDE.md "How the cinematic scenes work". */
export function useFramePreloader(sceneId: string, frames: SequenceFrames, priority = false) {
  const [preloader] = useState(() => createFramePreloader(sceneId, frames, priority));
  return preloader;
}

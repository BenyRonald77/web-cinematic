import type { CSSProperties } from "react";
import type { Scene, TextPosition } from "@/data/scenes";
import IntroWords from "./IntroWords";

// Mobile: text sits at the bottom of the safe (svh) area, under the subject.
// Desktop (md+): placement comes from scenes.ts.
const placement: Record<TextPosition, string> = {
  left: "md:justify-center md:items-start",
  "left-bottom": "md:justify-end md:items-start",
  right: "md:justify-center md:items-end",
};

const ctaClass = [
  "rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-85",
  "rounded-full border border-espresso/30 px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-70",
];

type SceneOverlayProps = {
  scene: Scene;
  headingLevel: 1 | 2;
  /**
   * First scene: text is on screen at first paint and plays a CSS-only intro (words split on
   * the server). Other scenes: SplitText splits at runtime and GSAP scrolls the text in.
   */
  intro?: boolean;
};

const order = (i: number) => ({ "--i": i }) as CSSProperties;

/** Text for one cinematic scene. data-split / data-reveal mark what ScrollSequence animates. */
export default function SceneOverlay({ scene, headingLevel, intro = false }: SceneOverlayProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const titleWords = scene.title.split(/\s+/).length;
  const accentWords = scene.titleAccent?.split(/\s+/).length ?? 0;
  const bodyStart = 1 + titleWords + accentWords;
  const ctaIndex = bodyStart + 3; // body words fade in 20 ms apart; CTAs follow right after

  const ctas = scene.ctas?.map((cta, i) => (
    <a key={cta.label} href={cta.href} className={ctaClass[Math.min(i, 1)]}>
      {cta.label}
    </a>
  ));

  return (
    <div
      className={`flex h-full flex-col justify-end px-6 pt-20 pb-24 md:px-16 md:pb-20 ${placement[scene.textPosition]}`}
    >
      <div className="max-w-[50rem]">
        <p data-reveal className="text-xs font-semibold tracking-[0.25em] md:text-sm">
          <span className={intro ? "intro-fade block" : undefined} style={intro ? order(0) : undefined}>
            {scene.number} —
          </span>
        </p>

        {intro ? (
          <Heading
            id={`${scene.id}-title`}
            className="mt-3 font-display text-[clamp(2.75rem,7vw,8.75rem)] leading-[0.95] font-semibold tracking-tight"
          >
            <span className="sr-only">
              {scene.title} {scene.titleAccent}
            </span>
            <span aria-hidden="true">
              <span className="block">
                <IntroWords text={scene.title} start={1} variant="rise" />
              </span>
              {scene.titleAccent && (
                <span className="block font-normal italic">
                  <IntroWords text={scene.titleAccent} start={1 + titleWords} variant="rise" />
                </span>
              )}
            </span>
          </Heading>
        ) : (
          <Heading
            id={`${scene.id}-title`}
            data-split="words"
            className="mt-3 font-display text-[clamp(2.75rem,7vw,8.75rem)] leading-[0.95] font-semibold tracking-tight"
          >
            {scene.title}
            {scene.titleAccent && (
              <span className="block font-normal italic">{scene.titleAccent}</span>
            )}
          </Heading>
        )}

        {intro ? (
          <p className="mt-5 max-w-md text-base md:text-lg">
            <span className="sr-only">{scene.body}</span>
            <span aria-hidden="true">
              <IntroWords text={scene.body} start={bodyStart} variant="fade" />
            </span>
          </p>
        ) : (
          <p data-split="lines" className="mt-5 max-w-md text-base md:text-lg">
            {scene.body}
          </p>
        )}

        {ctas && (
          <div data-reveal className="mt-8">
            <div
              className={`flex flex-wrap gap-3 ${intro ? "intro-fade" : ""}`}
              style={intro ? order(ctaIndex) : undefined}
            >
              {ctas}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

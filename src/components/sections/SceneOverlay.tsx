import type { Scene, TextPosition } from "@/data/scenes";

// Mobile: text sits at the bottom of the safe (svh) area, under the subject.
// Desktop (md+): placement comes from scenes.ts.
const placement: Record<TextPosition, string> = {
  left: "md:justify-center md:items-start",
  "left-bottom": "md:justify-end md:items-start",
  right: "md:justify-center md:items-end",
};

type SceneOverlayProps = {
  scene: Scene;
  headingLevel: 1 | 2;
};

/** Text for one cinematic scene. data-split / data-reveal mark what ScrollSequence animates. */
export default function SceneOverlay({ scene, headingLevel }: SceneOverlayProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <div
      className={`flex h-full flex-col justify-end px-6 pt-20 pb-24 md:px-16 md:pb-20 ${placement[scene.textPosition]}`}
    >
      <div className="max-w-[50rem]">
        <p data-reveal className="text-xs font-semibold tracking-[0.25em] md:text-sm">
          {scene.number} —
        </p>
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
        <p data-split="lines" className="mt-5 max-w-md text-base md:text-lg">
          {scene.body}
        </p>
        {scene.ctas && (
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            {scene.ctas.map((cta, i) => (
              <a
                key={cta.label}
                href={cta.href}
                className={
                  i === 0
                    ? "rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-85"
                    : "rounded-full border border-espresso/30 px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                }
              >
                {cta.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

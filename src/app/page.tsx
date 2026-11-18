import { scenes } from "@/data/scenes";
import sequences from "@/data/sequences.json";

// Milestone 1 placeholder: one tall section per scene, no canvas or animation yet.
export default function Home() {
  return (
    <main>
      {scenes.map((scene, index) => {
        const Heading = index === 0 ? "h1" : "h2";
        const frames = sequences[scene.id];

        return (
          <section
            key={scene.id}
            id={scene.id}
            aria-labelledby={`${scene.id}-title`}
            className={`relative h-[300vh] ${index % 2 === 0 ? "bg-cream" : "bg-cream-deep"}`}
          >
            <div className="sticky top-0 flex h-svh flex-col justify-center px-6 md:px-16">
              <p className="text-sm font-semibold tracking-[0.2em] text-espresso-soft">
                {scene.number} —
              </p>
              <Heading
                id={`${scene.id}-title`}
                className="mt-3 max-w-[12ch] font-display text-[clamp(3rem,9vw,8.75rem)] leading-[0.92] font-semibold tracking-tight"
              >
                {scene.title}
                {scene.titleAccent && (
                  <span className="block font-normal italic">{scene.titleAccent}</span>
                )}
              </Heading>
              <p className="mt-6 max-w-md text-base text-espresso-soft md:text-lg">{scene.body}</p>
              <p className="mt-10 text-xs tracking-wide text-espresso-soft/70">
                {scene.id} · placeholder · {frames.desktop.count} desktop / {frames.mobile.count}{" "}
                mobile frames
              </p>
            </div>
          </section>
        );
      })}
    </main>
  );
}

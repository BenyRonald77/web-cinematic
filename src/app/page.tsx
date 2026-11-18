import ScrollHint from "@/components/sections/ScrollHint";
import SceneOverlay from "@/components/sections/SceneOverlay";
import ScrollSequence from "@/components/sequence/ScrollSequence";
import { scenes } from "@/data/scenes";
import sequences from "@/data/sequences.json";

export default function Home() {
  return (
    <main>
      {scenes.map((scene, index) => (
        <ScrollSequence
          key={scene.id}
          sceneId={scene.id}
          frames={sequences[scene.id]}
          focusX={scene.focusX}
          priority={index === 0}
          intro={index === 0}
          joinPrevious={index > 0}
          titleId={`${scene.id}-title`}
        >
          <SceneOverlay scene={scene} headingLevel={index === 0 ? 1 : 2} intro={index === 0} />
          {index === 0 && <ScrollHint />}
        </ScrollSequence>
      ))}

      {/* Placeholder so the last scene can scroll away; replaced by the real sections in milestone 5. */}
      <section
        id="menu"
        className="flex min-h-svh items-center justify-center bg-cream-deep px-6 text-center"
      >
        <p className="font-display text-3xl md:text-5xl">Menu, story & visit — milestone 5</p>
      </section>
    </main>
  );
}

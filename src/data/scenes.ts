export type SceneId = "scene-01" | "scene-02" | "scene-03" | "scene-04";

export type TextPosition = "left" | "left-bottom" | "right";

export type SceneCta = {
  label: string;
  href: string;
};

export type Scene = {
  id: SceneId;
  /** Small label above the title, e.g. "01". */
  number: string;
  title: string;
  /** Optional italic second line under the title. */
  titleAccent?: string;
  body: string;
  textPosition: TextPosition;
  /**
   * Horizontal focus point of the subject in the frame (0 = left edge, 1 = right edge).
   * Used by drawCover to pick the crop on portrait screens.
   * Initial guesses; tune once the real frames are in.
   */
  focusX: number;
  ctas?: SceneCta[];
};

// Placeholder copy from docs/PRD.md section 6.
export const scenes: Scene[] = [
  {
    id: "scene-01",
    number: "01",
    title: "Wake the beans",
    titleAccent: "one by one.",
    body: "Single-origin beans from across the archipelago, roasted in small batches every week.",
    textPosition: "left",
    focusX: 0.68,
    ctas: [
      { label: "Order now", href: "#menu" },
      { label: "See the menu", href: "#menu" },
    ],
  },
  {
    id: "scene-02",
    number: "02",
    title: "Pour it slow.",
    body: "Ninety-two degrees. Thirty seconds of patience.",
    textPosition: "left",
    focusX: 0.62,
  },
  {
    id: "scene-03",
    number: "03",
    title: "Let it bloom.",
    body: "The first breath of the grounds is where the flavour begins.",
    textPosition: "left-bottom",
    focusX: 0.6,
  },
  {
    id: "scene-04",
    number: "04",
    title: "Make time taste better.",
    body: "Sit down. Stay a while.",
    textPosition: "right",
    focusX: 0.35,
    ctas: [{ label: "Visit us", href: "#visit" }],
  },
];

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
   * Horizontal crop point (0 = left edge, 1 = right edge), like CSS object-position X%. Keeps the
   * subject visible on portrait screens. Keep it the same in every scene: offsetX alignment
   * across scene borders only holds on every screen size when focusX is equal.
   */
  focusX: number;
  /**
   * Sideways shift of the image as a share of its drawn width (0.01 = 1 %), so the flow leaving
   * the bottom of the previous scene's last frame lines up with the flow entering the top of this
   * scene's first frame. Scene 01 is the reference (0). Measure with `npm run flow`.
   */
  offsetX: number;
  /**
   * Height of the seam between this scene and the one above, in % of the screen height: this
   * scene overlaps the previous one by that much and fades its top edge in over it. Thin (2) where
   * a flow crosses the border, wider where the border is a plain-cream gradient. 0 for scene 01.
   */
  seamAbove: number;
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
    focusX: 0.84,
    offsetX: 0,
    seamAbove: 0,
    ctas: [
      { label: "Order now", href: "#menu" },
      { label: "See the menu", href: "#menu" },
    ],
  },
  {
    id: "scene-02",
    number: "02",
    title: "Grind it fresh.",
    body: "Ground seconds before brewing, one cup at a time.",
    textPosition: "left",
    focusX: 0.84,
    offsetX: 0,
    seamAbove: 2, // bean column crosses the border
  },
  {
    id: "scene-03",
    number: "03",
    title: "Let it bloom.",
    body: "The first breath of the grounds is where the flavour begins.",
    textPosition: "left-bottom",
    focusX: 0.84,
    offsetX: 0,
    seamAbove: 2, // ground coffee crosses the border
  },
  {
    id: "scene-04",
    number: "04",
    title: "Make time\ntaste better.", // explicit break keeps the title clear of the cup on desktop
    body: "Sit down. Stay a while.",
    textPosition: "left",
    focusX: 0.84,
    offsetX: 0,
    seamAbove: 12, // plain-cream gradient, nothing crosses
    ctas: [{ label: "Visit us", href: "#visit" }],
  },
];

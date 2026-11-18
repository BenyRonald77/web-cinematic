import { Fragment, type CSSProperties } from "react";

type IntroWordsProps = {
  text: string;
  /**
   * Stagger slot of the first word, so several runs of words play as one sequence. "rise" words
   * take one slot each (60 ms apart); "fade" words share the slot and follow 20 ms apart.
   */
  start: number;
  /** "rise": slides up inside a mask (headings). "fade": fades up, no mask (body copy). */
  variant: "rise" | "fade";
};

/**
 * Words split on the server for the first scene's intro, animated by CSS keyframes so they are
 * visible at first paint without waiting for JS. Two layers per word: the outer [data-reveal]
 * belongs to GSAP (scroll exit), the inner .intro-* to CSS (intro), so they never fight over
 * the same element and GSAP can take over mid-intro without a flash.
 */
export default function IntroWords({ text, start, variant }: IntroWordsProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return words.map((word, i) => {
    const inner = (
      <span data-reveal className="inline-block">
        <span
          className={variant === "rise" ? "intro-rise" : "intro-fade inline-block"}
          style={
            variant === "rise"
              ? ({ "--i": start + i } as CSSProperties)
              : ({ "--i": start, "--j": i } as CSSProperties)
          }
        >
          {word}
        </span>
      </span>
    );

    return (
      <Fragment key={i}>
        {i > 0 && " "}
        {variant === "rise" ? <span className="intro-mask">{inner}</span> : inner}
      </Fragment>
    );
  });
}

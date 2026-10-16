import type React from "react";
import { useCurrentFrame } from "remotion";
import { mix, progress } from "../lib/anim";
import { colors, ease, fonts } from "../theme";

export type Part = { t: string; style?: React.CSSProperties };

/** Normalizes "plain text" or [{t, style}] into word-level pieces. */
const toWords = (content: string | Part[]): Part[] => {
  const parts = typeof content === "string" ? [{ t: content }] : content;
  const words: Part[] = [];
  for (const part of parts) {
    const split = part.t.split(/(\s+)/).filter((w) => w.length > 0);
    for (const w of split) words.push({ t: w, style: part.style });
  }
  return words;
};

type KineticTextProps = {
  content: string | Part[];
  /** Frame (local) when the first word starts entering. */
  start: number;
  /** Frames between words. */
  stagger?: number;
  /** Frames for each word to settle. */
  duration?: number;
  /** Frame when the whole line starts exiting (optional). */
  exitAt?: number;
  rise?: number;
  blur?: number;
  style?: React.CSSProperties;
};

/**
 * Word-staggered type: each word rises, sharpens (blur → 0) and fades in on a
 * strong ease-out. Exit is quicker and moves the whole line together.
 */
export const KineticText: React.FC<KineticTextProps> = ({
  content,
  start,
  stagger = 3,
  duration = 20,
  exitAt,
  rise = 28,
  blur = 8,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = toWords(content);
  const exit = exitAt === undefined ? 0 : progress(frame, exitAt, 10, ease.in);
  let wordIndex = 0;

  return (
    <div
      style={{
        opacity: 1 - exit,
        translate: `0px ${mix(0, -14, exit)}px`,
        ...style,
      }}
    >
      {words.map((w, i) => {
        if (w.t.includes("\n")) return <br key={i} />;
        if (/^\s+$/.test(w.t)) return <span key={i}>{w.t}</span>;
        const p = progress(frame, start + wordIndex++ * stagger, duration);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              translate: `0px ${mix(rise, 0, p)}px`,
              filter: p < 1 ? `blur(${mix(blur, 0, p)}px)` : undefined,
              ...w.style,
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

export const Eyebrow: React.FC<{
  children: string;
  start: number;
  exitAt?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, start, exitAt, color = colors.violet, style }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 16);
  const exit = exitAt === undefined ? 0 : progress(frame, exitAt, 10, ease.in);
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity: p * (1 - exit),
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 40,
          height: 2,
          background: color,
          scale: `${mix(0.2, 1, p)} 1`,
          transformOrigin: "left center",
        }}
      />
      <span style={{ translate: `${mix(-12, 0, p)}px 0px` }}>{children}</span>
    </div>
  );
};

/** Inline accent: the landing page's italic serif, used for one word or phrase. */
export const serifAccent = (color: string): React.CSSProperties => ({
  fontFamily: fonts.serif,
  fontStyle: "italic",
  fontWeight: 400,
  letterSpacing: "-0.01em",
  color,
});

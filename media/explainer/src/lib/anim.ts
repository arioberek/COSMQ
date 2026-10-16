import { interpolate } from "remotion";
import { ease } from "../theme";

type EasingFn = (t: number) => number;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 progress over [start, start + duration], eased (ease-out by default). */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: EasingFn = ease.out,
): number => interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing });

/** Linear blend between a and b. */
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Visibility window: fades/rises in over `inDur` from `start`, and out over
 * `outDur` ending at `end`. Returns 0..1 in, and 1..0 out separately so the
 * caller can shape enter and exit differently (exits are faster and quieter).
 */
export const span = (
  frame: number,
  start: number,
  end: number,
  inDur = 18,
  outDur = 10,
): { enter: number; exit: number; visible: boolean } => ({
  enter: progress(frame, start, inDur, ease.out),
  exit: progress(frame, end - outDur, outDur, ease.in),
  visible: frame >= start && frame < end,
});

/** Keyframed value: holds between keys, eases between them. */
export type Key = { at: number; dur: number; value: number };

export const keyed = (
  frame: number,
  initial: number,
  keys: Key[],
  easing: EasingFn = ease.inOut,
) => {
  let value = initial;
  for (const k of keys) {
    const t = progress(frame, k.at, k.dur, easing);
    value = mix(value, k.value, t);
  }
  return value;
};

/** Deterministic pseudo-random in [0, 1) for a given seed. */
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

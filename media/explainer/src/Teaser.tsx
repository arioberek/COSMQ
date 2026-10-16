import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { EndCard } from "./scenes/EndCard";
import { ProductScene } from "./scenes/Product";
import { colors, ease } from "./theme";
import { TEASER } from "./timeline";

/**
 * README teaser: editor → results → lockup. Starts and ends on black so the
 * loop seam is invisible. Rendered at 1920×1080 and scaled down on export.
 */
export const Teaser: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease.out,
  });
  return (
    <AbsoluteFill style={{ background: colors.black }}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Product excerpt"
          durationInFrames={TEASER.productDur}
          premountFor={fps}
        >
          {/* Shift the Product scene so the excerpt starts mid-way through it. */}
          <Sequence from={-TEASER.productFrom} name="Product (offset)">
            <ProductScene />
          </Sequence>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TEASER.crossfade, easing: ease.out })}
        />
        <TransitionSeries.Sequence
          name="End card"
          durationInFrames={TEASER.endDur}
          premountFor={fps}
        >
          <EndCard fadeOut />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <AbsoluteFill style={{ background: colors.black, opacity: fadeIn, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

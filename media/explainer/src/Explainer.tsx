import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { DirectScene } from "./scenes/Direct";
import { EndCard } from "./scenes/EndCard";
import { EnginesScene } from "./scenes/Engines";
import { LightDarkScene } from "./scenes/LightDark";
import { LogoSting } from "./scenes/LogoSting";
import { PrivacyScene } from "./scenes/Privacy";
import { ProductScene } from "./scenes/Product";
import { colors, ease } from "./theme";
import { SCENES, TRANSITIONS } from "./timeline";
import { circleReveal } from "./transitions/circleReveal";

/** The full ~45 s explainer. Scene and transition lengths live in timeline.ts. */
export const Explainer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    // Canvas backdrop so slide transitions never expose a seam.
    <AbsoluteFill style={{ background: colors.canvas }}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Logo sting"
          durationInFrames={SCENES.logo}
          premountFor={fps}
        >
          <LogoSting />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={circleReveal({ x: "33%", y: "45%" })}
          timing={linearTiming({
            durationInFrames: TRANSITIONS.logoToEngines,
            easing: ease.inOut,
          })}
        />
        <TransitionSeries.Sequence
          name="Engines"
          durationInFrames={SCENES.engines}
          premountFor={fps}
        >
          <EnginesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({
            durationInFrames: TRANSITIONS.enginesToDirect,
            easing: ease.inOut,
          })}
        />
        <TransitionSeries.Sequence
          name="Direct connection"
          durationInFrames={SCENES.direct}
          premountFor={fps}
        >
          <DirectScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({
            durationInFrames: TRANSITIONS.directToProduct,
            easing: ease.out,
          })}
        />
        <TransitionSeries.Sequence
          name="Product"
          durationInFrames={SCENES.product}
          premountFor={fps}
        >
          <ProductScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence
          name="Light and dark"
          durationInFrames={SCENES.lightDark}
          premountFor={fps}
        >
          <LightDarkScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence
          name="Privacy"
          durationInFrames={SCENES.privacy}
          premountFor={fps}
        >
          <PrivacyScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({
            durationInFrames: TRANSITIONS.privacyToEnd,
            easing: ease.out,
          })}
        />
        <TransitionSeries.Sequence name="End card" durationInFrames={SCENES.end} premountFor={fps}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

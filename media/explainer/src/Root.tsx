import type React from "react";
import { Composition, Folder, Still } from "remotion";
import { Explainer } from "./Explainer";
import { Poster } from "./Poster";
import { DirectScene } from "./scenes/Direct";
import { EndCard } from "./scenes/EndCard";
import { EnginesScene } from "./scenes/Engines";
import { LightDarkScene } from "./scenes/LightDark";
import { LogoSting } from "./scenes/LogoSting";
import { PrivacyScene } from "./scenes/Privacy";
import { ProductScene } from "./scenes/Product";
import { Teaser } from "./Teaser";
import { EXPLAINER_DURATION, SCENES, TEASER_DURATION } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Explainer"
        component={Explainer}
        durationInFrames={EXPLAINER_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Teaser"
        component={Teaser}
        durationInFrames={TEASER_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Still id="Poster" component={Poster} width={1920} height={1080} />

      {/* Each scene on its own timeline, for previewing and tweaking in Studio. */}
      <Folder name="Scenes">
        <Composition
          id="LogoSting"
          component={LogoSting}
          durationInFrames={SCENES.logo}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Engines"
          component={EnginesScene}
          durationInFrames={SCENES.engines}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Direct"
          component={DirectScene}
          durationInFrames={SCENES.direct}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Product"
          component={ProductScene}
          durationInFrames={SCENES.product}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="LightDark"
          component={LightDarkScene}
          durationInFrames={SCENES.lightDark}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Privacy"
          component={PrivacyScene}
          durationInFrames={SCENES.privacy}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="EndCard"
          component={EndCard}
          durationInFrames={SCENES.end}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ fadeOut: false }}
        />
      </Folder>
    </>
  );
};

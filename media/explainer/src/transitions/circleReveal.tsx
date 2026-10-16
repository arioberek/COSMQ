import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill } from "remotion";

type CircleRevealProps = {
  /** Circle origin as CSS percentages. */
  x: string;
  y: string;
};

const CircleReveal: React.FC<TransitionPresentationComponentProps<CircleRevealProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    // The outgoing scene recedes slightly as the new one opens over it.
    return (
      <AbsoluteFill style={{ scale: `${1 - 0.04 * presentationProgress}` }}>
        {children}
      </AbsoluteFill>
    );
  }
  // 120% of the half-diagonal covers the frame from any origin near the center.
  const radius = presentationProgress * 120;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${radius}% at ${passedProps.x} ${passedProps.y})` }}>
      {children}
    </AbsoluteFill>
  );
};

/** The incoming scene opens as an expanding circle from a point. */
export const circleReveal = (
  props: CircleRevealProps = { x: "50%", y: "50%" },
): TransitionPresentation<CircleRevealProps> => ({ component: CircleReveal, props });

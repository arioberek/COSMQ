import { memo } from "react";
import { YStack, styled, type GetProps } from "tamagui";

const StyledCard = styled(YStack, {
  backgroundColor: "$surface",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$md",
  padding: "$md",
  animation: "quick",

  variants: {
    pressable: {
      true: {
        pressStyle: {
          backgroundColor: "$surfaceAlt",
          scale: 0.98,
        },
        hoverStyle: {
          backgroundColor: "$surfaceAlt",
        },
      },
    },
    elevated: {
      true: {
        backgroundColor: "$surfaceElevated",
        shadowColor: "$shadowColor",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    },
    variant: {
      default: {
        backgroundColor: "$surface",
      },
      muted: {
        backgroundColor: "$surfaceMuted",
        borderColor: "$borderColor",
      },
      transparent: {
        backgroundColor: "transparent",
        borderWidth: 0,
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
  },
});

type CardProps = GetProps<typeof StyledCard>;

export const Card = memo(function Card(props: CardProps) {
  return <StyledCard {...props} />;
});

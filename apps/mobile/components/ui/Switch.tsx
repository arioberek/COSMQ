import { Switch as TamaguiSwitch, styled, type GetProps } from "tamagui";

const StyledSwitch = styled(TamaguiSwitch, {
  backgroundColor: "$surfaceMuted",

  variants: {
    size: {
      sm: {
        width: 40,
        height: 24,
      },
      md: {
        width: 50,
        height: 30,
      },
      lg: {
        width: 60,
        height: 36,
      },
    },
  } as const,

  defaultVariants: {
    size: "md",
  },
});

const StyledThumb = styled(TamaguiSwitch.Thumb, {
  backgroundColor: "$switchThumb",
  borderRadius: "$full",

  variants: {
    size: {
      sm: {
        width: 20,
        height: 20,
      },
      md: {
        width: 26,
        height: 26,
      },
      lg: {
        width: 32,
        height: 32,
      },
    },
  } as const,

  defaultVariants: {
    size: "md",
  },
});

type SwitchProps = GetProps<typeof StyledSwitch> & {
  thumbSize?: "sm" | "md" | "lg";
};

export const Switch = ({ size = "md", thumbSize, checked, ...props }: SwitchProps) => {
  return (
    <StyledSwitch
      size={size}
      checked={checked}
      backgroundColor={checked ? "$primary" : "$surfaceMuted"}
      {...props}
    >
      <StyledThumb size={thumbSize ?? size} animation="quick" />
    </StyledSwitch>
  );
};

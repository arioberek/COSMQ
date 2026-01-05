import { Switch as TamaguiSwitch, styled, type GetProps } from "tamagui";

const StyledSwitch = styled(TamaguiSwitch, {
  backgroundColor: "$surfaceMuted",

  variants: {
    switchSize: {
      small: {
        width: 40,
        height: 24,
      },
      medium: {
        width: 50,
        height: 30,
      },
      large: {
        width: 60,
        height: 36,
      },
    },
  } as const,

  defaultVariants: {
    switchSize: "medium",
  },
});

const StyledThumb = styled(TamaguiSwitch.Thumb, {
  backgroundColor: "$switchThumb",
  borderRadius: "$full",

  variants: {
    thumbSize: {
      small: {
        width: 20,
        height: 20,
      },
      medium: {
        width: 26,
        height: 26,
      },
      large: {
        width: 32,
        height: 32,
      },
    },
  } as const,

  defaultVariants: {
    thumbSize: "medium",
  },
});

type SwitchSize = "small" | "medium" | "large";

type SwitchProps = Omit<GetProps<typeof StyledSwitch>, "switchSize"> & {
  size?: SwitchSize;
  thumbSize?: SwitchSize;
};

export const Switch = ({ size = "medium", thumbSize, checked, ...props }: SwitchProps) => {
  return (
    <StyledSwitch
      switchSize={size}
      checked={checked}
      backgroundColor={checked ? "$primary" : "$surfaceMuted"}
      {...props}
    >
      <StyledThumb thumbSize={thumbSize ?? size} animation="quick" />
    </StyledSwitch>
  );
};

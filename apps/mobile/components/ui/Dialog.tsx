import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Dialog as TamaguiDialog, Adapt, Sheet, XStack, YStack, Text, Button, useTheme } from "tamagui";

type DialogVariant = "default" | "danger";

type DialogAction = {
  label: string;
  onPress: () => void;
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: DialogVariant;
  children?: React.ReactNode;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
};

export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  children,
  primaryAction,
  secondaryAction,
}: DialogProps) => {
  const theme = useTheme();
  
  const dialogGradient = [
    theme.dialogGradientStart.val,
    theme.dialogGradientMid.val,
    theme.dialogGradientEnd.val,
  ] as const;

  const handleCancel = () => {
    if (secondaryAction) {
      secondaryAction.onPress();
    } else {
      onCancel?.();
    }
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (primaryAction) {
      primaryAction.onPress();
    } else {
      onConfirm?.();
    }
    onOpenChange(false);
  };

  const showCancelButton = !primaryAction || secondaryAction;
  const confirmLabel = primaryAction?.label ?? confirmText;
  const cancelLabel = secondaryAction?.label ?? cancelText;

  return (
    <TamaguiDialog modal open={open} onOpenChange={onOpenChange}>
      <TamaguiDialog.Portal>
        <TamaguiDialog.Overlay
          key="overlay"
          animation="medium"
          opacity={0.95}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="$dialogOverlay"
        />

        <TamaguiDialog.Content
          elevate
          key="content"
          animation={[
            "bouncy",
            {
              opacity: {
                overshootClamping: true,
              },
              scale: {
                overshootClamping: false,
              },
            },
          ]}
          enterStyle={{ y: -30, opacity: 0, scale: 0.85 }}
          exitStyle={{ y: 20, opacity: 0, scale: 0.9 }}
          borderRadius="$lg"
          padding={0}
          maxWidth={400}
          width="90%"
          overflow="hidden"
          borderWidth={1}
          borderColor="$dialogBorder"
          backgroundColor={theme.dialogGradientStart.val}
        >
          <LinearGradient
            colors={dialogGradient}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <YStack padding="$lg" gap="$md">
            <TamaguiDialog.Title fontSize={20} fontWeight="700" color="$dialogText">
              {title}
            </TamaguiDialog.Title>

            {description ? (
              <TamaguiDialog.Description color="$dialogTextMuted" fontSize={15} lineHeight={22}>
                {description}
              </TamaguiDialog.Description>
            ) : null}

            {children}

            <XStack gap="$md" justifyContent="flex-end" marginTop="$md">
              {showCancelButton && (
                <Button
                  backgroundColor="transparent"
                  borderWidth={1}
                  borderColor="$dialogButtonBorder"
                  onPress={handleCancel}
                  paddingHorizontal="$lg"
                  paddingVertical="$sm"
                  borderRadius="$md"
                  animation="quick"
                  pressStyle={{ scale: 0.95, opacity: 0.8, backgroundColor: "$dialogButtonHover" }}
                >
                  <Text color="$dialogTextMuted" fontWeight="500" fontSize={15}>
                    {cancelLabel}
                  </Text>
                </Button>
              )}

              <Button
                backgroundColor={variant === "danger" ? "$danger" : "$primary"}
                onPress={handleConfirm}
                paddingHorizontal="$lg"
                paddingVertical="$sm"
                borderRadius="$md"
                animation="quick"
                pressStyle={{ scale: 0.95, opacity: 0.9 }}
                hoverStyle={{ opacity: 0.9 }}
              >
                <Text color="#ffffff" fontWeight="600" fontSize={15}>
                  {confirmLabel}
                </Text>
              </Button>
            </XStack>
          </YStack>
        </TamaguiDialog.Content>
      </TamaguiDialog.Portal>

      <Adapt when="sm" platform="touch">
        <Sheet
          animation="bouncy"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
        >
          <Sheet.Overlay
            animation="medium"
            opacity={0.95}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="$dialogOverlay"
          />
          <Sheet.Frame
            padding={0}
            overflow="hidden"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            backgroundColor={theme.dialogGradientStart.val}
          >
            <LinearGradient
              colors={dialogGradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            <YStack padding="$lg" gap="$md">
              <Sheet.Handle backgroundColor="$dialogHandle" marginBottom="$sm" />

              <Text fontSize={20} fontWeight="700" color="$dialogText">
                {title}
              </Text>

              {description ? (
                <Text color="$dialogTextMuted" fontSize={15} lineHeight={22}>
                  {description}
                </Text>
              ) : null}

              {children}

              <XStack gap="$md" marginTop="$md">
                {showCancelButton && (
                  <Button
                    flex={1}
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$dialogButtonBorder"
                    onPress={handleCancel}
                    paddingVertical="$md"
                    borderRadius="$md"
                    animation="quick"
                    pressStyle={{ scale: 0.97, opacity: 0.8, backgroundColor: "$dialogButtonHover" }}
                  >
                    <Text color="$dialogTextMuted" fontWeight="500" fontSize={15}>
                      {cancelLabel}
                    </Text>
                  </Button>
                )}

                <Button
                  flex={1}
                  backgroundColor={variant === "danger" ? "$danger" : "$primary"}
                  onPress={handleConfirm}
                  paddingVertical="$md"
                  borderRadius="$md"
                  animation="quick"
                  pressStyle={{ scale: 0.97, opacity: 0.9 }}
                >
                  <Text color="#ffffff" fontWeight="600" fontSize={15}>
                    {confirmLabel}
                  </Text>
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </Adapt>
    </TamaguiDialog>
  );
};

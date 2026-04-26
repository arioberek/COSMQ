import { memo } from "react";
import { Dialog as TamaguiDialog, Adapt, Sheet, XStack, YStack, Text, Button } from "tamagui";

type DialogVariant = "default" | "danger";

type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: DialogVariant | "neutral";
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
  actions?: DialogAction[];
  hideActions?: boolean;
};

const actionBackground = (variant: DialogAction["variant"]) => {
  switch (variant) {
    case "danger":
      return "$danger";
    case "neutral":
      return "transparent";
    default:
      return "$primary";
  }
};

const actionTextColor = (variant: DialogAction["variant"]) => {
  switch (variant) {
    case "danger":
      return "$textOnDanger";
    case "neutral":
      return "$dialogTextMuted";
    default:
      return "$textOnPrimary";
  }
};

export const Dialog = memo(function Dialog({
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
  actions,
  hideActions,
}: DialogProps) {
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

  const handleAction = (action: DialogAction) => {
    action.onPress();
    onOpenChange(false);
  };

  const showCancelButton = !primaryAction || secondaryAction;
  const confirmLabel = primaryAction?.label ?? confirmText;
  const cancelLabel = secondaryAction?.label ?? cancelText;

  const renderActions = (compact: boolean) => {
    if (hideActions) return null;
    if (actions && actions.length > 0) {
      return (
        <YStack gap="$sm" marginTop="$md">
          {actions.map((action) => (
            <Button
              key={action.label}
              unstyled
              backgroundColor={actionBackground(action.variant)}
              borderWidth={action.variant === "neutral" ? 1 : 0}
              borderColor="$dialogButtonBorder"
              onPress={() => handleAction(action)}
              height={compact ? 56 : 48}
              borderRadius="$md"
              alignItems="center"
              justifyContent="center"
              pressStyle={{
                opacity: 0.85,
                backgroundColor:
                  action.variant === "neutral"
                    ? "$dialogButtonHover"
                    : actionBackground(action.variant),
              }}
            >
              <Text
                color={actionTextColor(action.variant)}
                fontWeight="600"
                fontSize={compact ? 16 : 15}
              >
                {action.label}
              </Text>
            </Button>
          ))}
        </YStack>
      );
    }
    return (
      <XStack
        gap="$md"
        justifyContent="flex-end"
        marginTop="$md"
      >
        {showCancelButton && (
          <Button
            unstyled
            flex={compact ? 1 : undefined}
            backgroundColor="transparent"
            borderWidth={1}
            borderColor="$dialogButtonBorder"
            onPress={handleCancel}
            paddingHorizontal={compact ? undefined : "$lg"}
            height={compact ? 56 : 44}
            borderRadius="$md"
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.85, backgroundColor: "$dialogButtonHover" }}
          >
            <Text color="$dialogTextMuted" fontWeight="500" fontSize={compact ? 16 : 15}>
              {cancelLabel}
            </Text>
          </Button>
        )}

        <Button
          unstyled
          flex={compact ? 1 : undefined}
          backgroundColor={variant === "danger" ? "$danger" : "$primary"}
          onPress={handleConfirm}
          paddingHorizontal={compact ? undefined : "$lg"}
          height={compact ? 56 : 44}
          borderRadius="$md"
          alignItems="center"
          justifyContent="center"
          pressStyle={{ opacity: 0.9 }}
        >
          <Text
            color={variant === "danger" ? "$textOnDanger" : "$textOnPrimary"}
            fontWeight="600"
            fontSize={compact ? 16 : 15}
          >
            {confirmLabel}
          </Text>
        </Button>
      </XStack>
    );
  };

  return (
    <TamaguiDialog modal open={open} onOpenChange={onOpenChange}>
      <TamaguiDialog.Portal>
        <TamaguiDialog.Overlay
          key="overlay"
          animation="medium"
          opacity={1}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="$dialogOverlay"
        />

        <TamaguiDialog.Content
          elevate
          key="content"
          animation={[
            "quick",
            {
              opacity: { overshootClamping: true },
              scale: { overshootClamping: true },
            },
          ]}
          enterStyle={{ y: -8, opacity: 0, scale: 0.96 }}
          exitStyle={{ y: 4, opacity: 0, scale: 0.98 }}
          borderRadius="$lg"
          padding="$lg"
          maxWidth={420}
          width="90%"
          borderWidth={1}
          borderColor="$dialogBorder"
          backgroundColor="$surfaceElevated"
        >
          <YStack gap="$md">
            <TamaguiDialog.Title fontSize={18} fontWeight="600" color="$dialogText" letterSpacing={-0.2}>
              {title}
            </TamaguiDialog.Title>

            {description ? (
              <TamaguiDialog.Description color="$dialogTextMuted" fontSize={15} lineHeight={22}>
                {description}
              </TamaguiDialog.Description>
            ) : null}

            {children}

            {renderActions(false)}
          </YStack>
        </TamaguiDialog.Content>
      </TamaguiDialog.Portal>

      <Adapt when="sm" platform="touch">
        <Sheet
          animation="quick"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
        >
          <Sheet.Overlay
            animation="medium"
            opacity={1}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="$dialogOverlay"
          />
          <Sheet.Frame
            padding="$lg"
            borderTopLeftRadius={20}
            borderTopRightRadius={20}
            backgroundColor="$surfaceElevated"
          >
            <YStack gap="$md">
              <Sheet.Handle backgroundColor="$dialogHandle" alignSelf="center" />

              <Text fontSize={18} fontWeight="600" color="$dialogText" letterSpacing={-0.2}>
                {title}
              </Text>

              {description ? (
                <Text color="$dialogTextMuted" fontSize={15} lineHeight={22}>
                  {description}
                </Text>
              ) : null}

              {children}

              {renderActions(true)}
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </Adapt>
    </TamaguiDialog>
  );
});

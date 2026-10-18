import { memo, type ReactNode, useEffect, useState } from "react";
import { BackHandler, Pressable, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Portal, Sheet, useTheme, View, XStack, YStack } from "tamagui";
import { AppText } from "./Text";

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DIALOG_ENTER_MS = 200;
const DIALOG_EXIT_MS = 140;

/**
 * Sheet position spring: critically damped (dampingRatio 1 → damping =
 * 2·√(stiffness·mass)) so it settles without bounce in ~300ms. Overshoot is
 * clamped as a belt-and-braces guard against the sheet passing its detent.
 */
const SHEET_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1,
  overshootClamping: true,
};
// Reduced motion: no travel, the sheet is simply there; the backdrop still fades.
const SHEET_REDUCED = { type: "timing" as const, duration: 0 };

// ---------------------------------------------------------------------------
// Dialog (alert-style, like UIAlertController)
// ---------------------------------------------------------------------------

type DialogVariant = "default" | "danger";

type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: DialogVariant | "neutral";
  /** Optional explicit role. Defaults: label "Cancel" → cancel, variant "danger" → destructive. */
  role?: "default" | "cancel" | "destructive";
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Return `false` to keep the dialog open (for example, when validation fails). */
  onConfirm?: () => unknown;
  onCancel?: () => void;
  variant?: DialogVariant;
  children?: React.ReactNode;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
  actions?: DialogAction[];
  hideActions?: boolean;
};

type ResolvedButton = {
  key: string;
  label: string;
  role: "default" | "cancel" | "destructive";
  onPress: () => void;
};

const roleFor = (action: DialogAction): ResolvedButton["role"] => {
  if (action.role) return action.role;
  if (action.variant === "danger") return "destructive";
  if (action.label.trim().toLowerCase() === "cancel") return "cancel";
  return "default";
};

const AlertButton = memo(function AlertButton({
  button,
  flex,
  divider,
}: {
  button: ResolvedButton;
  flex?: boolean;
  /** Hairline on the leading edge (side-by-side layout). */
  divider?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={button.onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: flex ? 1 : undefined,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
        backgroundColor: pressed ? theme.fill.val : "transparent",
        borderLeftWidth: divider ? 0.5 : 0,
        borderLeftColor: theme.borderColor.val,
      })}
    >
      <AppText
        variant="body"
        tone={button.role === "destructive" ? "danger" : "accent"}
        emphasized={button.role === "cancel"}
        numberOfLines={1}
        style={{ textAlign: "center" }}
      >
        {button.label}
      </AppText>
    </Pressable>
  );
});

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
  const reducedMotion = useReducedMotion();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0); // opacity of card + backdrop
  const scale = useSharedValue(1);

  // Keep the dialog mounted through its exit, then unmount from the UI thread
  // callback. Enter: scale 0.95→1 + fade, 200ms strong ease-out. Exit: a
  // quicker fade with no scale, like UIAlertController.
  useEffect(() => {
    if (open) {
      setMounted(true);
      scale.set(reducedMotion ? 1 : 0.95);
      scale.set(withTiming(1, { duration: DIALOG_ENTER_MS, easing: EASE_OUT }));
      progress.set(withTiming(1, { duration: DIALOG_ENTER_MS, easing: EASE_OUT }));
    } else {
      progress.set(
        withTiming(0, { duration: DIALOG_EXIT_MS, easing: EASE_OUT }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [open, reducedMotion, progress, scale]);

  // Android hardware back closes the dialog.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onOpenChange(false);
      return true;
    });
    return () => sub.remove();
  }, [open, onOpenChange]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: scale.get() }],
  }));

  if (!mounted) return null;

  const close = () => onOpenChange(false);

  let buttons: ResolvedButton[] = [];
  if (!hideActions) {
    if (actions && actions.length > 0) {
      buttons = actions.map((action, i) => ({
        key: `${action.label}-${i}`,
        label: action.label,
        role: roleFor(action),
        onPress: () => {
          action.onPress();
          close();
        },
      }));
      // iOS puts Cancel last in a vertical stack.
      buttons.sort((a, b) => Number(a.role === "cancel") - Number(b.role === "cancel"));
    } else {
      const showCancel = !primaryAction || !!secondaryAction;
      if (showCancel) {
        buttons.push({
          key: "cancel",
          label: secondaryAction?.label ?? cancelText,
          role: "cancel",
          onPress: () => {
            if (secondaryAction) secondaryAction.onPress();
            else onCancel?.();
            close();
          },
        });
      }
      const confirmLabel = primaryAction?.label ?? confirmText;
      buttons.push({
        key: "confirm",
        label: confirmLabel,
        // A lone button is the dismiss action, so it takes the bold weight.
        role:
          variant === "danger" || primaryAction?.variant === "danger"
            ? "destructive"
            : showCancel
              ? "default"
              : "cancel",
        onPress: () => {
          if (primaryAction) {
            primaryAction.onPress();
            close();
            return;
          }
          if (onConfirm?.() !== false) close();
        },
      });
    }
  }

  const sideBySide =
    buttons.length === 2 &&
    buttons.every((b) => b.label.length <= 14) &&
    !(actions && actions.length > 0);
  const rich = !!children;

  return (
    <Portal zIndex={300000}>
      {/* Explicit window size: the portal host has no intrinsic height on web. */}
      <View
        position="absolute"
        top={0}
        left={0}
        width={windowWidth}
        height={windowHeight}
        alignItems="center"
        justifyContent="center"
      >
        <Animated.View
          style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, backdropStyle]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <View flex={1} backgroundColor="$overlay" />
          </Pressable>
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[{ width: rich ? "88%" : 270, maxWidth: rich ? 400 : 270 }, cardStyle]}
        >
          <YStack
            backgroundColor="$surfaceElevated"
            borderRadius="$lg"
            overflow="hidden"
            maxHeight={windowHeight * 0.8}
            style={{ borderCurve: "continuous" }}
          >
            <YStack
              paddingTop={20}
              paddingHorizontal="$md"
              paddingBottom={rich ? "$sm" : 20}
              gap={4}
              flexShrink={1}
            >
              <AppText
                variant="headline"
                accessibilityRole="header"
                style={{ textAlign: "center" }}
              >
                {title}
              </AppText>
              {description ? (
                <AppText variant="footnote" selectable style={{ textAlign: "center" }}>
                  {description}
                </AppText>
              ) : null}
              {children ? (
                <YStack marginTop="$sm" flexShrink={1}>
                  {children}
                </YStack>
              ) : null}
            </YStack>

            {buttons.length > 0 ? (
              sideBySide ? (
                <XStack borderTopWidth={0.5} borderTopColor="$borderColor">
                  {buttons.map((b, i) => (
                    <AlertButton key={b.key} button={b} flex divider={i > 0} />
                  ))}
                </XStack>
              ) : (
                <YStack>
                  {buttons.map((b) => (
                    <YStack key={b.key} borderTopWidth={0.5} borderTopColor="$borderColor">
                      <AlertButton button={b} />
                    </YStack>
                  ))}
                </YStack>
              )
            ) : null}
          </YStack>
        </Animated.View>
      </View>
    </Portal>
  );
});

// ---------------------------------------------------------------------------
// ModalSheet (iOS page sheet look on top of Tamagui Sheet)
// ---------------------------------------------------------------------------

type ModalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  /** Percent snap points, topmost first. */
  snapPoints?: number[];
  /** Trailing header action. Defaults to "Done", which closes the sheet. */
  doneLabel?: string;
  onDone?: () => void;
  /** Fixed content between the header and the scrolling body, e.g. a search field. */
  toolbar?: ReactNode;
  children: ReactNode;
};

/**
 * Grouped iOS sheet: grabber, title3 header with a plain "Done" button, and a
 * scrolling `$background` body meant for `ListSection`s. Position uses a
 * critically damped spring (no bounce); the backdrop fades in `$overlay`.
 */
export const ModalSheet = memo(function ModalSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  snapPoints = [85],
  doneLabel = "Done",
  onDone,
  toolbar,
  children,
}: ModalSheetProps) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      animationConfig={reducedMotion ? SHEET_REDUCED : SHEET_SPRING}
      zIndex={200000}
      dismissOnSnapToBottom
      moveOnKeyboardChange
      snapPoints={snapPoints}
    >
      <Sheet.Overlay
        animation="quick"
        opacity={1}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="$overlay"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$md"
        borderTopRightRadius="$md"
        // Dark mode: the grouped background is black, so a hairline edge keeps
        // the sheet distinct from the dimmed screen behind it.
        borderWidth={0.5}
        borderBottomWidth={0}
        borderColor="$borderSubtle"
        style={{ borderCurve: "continuous" }}
      >
        <YStack alignItems="center" paddingTop={5} paddingBottom={3}>
          <View
            width={36}
            height={5}
            borderRadius="$full"
            backgroundColor="$placeholderColor"
            accessibilityLabel="Sheet grabber"
          />
        </YStack>

        <XStack
          alignItems="center"
          gap="$sm"
          paddingHorizontal="$md"
          paddingTop="$sm"
          paddingBottom="$sm"
        >
          <YStack flex={1} minWidth={0}>
            <AppText variant="title3" numberOfLines={1} accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="footnote" tone="secondary" numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </YStack>
          <Pressable
            hitSlop={12}
            onPress={onDone ?? (() => onOpenChange(false))}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <AppText variant="headline" tone="accent">
              {doneLabel}
            </AppText>
          </Pressable>
        </XStack>

        {toolbar ? (
          <YStack paddingHorizontal="$md" paddingBottom="$sm">
            {toolbar}
          </YStack>
        ) : null}

        <Sheet.ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            gap: 28,
          }}
        >
          {children}
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
});

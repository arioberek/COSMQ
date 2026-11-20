import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, useWindowDimensions } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";
import AlienLogo from "../assets/logos/alien.svg";
import {
  authenticate,
  type BiometricCapability,
  canAuthenticate as canAuthenticateWith,
  checkBiometricCapability,
  getBiometricDisplayName,
} from "../lib/app-lock";
import { AppText, Button } from "./ui";

type LockScreenProps = {
  onUnlock: () => void;
};

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER = FadeIn.duration(220).easing(EASE_OUT);
// Exit matches the entry path so unlocking doesn't cut to the app abruptly.
const EXIT = FadeOut.duration(160).easing(EASE_OUT);

export const LockScreen = memo(function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  // Explicit size: it renders inside a portal, whose host has no layout of its own on web.
  const { width, height } = useWindowDimensions();

  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const hasTriedAutoAuth = useRef(false);
  const onUnlockRef = useRef(onUnlock);

  onUnlockRef.current = onUnlock;

  const mountedRef = useRef(true);

  const refreshCapability = useCallback(() => {
    checkBiometricCapability().then((cap) => {
      if (mountedRef.current) setCapability(cap);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshCapability();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshCapability]);

  const handleUnlock = useCallback(async () => {
    if (isAuthenticating) return;

    setError(null);
    setWarning(null);
    setIsAuthenticating(true);

    try {
      const result = await authenticate();

      if (result.success) {
        onUnlockRef.current();
        return;
      }

      if (result.error) {
        setError(result.error);
      } else if (result.warning) {
        setWarning(result.warning);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  // Biometrics removed after App Lock was turned on: the device passcode still unlocks.
  const canAuthenticate = capability ? canAuthenticateWith(capability) : false;

  useEffect(() => {
    if (canAuthenticate && !hasTriedAutoAuth.current) {
      hasTriedAutoAuth.current = true;
      handleUnlock();
    }
  }, [canAuthenticate, handleUnlock]);

  const biometricName = !capability
    ? "Biometrics"
    : capability.isEnrolled
      ? getBiometricDisplayName(capability.availableTypes)
      : "Passcode";

  const message = error
    ? error
    : warning
      ? warning
      : capability && !canAuthenticate
        ? !capability.isSupported
          ? "This device doesn’t support biometric authentication."
          : "This device has no passcode or biometrics. Set one up in your device settings, then come back."
        : "Your database connections are protected.";

  const messageTone = error ? "danger" : warning ? "warning" : "secondary";

  return (
    <Animated.View
      entering={reducedMotion ? undefined : ENTER}
      exiting={reducedMotion ? undefined : EXIT}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 9999,
        backgroundColor: theme.background.val,
        // The web portal host is pointer-events: none; the lock screen must catch every touch.
        pointerEvents: "auto",
      }}
      accessibilityViewIsModal
    >
      <YStack
        flex={1}
        paddingHorizontal="$xl"
        paddingTop={insets.top}
        paddingBottom={Math.max(insets.bottom, 16) + 16}
      >
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$sm">
          {/* Echoes the app icon: white alien on the accent tile. */}
          <YStack
            width={76}
            height={76}
            borderRadius="$lg"
            style={{ borderCurve: "continuous" }}
            backgroundColor="$accentFill"
            alignItems="center"
            justifyContent="center"
            marginBottom="$sm"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <AlienLogo width={48} height={48} color={theme.textOnAccent.val} />
          </YStack>
          <AppText variant="title3" textAlign="center" accessibilityRole="header">
            COSMQ Locked
          </AppText>
          <AppText
            variant="footnote"
            tone={messageTone}
            textAlign="center"
            maxWidth={300}
            accessibilityLiveRegion="polite"
          >
            {message}
          </AppText>
        </YStack>

        <YStack minHeight={50} justifyContent="center" alignItems="center">
          {!capability ? (
            <ActivityIndicator color={theme.textSubtle.val} />
          ) : canAuthenticate ? (
            <Button
              size="lg"
              alignSelf="stretch"
              onPress={handleUnlock}
              loading={isAuthenticating}
              accessibilityLabel={`Unlock with ${biometricName}`}
            >
              <Ionicons
                name={
                  !capability?.isEnrolled
                    ? "keypad-outline"
                    : capability.availableTypes.includes("facial")
                      ? "scan-outline"
                      : "finger-print-outline"
                }
                size={20}
                color={theme.textOnAccent.val}
              />
              <AppText variant="headline" tone="onAccent" numberOfLines={1}>
                Unlock with {biometricName}
              </AppText>
            </Button>
          ) : capability.isSupported ? (
            // Nothing to authenticate with yet. Re-check after the user sets a passcode.
            <Button size="lg" variant="gray" alignSelf="stretch" onPress={refreshCapability}>
              Check Again
            </Button>
          ) : null}
        </YStack>
      </YStack>
    </Animated.View>
  );
});

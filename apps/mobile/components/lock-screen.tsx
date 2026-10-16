import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import Animated, { Easing, FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";
import AlienLogo from "../assets/logos/alien.svg";
import {
  authenticate,
  type BiometricCapability,
  checkBiometricCapability,
  getBiometricDisplayName,
} from "../lib/app-lock";
import { AppText, Button } from "./ui";

type LockScreenProps = {
  onUnlock: () => void;
};

const ENTER = FadeIn.duration(220).easing(Easing.bezier(0.23, 1, 0.32, 1));

export const LockScreen = memo(function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const hasTriedAutoAuth = useRef(false);
  const onUnlockRef = useRef(onUnlock);

  onUnlockRef.current = onUnlock;

  useEffect(() => {
    let mounted = true;
    checkBiometricCapability().then((cap) => {
      if (mounted) setCapability(cap);
    });
    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    if (capability?.isEnrolled && !hasTriedAutoAuth.current) {
      hasTriedAutoAuth.current = true;
      handleUnlock();
    }
  }, [capability?.isEnrolled, handleUnlock]);

  const biometricName = capability
    ? getBiometricDisplayName(capability.availableTypes)
    : "Biometrics";

  const canAuthenticate = capability?.isSupported && capability?.isEnrolled;

  const message = error
    ? error
    : warning
      ? warning
      : capability && !canAuthenticate
        ? !capability.isSupported
          ? "This device doesn’t support biometric authentication."
          : "No biometrics are enrolled. Set up Face ID, Touch ID or a fingerprint in your device settings."
        : "Your database connections are protected.";

  const messageTone = error ? "danger" : warning ? "warning" : "secondary";

  return (
    <Animated.View
      entering={reducedMotion ? undefined : ENTER}
      style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: theme.background.val }]}
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
            backgroundColor="$accent"
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
                  capability.availableTypes.includes("facial")
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
          ) : null}
        </YStack>
      </YStack>
    </Animated.View>
  );
});

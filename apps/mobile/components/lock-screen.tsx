import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Button, Text, useTheme, YStack } from "tamagui";
import {
  authenticate,
  checkBiometricCapability,
  getBiometricDisplayName,
  type BiometricCapability,
} from "../lib/app-lock";
import AlienLogo from "../assets/logos/alien.svg";

type LockScreenProps = {
  onUnlock: () => void;
};

export const LockScreen = memo(function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();

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
    return () => { mounted = false; };
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

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$background"
      zIndex={9999}
    >
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$xl">
        <YStack
          width={100}
          height={100}
          borderRadius="$full"
          backgroundColor="$surface"
          justifyContent="center"
          alignItems="center"
          marginBottom="$lg"
          borderWidth={2}
          borderColor="$borderColor"
        >
          <AlienLogo width={60} height={60} />
        </YStack>

        <Text fontSize={32} fontWeight="bold" color="$color" marginBottom="$sm">
          COSMQ
        </Text>
        <Text fontSize={18} color="$textSubtle" marginBottom="$xl">
          App Locked
        </Text>

        {error ? (
          <YStack
            backgroundColor="$dangerMuted"
            padding="$md"
            borderRadius="$md"
            marginBottom="$lg"
            maxWidth={300}
          >
            <Text color="$danger" fontSize={14} textAlign="center" lineHeight={20}>
              {error}
            </Text>
          </YStack>
        ) : null}

        {warning ? (
          <YStack
            backgroundColor="$warningMuted"
            padding="$md"
            borderRadius="$md"
            marginBottom="$lg"
            maxWidth={300}
          >
            <Text color="$warning" fontSize={14} textAlign="center">
              {warning}
            </Text>
          </YStack>
        ) : null}

        {!capability ? (
          <ActivityIndicator
            size="large"
            color={theme.primary.val}
            style={{ marginBottom: 24 }}
          />
        ) : canAuthenticate ? (
          <Button
            backgroundColor="$primary"
            paddingHorizontal="$xl"
            paddingVertical="$md"
            borderRadius="$md"
            marginBottom="$lg"
            gap="$md"
            onPress={handleUnlock}
            disabled={isAuthenticating}
            opacity={isAuthenticating ? 0.6 : 1}
            pressStyle={{ opacity: 0.8 }}
            animation="quick"
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text fontSize={24}>
                  {capability.availableTypes.includes("facial") ? "👤" : "👆"}
                </Text>
                <Text color="$color" fontSize={16} fontWeight="600">
                  Unlock with {biometricName}
                </Text>
              </>
            )}
          </Button>
        ) : (
          <YStack
            backgroundColor="$surfaceMuted"
            padding="$md"
            borderRadius="$md"
            marginBottom="$lg"
            maxWidth={300}
          >
            <Text color="$textSubtle" fontSize={14} textAlign="center" lineHeight={20}>
              {!capability.isSupported
                ? "Biometric authentication not supported on this device"
                : "No biometric credentials enrolled. Please set up Face ID or fingerprint in device settings."}
            </Text>
          </YStack>
        )}

        <Text color="$textSubtle" fontSize={12} textAlign="center">
          Your database connections are protected
        </Text>
      </YStack>
    </YStack>
  );
});

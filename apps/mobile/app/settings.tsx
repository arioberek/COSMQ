import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ScrollView, Text, useTheme, XStack, YStack } from "tamagui";
import { useSettingsStore } from "../stores/settings";
import {
  checkBiometricCapability,
  getBiometricDisplayName,
  authenticate,
  type BiometricCapability,
} from "../lib/app-lock";
import {
  APP_LOCK_TIMEOUT_LABELS,
  AUTO_ROLLBACK_RANGE,
  type AppLockTimeout,
  normalizeAutoRollbackSeconds,
} from "../lib/settings";
import { Switch, Dialog } from "../components/ui";

const TIMEOUT_OPTIONS: AppLockTimeout[] = ["immediate", "15s", "1m", "5m"];

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const versionTapCount = useRef(0);
  const versionTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRollbackInput, setAutoRollbackInput] = useState(
    settings.autoRollbackSeconds.toString()
  );
  const [isAutoRollbackEditing, setIsAutoRollbackEditing] = useState(false);

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", message: "" });

  useEffect(() => {
    checkBiometricCapability().then(setBiometricCapability);
  }, []);

  useEffect(() => {
    if (!isAutoRollbackEditing) {
      setAutoRollbackInput(settings.autoRollbackSeconds.toString());
    }
  }, [settings.autoRollbackSeconds, isAutoRollbackEditing]);

  useEffect(() => {
    return () => {
      if (versionTapTimeout.current) {
        clearTimeout(versionTapTimeout.current);
      }
    };
  }, []);

  const biometricName = biometricCapability
    ? getBiometricDisplayName(biometricCapability.availableTypes)
    : "Biometrics";

  const canEnableAppLock = biometricCapability?.isSupported && biometricCapability?.isEnrolled;

  const handleAppLockToggle = useCallback(async (enable: boolean) => {
    if (!enable) {
      await updateSettings({ appLockEnabled: false });
      return;
    }

    if (!canEnableAppLock) {
      setAlertContent({
        title: "Cannot Enable App Lock",
        message: biometricCapability?.isSupported
          ? "No biometric credentials are enrolled. Please set up Face ID, Touch ID, or fingerprint in your device settings first."
          : "Biometric authentication is not supported on this device.",
      });
      setShowAlertDialog(true);
      return;
    }

    const result = await authenticate("Authenticate to enable App Lock");
    if (result.success) {
      await updateSettings({ appLockEnabled: true });
    } else if (result.error) {
      setAlertContent({ title: "Authentication Failed", message: result.error });
      setShowAlertDialog(true);
    }
  }, [canEnableAppLock, biometricCapability, updateSettings]);

  const handleAutoRollbackToggle = useCallback(
    async (enable: boolean) => {
      if (!enable) {
        await updateSettings({ autoRollbackEnabled: false });
        return;
      }

      const parsed = Number.parseInt(autoRollbackInput, 10);
      const normalized = normalizeAutoRollbackSeconds(
        Number.isNaN(parsed) ? settings.autoRollbackSeconds : parsed
      );
      setAutoRollbackInput(normalized.toString());
      await updateSettings({
        autoRollbackEnabled: true,
        autoRollbackSeconds: normalized,
      });
    },
    [autoRollbackInput, settings.autoRollbackSeconds, updateSettings]
  );

  const commitAutoRollbackSeconds = useCallback(async () => {
    const parsed = Number.parseInt(autoRollbackInput, 10);
    if (Number.isNaN(parsed)) {
      setAutoRollbackInput(settings.autoRollbackSeconds.toString());
      return;
    }

    const normalized = normalizeAutoRollbackSeconds(parsed);
    setAutoRollbackInput(normalized.toString());
    await updateSettings({ autoRollbackSeconds: normalized });
  }, [autoRollbackInput, settings.autoRollbackSeconds, updateSettings]);

  const handleVersionTap = useCallback(() => {
    if (versionTapTimeout.current) {
      clearTimeout(versionTapTimeout.current);
    }

    versionTapCount.current += 1;
    if (versionTapCount.current >= 5) {
      versionTapCount.current = 0;
      setAlertContent({ title: "You found the Cosmos!", message: "Thanks for exploring. Keep building." });
      setShowAlertDialog(true);
      return;
    }

    versionTapTimeout.current = setTimeout(() => {
      versionTapCount.current = 0;
    }, 1200);
  }, []);

  const auroraGradient = [
    theme.gradientCosmicStart.val,
    theme.gradientCosmicMid.val,
    theme.gradientCosmicEnd.val,
  ] as const;
  const cardGradient = [theme.card.val, theme.surfaceAlt.val] as const;
  const primaryGradient = [theme.gradientPrimaryStart.val, theme.gradientPrimaryEnd.val] as const;

  return (
    <YStack flex={1} backgroundColor="$background">
      <LinearGradient
        colors={auroraGradient}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 350,
          opacity: 0.12,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor="$background"
        opacity={0.9}
      />

      <ScrollView flex={1} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        <Animated.View
          entering={FadeInUp.delay(50).springify()}
          style={{ paddingTop: 24, paddingBottom: 24 }}
        >
          <Text color="$color" fontSize={32} fontWeight="700" letterSpacing={-0.5}>
            Settings
          </Text>
          <Text color="$textSubtle" fontSize={15} marginTop="$xs">
            Customize your experience
          </Text>
        </Animated.View>

        <Section title="Appearance" index={0} cardGradient={cardGradient}>
          <SettingRow
            label="Dark Mode"
            description="Switch between light and dark themes"
            value={settings.darkMode}
            onValueChange={(value) => updateSettings({ darkMode: value })}
          />
        </Section>

        <Section title="Security" index={1} cardGradient={cardGradient}>
          <SettingRow
            label={`App Lock (${biometricName})`}
            description={
              canEnableAppLock
                ? "Require biometric authentication to access the app"
                : biometricCapability?.isSupported
                  ? "Set up Face ID or fingerprint in device settings to enable"
                  : "Not supported on this device"
            }
            value={settings.appLockEnabled}
            onValueChange={handleAppLockToggle}
          />
          {settings.appLockEnabled ? (
            <>
              <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
              <TimeoutSelector
                value={settings.appLockTimeout}
                onChange={(value) => updateSettings({ appLockTimeout: value })}
                primaryGradient={primaryGradient}
              />
            </>
          ) : null}
        </Section>

        <Section title="Safety" index={2} cardGradient={cardGradient}>
          <SettingRow
            label="Dangerous Operations Hint"
            description="Confirm UPDATE/DELETE/DROP statements"
            value={settings.dangerousOpsHint}
            onValueChange={(value) => updateSettings({ dangerousOpsHint: value })}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <SettingRow
            label="Auto-rollback Transactions"
            description="Automatically rollback unfinished transactions"
            value={settings.autoRollbackEnabled}
            onValueChange={handleAutoRollbackToggle}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <NumberSettingRow
            label="Auto-rollback Timer"
            description={`Timeout before rollback (${AUTO_ROLLBACK_RANGE.min}-${AUTO_ROLLBACK_RANGE.max}s)`}
            value={autoRollbackInput}
            onChangeText={setAutoRollbackInput}
            onFocus={() => setIsAutoRollbackEditing(true)}
            onBlur={() => {
              setIsAutoRollbackEditing(false);
              commitAutoRollbackSeconds();
            }}
            editable={settings.autoRollbackEnabled}
          />
        </Section>

        <Section title="Editor" index={3} cardGradient={cardGradient}>
          <SettingRow
            label="Autocomplete Suggestions"
            description="Show SQL keyword autocomplete as you type"
            value={settings.enableAutocomplete}
            onValueChange={(value) => updateSettings({ enableAutocomplete: value })}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <SettingRow
            label="SQL Templates"
            description="Show quick templates for common queries"
            value={settings.showSqlTemplates}
            onValueChange={(value) => updateSettings({ showSqlTemplates: value })}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <SettingRow
            label="Quick Actions"
            description="Show one-tap SQL snippets under the editor"
            value={settings.showQuickActions}
            onValueChange={(value) => updateSettings({ showQuickActions: value })}
          />
        </Section>

        <Section title="Feedback" index={4} cardGradient={cardGradient}>
          <SettingRow
            label="Haptic Feedback"
            description="Vibrate on query success, errors, and transactions"
            value={settings.hapticFeedbackEnabled}
            onValueChange={(value) => updateSettings({ hapticFeedbackEnabled: value })}
          />
        </Section>

        <Section title="About" index={5} cardGradient={cardGradient}>
          <InfoRow label="Version" value={appVersion} onPress={handleVersionTap} />
        </Section>

        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={{ alignItems: "center", paddingTop: 32 }}
        >
          <XStack alignItems="center">
            <Text color="$textSubtle" fontSize={13}>
              Made with{" "}
            </Text>
            <Ionicons name="heart" size={13} color={theme.primary.val} />
            <Text color="$textSubtle" fontSize={13}>
              {" "}for database enthusiasts
            </Text>
          </XStack>
        </Animated.View>
      </ScrollView>

      <Dialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        title={alertContent.title}
        description={alertContent.message}
        confirmText="OK"
        cancelText="Dismiss"
        onConfirm={() => setShowAlertDialog(false)}
      />
    </YStack>
  );
}

const Section = ({
  title,
  children,
  index,
  cardGradient,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
  cardGradient: readonly [string, string];
}) => (
  <Animated.View
    entering={FadeInDown.delay(index * 80).springify()}
    style={{ marginBottom: 24 }}
  >
    <Text
      color="$primary"
      fontSize={13}
      fontWeight="700"
      textTransform="uppercase"
      letterSpacing={1.5}
      marginBottom="$sm"
      marginLeft="$xs"
    >
      {title}
    </Text>
    <YStack
      borderRadius="$lg"
      padding="$md"
      overflow="hidden"
      borderWidth={1}
      borderColor="$cardBorder"
    >
      <LinearGradient
        colors={cardGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </YStack>
  </Animated.View>
);

const SettingRow = ({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <XStack alignItems="center" justifyContent="space-between" gap="$md" paddingVertical="$xs">
    <YStack flex={1} gap={2}>
      <Text color="$color" fontSize={16} fontWeight="600">
        {label}
      </Text>
      {description ? (
        <Text color="$textSubtle" fontSize={13} lineHeight={18}>
          {description}
        </Text>
      ) : null}
    </YStack>
    <Switch checked={value} onCheckedChange={onValueChange} />
  </XStack>
);

const NumberSettingRow = ({
  label,
  description,
  value,
  onChangeText,
  onFocus,
  onBlur,
  editable,
}: {
  label: string;
  description?: string;
  value: string;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  editable: boolean;
}) => {
  const theme = useTheme();

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$md" paddingVertical="$xs">
      <YStack flex={1} gap={2}>
        <Text color="$color" fontSize={16} fontWeight="600">
          {label}
        </Text>
        {description ? (
          <Text color="$textSubtle" fontSize={13} lineHeight={18}>
            {description}
          </Text>
        ) : null}
      </YStack>
      <XStack
        alignItems="center"
        gap={6}
        paddingHorizontal="$md"
        paddingVertical="$sm"
        borderRadius="$md"
        backgroundColor="$surfaceAlt"
        borderWidth={1}
        borderColor="$borderColor"
        minWidth={100}
        justifyContent="flex-end"
        opacity={editable ? 1 : 0.5}
      >
        <TextInput
          style={{
            color: editable ? theme.color.val : theme.textSubtle.val,
            fontSize: 15,
            minWidth: 40,
            textAlign: "right",
            paddingVertical: 2,
            fontFamily: "JetBrainsMono",
          }}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={`${AUTO_ROLLBACK_RANGE.min}-${AUTO_ROLLBACK_RANGE.max}`}
          placeholderTextColor={theme.placeholderColor.val}
          keyboardType="number-pad"
          returnKeyType="done"
          editable={editable}
        />
        <Text color={editable ? "$textSubtle" : "$disabled"} fontSize={13} fontWeight="600">
          s
        </Text>
      </XStack>
    </XStack>
  );
};

const InfoRow = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) =>
  onPress ? (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 4,
        },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <Text color="$textSubtle" fontSize={15}>
        {label}
      </Text>
      <XStack alignItems="center" gap="$xs">
        <Text color="$color" fontSize={15} fontWeight="600">
          {value}
        </Text>
        <YStack width={20} height={20} justifyContent="center" alignItems="center">
          <Text color="$textSubtle" fontSize={18} fontWeight="300">
            ›
          </Text>
        </YStack>
      </XStack>
    </Pressable>
  ) : (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical="$xs">
      <Text color="$textSubtle" fontSize={15}>
        {label}
      </Text>
      <Text color="$color" fontSize={15} fontWeight="600">
        {value}
      </Text>
    </XStack>
  );

const TimeoutSelector = ({
  value,
  onChange,
  primaryGradient,
}: {
  value: AppLockTimeout;
  onChange: (value: AppLockTimeout) => void;
  primaryGradient: readonly [string, string];
}) => (
  <YStack gap="$sm" paddingVertical="$xs">
    <Text color="$textSubtle" fontSize={13}>
      Lock after leaving app:
    </Text>
    <XStack flexWrap="wrap" gap="$sm">
      {TIMEOUT_OPTIONS.map((option) => (
        <Pressable
          key={option}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: value === option ? "transparent" : "rgba(255,255,255,0.08)",
          }}
          onPress={() => onChange(option)}
        >
          {value === option && (
            <LinearGradient
              colors={primaryGradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <Text
            color={value === option ? "#fff" : "$textSubtle"}
            fontSize={13}
            fontWeight="600"
          >
            {APP_LOCK_TIMEOUT_LABELS[option]}
          </Text>
        </Pressable>
      ))}
    </XStack>
  </YStack>
);

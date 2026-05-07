import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { ScrollView, Text, useTheme, XStack, YStack } from "tamagui";
import { Dialog, Switch } from "../components/ui";
import {
  authenticate,
  type BiometricCapability,
  checkBiometricCapability,
  getBiometricDisplayName,
} from "../lib/app-lock";
import {
  APP_LOCK_TIMEOUT_LABELS,
  type AppLockTimeout,
  AUTO_ROLLBACK_RANGE,
  normalizeAutoRollbackSeconds,
} from "../lib/settings";
import { useSettingsStore } from "../stores/settings";

const TIMEOUT_OPTIONS: AppLockTimeout[] = ["immediate", "15s", "1m", "5m"];

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettingsStore();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const versionTapCount = useRef(0);
  const versionTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRollbackInput, setAutoRollbackInput] = useState(
    settings.autoRollbackSeconds.toString(),
  );
  const [isAutoRollbackEditing, setIsAutoRollbackEditing] = useState(false);

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", message: "" });

  useEffect(() => {
    let mounted = true;
    checkBiometricCapability().then((capability) => {
      if (mounted) setBiometricCapability(capability);
    });
    return () => {
      mounted = false;
    };
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

  const handleAppLockToggle = useCallback(
    async (enable: boolean) => {
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
    },
    [canEnableAppLock, biometricCapability, updateSettings],
  );

  const handleAutoRollbackToggle = useCallback(
    async (enable: boolean) => {
      if (!enable) {
        await updateSettings({ autoRollbackEnabled: false });
        return;
      }

      const parsed = Number.parseInt(autoRollbackInput, 10);
      const normalized = normalizeAutoRollbackSeconds(
        Number.isNaN(parsed) ? settings.autoRollbackSeconds : parsed,
      );
      setAutoRollbackInput(normalized.toString());
      await updateSettings({
        autoRollbackEnabled: true,
        autoRollbackSeconds: normalized,
      });
    },
    [autoRollbackInput, settings.autoRollbackSeconds, updateSettings],
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
      setAlertContent({
        title: "Nice find.",
        message: "Thanks for poking around. Build something.",
      });
      setShowAlertDialog(true);
      return;
    }

    versionTapTimeout.current = setTimeout(() => {
      versionTapCount.current = 0;
    }, 1200);
  }, []);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView flex={1} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        <YStack paddingTop="$lg" paddingBottom="$lg" gap={2}>
          <Text color="$color" fontSize={26} fontWeight="600" letterSpacing={-0.4}>
            Settings
          </Text>
          <Text color="$textSubtle" fontSize={13}>
            App preferences
          </Text>
        </YStack>

        <Section title="Appearance">
          <SettingRow
            label="Dark mode"
            description="Switch between light and dark themes"
            value={settings.darkMode}
            onValueChange={(value) => updateSettings({ darkMode: value })}
          />
        </Section>

        <Section title="Security">
          <SettingRow
            label={`App lock (${biometricName})`}
            description={
              canEnableAppLock
                ? "Require biometric authentication to open the app"
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
              />
            </>
          ) : null}
        </Section>

        <Section title="Safety">
          <SettingRow
            label="Confirm dangerous statements"
            description="Prompt before running UPDATE / DELETE / DROP"
            value={settings.dangerousOpsHint}
            onValueChange={(value) => updateSettings({ dangerousOpsHint: value })}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <SettingRow
            label="Auto-rollback transactions"
            description="Roll back unfinished transactions automatically"
            value={settings.autoRollbackEnabled}
            onValueChange={handleAutoRollbackToggle}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <NumberSettingRow
            label="Auto-rollback timer"
            description={`${AUTO_ROLLBACK_RANGE.min}–${AUTO_ROLLBACK_RANGE.max} seconds`}
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

        <Section title="Editor">
          <SettingRow
            label="Autocomplete"
            description="Suggest SQL keywords as you type"
            value={settings.enableAutocomplete}
            onValueChange={(value) => updateSettings({ enableAutocomplete: value })}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <SettingRow
            label="Templates"
            description="Show common-query templates above the editor"
            value={settings.showSqlTemplates}
            onValueChange={(value) => updateSettings({ showSqlTemplates: value })}
          />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <SettingRow
            label="Quick actions"
            description="Show keyword chips below the editor"
            value={settings.showQuickActions}
            onValueChange={(value) => updateSettings({ showQuickActions: value })}
          />
        </Section>

        <Section title="Feedback">
          <SettingRow
            label="Haptics"
            description="Vibrate on success, errors, and transaction events"
            value={settings.hapticFeedbackEnabled}
            onValueChange={(value) => updateSettings({ hapticFeedbackEnabled: value })}
          />
        </Section>

        <Section title="About">
          <InfoRow label="Version" value={appVersion} onPress={handleVersionTap} />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <InfoRow label="Author" value="Arielton Oberek" />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <LinkRow label="Website" value="cosmq.arielton.com" url="https://cosmq.arielton.com" />
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$sm" />
          <LinkRow
            label="GitHub"
            value="arioberek/cosmq"
            url="https://github.com/arioberek/cosmq"
          />
        </Section>

        <YStack alignItems="center" paddingTop="$xl">
          <Text color="$textSubtle" fontSize={12}>
            Run queries from anywhere.
          </Text>
        </YStack>
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <YStack marginBottom="$lg">
    <Text
      color="$textSubtle"
      fontSize={11}
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing={1.2}
      marginBottom="$sm"
      marginLeft="$xs"
    >
      {title}
    </Text>
    <YStack
      borderRadius="$md"
      padding="$md"
      borderWidth={1}
      borderColor="$cardBorder"
      backgroundColor="$surface"
    >
      {children}
    </YStack>
  </YStack>
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

const LinkRow = ({ label, value, url }: { label: string; value: string; url: string }) => {
  const theme = useTheme();

  return (
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
      onPress={() => Linking.openURL(url)}
    >
      <Text color="$textSubtle" fontSize={15}>
        {label}
      </Text>
      <XStack alignItems="center" gap="$xs">
        <Text color="$primary" fontSize={15} fontWeight="600">
          {value}
        </Text>
        <Ionicons name="open-outline" size={14} color={theme.primary.val} />
      </XStack>
    </Pressable>
  );
};

const TimeoutSelector = ({
  value,
  onChange,
}: {
  value: AppLockTimeout;
  onChange: (value: AppLockTimeout) => void;
}) => {
  const theme = useTheme();
  return (
    <YStack gap="$sm" paddingVertical="$xs">
      <Text color="$textSubtle" fontSize={13}>
        Lock after leaving app
      </Text>
      <XStack flexWrap="wrap" gap="$sm">
        {TIMEOUT_OPTIONS.map((option) => {
          const isActive = value === option;
          return (
            <Pressable
              key={option}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isActive ? theme.primary.val : theme.borderColor.val,
                backgroundColor: isActive ? theme.primaryMuted.val : "transparent",
              }}
              onPress={() => onChange(option)}
            >
              <Text
                color={isActive ? "$primary" : "$textSubtle"}
                fontSize={13}
                fontWeight={isActive ? "600" : "500"}
              >
                {APP_LOCK_TIMEOUT_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </XStack>
    </YStack>
  );
};

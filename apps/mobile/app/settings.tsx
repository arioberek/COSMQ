import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, TextInput } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import { AppText, ListIcon, ListRow, ListSection, Switch } from "../components/ui";
import {
  authenticate,
  type BiometricCapability,
  checkBiometricCapability,
  getBiometricDisplayName,
} from "../lib/app-lock";
import {
  APP_LOCK_TIMEOUT_LABELS,
  APPEARANCE_LABELS,
  type Appearance,
  type AppLockTimeout,
  AUTO_ROLLBACK_RANGE,
  normalizeAutoRollbackSeconds,
} from "../lib/settings";
import { useSettingsStore } from "../stores/settings";

const TIMEOUT_OPTIONS: AppLockTimeout[] = ["immediate", "15s", "1m", "5m"];
const APPEARANCE_OPTIONS: Appearance[] = ["system", "light", "dark"];

// TextInput can't use AppText variants; this mirrors the `body` text style (17pt).
const BODY_FONT_SIZE = 17;

const openUrl = (url: string) => {
  Linking.openURL(url).catch(() => {});
};

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const versionTapCount = useRef(0);
  const versionTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRollbackInput, setAutoRollbackInput] = useState(
    settings.autoRollbackSeconds.toString(),
  );
  const [isAutoRollbackEditing, setIsAutoRollbackEditing] = useState(false);

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
        Alert.alert(
          "Can’t Turn On App Lock",
          biometricCapability?.isSupported
            ? "No biometrics are enrolled. Set up Face ID, Touch ID or a fingerprint in your device settings first."
            : "This device doesn’t support biometric authentication.",
        );
        return;
      }

      const result = await authenticate("Authenticate to enable App Lock");
      if (result.success) {
        await updateSettings({ appLockEnabled: true });
      } else if (result.error) {
        Alert.alert("Authentication Failed", result.error);
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
      Alert.alert("Nice find.", "Thanks for poking around. Build something.");
      return;
    }

    versionTapTimeout.current = setTimeout(() => {
      versionTapCount.current = 0;
    }, 1200);
  }, []);

  const securityFooter = !biometricCapability
    ? undefined
    : canEnableAppLock
      ? `Require ${biometricName} to open COSMQ.`
      : biometricCapability.isSupported
        ? "Set up Face ID, Touch ID or a fingerprint in your device settings to turn on App Lock."
        : "This device doesn’t support biometric authentication.";

  const securityIcon = biometricCapability?.availableTypes.includes("facial")
    ? "scan"
    : biometricCapability?.availableTypes.includes("fingerprint")
      ? "finger-print"
      : "lock-closed";

  const linkIcon = <Ionicons name="open-outline" size={17} color={theme.textSubtle.val} />;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 28 }}
    >
      <ListSection title="Appearance">
        {APPEARANCE_OPTIONS.map((option) => (
          <ListRow
            key={option}
            title={APPEARANCE_LABELS[option]}
            accessory={settings.appearance === option ? "check" : undefined}
            onPress={() => updateSettings({ appearance: option })}
            accessibilityLabel={`${APPEARANCE_LABELS[option]} appearance${settings.appearance === option ? ", selected" : ""}`}
          />
        ))}
      </ListSection>

      <ListSection title="Security" footer={securityFooter}>
        <ListRow
          icon={<ListIcon name={securityIcon} color={theme.tileGreen.val} />}
          title="App Lock"
          accessory={
            <Switch
              checked={settings.appLockEnabled}
              onCheckedChange={handleAppLockToggle}
              accessibilityLabel={`App Lock with ${biometricName}`}
            />
          }
        />
      </ListSection>

      {settings.appLockEnabled ? (
        <ListSection
          title="Require Unlock"
          footer="How long COSMQ can stay in the background before it locks."
        >
          {TIMEOUT_OPTIONS.map((option) => (
            <ListRow
              key={option}
              title={APP_LOCK_TIMEOUT_LABELS[option]}
              accessory={settings.appLockTimeout === option ? "check" : undefined}
              onPress={() => updateSettings({ appLockTimeout: option })}
              accessibilityLabel={`${APP_LOCK_TIMEOUT_LABELS[option]}${settings.appLockTimeout === option ? ", selected" : ""}`}
            />
          ))}
        </ListSection>
      ) : null}

      <ListSection
        title="Safety"
        footer={`Confirmation asks before UPDATE, DELETE or DROP runs. Auto-rollback rolls back a transaction still open when the timer runs out (${AUTO_ROLLBACK_RANGE.min}–${AUTO_ROLLBACK_RANGE.max} seconds).`}
      >
        <ListRow
          icon={<ListIcon name="warning" color={theme.tileRed.val} />}
          title="Confirm Dangerous Queries"
          accessory={
            <Switch
              checked={settings.dangerousOpsHint}
              onCheckedChange={(value) => updateSettings({ dangerousOpsHint: value })}
              accessibilityLabel="Confirm dangerous queries"
            />
          }
        />
        <ListRow
          icon={<ListIcon name="arrow-undo" color={theme.tileOrange.val} />}
          title="Auto-Rollback"
          accessory={
            <Switch
              checked={settings.autoRollbackEnabled}
              onCheckedChange={handleAutoRollbackToggle}
              accessibilityLabel="Auto-rollback transactions"
            />
          }
        />
        {settings.autoRollbackEnabled ? (
          <ListRow
            icon={<ListIcon name="timer" color={theme.tileOrange.val} />}
            title="Rollback After"
            accessory={
              <XStack alignItems="center" gap={4}>
                <TextInput
                  value={autoRollbackInput}
                  onChangeText={setAutoRollbackInput}
                  onFocus={() => setIsAutoRollbackEditing(true)}
                  onBlur={() => {
                    setIsAutoRollbackEditing(false);
                    commitAutoRollbackSeconds();
                  }}
                  onSubmitEditing={commitAutoRollbackSeconds}
                  placeholder={`${AUTO_ROLLBACK_RANGE.min}–${AUTO_ROLLBACK_RANGE.max}`}
                  placeholderTextColor={theme.placeholderColor.val}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={3}
                  selectTextOnFocus
                  accessibilityLabel="Rollback after, in seconds"
                  style={{
                    color: theme.textMuted.val,
                    fontSize: BODY_FONT_SIZE,
                    width: 64,
                    textAlign: "right",
                    paddingVertical: 0,
                    fontVariant: ["tabular-nums"],
                  }}
                />
                <AppText variant="body" tone="secondary">
                  s
                </AppText>
              </XStack>
            }
          />
        ) : null}
      </ListSection>

      <ListSection
        title="Editor"
        footer="Templates add common queries above the editor. Quick actions add keyword chips below it."
      >
        <ListRow
          icon={<ListIcon name="sparkles" color={theme.accent.val} />}
          title="Autocomplete"
          accessory={
            <Switch
              checked={settings.enableAutocomplete}
              onCheckedChange={(value) => updateSettings({ enableAutocomplete: value })}
              accessibilityLabel="Autocomplete"
            />
          }
        />
        <ListRow
          icon={<ListIcon name="document-text" color={theme.tileBlue.val} />}
          title="Templates"
          accessory={
            <Switch
              checked={settings.showSqlTemplates}
              onCheckedChange={(value) => updateSettings({ showSqlTemplates: value })}
              accessibilityLabel="Templates"
            />
          }
        />
        <ListRow
          icon={<ListIcon name="flash" color={theme.tileIndigo.val} />}
          title="Quick Actions"
          accessory={
            <Switch
              checked={settings.showQuickActions}
              onCheckedChange={(value) => updateSettings({ showQuickActions: value })}
              accessibilityLabel="Quick actions"
            />
          }
        />
      </ListSection>

      <ListSection title="Feedback" footer="Vibrate on success, errors and transaction events.">
        <ListRow
          icon={<ListIcon name="pulse" color={theme.tilePink.val} />}
          title="Haptics"
          accessory={
            <Switch
              checked={settings.hapticFeedbackEnabled}
              onCheckedChange={(value) => updateSettings({ hapticFeedbackEnabled: value })}
              accessibilityLabel="Haptics"
            />
          }
        />
      </ListSection>

      <ListSection title="About">
        <ListRow
          icon={<ListIcon name="information" color={theme.tileGray.val} />}
          title="Version"
          value={appVersion}
          onPress={handleVersionTap}
          accessibilityLabel={`Version ${appVersion}`}
        />
        <ListRow
          icon={<ListIcon name="person" color={theme.tileGray.val} />}
          title="Author"
          value="Arielton Oberek"
        />
        <ListRow
          icon={<ListIcon name="globe-outline" color={theme.tileGray.val} />}
          title="Website"
          value="cosmq.arielton.com"
          accessory={linkIcon}
          onPress={() => openUrl("https://cosmq.arielton.com")}
          accessibilityLabel="Website, cosmq.arielton.com"
        />
        <ListRow
          icon={<ListIcon name="logo-github" color={theme.tileGray.val} />}
          title="GitHub"
          value="arioberek/cosmq"
          accessory={linkIcon}
          onPress={() => openUrl("https://github.com/arioberek/cosmq")}
          accessibilityLabel="GitHub, arioberek/cosmq"
        />
      </ListSection>

      <YStack alignItems="center">
        <AppText variant="footnote" tone="tertiary">
          Run queries from anywhere.
        </AppText>
      </YStack>
    </ScrollView>
  );
}

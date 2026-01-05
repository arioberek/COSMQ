import "../polyfills";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "tamagui";
import { useSettingsStore } from "../stores/settings";
import { LockScreen } from "../components/lock-screen";
import { APP_LOCK_TIMEOUT_MS } from "../lib/settings";
import { Provider } from "../components/Provider";

const isExpoGo = Constants.appOwnership === "expo";

SplashScreen.preventAutoHideAsync().catch(() => {});

if (!isExpoGo) {
  SplashScreen.setOptions({
    duration: 800,
    fade: true,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootLayoutContent() {
  const theme = useTheme();
  const { loadSettings, settings, isLoaded: settingsLoaded } = useSettingsStore();

  const [isLocked, setIsLocked] = useState(true);
  const hasAuthenticatedRef = useRef(false);
  const lastUnlockTime = useRef<number>(0);
  const backgroundTimestamp = useRef<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!settingsLoaded) return;

    if (!settings.appLockEnabled) {
      setIsLocked(false);
      hasAuthenticatedRef.current = false;
      return;
    }

    if (!hasAuthenticatedRef.current) {
      setIsLocked(true);
    }
  }, [settings.appLockEnabled, settingsLoaded]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (!settings.appLockEnabled) return;

    if (nextAppState === "background" || nextAppState === "inactive") {
      backgroundTimestamp.current = Date.now();
    } else if (nextAppState === "active" && backgroundTimestamp.current !== null) {
      const timeSinceUnlock = Date.now() - lastUnlockTime.current;
      if (timeSinceUnlock < 2000) {
        backgroundTimestamp.current = null;
        return;
      }

      const timeInBackground = Date.now() - backgroundTimestamp.current;
      const timeout = APP_LOCK_TIMEOUT_MS[settings.appLockTimeout];

      if (timeInBackground >= timeout) {
        hasAuthenticatedRef.current = false;
        setIsLocked(true);
      }

      backgroundTimestamp.current = null;
    }
  }, [settings.appLockEnabled, settings.appLockTimeout]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  const handleUnlock = useCallback(() => {
    hasAuthenticatedRef.current = true;
    lastUnlockTime.current = Date.now();
    setIsLocked(false);
  }, []);

  const showLockScreen = settings.appLockEnabled && isLocked;

  return (
    <>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.surface?.val,
          },
          headerTintColor: theme.color?.val,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.background?.val,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "COSMQ" }}
        />
        <Stack.Screen
          name="connection/new"
          options={{ title: "New Connection", presentation: "modal" }}
        />
        <Stack.Screen
          name="connection/[id]"
          options={{ title: "Connection" }}
        />
        <Stack.Screen
          name="query/[connectionId]"
          options={{ title: "Query" }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: "Settings" }}
        />
      </Stack>
      {showLockScreen ? <LockScreen onUnlock={handleUnlock} /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono: require("../assets/fonts/JetBrainsMono-Regular.ttf"),
  });
  const { isLoaded: settingsLoaded, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (fontsLoaded && settingsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, settingsLoaded]);

  if (!fontsLoaded || !settingsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Provider>
          <RootLayoutContent />
        </Provider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

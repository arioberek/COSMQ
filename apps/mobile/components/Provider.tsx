import type { ReactNode } from "react";
import { TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { PortalProvider } from "@tamagui/portal";
import { config } from "../tamagui.config";
import { useSettingsStore } from "../stores/settings";

type ProviderProps = {
  children: ReactNode;
} & Omit<TamaguiProviderProps, "config">;

export function Provider({ children, ...rest }: ProviderProps) {
  const { settings } = useSettingsStore();

  const resolvedTheme = settings.darkMode ? "dark" : "light";

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={resolvedTheme}
      {...rest}
    >
      <PortalProvider shouldAddRootHost>
        <ToastProvider swipeDirection="up" duration={4000}>
          {children}
          <ToastViewport
            top="$10"
            left={0}
            right={0}
            flexDirection="column"
            alignItems="center"
          />
        </ToastProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
}

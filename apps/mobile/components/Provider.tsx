import { PortalProvider } from "@tamagui/portal";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import type { ReactNode } from "react";
import { TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { useResolvedColorScheme } from "../hooks/useResolvedColorScheme";
import { config } from "../tamagui.config";

type ProviderProps = {
  children: ReactNode;
} & Omit<TamaguiProviderProps, "config">;

export function Provider({ children, ...rest }: ProviderProps) {
  const scheme = useResolvedColorScheme();

  return (
    <TamaguiProvider config={config} defaultTheme={scheme} {...rest}>
      <PortalProvider shouldAddRootHost>
        <ToastProvider swipeDirection="up" duration={4000}>
          {children}
          <ToastViewport top="$10" left={0} right={0} flexDirection="column" alignItems="center" />
        </ToastProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
}

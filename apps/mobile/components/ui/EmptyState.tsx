import type { ReactNode } from "react";
import { YStack } from "tamagui";
import { AppText } from "./Text";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
};

/** Centered placeholder for screens and panels with no content yet. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <YStack alignItems="center" justifyContent="center" gap="$sm" paddingHorizontal="$xl">
      {icon ? <YStack marginBottom="$xs">{icon}</YStack> : null}
      <AppText variant="title3" textAlign="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="subhead" tone="secondary" textAlign="center" maxWidth={320}>
          {message}
        </AppText>
      ) : null}
      {action ? <YStack marginTop="$md">{action}</YStack> : null}
    </YStack>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import { DatabaseTile } from "../../components/database-icon";
import { AppText, Button, EmptyState, ListRow, ListSection } from "../../components/ui";
import { DATABASE_LABELS } from "../../lib/database-meta";
import { useHaptic } from "../../lib/haptics";
import { safeBack } from "../../lib/navigation";
import { deleteConnection, getConnectionWithPassword } from "../../lib/storage/connections";
import type { ConnectionConfig } from "../../lib/types";
import { useConnectionStore } from "../../stores/connection";

const describeSsl = (ssl: ConnectionConfig["ssl"]) => {
  if (typeof ssl === "boolean") return ssl ? "On" : "Off";
  if (!ssl.enabled) return "Off";
  return ssl.rejectUnauthorized === false ? "On, Unverified" : "On";
};

/** Trailing value for a details row: secondary, selectable, truncated in the middle. */
function DetailValue({ children }: { children: string }) {
  return (
    <AppText
      variant="body"
      tone="secondary"
      numberOfLines={1}
      ellipsizeMode="middle"
      flexShrink={1}
      textAlign="right"
      selectable
    >
      {children}
    </AppText>
  );
}

export default function ConnectionDetailScreen() {
  const theme = useTheme();
  const haptic = useHaptic();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const { connect, activeConnections, disconnect } = useConnectionStore();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["connection", id],
    queryFn: () => getConnectionWithPassword(id ?? ""),
    enabled: !!id,
  });

  const activeConnection = id ? activeConnections.get(id) : null;
  const isConnected = activeConnection?.state.status === "connected";
  // A connect attempt's own error, or the store's (e.g. the socket dropped mid-session).
  const shownError =
    connectError ??
    (activeConnection?.state.status === "error" ? (activeConnection.state.error ?? null) : null);

  const handleConnect = async () => {
    if (!connection) return;

    setConnecting(true);
    setConnectError(null);
    try {
      await connect(connection);
      haptic.success();
      router.replace(`/query/${connection.id}`);
    } catch (error) {
      haptic.error();
      setConnectError(error instanceof Error ? error.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!id) return;
    try {
      await disconnect(id);
      haptic.success();
    } catch (error) {
      haptic.error();
      Alert.alert(
        "Couldn’t Disconnect",
        error instanceof Error ? error.message : "Failed to disconnect",
      );
    }
  };

  const deleteNow = async () => {
    if (!id) return;
    try {
      await disconnect(id);
      await deleteConnection(id);
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
      safeBack();
    } catch (error) {
      Alert.alert(
        "Couldn’t Delete Connection",
        error instanceof Error ? error.message : "Failed to delete connection",
      );
    }
  };

  const confirmDelete = () => {
    if (!connection) return;
    Alert.alert(
      `Delete “${connection.name}”?`,
      "The saved connection and its password will be removed from this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteNow },
      ],
    );
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator color={theme.textSubtle.val} />
      </YStack>
    );
  }

  if (!connection) {
    return (
      <YStack flex={1} justifyContent="center" backgroundColor="$background" paddingBottom="$xxl">
        <Stack.Screen options={{ title: "" }} />
        <EmptyState
          icon={<Ionicons name="help-circle-outline" size={56} color={theme.textSubtle.val} />}
          title="Connection Not Found"
          message="It may have been deleted on this device."
          action={
            <Button variant="tinted" onPress={() => safeBack()}>
              Back to Connections
            </Button>
          }
        />
      </YStack>
    );
  }

  const sqlite = connection.type === "sqlite";
  const target = sqlite ? connection.database : connection.host;
  const status = connecting
    ? { label: "Connecting…", dot: "$textSubtle" }
    : isConnected
      ? { label: "Connected", dot: "$successLight" }
      : activeConnection?.state.status === "error"
        ? { label: "Connection Error", dot: "$danger" }
        : { label: "Not Connected", dot: "$textSubtle" };

  return (
    <>
      <Stack.Screen options={{ title: connection.name }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background.val }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 28 }}
      >
        <YStack alignItems="center" gap="$md" paddingTop="$sm">
          <DatabaseTile type={connection.type} size={72} tag={connection.color} />
          <YStack alignItems="center" gap="$xs" maxWidth="100%">
            <AppText variant="title2" textAlign="center" numberOfLines={2}>
              {connection.name}
            </AppText>
            <AppText
              variant="subhead"
              tone="secondary"
              textAlign="center"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {DATABASE_LABELS[connection.type]} · {target}
            </AppText>
            <XStack
              alignItems="center"
              gap={6}
              marginTop={2}
              accessibilityLabel={`Status: ${status.label}`}
            >
              <YStack width={7} height={7} borderRadius={4} backgroundColor={status.dot} />
              <AppText variant="footnote" tone="secondary">
                {status.label}
              </AppText>
            </XStack>
          </YStack>
        </YStack>

        <YStack gap="$sm">
          {isConnected ? (
            <Button
              variant="filled"
              size="lg"
              onPress={() => router.push(`/query/${connection.id}`)}
            >
              Open Query Editor
            </Button>
          ) : (
            <Button
              variant="filled"
              size="lg"
              onPress={handleConnect}
              disabled={connecting}
              loading={connecting}
            >
              {shownError ? "Try Again" : "Connect"}
            </Button>
          )}
          {shownError && !isConnected ? (
            <YStack
              gap="$xs"
              padding={12}
              borderRadius="$md"
              style={{ borderCurve: "continuous" }}
              backgroundColor="$dangerMuted"
              accessibilityLiveRegion="polite"
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="alert-circle" size={16} color={theme.danger.val} />
                <AppText variant="subhead" emphasized tone="danger">
                  Couldn’t Connect
                </AppText>
              </XStack>
              <AppText variant="footnote" tone="danger" selectable>
                {shownError}
              </AppText>
            </YStack>
          ) : null}
        </YStack>

        <ListSection title="Details">
          <ListRow title="Type" value={DATABASE_LABELS[connection.type]} />
          {sqlite ? (
            <ListRow title="File" value={<DetailValue>{connection.database}</DetailValue>} />
          ) : null}
          {!sqlite ? (
            <ListRow title="Host" value={<DetailValue>{connection.host}</DetailValue>} />
          ) : null}
          {!sqlite ? (
            <ListRow title="Port" value={<DetailValue>{connection.port.toString()}</DetailValue>} />
          ) : null}
          {!sqlite ? (
            <ListRow title="Database" value={<DetailValue>{connection.database}</DetailValue>} />
          ) : null}
          {!sqlite ? (
            <ListRow
              title="User"
              value={<DetailValue>{connection.username || "None"}</DetailValue>}
            />
          ) : null}
          {!sqlite ? <ListRow title="SSL/TLS" value={describeSsl(connection.ssl)} /> : null}
        </ListSection>

        <ListSection>
          <ListRow
            title="Edit Connection"
            tint
            onPress={() => router.push(`/connection/new?edit=${connection.id}`)}
          />
          {isConnected ? <ListRow title="Disconnect" tint onPress={handleDisconnect} /> : null}
        </ListSection>

        <ListSection>
          <ListRow title="Delete Connection" destructive onPress={confirmDelete} />
        </ListSection>
      </ScrollView>
    </>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Alert, Pressable, ScrollView } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import AlienLogo from "../assets/logos/alien.svg";
import { DatabaseIcon } from "../components/database-icon";
import { SwipeableRow } from "../components/swipeable-row";
import { AppText, Button, EmptyState, ListRow, ListSection } from "../components/ui";
import { DATABASE_LABELS } from "../lib/database-meta";
import { deleteConnection, getConnections } from "../lib/storage/connections";
import { CONNECTION_COLORS, type ConnectionConfig } from "../lib/types";
import { useConnectionStore } from "../stores/connection";

const describeTarget = (connection: ConnectionConfig) =>
  connection.type === "sqlite"
    ? connection.database
    : connection.port
      ? `${connection.host}:${connection.port}`
      : connection.host;

const ConnectionTile = memo(function ConnectionTile({
  connection,
}: {
  connection: ConnectionConfig;
}) {
  const theme = useTheme();
  const tag = CONNECTION_COLORS.includes(connection.color as (typeof CONNECTION_COLORS)[number])
    ? (connection.color as string)
    : null;

  return (
    <YStack
      width={36}
      height={36}
      borderRadius={9}
      style={{ borderCurve: "continuous" }}
      alignItems="center"
      justifyContent="center"
      backgroundColor={tag ?? "$fill"}
    >
      <DatabaseIcon type={connection.type} size={20} color={tag ? "#ffffff" : theme.color.val} />
    </YStack>
  );
});

type ConnectionRowProps = {
  connection: ConnectionConfig;
  isConnected: boolean;
  onDelete: (connection: ConnectionConfig) => void;
  showSeparator?: boolean;
};

const ConnectionRow = memo(function ConnectionRow({
  connection,
  isConnected,
  onDelete,
  showSeparator,
}: ConnectionRowProps) {
  const theme = useTheme();

  const open = useCallback(() => {
    router.push(isConnected ? `/query/${connection.id}` : `/connection/${connection.id}`);
  }, [connection.id, isConnected]);

  return (
    <SwipeableRow
      rightActions={[
        {
          label: "Edit",
          color: theme.textSubtle.val,
          onPress: () => router.push(`/connection/new?edit=${connection.id}`),
        },
        { label: "Delete", color: theme.danger.val, onPress: () => onDelete(connection) },
      ]}
    >
      <YStack backgroundColor="$surface">
        <ListRow
          icon={<ConnectionTile connection={connection} />}
          title={
            <AppText variant="body" emphasized numberOfLines={1}>
              {connection.name}
            </AppText>
          }
          subtitle={
            <AppText variant="footnote" tone="secondary" numberOfLines={1} ellipsizeMode="middle">
              {DATABASE_LABELS[connection.type]} · {describeTarget(connection)}
            </AppText>
          }
          value={
            isConnected ? (
              <XStack alignItems="center" gap={6}>
                <YStack width={7} height={7} borderRadius={4} backgroundColor="$successLight" />
                <AppText variant="footnote" tone="secondary">
                  Connected
                </AppText>
              </XStack>
            ) : undefined
          }
          accessory="chevron"
          onPress={open}
          showSeparator={showSeparator}
          accessibilityLabel={`${connection.name}, ${DATABASE_LABELS[connection.type]}${isConnected ? ", connected" : ""}`}
        />
      </YStack>
    </SwipeableRow>
  );
});

function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
    >
      <Ionicons name={icon} size={24} color={theme.accent.val} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { activeConnections } = useConnectionStore();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: getConnections,
  });

  const isConnected = useCallback(
    (id: string) => activeConnections.get(id)?.state.status === "connected",
    [activeConnections],
  );

  const [connected, saved] = useMemo(() => {
    const live = connections.filter((c) => isConnected(c.id));
    const rest = connections.filter((c) => !isConnected(c.id));
    return [live, rest];
  }, [connections, isConnected]);

  const handleDelete = useCallback(
    (connection: ConnectionConfig) => {
      Alert.alert(
        `Delete “${connection.name}”?`,
        "The saved connection and its password will be removed from this device.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteConnection(connection.id);
                await queryClient.invalidateQueries({ queryKey: ["connections"] });
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                Alert.alert("Couldn’t Delete Connection", message);
              }
            },
          },
        ],
      );
    },
    [queryClient],
  );

  const addConnection = useCallback(() => router.push("/connection/new"), []);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderButton
              icon="settings-outline"
              label="Settings"
              onPress={() => router.push("/settings")}
            />
          ),
          headerRight: () => (
            <HeaderButton icon="add" label="New connection" onPress={addConnection} />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 28, flexGrow: 1 }}
      >
        {isLoading ? null : connections.length === 0 ? (
          <YStack flex={1} justifyContent="center" paddingBottom="$xxl">
            <EmptyState
              icon={<AlienLogo width={88} height={88} color={theme.accent.val} />}
              title="No Connections"
              message="Add a PostgreSQL, MySQL, MariaDB, CockroachDB, MongoDB or SQLite database to start querying."
              action={<Button onPress={addConnection}>Add Connection</Button>}
            />
          </YStack>
        ) : (
          <>
            {connected.length > 0 ? (
              <ListSection title="Connected">
                {connected.map((c) => (
                  <ConnectionRow key={c.id} connection={c} isConnected onDelete={handleDelete} />
                ))}
              </ListSection>
            ) : null}
            {saved.length > 0 ? (
              <ListSection
                title={connected.length > 0 ? "Saved" : undefined}
                footer="Swipe left on a connection to edit or delete it."
              >
                {saved.map((c) => (
                  <ConnectionRow
                    key={c.id}
                    connection={c}
                    isConnected={false}
                    onDelete={handleDelete}
                  />
                ))}
              </ListSection>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScrollView, Text, useTheme, XStack, YStack } from "tamagui";
import {
  deleteConnection,
  getConnectionWithPassword,
} from "../../lib/storage/connections";
import { useConnectionStore } from "../../stores/connection";
import { DatabaseIcon } from "../../components/database-icon";
import { Button, Dialog } from "../../components/ui";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <XStack
    justifyContent="space-between"
    paddingVertical="$sm"
    borderBottomWidth={1}
    borderBottomColor="$borderColor"
  >
    <Text color="$textSubtle" fontSize={14}>
      {label}
    </Text>
    <Text color="$color" fontSize={14} fontWeight="500">
      {value}
    </Text>
  </XStack>
);

export default function ConnectionDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { connect, activeConnections, disconnect } = useConnectionStore();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["connection", id],
    queryFn: () => getConnectionWithPassword(id!),
    enabled: !!id,
  });

  const activeConnection = id ? activeConnections.get(id) : null;
  const isConnected = activeConnection?.state.status === "connected";

  const handleConnect = async () => {
    if (!connection) return;

    setConnecting(true);
    try {
      await connect(connection);
      router.replace(`/query/${connection.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to connect");
      setShowErrorDialog(true);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!id) return;
    await disconnect(id);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    await disconnect(id);
    await deleteConnection(id);
    await queryClient.invalidateQueries({ queryKey: ["connections"] });
    router.back();
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <ActivityIndicator size="large" color={theme.primary.val} />
      </YStack>
    );
  }

  if (!connection) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <Text color="$danger" fontSize={16} textAlign="center" marginTop="$lg">
          Connection not found
        </Text>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ padding: 16 }}>
        <YStack alignItems="center" paddingVertical="$lg">
          <YStack marginBottom="$md">
            <DatabaseIcon type={connection.type} size={64} color={theme.color.val} />
          </YStack>
          <Text color="$color" fontSize={24} fontWeight="600" marginBottom="$md">
            {connection.name}
          </Text>
          <YStack
            paddingHorizontal="$md"
            paddingVertical="$xs"
            borderRadius="$md"
            backgroundColor={isConnected ? "$successMuted" : "$primaryMuted"}
          >
            <Text color="$color" fontSize={12} fontWeight="500">
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </YStack>
        </YStack>

        <YStack backgroundColor="$surface" borderRadius="$md" padding="$md" marginBottom="$lg">
          <InfoRow label="Type" value={connection.type.toUpperCase()} />
          <InfoRow label="Host" value={connection.host} />
          <InfoRow label="Port" value={connection.port.toString()} />
          <InfoRow label="Database" value={connection.database} />
          <InfoRow label="Username" value={connection.username} />
          <InfoRow label="SSL" value={connection.ssl ? "Enabled" : "Disabled"} />
        </YStack>

        <YStack gap="$md">
          {isConnected ? (
            <>
              <Button variant="primary" onPress={() => router.push(`/query/${connection.id}`)}>
                Open Query Editor
              </Button>
              <Button variant="secondary" onPress={handleDisconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onPress={handleConnect}
              disabled={connecting}
              loading={connecting}
            >
              Connect
            </Button>
          )}

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Button
              variant="secondary"
              onPress={() => router.push(`/connection/new?edit=${connection.id}`)}
            >
              <XStack alignItems="center" gap="$sm">
                <Ionicons name="create-outline" size={18} color={theme.color.val} />
                <Text color="$color" fontWeight="500">
                  Edit Connection
                </Text>
              </XStack>
            </Button>
          </Animated.View>

          <Button
            variant="ghost"
            onPress={() => setShowDeleteDialog(true)}
            marginTop="$md"
          >
            <Text color="$danger" fontWeight="500">
              Delete Connection
            </Text>
          </Button>
        </YStack>
      </ScrollView>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Connection"
        description="Are you sure you want to delete this connection?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />

      <Dialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Connection Failed"
        description={errorMessage}
        confirmText="OK"
        cancelText="Dismiss"
        onConfirm={() => setShowErrorDialog(false)}
      />
    </>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Stack, router } from "expo-router";
import { memo, useCallback, useState } from "react";
import { FlatList, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text, useTheme, XStack, YStack } from "tamagui";
import { DatabaseIcon } from "../components/database-icon";
import { SwipeableRow } from "../components/swipeable-row";
import { Dialog } from "../components/ui/Dialog";
import { deleteConnection, getConnections } from "../lib/storage/connections";
import { CONNECTION_COLORS, type ConnectionConfig } from "../lib/types";
import { useConnectionStore } from "../stores/connection";
import AlienLogo from "../assets/logos/alien.svg";

type ConnectionItemProps = {
	connection: ConnectionConfig;
	onEdit: (connection: ConnectionConfig) => void;
	onDelete: (connection: ConnectionConfig) => void;
};

const ConnectionItem = memo(function ConnectionItem({
	connection,
	onEdit,
	onDelete,
}: ConnectionItemProps) {
	const theme = useTheme();
	const { activeConnections } = useConnectionStore();
	const activeConnection = activeConnections.get(connection.id);
	const isConnected = activeConnection?.state.status === "connected";

	const handlePress = useCallback(() => {
		if (isConnected) {
			router.push(`/query/${connection.id}`);
		} else {
			router.push(`/connection/${connection.id}`);
		}
	}, [connection.id, isConnected]);

	const handleEdit = useCallback(() => onEdit(connection), [onEdit, connection]);
	const handleDelete = useCallback(() => onDelete(connection), [onDelete, connection]);

	const hasColorTag =
		Boolean(connection.color) &&
		CONNECTION_COLORS.includes(connection.color as (typeof CONNECTION_COLORS)[number]);

	return (
		<SwipeableRow
			rightActions={[
				{
					icon: "pencil",
					color: theme.primary.val,
					onPress: handleEdit,
				},
				{
					icon: "trash",
					color: theme.danger.val,
					onPress: handleDelete,
				},
			]}
		>
			<Pressable
				style={({ pressed }) => [
					{
						borderRadius: 14,
						borderWidth: 1,
						borderColor: theme.cardBorder.val,
						backgroundColor: theme.surface.val,
					},
					pressed && { opacity: 0.85 },
				]}
				onPress={handlePress}
			>
				<XStack alignItems="center" padding="$md" gap="$md">
					<YStack
						width={44}
						height={44}
						borderRadius={10}
						justifyContent="center"
						alignItems="center"
						backgroundColor={hasColorTag ? `${connection.color}22` : theme.surfaceAlt.val}
						borderWidth={1}
						borderColor={hasColorTag ? `${connection.color}55` : theme.borderColor.val}
					>
						<DatabaseIcon
							type={connection.type}
							size={22}
							color={hasColorTag ? (connection.color as string) : theme.color.val}
						/>
					</YStack>
					<YStack flex={1} minWidth={0}>
						<Text
							color="$color"
							fontSize={16}
							fontWeight="600"
							letterSpacing={-0.1}
							numberOfLines={1}
						>
							{connection.name}
						</Text>
						<Text
							color="$textSubtle"
							fontSize={12}
							marginTop={2}
							fontFamily="$mono"
							numberOfLines={1}
							ellipsizeMode="middle"
						>
							{connection.host}:{connection.port}/{connection.database}
						</Text>
					</YStack>
					<XStack alignItems="center" gap="$sm">
						<YStack
							width={6}
							height={6}
							borderRadius="$full"
							backgroundColor={isConnected ? "$success" : "$disabled"}
						/>
						<Text color="$textSubtle" fontSize={11} fontWeight="500">
							{isConnected ? "Connected" : "Idle"}
						</Text>
					</XStack>
				</XStack>
			</Pressable>
		</SwipeableRow>
	);
});

export default function HomeScreen() {
	const theme = useTheme();
	const queryClient = useQueryClient();
	const [connectionToDelete, setConnectionToDelete] =
		useState<ConnectionConfig | null>(null);

	const { data: connections = [] } = useQuery({
		queryKey: ["connections"],
		queryFn: getConnections,
	});

	const handleEdit = useCallback((connection: ConnectionConfig) => {
		router.push(`/connection/new?edit=${connection.id}`);
	}, []);

	const handleDeleteRequest = useCallback((connection: ConnectionConfig) => {
		setConnectionToDelete(connection);
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
		if (!connectionToDelete) return;

		try {
			await deleteConnection(connectionToDelete.id);
			await queryClient.invalidateQueries({ queryKey: ["connections"] });
		} catch (error) {
			console.error("Failed to delete connection:", error);
		} finally {
			setConnectionToDelete(null);
		}
	}, [connectionToDelete, queryClient]);

	return (
		<YStack flex={1} backgroundColor="$background">
			<Stack.Screen
				options={{
					headerTransparent: true,
					headerStyle: {
						backgroundColor: "transparent",
					},
					headerRight: () => (
						<Pressable
							onPress={() => router.push("/settings")}
							style={({ pressed }) => [
								{ padding: 6 },
								pressed && { opacity: 0.6 },
							]}
						>
							<Ionicons
								name="settings-outline"
								size={22}
								color={theme.color.val}
							/>
						</Pressable>
					),
				}}
			/>

			{connections.length === 0 ? (
				<YStack
					flex={1}
					justifyContent="center"
					alignItems="center"
					padding="$xl"
					paddingTop={100}
				>
					<YStack
						width={96}
						height={96}
						borderRadius={48}
						justifyContent="center"
						alignItems="center"
						marginBottom="$lg"
						backgroundColor="$surfaceAlt"
						borderWidth={1}
						borderColor="$borderColor"
					>
						<AlienLogo width={56} height={56} />
					</YStack>
					<Text
						color="$color"
						fontSize={22}
						fontWeight="600"
						marginBottom="$xs"
						letterSpacing={-0.3}
					>
						No connections yet
					</Text>
					<Text
						color="$textSubtle"
						fontSize={14}
						textAlign="center"
						marginBottom="$xl"
						lineHeight={20}
						maxWidth={300}
					>
						Add a database to start querying. Paste a connection URL or fill the fields manually.
					</Text>
					<Link href="/connection/new" asChild>
						<Pressable
							style={({ pressed }) => [
								{
									borderRadius: 12,
									backgroundColor: theme.primary.val,
									paddingHorizontal: 24,
									paddingVertical: 12,
								},
								pressed && { opacity: 0.9 },
							]}
						>
							<Text
								color="$textOnPrimary"
								fontSize={15}
								fontWeight="600"
							>
								Add connection
							</Text>
						</Pressable>
					</Link>
				</YStack>
			) : (
				<>
					<Animated.View
						entering={FadeIn.duration(120)}
						style={{
							paddingHorizontal: 20,
							paddingTop: 110,
							paddingBottom: 12,
						}}
					>
						<Text
							color="$color"
							fontSize={26}
							fontWeight="600"
							letterSpacing={-0.4}
						>
							Connections
						</Text>
						<Text
							color="$textSubtle"
							fontSize={13}
							marginTop={2}
						>
							{connections.length} {connections.length === 1 ? "database" : "databases"}
						</Text>
					</Animated.View>
					<FlatList
						data={connections}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<ConnectionItem
								connection={item}
								onEdit={handleEdit}
								onDelete={handleDeleteRequest}
							/>
						)}
						contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
						showsVerticalScrollIndicator={false}
					/>
					<Link href="/connection/new" asChild>
						<Pressable
							style={({ pressed }) => [
								{
									position: "absolute",
									bottom: 28,
									right: 20,
									width: 52,
									height: 52,
									borderRadius: 26,
									backgroundColor: theme.primary.val,
									justifyContent: "center",
									alignItems: "center",
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.25,
									shadowRadius: 8,
									elevation: 6,
								},
								pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
							]}
						>
							<Ionicons name="add" size={26} color={theme.textOnPrimary.val} />
						</Pressable>
					</Link>
				</>
			)}

			<Dialog
				open={connectionToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setConnectionToDelete(null);
				}}
				title="Delete connection"
				description={`Delete "${connectionToDelete?.name}"? This cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				variant="danger"
				onConfirm={handleDeleteConfirm}
			/>
		</YStack>
	);
}

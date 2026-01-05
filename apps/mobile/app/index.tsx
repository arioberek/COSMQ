import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack, router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import Animated, {
	FadeIn,
	FadeInDown,
	FadeInUp,
	ZoomIn,
} from "react-native-reanimated";
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
	index: number;
	onEdit: (connection: ConnectionConfig) => void;
	onDelete: (connection: ConnectionConfig) => void;
};

const ConnectionItem = ({
	connection,
	index,
	onEdit,
	onDelete,
}: ConnectionItemProps) => {
	const theme = useTheme();
	const { activeConnections } = useConnectionStore();
	const activeConnection = activeConnections.get(connection.id);
	const isConnected = activeConnection?.state.status === "connected";

	const handlePress = async () => {
		if (isConnected) {
			router.push(`/query/${connection.id}`);
		} else {
			router.push(`/connection/${connection.id}`);
		}
	};

	const cardGradient = [theme.card.val, theme.surfaceAlt.val] as const;
	const successGradient = [theme.success.val, theme.successLight.val] as const;
	const surfaceGradient = [theme.surface.val, theme.surfaceAlt.val] as const;

	return (
		<Animated.View entering={FadeInDown.delay(index * 80).springify()}>
			<SwipeableRow
				rightActions={[
					{
						icon: "pencil",
						color: theme.primary.val,
						//label: "Edit",
						onPress: () => onEdit(connection),
					},
					{
						icon: "trash",
						color: theme.danger.val,
					//	label: "Delete",
						onPress: () => onDelete(connection),
					},
				]}
			>
				<Pressable
					style={({ pressed }) => [
						{
							borderRadius: 16,
							overflow: "hidden",
							borderWidth: 1,
							borderColor: theme.cardBorder.val,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.15,
							shadowRadius: 12,
							elevation: 8,
						},
						pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
					]}
					onPress={handlePress}
				>
					<LinearGradient
						colors={cardGradient}
						style={StyleSheet.absoluteFill}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					/>
					{connection.color && CONNECTION_COLORS.includes(connection.color) && (
						<LinearGradient
							colors={[connection.color, `${connection.color}00`]}
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								bottom: 0,
								width: 4,
							}}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0.5 }}
						/>
					)}
					<XStack alignItems="center" padding="$md" gap="$md">
						<YStack
							width={52}
							height={52}
							borderRadius="$md"
							justifyContent="center"
							alignItems="center"
							overflow="hidden"
						>
							<LinearGradient
								colors={isConnected ? successGradient : surfaceGradient}
								style={{ ...StyleSheet.absoluteFillObject, opacity: 0.8 }}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							/>
							<DatabaseIcon
								type={connection.type}
								size={28}
								color={theme.color.val}
							/>
						</YStack>
						<YStack flex={1}>
							<Text
								color="$color"
								fontSize={17}
								fontWeight="600"
								letterSpacing={-0.2}
							>
								{connection.name}
							</Text>
							<Text
								color="$textSubtle"
								fontSize={13}
								marginTop="$xs"
								fontFamily="$mono"
							>
								{connection.host}:{connection.port}/{connection.database}
							</Text>
						</YStack>
						<YStack
							position="relative"
							width={14}
							height={14}
							justifyContent="center"
							alignItems="center"
						>
							<YStack
								width={10}
								height={10}
								borderRadius="$full"
								backgroundColor={isConnected ? "$success" : "$disabled"}
							/>
							{isConnected && (
								<YStack
									position="absolute"
									width={20}
									height={20}
									borderRadius="$full"
									backgroundColor="$success"
									opacity={0.3}
								/>
							)}
						</YStack>
					</XStack>
				</Pressable>
			</SwipeableRow>
		</Animated.View>
	);
};

export default function HomeScreen() {
	const theme = useTheme();
	const queryClient = useQueryClient();
	const [connectionToDelete, setConnectionToDelete] =
		useState<ConnectionConfig | null>(null);

	const { data: connections = [] } = useQuery({
		queryKey: ["connections"],
		queryFn: getConnections,
	});

	const handleEdit = (connection: ConnectionConfig) => {
		router.push(`/connection/new?edit=${connection.id}`);
	};

	const handleDeleteRequest = (connection: ConnectionConfig) => {
		setConnectionToDelete(connection);
	};

	const handleDeleteConfirm = async () => {
		if (!connectionToDelete) return;

		try {
			await deleteConnection(connectionToDelete.id);
			await queryClient.invalidateQueries({ queryKey: ["connections"] });
		} catch (error) {
			console.error("Failed to delete connection:", error);
			// Optionally show error dialog to user
		} finally {
			setConnectionToDelete(null);
		}
	};

	const primaryGradient = [
		theme.gradientPrimaryStart.val,
		theme.gradientPrimaryEnd.val,
	] as const;

	return (
		<YStack flex={1} backgroundColor="$background">
			<Stack.Screen
				options={{
					headerTransparent: true,
					headerBlurEffect: "dark",
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
								size={24}
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
					<Animated.View
						entering={FadeInUp.delay(100).springify()}
						style={{
							width: 120,
							height: 120,
							borderRadius: 60,
							justifyContent: "center",
							alignItems: "center",
							marginBottom: 24,
							overflow: "hidden",
							backgroundColor: theme.surfaceAlt.val,
						}}
					>
						<AlienLogo width={70} height={70} />
					</Animated.View>
					<Animated.Text
						entering={FadeInUp.delay(200).springify()}
						style={{
							color: theme.color.val,
							fontSize: 24,
							fontWeight: "700",
							marginBottom: 8,
							letterSpacing: -0.5,
						}}
					>
						No Connections
					</Animated.Text>
					<Animated.Text
						entering={FadeInUp.delay(300).springify()}
						style={{
							color: theme.textSubtle.val,
							fontSize: 16,
							textAlign: "center",
							marginBottom: 32,
							lineHeight: 24,
							maxWidth: 280,
						}}
					>
						Add a database connection to start exploring your data
					</Animated.Text>
					<Animated.View entering={FadeInUp.delay(400).springify()}>
						<Link href="/connection/new" asChild>
							<Pressable
								style={{
									borderRadius: 16,
									overflow: "hidden",
									shadowColor: theme.primary.val,
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.4,
									shadowRadius: 12,
									elevation: 8,
								}}
							>
								<LinearGradient
									colors={primaryGradient}
									style={StyleSheet.absoluteFill}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								/>
								<Text
									color="#fff"
									fontSize={17}
									fontWeight="600"
									paddingHorizontal="$xl"
									paddingVertical="$md"
								>
									+ Add Connection
								</Text>
							</Pressable>
						</Link>
					</Animated.View>
				</YStack>
			) : (
				<>
					<Animated.View
						entering={FadeIn.delay(100)}
						style={{
							paddingHorizontal: 24,
							paddingTop: 120,
							paddingBottom: 16,
						}}
					>
						<Animated.Text
							entering={FadeInDown.delay(150).springify()}
							style={{
								color: theme.color.val,
								fontSize: 28,
								fontWeight: "700",
								letterSpacing: -0.5,
							}}
						>
							Your Databases
						</Animated.Text>
						<Animated.Text
							entering={FadeInDown.delay(250).springify()}
							style={{
								color: theme.textSubtle.val,
								fontSize: 14,
								marginTop: 4,
							}}
						>
							{connections.length} connection
							{connections.length !== 1 ? "s" : ""}
						</Animated.Text>
					</Animated.View>
					<FlatList
						data={connections}
						keyExtractor={(item) => item.id}
						renderItem={({ item, index }) => (
							<ConnectionItem
								connection={item}
								index={index}
								onEdit={handleEdit}
								onDelete={handleDeleteRequest}
							/>
						)}
						contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
						showsVerticalScrollIndicator={false}
					/>
					<Animated.View
						entering={ZoomIn.delay(400).springify().damping(12)}
						style={{
							position: "absolute",
							bottom: 32,
							right: 24,
						}}
					>
						<Link href="/connection/new" asChild>
							<Pressable
								style={({ pressed }) => [
									{
										width: 60,
										height: 60,
										borderRadius: 30,
										justifyContent: "center",
										alignItems: "center",
										overflow: "hidden",
										shadowColor: theme.primary.val,
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.4,
										shadowRadius: 12,
										elevation: 8,
									},
									pressed && { transform: [{ scale: 0.9 }], opacity: 0.9 },
								]}
							>
							<LinearGradient
								colors={primaryGradient}
								style={StyleSheet.absoluteFill}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							/>
							<Ionicons name="add" size={32} color="#fff" />
							</Pressable>
						</Link>
					</Animated.View>
				</>
			)}

			<Dialog
				open={connectionToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setConnectionToDelete(null);
				}}
				title="Delete Connection"
				description={`Are you sure you want to delete "${connectionToDelete?.name}"? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				variant="danger"
				onConfirm={handleDeleteConfirm}
			/>
		</YStack>
	);
}

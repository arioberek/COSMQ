import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ConnectionConfig } from "../types";

const CONNECTIONS_KEY = "cosmq_connections";
const PASSWORD_PREFIX = "cosmq_pwd_";

/**
 * Storage architecture (iOS SecureStore has 2KB limit per key):
 * - Connection metadata → AsyncStorage (unlimited)
 * - Passwords → SecureStore (encrypted, one key per password)
 */

export async function saveConnection(
  connection: ConnectionConfig
): Promise<void> {
  const connections = await getConnections();
  const existingIndex = connections.findIndex((c) => c.id === connection.id);

  await SecureStore.setItemAsync(
    `${PASSWORD_PREFIX}${connection.id}`,
    connection.password
  );

  const configWithoutPassword = { ...connection, password: "" };

  if (existingIndex >= 0) {
    connections[existingIndex] = configWithoutPassword;
  } else {
    connections.push(configWithoutPassword);
  }

  await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

export async function getConnections(): Promise<ConnectionConfig[]> {
  const data = await AsyncStorage.getItem(CONNECTIONS_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data) as ConnectionConfig[];
  } catch {
    return [];
  }
}

export async function getConnectionWithPassword(
  id: string
): Promise<ConnectionConfig | null> {
  const connections = await getConnections();
  const connection = connections.find((c) => c.id === id);

  if (!connection) return null;

  const password = await SecureStore.getItemAsync(`${PASSWORD_PREFIX}${id}`);
  return { ...connection, password: password || "" };
}

export async function deleteConnection(id: string): Promise<void> {
  const connections = await getConnections();
  const filtered = connections.filter((c) => c.id !== id);

  await SecureStore.deleteItemAsync(`${PASSWORD_PREFIX}${id}`);
  await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(filtered));
}

export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Migrates connections from SecureStore to AsyncStorage (one-time on app startup).
 * Required for users upgrading from versions that stored metadata in SecureStore.
 */
export async function migrateFromSecureStore(): Promise<void> {
  try {
    const oldData = await SecureStore.getItemAsync(CONNECTIONS_KEY);
    if (!oldData) return;

    const newData = await AsyncStorage.getItem(CONNECTIONS_KEY);
    if (newData) {
      await SecureStore.deleteItemAsync(CONNECTIONS_KEY);
      return;
    }

    await AsyncStorage.setItem(CONNECTIONS_KEY, oldData);
    await SecureStore.deleteItemAsync(CONNECTIONS_KEY);
  } catch {
    // Migration failure shouldn't break the app - users can re-add connections
  }
}

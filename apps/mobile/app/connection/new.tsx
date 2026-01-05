import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { SvgProps } from "react-native-svg";
import {
  ScrollView,
  Switch,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import {
  generateConnectionId,
  getConnectionWithPassword,
  saveConnection,
} from "../../lib/storage/connections";
import type { ConnectionConfig, ConnectionColor, DatabaseType } from "../../lib/types";
import { CONNECTION_COLORS } from "../../lib/types";
import { useConnectionStore } from "../../stores/connection";
import PostgresqlIcon from "../../assets/icons/postgresql.svg";
import MysqlIcon from "../../assets/icons/mysql.svg";
import MariadbIcon from "../../assets/icons/mariadb.svg";
import SqliteIcon from "../../assets/icons/sqlite.svg";
import CockroachdbIcon from "../../assets/icons/cockroachdb.svg";
import MongodbIcon from "../../assets/icons/mongodb.svg";
import { Button, Dialog } from "../../components/ui";

const DEFAULT_PORTS: Record<DatabaseType, number> = {
  postgres: 5432,
  mysql: 3306,
  mariadb: 3306,
  sqlite: 0,
  cockroachdb: 26257,
  mongodb: 27017,
};

const DATABASE_OPTIONS: Array<{
  type: DatabaseType;
  label: string;
  Icon: FC<SvgProps>;
}> = [
  { type: "postgres", label: "PostgreSQL", Icon: PostgresqlIcon },
  { type: "mysql", label: "MySQL", Icon: MysqlIcon },
  { type: "mariadb", label: "MariaDB", Icon: MariadbIcon },
  { type: "sqlite", label: "SQLite", Icon: SqliteIcon },
  { type: "cockroachdb", label: "CockroachDB", Icon: CockroachdbIcon },
  { type: "mongodb", label: "MongoDB", Icon: MongodbIcon },
];

type ParsedConnectionUrl = {
  type?: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
};

const URL_PROTOCOL_TO_TYPE: Record<string, DatabaseType> = {
  postgres: "postgres",
  postgresql: "postgres",
  mysql: "mysql",
  mariadb: "mariadb",
  sqlite: "sqlite",
  file: "sqlite",
  cockroachdb: "cockroachdb",
  crdb: "cockroachdb",
  mongodb: "mongodb",
  "mongodb+srv": "mongodb",
};

const parseSslValue = (value: string | null): boolean | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (["disable", "false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  return true;
};

const parseConnectionUrl = (
  rawValue: string,
  fallbackType: DatabaseType
): ParsedConnectionUrl | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let url: URL | null = null;
  try {
    url = new URL(trimmed);
  } catch {
    if (!trimmed.includes("://")) {
      try {
        url = new URL(`${fallbackType}://${trimmed}`);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

  if (!url) return null;

  const protocol = url.protocol.replace(":", "").toLowerCase();
  const type = URL_PROTOCOL_TO_TYPE[protocol];
  if (!type) return null;

  const host = url.hostname || undefined;
  const port = url.port ? Number(url.port) : undefined;
  const database = url.pathname
    ? url.pathname.replace(/^\/+/, "") || undefined
    : undefined;
  const username = url.username || undefined;
  const password = url.password || undefined;
  const ssl =
    parseSslValue(url.searchParams.get("sslmode")) ??
    parseSslValue(url.searchParams.get("ssl"));

  return {
    type,
    host,
    port,
    database,
    username,
    password,
    ssl,
  };
};

const isSqlite = (dbType: DatabaseType) => dbType === "sqlite";

const SQLITE_MAGIC_HEADER = "SQLite format 3";

const validateSqliteFile = async (uri: string): Promise<boolean> => {
  try {
    const base64Header = await LegacyFileSystem.readAsStringAsync(uri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
      length: 16,
      position: 0,
    });
    const header = atob(base64Header);
    return header.startsWith(SQLITE_MAGIC_HEADER);
  } catch {
    return false;
  }
};

type AlertState = {
  open: boolean;
  title: string;
  message: string;
};

type FormInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  keyboardType?: "default" | "number-pad" | "email-address";
  secureTextEntry?: boolean;
};

const FormInput = ({
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  secureTextEntry,
}: FormInputProps) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholderColor.val}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        backgroundColor: theme.card.val,
        borderWidth: 1,
        borderColor: isFocused ? theme.primary.val : theme.cardBorder.val,
        borderRadius: 12,
        padding: 16,
        color: theme.color.val,
        fontSize: 16,
      }}
    />
  );
};

export default function NewConnectionScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { edit: editId } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = Boolean(editId);
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ open: false, title: "", message: "" });

  const { connect, disconnect } = useConnectionStore();

  const [connectionUrl, setConnectionUrl] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<DatabaseType>("postgres");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(DEFAULT_PORTS.postgres.toString());
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(false);
  const [color, setColor] = useState<ConnectionColor | undefined>(undefined);
  const [existingConnection, setExistingConnection] = useState<ConnectionConfig | null>(null);

  const { data: connectionToEdit } = useQuery({
    queryKey: ["connection", editId],
    queryFn: () => getConnectionWithPassword(editId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (connectionToEdit) {
      setExistingConnection(connectionToEdit);
      setName(connectionToEdit.name);
      setType(connectionToEdit.type);
      setHost(connectionToEdit.host);
      setPort(connectionToEdit.port.toString());
      setDatabase(connectionToEdit.database);
      setUsername(connectionToEdit.username);
      setPassword(connectionToEdit.password);
      setSsl(typeof connectionToEdit.ssl === "boolean" ? connectionToEdit.ssl : false);
      setColor(connectionToEdit.color);
    }
  }, [connectionToEdit]);

  const showAlert = (title: string, message: string) => {
    setAlert({ open: true, title, message });
  };

  const pickDatabaseFile = async (): Promise<string | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/x-sqlite3", "application/vnd.sqlite3", "application/octet-stream"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) {
        return null;
      }

      const uri = result.assets[0].uri;
      const isValid = await validateSqliteFile(uri);

      if (!isValid) {
        showAlert(
          "Invalid File",
          "The selected file is not a valid SQLite database. Please select a .db, .sqlite, or .sqlite3 file."
        );
        return null;
      }

      return uri;
    } catch {
      return null;
    }
  };

  const handleTypeChange = (newType: DatabaseType) => {
    setType(newType);
    const newPort = DEFAULT_PORTS[newType];
    setPort(newPort > 0 ? newPort.toString() : "");
  };

  const handleUrlChange = (value: string) => {
    setConnectionUrl(value);
    const parsed = parseConnectionUrl(value, type);
    if (!parsed) return;

    if (parsed.type && parsed.type !== type) {
      setType(parsed.type);
      if (parsed.port !== undefined) {
        setPort(parsed.port.toString());
      } else {
        const newPort = DEFAULT_PORTS[parsed.type];
        setPort(newPort > 0 ? newPort.toString() : "");
      }
    } else if (parsed.port !== undefined) {
      setPort(parsed.port.toString());
    }

    if (parsed.host) setHost(parsed.host);
    if (parsed.database) setDatabase(parsed.database);
    if (parsed.username) setUsername(parsed.username);
    if (parsed.password) setPassword(parsed.password);
    if (parsed.ssl !== undefined) setSsl(parsed.ssl);
  };

  const handleTestConnection = async () => {
    if (!isSqlite(type)) {
      if (!host.trim()) {
        showAlert("Error", "Host is required");
        return;
      }
      if (!username.trim()) {
        showAlert("Error", "Username is required");
        return;
      }
    }

    if (!database.trim()) {
      showAlert(
        "Error",
        isSqlite(type)
          ? "Database file path is required"
          : "Database name is required"
      );
      return;
    }

    setTesting(true);
    const testId = `test_${Date.now()}`;

    try {
      const testConfig: ConnectionConfig = {
        id: testId,
        name: name.trim() || "Test Connection",
        type,
        host: isSqlite(type) ? "" : host.trim(),
        port: isSqlite(type) ? 0 : parseInt(port, 10) || DEFAULT_PORTS[type],
        database: database.trim(),
        username: isSqlite(type) ? "" : username.trim(),
        password: isSqlite(type) ? "" : password,
        ssl: isSqlite(type) ? false : ssl,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await connect(testConfig);
      showAlert("Success", "Connection successful!");
    } catch (error) {
      showAlert(
        "Connection Failed",
        error instanceof Error ? error.message : "Failed to connect"
      );
    } finally {
      try {
        await disconnect(testId);
      } catch {
      }
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert("Error", "Connection name is required");
      return;
    }

    if (!isSqlite(type)) {
      if (!host.trim()) {
        showAlert("Error", "Host is required");
        return;
      }
      if (!username.trim()) {
        showAlert("Error", "Username is required");
        return;
      }
    }

    if (!database.trim()) {
      showAlert(
        "Error",
        isSqlite(type)
          ? "Database file path is required"
          : "Database name is required"
      );
      return;
    }

    setSaving(true);

    try {
      const connection: ConnectionConfig = {
        id: existingConnection?.id ?? generateConnectionId(),
        name: name.trim(),
        type,
        host: isSqlite(type) ? "" : host.trim(),
        port: isSqlite(type) ? 0 : parseInt(port, 10) || DEFAULT_PORTS[type],
        database: database.trim(),
        username: isSqlite(type) ? "" : username.trim(),
        password: isSqlite(type) ? "" : password,
        ssl: isSqlite(type) ? false : ssl,
        color,
        createdAt: existingConnection?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      await saveConnection(connection);
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
      if (isEditMode) {
        await queryClient.invalidateQueries({ queryKey: ["connection", editId] });
      }

      router.back();
    } catch (error) {
      showAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to save connection"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View flex={1} backgroundColor="$background">
      <Dialog
        open={alert.open}
        onOpenChange={(open) => setAlert((prev) => ({ ...prev, open }))}
        title={alert.title}
        description={alert.message}
        primaryAction={{
          label: "OK",
          onPress: () => setAlert((prev) => ({ ...prev, open: false })),
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          flex={1}
          contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <YStack gap="$sm">
              <Text
                color="$textMuted"
                fontSize={13}
                fontWeight="600"
                textTransform="uppercase"
                marginLeft={4}
              >
                Connection Name
              </Text>
              <FormInput
                value={name}
                onChangeText={setName}
                placeholder="My Database"
              />
            </YStack>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <YStack gap="$sm">
              <Text
                color="$textMuted"
                fontSize={13}
                fontWeight="600"
                textTransform="uppercase"
                marginLeft={4}
              >
                Color Tag (Optional)
              </Text>
              <XStack flexWrap="wrap" gap="$md" padding="$sm">
                <Pressable
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: !color ? theme.color.val : theme.cardBorder.val,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.card.val,
                    transform: !color ? [{ scale: 1.1 }] : [{ scale: 1 }],
                  }}
                  onPress={() => setColor(undefined)}
                >
                  <Text color={!color ? "$color" : "$textMuted"} fontSize={10} fontWeight="600">
                    None
                  </Text>
                </Pressable>
                {CONNECTION_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor: color === c ? theme.color.val : theme.cardBorder.val,
                      backgroundColor: c,
                      transform: color === c ? [{ scale: 1.1 }] : [{ scale: 1 }],
                    }}
                    onPress={() => setColor(c)}
                  />
                ))}
              </XStack>
            </YStack>
          </Animated.View>

          {!isSqlite(type) && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <YStack gap="$sm">
                <Text
                  color="$textMuted"
                  fontSize={13}
                  fontWeight="600"
                  textTransform="uppercase"
                  marginLeft={4}
                >
                  Connection URL
                </Text>
                <FormInput
                  value={connectionUrl}
                  onChangeText={handleUrlChange}
                  placeholder="postgres://user:pass@host:5432/db?sslmode=require"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </YStack>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <YStack gap="$sm">
              <Text
                color="$textMuted"
                fontSize={13}
                fontWeight="600"
                textTransform="uppercase"
                marginLeft={4}
              >
                Database Type
              </Text>
              <XStack flexWrap="wrap" gap="$sm">
                {DATABASE_OPTIONS.map((option) => {
                  const isActive = type === option.type;
                  return (
                    <Pressable
                      key={option.type}
                      style={{
                        width: "31%",
                        borderRadius: 12,
                        padding: 16,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: isActive ? "transparent" : theme.cardBorder.val,
                        backgroundColor: isActive ? "transparent" : theme.card.val,
                        overflow: "hidden",
                      }}
                      onPress={() => handleTypeChange(option.type)}
                    >
                      {isActive && (
                        <LinearGradient
                          colors={[theme.gradientPrimaryStart.val, theme.gradientPrimaryEnd.val]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      )}
                      <View marginBottom="$xs" zIndex={1}>
                        <option.Icon width={24} height={24} fill={isActive ? "#fff" : theme.color.val} />
                      </View>
                      <Text
                        color={isActive ? "#fff" : "$textSubtle"}
                        fontSize={11}
                        fontWeight={isActive ? "600" : "500"}
                        textAlign="center"
                        zIndex={1}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </XStack>
            </YStack>
          </Animated.View>

          {!isSqlite(type) && (
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <XStack gap="$md">
                <YStack gap="$sm" flex={2}>
                  <Text
                    color="$textMuted"
                    fontSize={13}
                    fontWeight="600"
                    textTransform="uppercase"
                    marginLeft={4}
                  >
                    Host
                  </Text>
                  <FormInput
                    value={host}
                    onChangeText={setHost}
                    placeholder="localhost"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </YStack>

                <YStack gap="$sm" flex={1}>
                  <Text
                    color="$textMuted"
                    fontSize={13}
                    fontWeight="600"
                    textTransform="uppercase"
                    marginLeft={4}
                  >
                    Port
                  </Text>
                  <FormInput
                    value={port}
                    onChangeText={setPort}
                    placeholder={DEFAULT_PORTS[type].toString()}
                    keyboardType="number-pad"
                  />
                </YStack>
              </XStack>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <YStack gap="$sm">
              <Text
                color="$textMuted"
                fontSize={13}
                fontWeight="600"
                textTransform="uppercase"
                marginLeft={4}
              >
                {isSqlite(type) ? "Database File" : "Database"}
              </Text>
              <XStack gap="$sm">
                <View flex={1}>
                  <FormInput
                    value={database}
                    onChangeText={setDatabase}
                    placeholder={isSqlite(type) ? "local.db" : "mydb"}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {isSqlite(type) && (
                  <Pressable
                    style={{
                      backgroundColor: theme.surfaceAlt.val,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: theme.cardBorder.val,
                    }}
                    onPress={async () => {
                      const uri = await pickDatabaseFile();
                      if (uri) setDatabase(uri);
                    }}
                  >
                    <Text color="$color" fontSize={14} fontWeight="500">
                      Browse
                    </Text>
                  </Pressable>
                )}
              </XStack>
            </YStack>
          </Animated.View>

          {!isSqlite(type) && (
            <>
              <Animated.View entering={FadeInDown.delay(700).springify()}>
                <XStack gap="$md">
                  <YStack gap="$sm" flex={1}>
                    <Text
                      color="$textMuted"
                      fontSize={13}
                      fontWeight="600"
                      textTransform="uppercase"
                      marginLeft={4}
                    >
                      Username
                    </Text>
                    <FormInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder={type === "mongodb" ? "admin" : "postgres"}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </YStack>

                  <YStack gap="$sm" flex={1}>
                    <Text
                      color="$textMuted"
                      fontSize={13}
                      fontWeight="600"
                      textTransform="uppercase"
                      marginLeft={4}
                    >
                      Password
                    </Text>
                    <FormInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      secureTextEntry
                    />
                  </YStack>
                </XStack>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).springify()}>
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  backgroundColor="$card"
                  padding="$md"
                  borderRadius="$md"
                  borderWidth={1}
                  borderColor="$cardBorder"
                >
                  <Text
                    color="$textMuted"
                    fontSize={13}
                    fontWeight="600"
                    textTransform="uppercase"
                  >
                    Use SSL/TLS
                  </Text>
                  <Switch
                    checked={ssl}
                    onCheckedChange={setSsl}
                    backgroundColor={ssl ? "$primary" : "$surfaceAlt"}
                  >
                    <Switch.Thumb
                      animation="quick"
                      backgroundColor="white"
                    />
                  </Switch>
                </XStack>
              </Animated.View>
            </>
          )}

          <Animated.View entering={FadeInDown.delay(900).springify()}>
            <YStack gap="$md" marginTop="$sm">
              <Button
                variant="outlined"
                onPress={handleTestConnection}
                disabled={testing || saving}
              >
                {testing ? "Testing..." : "Test Connection"}
              </Button>

              <Button
                variant="primary"
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : isEditMode ? "Update Connection" : "Save Connection"}
              </Button>
            </YStack>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

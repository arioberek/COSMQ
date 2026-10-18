import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, type TextInput } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import { ColorTagPicker } from "../../components/connection/color-tag-picker";
import { DatabaseTypePicker } from "../../components/connection/database-type-picker";
import {
  FormControlRow,
  FormField,
  HeaderTextButton,
} from "../../components/connection/form-field";
import { AppText, Button, ListRow, ListSection, Switch } from "../../components/ui";
import { DATABASE_LABELS } from "../../lib/database-meta";
import { useHaptic } from "../../lib/haptics";
import { safeBack } from "../../lib/navigation";
import {
  generateConnectionId,
  getConnectionWithPassword,
  saveConnection,
} from "../../lib/storage/connections";
import type { ConnectionColor, ConnectionConfig, DatabaseType } from "../../lib/types";
import { useConnectionStore } from "../../stores/connection";

const DEFAULT_PORTS: Record<DatabaseType, number> = {
  postgres: 5432,
  mysql: 3306,
  mariadb: 3306,
  sqlite: 0,
  cockroachdb: 26257,
  mongodb: 27017,
};

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
  fallbackType: DatabaseType,
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
  const database = url.pathname ? url.pathname.replace(/^\/+/, "") || undefined : undefined;
  const username = url.username || undefined;
  const password = url.password || undefined;
  const ssl =
    parseSslValue(url.searchParams.get("sslmode")) ?? parseSslValue(url.searchParams.get("ssl"));

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

type FormIssue = { title: string; message: string };

type TestResult = { ok: true } | { ok: false; message: string };

export default function NewConnectionScreen() {
  const theme = useTheme();
  const haptic = useHaptic();
  const queryClient = useQueryClient();
  const { edit: editId } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = Boolean(editId);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ signature: string; result: TestResult } | null>(
    null,
  );

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
  const [verifyCertificate, setVerifyCertificate] = useState(true);
  const [color, setColor] = useState<ConnectionColor | undefined>(undefined);
  const [existingConnection, setExistingConnection] = useState<ConnectionConfig | null>(null);

  const hostRef = useRef<TextInput>(null);
  const portRef = useRef<TextInput>(null);
  const databaseRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const { data: connectionToEdit, isLoading: loadingEdit } = useQuery({
    queryKey: ["connection", editId],
    queryFn: () => getConnectionWithPassword(editId ?? ""),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (connectionToEdit) {
      setExistingConnection(connectionToEdit);
      setName(connectionToEdit.name);
      setType(connectionToEdit.type);
      setHost(connectionToEdit.host);
      setPort(connectionToEdit.port ? connectionToEdit.port.toString() : "");
      setDatabase(connectionToEdit.database);
      setUsername(connectionToEdit.username);
      setPassword(connectionToEdit.password);
      if (typeof connectionToEdit.ssl === "object") {
        setSsl(connectionToEdit.ssl.enabled);
        setVerifyCertificate(connectionToEdit.ssl.rejectUnauthorized !== false);
      } else {
        setSsl(connectionToEdit.ssl);
        setVerifyCertificate(true);
      }
      setColor(connectionToEdit.color);
    }
  }, [connectionToEdit]);

  const sqlite = isSqlite(type);

  // Plain `true` keeps the stored shape unchanged for the common case; an SslConfig is
  // only written when verification is off or the connection already carried certificates.
  const buildSsl = (): ConnectionConfig["ssl"] => {
    if (sqlite || !ssl) return false;
    const existing = typeof existingConnection?.ssl === "object" ? existingConnection.ssl : null;
    if (verifyCertificate && !existing) return true;
    return { ...existing, enabled: true, rejectUnauthorized: verifyCertificate };
  };

  const buildConfig = (id: string, fallbackName: string): ConnectionConfig => ({
    id,
    name: name.trim() || fallbackName,
    type,
    host: sqlite ? "" : host.trim(),
    port: sqlite ? 0 : parseInt(port, 10) || DEFAULT_PORTS[type],
    database: database.trim(),
    username: sqlite ? "" : username.trim(),
    password: sqlite ? "" : password,
    ssl: buildSsl(),
    color,
    createdAt: existingConnection?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });

  const findIssue = (requireName: boolean): FormIssue | null => {
    if (requireName && !name.trim()) {
      return {
        title: "Name Required",
        message: "Give the connection a name so you can find it later.",
      };
    }
    if (!sqlite) {
      if (!host.trim()) {
        return { title: "Host Required", message: "Enter the server’s host name or IP address." };
      }
      if (!username.trim()) {
        return { title: "User Required", message: "Enter the user name to sign in with." };
      }
    }
    if (!database.trim()) {
      return sqlite
        ? { title: "Database File Required", message: "Choose a SQLite file or enter its path." }
        : { title: "Database Required", message: "Enter the name of the database to open." };
    }
    return null;
  };

  const canSave = findIssue(true) === null;
  const signature = JSON.stringify([
    type,
    host,
    port,
    database,
    username,
    password,
    ssl,
    verifyCertificate,
  ]);
  const visibleTestResult = testResult?.signature === signature ? testResult.result : null;

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
        Alert.alert(
          "Not a SQLite Database",
          "Choose a .db, .sqlite or .sqlite3 file created by SQLite.",
        );
        return null;
      }

      return uri;
    } catch {
      return null;
    }
  };

  const handleChooseFile = async () => {
    const uri = await pickDatabaseFile();
    if (uri) setDatabase(uri);
  };

  const handleTypeChange = (newType: DatabaseType) => {
    if (newType === type) return;
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

  const handlePasteUrl = async () => {
    let text = "";
    try {
      text = (await Clipboard.getStringAsync()).trim();
    } catch {}

    if (!text.includes("://") || !parseConnectionUrl(text, type)) {
      Alert.alert(
        "No Connection URL",
        "Copy a URL such as postgres://user:password@host:5432/database, then try again.",
      );
      return;
    }
    handleUrlChange(text);
    haptic.light();
  };

  const handleTestConnection = async () => {
    const issue = findIssue(false);
    if (issue) {
      Alert.alert(issue.title, issue.message);
      return;
    }

    setTesting(true);
    const testId = `test_${Date.now()}`;
    const testedSignature = signature;

    try {
      await connect(buildConfig(testId, "Test Connection"));
      setTestResult({ signature: testedSignature, result: { ok: true } });
      haptic.success();
    } catch (error) {
      setTestResult({
        signature: testedSignature,
        result: {
          ok: false,
          message: error instanceof Error ? error.message : "Failed to connect",
        },
      });
      haptic.error();
    } finally {
      try {
        await disconnect(testId);
      } catch {}
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const issue = findIssue(true);
    if (issue) {
      Alert.alert(issue.title, issue.message);
      return;
    }

    // Saving before the connection being edited has loaded would create a
    // second copy of it instead of updating it.
    if (isEditMode && !existingConnection) return;

    setSaving(true);

    try {
      if (isEditMode && editId) {
        // The host, database or credentials may have changed under a live
        // connection; drop it so the next Connect uses the new settings.
        await disconnect(editId).catch(() => {});
      }
      await saveConnection(buildConfig(existingConnection?.id ?? generateConnectionId(), ""));
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
      if (isEditMode) {
        await queryClient.invalidateQueries({ queryKey: ["connection", editId] });
      }

      safeBack();
    } catch (error) {
      Alert.alert(
        "Couldn’t Save Connection",
        error instanceof Error ? error.message : "Failed to save connection",
      );
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || testing;

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Connection" : "New Connection",
          headerLeft: () => <HeaderTextButton label="Cancel" onPress={() => safeBack()} />,
          headerRight: () => (
            <HeaderTextButton
              label={isEditMode ? "Save" : "Add"}
              emphasized
              disabled={!canSave || testing || (isEditMode && loadingEdit)}
              loading={saving}
              onPress={handleSave}
            />
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background.val }}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 28 }}
      >
        {!sqlite ? (
          <ListSection
            title="Connection URL"
            footer="Paste a URL to fill in the fields below. Nothing is saved until you confirm."
          >
            <FormField
              mono
              value={connectionUrl}
              onChangeText={handleUrlChange}
              placeholder={`${type}://user:password@host:${DEFAULT_PORTS[type]}/db`}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              accessibilityLabel="Connection URL"
              trailing={
                <Button variant="tinted" size="sm" onPress={handlePasteUrl}>
                  Paste
                </Button>
              }
            />
          </ListSection>
        ) : null}

        <YStack gap={6}>
          <AppText
            variant="footnote"
            tone="secondary"
            paddingHorizontal="$md"
            textTransform="uppercase"
          >
            Database Type
          </AppText>
          <DatabaseTypePicker value={type} onChange={handleTypeChange} />
        </YStack>

        <ListSection
          title="Connection"
          footer={
            sqlite
              ? "A file you choose is copied into COSMQ on this device."
              : `Leave the port empty to use the ${DATABASE_LABELS[type]} default, ${DEFAULT_PORTS[type]}.`
          }
        >
          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Production"
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => (sqlite ? databaseRef : hostRef).current?.focus()}
          />
          {!sqlite ? (
            <FormField
              label="Host"
              inputRef={hostRef}
              mono
              value={host}
              onChangeText={setHost}
              placeholder="localhost"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => portRef.current?.focus()}
            />
          ) : null}
          {!sqlite ? (
            <FormField
              label="Port"
              inputRef={portRef}
              mono
              value={port}
              onChangeText={setPort}
              placeholder={DEFAULT_PORTS[type].toString()}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => databaseRef.current?.focus()}
            />
          ) : null}
          <FormField
            label={sqlite ? "File" : "Database"}
            inputRef={databaseRef}
            mono={sqlite}
            value={database}
            onChangeText={setDatabase}
            placeholder={sqlite ? "local.db" : "Required"}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType={sqlite ? "done" : "next"}
            submitBehavior={sqlite ? "blurAndSubmit" : "submit"}
            onSubmitEditing={() => (sqlite ? undefined : usernameRef.current?.focus())}
          />
          {sqlite ? (
            <ListRow
              title="Choose File…"
              tint
              icon={<Ionicons name="folder-open-outline" size={22} color={theme.accent.val} />}
              onPress={handleChooseFile}
            />
          ) : null}
        </ListSection>

        {!sqlite ? (
          <ListSection title="Authentication">
            <FormField
              label="User"
              inputRef={usernameRef}
              value={username}
              onChangeText={setUsername}
              placeholder={type === "mongodb" ? "admin" : "postgres"}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <FormField
              label="Password"
              inputRef={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Optional"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </ListSection>
        ) : null}

        {!sqlite ? (
          <ListSection
            title="Security"
            footer={
              ssl
                ? verifyCertificate
                  ? "The server’s certificate must be valid and trusted."
                  : "Traffic is encrypted, but the server’s identity isn’t checked. Use only for self-signed certificates."
                : "Turn on to encrypt traffic between this device and the server."
            }
          >
            <FormControlRow
              title="Use SSL/TLS"
              control={
                <Switch checked={ssl} onCheckedChange={setSsl} accessibilityLabel="Use SSL/TLS" />
              }
            />
            {ssl ? (
              <FormControlRow
                title="Verify Certificate"
                control={
                  <Switch
                    checked={verifyCertificate}
                    onCheckedChange={setVerifyCertificate}
                    accessibilityLabel="Verify certificate"
                  />
                }
              />
            ) : null}
          </ListSection>
        ) : null}

        <ListSection title="Color Tag" footer="Shown next to the connection in your list.">
          <ColorTagPicker value={color} onChange={setColor} />
        </ListSection>

        <YStack gap="$sm">
          <Button
            variant="gray"
            size="lg"
            onPress={handleTestConnection}
            loading={testing}
            disabled={busy}
          >
            Test Connection
          </Button>
          {visibleTestResult ? (
            visibleTestResult.ok ? (
              <XStack
                alignItems="center"
                justifyContent="center"
                gap={6}
                paddingVertical="$xs"
                accessibilityLiveRegion="polite"
              >
                <Ionicons name="checkmark-circle" size={16} color={theme.success.val} />
                <AppText variant="footnote" tone="success">
                  Connected to {DATABASE_LABELS[type]} successfully
                </AppText>
              </XStack>
            ) : (
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
                    Connection Failed
                  </AppText>
                </XStack>
                <AppText variant="footnote" tone="danger" selectable>
                  {visibleTestResult.message}
                </AppText>
              </YStack>
            )
          ) : null}
        </YStack>
      </ScrollView>
    </>
  );
}

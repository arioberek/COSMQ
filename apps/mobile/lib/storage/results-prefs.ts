import AsyncStorage from "@react-native-async-storage/async-storage";

export type ResultsViewMode = "cards" | "table" | "json";

export interface ColumnPrefs {
  pinned: string[];
  hidden: string[];
}

const VIEW_KEY = "cosmq_results_view_by_connection";
const COLUMNS_KEY = "cosmq_results_columns_by_query";
const EDITOR_MODE_KEY = "cosmq_editor_mode_by_connection";

export type EditorMode = "editor" | "builder";

const queryHash = (sql: string): string => {
  let h = 5381;
  for (let i = 0; i < sql.length; i++) {
    h = ((h << 5) + h + sql.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
};

export const buildPrefsKey = (connectionId: string, sql: string): string =>
  `${connectionId}:${queryHash(sql.trim())}`;

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export async function getResultsViewMode(
  connectionId: string,
): Promise<ResultsViewMode | null> {
  const map = await readJson<Record<string, ResultsViewMode>>(VIEW_KEY, {});
  return map[connectionId] ?? null;
}

export async function setResultsViewMode(
  connectionId: string,
  mode: ResultsViewMode,
): Promise<void> {
  const map = await readJson<Record<string, ResultsViewMode>>(VIEW_KEY, {});
  map[connectionId] = mode;
  await AsyncStorage.setItem(VIEW_KEY, JSON.stringify(map));
}

export async function getColumnPrefs(prefsKey: string): Promise<ColumnPrefs> {
  const map = await readJson<Record<string, ColumnPrefs>>(COLUMNS_KEY, {});
  return map[prefsKey] ?? { pinned: [], hidden: [] };
}

export async function setColumnPrefs(
  prefsKey: string,
  prefs: ColumnPrefs,
): Promise<void> {
  const map = await readJson<Record<string, ColumnPrefs>>(COLUMNS_KEY, {});
  if (prefs.pinned.length === 0 && prefs.hidden.length === 0) {
    delete map[prefsKey];
  } else {
    map[prefsKey] = prefs;
  }
  await AsyncStorage.setItem(COLUMNS_KEY, JSON.stringify(map));
}

export async function getEditorMode(connectionId: string): Promise<EditorMode | null> {
  const map = await readJson<Record<string, EditorMode>>(EDITOR_MODE_KEY, {});
  return map[connectionId] ?? null;
}

export async function setEditorMode(connectionId: string, mode: EditorMode): Promise<void> {
  const map = await readJson<Record<string, EditorMode>>(EDITOR_MODE_KEY, {});
  map[connectionId] = mode;
  await AsyncStorage.setItem(EDITOR_MODE_KEY, JSON.stringify(map));
}

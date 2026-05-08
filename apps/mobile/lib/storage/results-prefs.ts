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

// Each writer below does read-modify-write on a shared JSON blob keyed by
// category. Without serialization, two rapid calls (e.g. fast pin/hide
// toggles, view-mode switch right after) can interleave their reads and the
// later setItem clobbers the earlier one — silently losing the first update.
// The chain serializes all writes targeting the same storage key.
const writeChains: Record<string, Promise<void>> = {};

const enqueueWrite = (key: string, task: () => Promise<void>): Promise<void> => {
  const prev = writeChains[key] ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(task);
  writeChains[key] = next.finally(() => {
    if (writeChains[key] === next) delete writeChains[key];
  });
  return next;
};

export async function getResultsViewMode(connectionId: string): Promise<ResultsViewMode | null> {
  const map = await readJson<Record<string, ResultsViewMode>>(VIEW_KEY, {});
  return map[connectionId] ?? null;
}

export async function setResultsViewMode(
  connectionId: string,
  mode: ResultsViewMode,
): Promise<void> {
  return enqueueWrite(VIEW_KEY, async () => {
    const map = await readJson<Record<string, ResultsViewMode>>(VIEW_KEY, {});
    map[connectionId] = mode;
    await AsyncStorage.setItem(VIEW_KEY, JSON.stringify(map));
  });
}

export async function getColumnPrefs(prefsKey: string): Promise<ColumnPrefs> {
  const map = await readJson<Record<string, ColumnPrefs>>(COLUMNS_KEY, {});
  return map[prefsKey] ?? { pinned: [], hidden: [] };
}

export async function setColumnPrefs(prefsKey: string, prefs: ColumnPrefs): Promise<void> {
  return enqueueWrite(COLUMNS_KEY, async () => {
    const map = await readJson<Record<string, ColumnPrefs>>(COLUMNS_KEY, {});
    if (prefs.pinned.length === 0 && prefs.hidden.length === 0) {
      delete map[prefsKey];
    } else {
      map[prefsKey] = prefs;
    }
    await AsyncStorage.setItem(COLUMNS_KEY, JSON.stringify(map));
  });
}

export async function getEditorMode(connectionId: string): Promise<EditorMode | null> {
  const map = await readJson<Record<string, EditorMode>>(EDITOR_MODE_KEY, {});
  return map[connectionId] ?? null;
}

export async function setEditorMode(connectionId: string, mode: EditorMode): Promise<void> {
  return enqueueWrite(EDITOR_MODE_KEY, async () => {
    const map = await readJson<Record<string, EditorMode>>(EDITOR_MODE_KEY, {});
    map[connectionId] = mode;
    await AsyncStorage.setItem(EDITOR_MODE_KEY, JSON.stringify(map));
  });
}

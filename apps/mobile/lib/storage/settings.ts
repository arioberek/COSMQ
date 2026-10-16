import * as SecureStore from "./secure-store";
import { type AppSettings, DEFAULT_SETTINGS } from "../settings";

const SETTINGS_KEY = "cosmq_settings";

export async function getSettings(): Promise<AppSettings> {
  const data = await SecureStore.getItemAsync(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;

  try {
    // `darkMode` was replaced by `appearance` (follows the system by default).
    const { darkMode: _legacyDarkMode, ...parsed } = JSON.parse(data) as Partial<AppSettings> & {
      darkMode?: boolean;
    };
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
}

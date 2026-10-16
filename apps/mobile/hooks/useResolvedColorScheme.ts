import { useColorScheme } from "react-native";
import { useSettingsStore } from "../stores/settings";

/** The color scheme in effect: the user's override, or the system appearance. */
export function useResolvedColorScheme(): "light" | "dark" {
  const appearance = useSettingsStore((state) => state.settings.appearance);
  const system = useColorScheme();
  if (appearance === "light" || appearance === "dark") return appearance;
  return system === "dark" ? "dark" : "light";
}

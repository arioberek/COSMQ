export type Theme = {
  mode: "dark" | "light";
  colors: {
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceAlt: string;
    surfaceMuted: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    border: string;
    borderSubtle: string;
    primary: string;
    primaryMuted: string;
    primaryLight: string;
    secondary: string;
    secondaryMuted: string;
    success: string;
    successMuted: string;
    successLight: string;
    warning: string;
    warningMuted: string;
    danger: string;
    dangerMuted: string;
    accent: string;
    accentMuted: string;
    accentLight: string;
    placeholder: string;
    disabled: string;
    glow: string;
    glowSubtle: string;
    card: string;
    cardBorder: string;
    overlay: string;
  };
  gradients: {
    primary: readonly [string, string];
    primaryReverse: readonly [string, string];
    accent: readonly [string, string];
    success: readonly [string, string];
    danger: readonly [string, string];
    surface: readonly [string, string];
    cosmic: readonly [string, string, string];
    aurora: readonly [string, string, string];
    sunset: readonly [string, string, string];
    ocean: readonly [string, string];
    glass: readonly [string, string];
    card: readonly [string, string];
  };
  shadows: {
    small: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    glow: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
};

const dark: Theme = {
  mode: "dark",
  colors: {
    background: "#0a0a0f",
    backgroundAlt: "#0d0d14",
    surface: "#13131a",
    surfaceAlt: "#1a1a24",
    surfaceMuted: "#22222e",
    surfaceElevated: "#1e1e2a",
    text: "#f0f0f5",
    textMuted: "#b8b8c8",
    textSubtle: "#6b6b80",
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    primary: "#7c5cff",
    primaryMuted: "rgba(124, 92, 255, 0.15)",
    primaryLight: "#9d85ff",
    secondary: "#00d9ff",
    secondaryMuted: "rgba(0, 217, 255, 0.15)",
    success: "#00e676",
    successMuted: "rgba(0, 230, 118, 0.12)",
    successLight: "#69f0ae",
    warning: "#ffab40",
    warningMuted: "rgba(255, 171, 64, 0.12)",
    danger: "#ff5252",
    dangerMuted: "rgba(255, 82, 82, 0.12)",
    accent: "#e040fb",
    accentMuted: "rgba(224, 64, 251, 0.15)",
    accentLight: "#ea80fc",
    placeholder: "#4a4a5a",
    disabled: "#3a3a4a",
    glow: "rgba(124, 92, 255, 0.4)",
    glowSubtle: "rgba(124, 92, 255, 0.2)",
    card: "rgba(19, 19, 26, 0.8)",
    cardBorder: "rgba(255, 255, 255, 0.06)",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
  gradients: {
    primary: ["#7c5cff", "#5c3dff"] as const,
    primaryReverse: ["#5c3dff", "#7c5cff"] as const,
    accent: ["#e040fb", "#7c5cff"] as const,
    success: ["#00e676", "#00bfa5"] as const,
    danger: ["#ff5252", "#ff1744"] as const,
    surface: ["#1a1a24", "#13131a"] as const,
    cosmic: ["#7c5cff", "#e040fb", "#00d9ff"] as const,
    aurora: ["#00e676", "#00d9ff", "#7c5cff"] as const,
    sunset: ["#ff5252", "#ffab40", "#e040fb"] as const,
    ocean: ["#0066ff", "#00d9ff"] as const,
    glass: ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"] as const,
    card: ["rgba(26, 26, 36, 0.9)", "rgba(19, 19, 26, 0.95)"] as const,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    glow: {
      shadowColor: "#7c5cff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 15,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

const light: Theme = {
  mode: "light",
  colors: {
    background: "#f8f9fc",
    backgroundAlt: "#f0f1f5",
    surface: "#ffffff",
    surfaceAlt: "#f5f6fa",
    surfaceMuted: "#ebedf2",
    surfaceElevated: "#ffffff",
    text: "#0f0f1a",
    textMuted: "#3a3a4f",
    textSubtle: "#6b6b80",
    border: "rgba(0, 0, 0, 0.08)",
    borderSubtle: "rgba(0, 0, 0, 0.04)",
    primary: "#6b4eff",
    primaryMuted: "rgba(107, 78, 255, 0.1)",
    primaryLight: "#8b72ff",
    secondary: "#00b8d9",
    secondaryMuted: "rgba(0, 184, 217, 0.1)",
    success: "#00c853",
    successMuted: "rgba(0, 200, 83, 0.1)",
    successLight: "#69f0ae",
    warning: "#ff9100",
    warningMuted: "rgba(255, 145, 0, 0.1)",
    danger: "#ff1744",
    dangerMuted: "rgba(255, 23, 68, 0.1)",
    accent: "#d500f9",
    accentMuted: "rgba(213, 0, 249, 0.1)",
    accentLight: "#e040fb",
    placeholder: "#9ca3af",
    disabled: "#d1d5db",
    glow: "rgba(107, 78, 255, 0.3)",
    glowSubtle: "rgba(107, 78, 255, 0.15)",
    card: "rgba(255, 255, 255, 0.9)",
    cardBorder: "rgba(0, 0, 0, 0.06)",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  gradients: {
    primary: ["#6b4eff", "#5530ff"] as const,
    primaryReverse: ["#5530ff", "#6b4eff"] as const,
    accent: ["#d500f9", "#6b4eff"] as const,
    success: ["#00c853", "#00bfa5"] as const,
    danger: ["#ff1744", "#ff5252"] as const,
    surface: ["#ffffff", "#f5f6fa"] as const,
    cosmic: ["#6b4eff", "#d500f9", "#00b8d9"] as const,
    aurora: ["#00c853", "#00b8d9", "#6b4eff"] as const,
    sunset: ["#ff1744", "#ff9100", "#d500f9"] as const,
    ocean: ["#0052cc", "#00b8d9"] as const,
    glass: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"] as const,
    card: ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.85)"] as const,
  },
  shadows: {
    small: {
      shadowColor: "#6b4eff",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: "#6b4eff",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: "#6b4eff",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    glow: {
      shadowColor: "#6b4eff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const getTheme = (darkMode: boolean): Theme =>
  darkMode ? dark : light;

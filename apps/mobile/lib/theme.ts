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
  syntax: {
    keyword: string;
    string: string;
    number: string;
    comment: string;
    operator: string;
    punctuation: string;
    identifier: string;
    default: string;
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
    background: "#0c0c12",
    backgroundAlt: "#101018",
    surface: "#15151d",
    surfaceAlt: "#1c1c26",
    surfaceMuted: "#232330",
    surfaceElevated: "#1e1e2a",
    text: "#f0f0f5",
    textMuted: "#bcbcce",
    textSubtle: "#8a8aa0",
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    primary: "#7c5cff",
    primaryMuted: "rgba(124, 92, 255, 0.15)",
    primaryLight: "#9d85ff",
    secondary: "#7c5cff",
    secondaryMuted: "rgba(124, 92, 255, 0.15)",
    success: "#3ddc84",
    successMuted: "rgba(61, 220, 132, 0.12)",
    successLight: "#7fefae",
    warning: "#ffab40",
    warningMuted: "rgba(255, 171, 64, 0.12)",
    danger: "#ff5b5b",
    dangerMuted: "rgba(255, 91, 91, 0.12)",
    accent: "#7c5cff",
    accentMuted: "rgba(124, 92, 255, 0.15)",
    accentLight: "#9d85ff",
    placeholder: "#5b5b6e",
    disabled: "#3a3a4a",
    glow: "rgba(0, 0, 0, 0.5)",
    glowSubtle: "rgba(0, 0, 0, 0.25)",
    card: "#15151d",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    overlay: "rgba(8, 8, 14, 0.78)",
  },
  syntax: {
    keyword: "#a78bfa",
    string: "#86efac",
    number: "#fbbf24",
    comment: "#5e5e74",
    operator: "#7dd3fc",
    punctuation: "#bcbcce",
    identifier: "#f0f0f5",
    default: "#bcbcce",
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
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
    background: "#fafbfc",
    backgroundAlt: "#f1f2f5",
    surface: "#ffffff",
    surfaceAlt: "#f5f6fa",
    surfaceMuted: "#ebedf2",
    surfaceElevated: "#ffffff",
    text: "#0f0f1a",
    textMuted: "#3a3a4f",
    textSubtle: "#5e5e74",
    border: "rgba(15, 15, 26, 0.10)",
    borderSubtle: "rgba(15, 15, 26, 0.06)",
    primary: "#6b4eff",
    primaryMuted: "rgba(107, 78, 255, 0.10)",
    primaryLight: "#8b72ff",
    secondary: "#6b4eff",
    secondaryMuted: "rgba(107, 78, 255, 0.10)",
    success: "#1f9d55",
    successMuted: "rgba(31, 157, 85, 0.10)",
    successLight: "#69f0ae",
    warning: "#d97706",
    warningMuted: "rgba(217, 119, 6, 0.10)",
    danger: "#dc2626",
    dangerMuted: "rgba(220, 38, 38, 0.10)",
    accent: "#6b4eff",
    accentMuted: "rgba(107, 78, 255, 0.10)",
    accentLight: "#8b72ff",
    placeholder: "#9ca3af",
    disabled: "#d1d5db",
    glow: "rgba(15, 15, 26, 0.10)",
    glowSubtle: "rgba(15, 15, 26, 0.05)",
    card: "#ffffff",
    cardBorder: "rgba(15, 15, 26, 0.08)",
    overlay: "rgba(15, 15, 26, 0.45)",
  },
  syntax: {
    keyword: "#7c3aed",
    string: "#15803d",
    number: "#b45309",
    comment: "#9ca3af",
    operator: "#0369a1",
    punctuation: "#3a3a4f",
    identifier: "#0f0f1a",
    default: "#3a3a4f",
  },
  shadows: {
    small: {
      shadowColor: "#0f0f1a",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#0f0f1a",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#0f0f1a",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: "#0f0f1a",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
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

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
    background: "#08080f",
    backgroundAlt: "#0c0c14",
    surface: "#16161f",
    surfaceAlt: "#1f1f2c",
    surfaceMuted: "#2a2a3a",
    surfaceElevated: "#22222f",
    text: "#f0f0f5",
    textMuted: "#c5c5d6",
    textSubtle: "#9a9ab0",
    border: "rgba(255, 255, 255, 0.10)",
    borderSubtle: "rgba(255, 255, 255, 0.06)",
    primary: "#7559ec",
    primaryMuted: "rgba(117, 89, 236, 0.20)",
    primaryLight: "#9b88f5",
    secondary: "#7559ec",
    secondaryMuted: "rgba(117, 89, 236, 0.20)",
    success: "#3ddc84",
    successMuted: "rgba(61, 220, 132, 0.16)",
    successLight: "#7fefae",
    warning: "#ffab40",
    warningMuted: "rgba(255, 171, 64, 0.16)",
    danger: "#ff5b5b",
    dangerMuted: "rgba(255, 91, 91, 0.16)",
    accent: "#7559ec",
    accentMuted: "rgba(117, 89, 236, 0.20)",
    accentLight: "#9b88f5",
    placeholder: "#6e6e84",
    disabled: "#3a3a4a",
    glow: "rgba(0, 0, 0, 0.55)",
    glowSubtle: "rgba(0, 0, 0, 0.3)",
    card: "#16161f",
    cardBorder: "rgba(255, 255, 255, 0.10)",
    overlay: "rgba(4, 4, 9, 0.86)",
  },
  syntax: {
    keyword: "#a78bfa",
    string: "#86efac",
    number: "#fbbf24",
    comment: "#6f6f86",
    operator: "#7dd3fc",
    punctuation: "#c5c5d6",
    identifier: "#f0f0f5",
    default: "#c5c5d6",
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
    background: "#fafbfd",
    backgroundAlt: "#eef0f5",
    surface: "#ffffff",
    surfaceAlt: "#f1f3f9",
    surfaceMuted: "#e6e8f0",
    surfaceElevated: "#ffffff",
    text: "#0f0f1a",
    textMuted: "#3a3a4f",
    textSubtle: "#56566d",
    border: "rgba(15, 15, 26, 0.13)",
    borderSubtle: "rgba(15, 15, 26, 0.09)",
    primary: "#5e47e6",
    primaryMuted: "rgba(94, 71, 230, 0.14)",
    primaryLight: "#8576f0",
    secondary: "#5e47e6",
    secondaryMuted: "rgba(94, 71, 230, 0.14)",
    success: "#1f9d55",
    successMuted: "rgba(31, 157, 85, 0.14)",
    successLight: "#4ade80",
    warning: "#d97706",
    warningMuted: "rgba(217, 119, 6, 0.14)",
    danger: "#dc2626",
    dangerMuted: "rgba(220, 38, 38, 0.14)",
    accent: "#5e47e6",
    accentMuted: "rgba(94, 71, 230, 0.14)",
    accentLight: "#8576f0",
    placeholder: "#8b92a0",
    disabled: "#d1d5db",
    glow: "rgba(15, 15, 26, 0.12)",
    glowSubtle: "rgba(15, 15, 26, 0.07)",
    card: "#ffffff",
    cardBorder: "rgba(15, 15, 26, 0.11)",
    overlay: "rgba(15, 15, 26, 0.55)",
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

export const getTheme = (darkMode: boolean): Theme => (darkMode ? dark : light);

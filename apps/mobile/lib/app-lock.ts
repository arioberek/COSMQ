import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

export type BiometricCapability = {
  isSupported: boolean;
  isEnrolled: boolean;
  securityLevel: LocalAuthentication.SecurityLevel;
  availableTypes: BiometricType[];
};

const AUTH_TYPE_MAP: Record<LocalAuthentication.AuthenticationType, BiometricType> = {
  [LocalAuthentication.AuthenticationType.FINGERPRINT]: "fingerprint",
  [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: "facial",
  [LocalAuthentication.AuthenticationType.IRIS]: "iris",
};

export async function checkBiometricCapability(): Promise<BiometricCapability> {
  const isSupported = await LocalAuthentication.hasHardwareAsync();

  if (!isSupported) {
    return {
      isSupported: false,
      isEnrolled: false,
      securityLevel: LocalAuthentication.SecurityLevel.NONE,
      availableTypes: [],
    };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  const availableTypes = supportedTypes.map((t) => AUTH_TYPE_MAP[t]).filter(Boolean);

  return {
    isSupported,
    isEnrolled,
    securityLevel,
    availableTypes,
  };
}

/** True when the system prompt has something to check: biometrics or a device passcode. */
export function canAuthenticate(capability: BiometricCapability): boolean {
  if (!capability.isSupported) return false;
  return (
    capability.isEnrolled || capability.securityLevel !== LocalAuthentication.SecurityLevel.NONE
  );
}

export type AuthResult = {
  success: boolean;
  error?: string;
  warning?: string;
};

export async function authenticate(promptMessage?: string): Promise<AuthResult> {
  const capability = await checkBiometricCapability();

  if (!capability.isSupported) {
    return {
      success: false,
      error: "This device doesn’t support biometric authentication.",
    };
  }

  // With no biometrics enrolled, the system prompt falls back to the device
  // passcode. Only a device with neither has nothing to authenticate against.
  if (!canAuthenticate(capability)) {
    return {
      success: false,
      error: "Set up a passcode, Face ID, Touch ID or a fingerprint in your device settings.",
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage ?? "Authenticate to unlock COSMQ",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      return { success: true };
    }

    if (result.error === "user_cancel") {
      return {
        success: false,
        warning: "Authentication canceled.",
      };
    }

    if (result.error === "lockout") {
      return {
        success: false,
        error: "Too many failed attempts. Try again later.",
      };
    }

    // `result.error` is a machine code such as "not_enrolled", not a sentence.
    return {
      success: false,
      error: "Authentication failed. Try again.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Authentication error",
    };
  }
}

export function getBiometricDisplayName(types: BiometricType[]): string {
  if (types.includes("facial")) {
    return "Face ID";
  }
  if (types.includes("fingerprint")) {
    return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  }
  if (types.includes("iris")) {
    return "Iris Scanner";
  }
  return "Biometrics";
}

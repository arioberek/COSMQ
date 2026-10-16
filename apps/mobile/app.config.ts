import type { ConfigContext, ExpoConfig } from "expo/config";
import pkg from "./package.json";

// Marketing version follows package.json (bumped by changesets).
// Build numbers are managed remotely by EAS (see eas.json `appVersionSource`).
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    version: pkg.version,
  }) as ExpoConfig;

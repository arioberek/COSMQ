# @cosmq/mobile

## 0.1.5

### Patch Changes

- 4acd959: App Lock no longer locks you out after biometrics are removed: the device passcode unlocks, and the lock screen says so. A forced Light or Dark appearance now reaches alerts, action sheets and the keyboard. MongoDB connections get working starter commands and a "Query" tab label. Button press animation respects Reduce Motion. Copy made consistent, and three unused modules removed.
- b32d322: Security: verify the server hostname on Android TLS connections (previously only the certificate chain was checked), refuse a PostgreSQL login that skips the SCRAM server proof, and close four ways a destructive statement could run without the confirmation prompt. Fix MongoDB SCRAM-SHA-1 so password auth works against real servers.

## 0.1.4

### Patch Changes

- 3be829a: Declare the mobile dependencies required by the current source tree so fresh installs can typecheck reliably.

## 0.1.3

### Patch Changes

- 8e31e55: feat: update mobile app branding with new COSMQ logo and add landing page

## 0.1.2

### Patch Changes

- c0a0e2d: feat(mobile): integrate Tamagui UI system

## 0.1.1

### Patch Changes

- 557c27d: 📝 Add docstrings to `feat/mobile-enhancements`
- f8c3eb6: feat(mobile): add query history, snippets, color tags, and haptic feedback

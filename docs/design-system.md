# COSMQ mobile design system

COSMQ looks and behaves like a native iOS app (Apple Human Interface Guidelines),
with one brand accent. Android uses the same components; native controls
(`Switch`, alerts, headers) pick up the platform look automatically.

**Principles**

- Native first. Use the platform's header, large titles, switches, alerts and
  sheets before building custom chrome.
- Content over decoration. No gradients, glows, emoji or decorative shadows.
  Group with backgrounds and hairlines, not borders.
- One accent. Violet is for interactive elements (buttons, links, toggles,
  selection). Status colors (green, red, orange) only mean status.
- Light first, dark equal. Appearance follows the system; both must look right.

## Tokens: `apps/mobile/tamagui.config.ts`

All values live in the Tamagui config. Never hardcode hex colors, font sizes or
radii in screens.

| Theme key | Light | Dark | Use |
| --- | --- | --- | --- |
| `$background` | `#f2f2f7` | `#000000` | Screen background (grouped) |
| `$surface` | `#ffffff` | `#1c1c1e` | Rows, grouped sections, cards |
| `$surfaceAlt` | `#f2f2f7` | `#2c2c2e` | Inset content inside a surface, e.g. editor |
| `$surfaceMuted` | `#e5e5ea` | `#3a3a3c` | Pressed row highlight |
| `$fill` | 12% gray | 24% gray | Gray buttons, chips, text field background, icon tiles |
| `$color` | `#000000` | `#ffffff` | Primary text (label) |
| `$textMuted` | 60% | 60% | Secondary text (secondaryLabel) |
| `$textSubtle` | `#8a8a8e` | `#8d8d93` | Tertiary text, chevrons, placeholders-ish |
| `$placeholderColor` | 30% | 30% | Text input placeholder |
| `$borderColor` | separator | separator | Hairlines (0.5pt) |
| `$accent` / `$primary` | `#6e56cf` | `#9585f2` | Tint: buttons, links, selection, switches |
| `$accentMuted` | 12% violet | 20% violet | Tinted button background, selected chip |
| `$success` / `$successLight` | `#248a3d` / `#34c759` | `#30d158` | Connected, query OK. Use `successLight` for dots |
| `$warning` | `#c93400` | `#ff9f0a` | Open transaction, caution |
| `$danger` / `$dangerMuted` | `#d70015` | `#ff453a` | Errors, destructive actions |
| `$syntax*` | Xcode light | Xcode dark | SQL highlighting |
| `$tile*` | iOS system colors | iOS system colors | `ListIcon` tiles only (Blue, Indigo, Gray, Green, Orange, Red, Pink, Teal) |

Spacing uses a 4pt grid: `$xs` 4, `$sm` 8, `$md` 16, `$lg` 24, `$xl` 32,
`$xxl` 48. Screen edge padding is 16. Section spacing is 28 (`gap`).
Radii: `$sm` 8 (chips, small tiles), `$md` 12 (sections, buttons, fields),
`$full` (capsules). Always pair a radius with `style={{ borderCurve: "continuous" }}`.

For `StyleSheet` code, `hooks/useTheme.ts` exposes the same values as plain
strings (`theme.colors.*`, `theme.syntax.*`).

## Typography: `AppText` (`components/ui/Text.tsx`)

Apple text styles. Don't set `fontSize`, `fontWeight` or `letterSpacing` in screens.

| `variant` | Size/leading | Use |
| --- | --- | --- |
| `largeTitle` | 34/41 bold | Rare. Prefer the native large title |
| `title2` | 22/28 bold | Hero numbers, detail headers |
| `title3` | 20/25 semibold | Empty state titles, sheet titles |
| `headline` | 17/22 semibold | Emphasized row titles, buttons |
| `body` | 17/22 | Default row and body text |
| `callout` | 16/21 | Secondary body |
| `subhead` | 15/20 | Supporting text, small buttons |
| `footnote` | 13/18 | Section headers and footers, row subtitles, meta |
| `caption` / `caption2` | 12/16, 11/13 | Badges, timestamps, table headers |
| `code` | 13/18 JetBrains Mono | SQL, values, hosts, JSON |

`tone`: `primary` (default), `secondary`, `tertiary`, `accent`, `danger`,
`success`, `warning`, `onAccent`. `emphasized` makes it semibold.
Copy uses **Title Case** for titles and buttons ("Add Connection") and
sentence case for descriptions and footers.

## Components: `components/ui`

- **`ListSection` / `ListRow` / `ListIcon`**: inset grouped lists (like the
  Settings app). Use them for every list of settings, details or navigation
  rows. `ListRow` takes `title`, `subtitle`, `value` (trailing secondary text),
  `icon`, `accessory` (`"chevron"`, `"check"` or a node such as a `Switch`),
  `onPress`, `destructive` and `tint`. Section titles are uppercase
  footnotes, and footers explain the section.
- **`Button`**: `variant` is `filled` (one primary action per screen),
  `tinted`, `gray`, `plain` or `destructive`; `size` is `sm` (capsule, 34),
  `md` (44) or `lg` (50). Press feedback is built in (scale 0.97).
- **`Switch`**: the native switch, tinted with the accent.
- **`EmptyState`**: `icon`, `title`, `message`, `action`.
- **Segmented choices**: `@react-native-segmented-control/segmented-control`
  (native `UISegmentedControl`).
- **Swipe actions**: `components/swipeable-row.tsx` (Gesture Handler).

## Patterns

- **Screen**: `ScrollView` (or `FlatList`) as the first child with
  `contentInsetAdjustmentBehavior="automatic"`, `contentContainerStyle={{ padding: 16, gap: 28 }}`.
  Titles come from the stack header (`Stack.Screen options`), never a text
  element on the page. Top-level screens use `headerLargeTitle`.
- **Header actions**: icon or text buttons in `headerLeft`/`headerRight`,
  tinted `$accent`. No floating action buttons.
- **Modals and forms**: "Cancel" on the left, the confirm action ("Save",
  "Add") on the right, semibold, in the header.
- **Confirmations**: `Alert.alert` with a `destructive` button for
  irreversible actions. Use the in-app `Dialog` only for richer content.
- **Lists of choices**: rows with a `"check"` accessory, or a segmented
  control for 2 to 4 options.
- **Forms**: grouped rows with the label on the left and a right-aligned
  `TextInput` (or full-width inputs on a `$surface` row). Field labels go in
  section headers when inputs are full-width.
- **Status**: a 7pt dot plus a footnote label. Never color alone.
- **Errors**: a `$dangerMuted` inset block with `danger`-toned text and a retry
  action. Messages are selectable.

## Motion

Follows `animate-expo` (Emil Kowalski's principles):

- Don't animate high-frequency actions (tab and segment switches, typing).
- Press feedback is scale 0.97 in about 120ms (built into `Button`). Rows
  use a highlight, not a scale.
- Enter/exit animations stay under 300ms with a strong ease-out
  (`Easing.bezier(0.23, 1, 0.32, 1)`). Never animate from `scale(0)`. Respect
  `useReducedMotion`.
- Use Reanimated and Gesture Handler for anything a finger drags, never
  `Animated` + `PanResponder`.
- Haptics (`useHaptic`): one per user action, at the moment it commits.
  Success or error when a query or connection finishes.

## Previewing on Linux

There's no iOS simulator on Linux, so the web build is used for layout
previews. iOS renders SF Pro, native headers and large titles. The web
preview approximates these, so final checks happen in TestFlight.

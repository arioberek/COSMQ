# COSMQ explainer video

The motion explainer for COSMQ, built with [Remotion](https://www.remotion.dev).
It lives outside the Bun workspaces (`apps/*`, `packages/*`), has its own npm
lockfile, and doesn't touch the app build or CI.

| Composition | Size        | Length          | Output                                   |
| ----------- | ----------- | --------------- | ---------------------------------------- |
| `Explainer` | 1920×1080   | 1340 f (≈45 s)  | `out/cosmq-explainer.mp4`                |
| `Teaser`    | 1920×1080 → 960×540 | 314 f (≈10.5 s, loops) | `out/cosmq-teaser.{mp4,webp,gif}` |
| `Poster`    | 1920×1080   | still           | `out/poster.png`                         |

Each scene is also registered on its own under the **Scenes** folder in Studio
(`LogoSting`, `Engines`, `Direct`, `Product`, `LightDark`, `Privacy`, `EndCard`).

## Preview

```sh
npm install
npm run dev        # opens Remotion Studio
```

## Render

```sh
npm run render:explainer   # out/cosmq-explainer.mp4 (H.264, CRF 18)
npm run render:poster      # out/poster.png
npm run render:teaser      # out/cosmq-teaser.mp4/.webp/.gif (needs ffmpeg with libwebp, and gifsicle)
```

Quick proof frames without rendering the whole video:

```sh
node scripts/stills.mjs Explainer:90 Product:228 Poster:0   # → renders/stills/*.jpeg
```

Rendering needs a few GB of RAM. On a small machine, render in Docker instead
(any `node:22-bookworm` image plus Chrome's shared libraries, see
<https://www.remotion.dev/docs/docker>):

```sh
docker run --rm --cpus 2 --memory 4g -v "$PWD":/app -w /app <image> \
  sh -c "npm ci && npx remotion render Explainer out/cosmq-explainer.mp4 --concurrency=2"
```

## Layout

```
src/
  Root.tsx          composition registry
  Explainer.tsx     scene order and transitions
  Teaser.tsx        README loop (Product excerpt + end card)
  Poster.tsx        poster still
  timeline.ts       every duration: scene lengths, transitions, Product beats
  theme.ts          colors, fonts (Geist, Geist Mono, Instrument Serif, Inter, JetBrains Mono), easing curves
  lib/anim.ts       progress / keyed interpolation helpers
  lib/sql.ts        SQL highlighter + typing schedule
  components/       Phone frame, kinetic type, lockup, engine logos
  components/phone-ui/QueryScreen.tsx   the query screen rebuilt in code
  scenes/           one file per scene
  transitions/      circle reveal
public/
  screens/          app screenshots (iPhone, 3x, demo data)
  brand/            app icons
```

## Notes

- **Retiming:** change numbers in `src/timeline.ts`. The Product scene is one
  continuous phone shot; its beats (`PRODUCT`) drive the camera, the in-phone
  state and the captions together.
- **In-phone UI:** the nav bar, tabs, editor, Run button, alert and transaction
  banner are drawn in code (measured from the screenshots) so typing and taps
  stay crisp. Static content (result cards, table, JSON, builder, home list) is
  cropped from the real screenshots in `public/screens/`. Replace those PNGs to
  update the video after a UI change.
- **Copy must stay true.** Every claim matches the app: direct wire-protocol
  connections, the confirm dialog text, the 20 s default auto-rollback, keyword
  autocomplete, Keychain storage, optional Face ID, no accounts or analytics.
- Engine logos are Simple Icons paths from `apps/mobile/assets/icons`, inlined
  in `src/assets/paths.ts`.

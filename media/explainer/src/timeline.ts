/**
 * Every duration in the video lives here (frames at 30 fps).
 *
 * SCENES are the top-level scene lengths; TRANSITIONS overlap neighbouring
 * scenes, so the explainer is shorter than the sum of SCENES.
 * PRODUCT holds the beat timings inside the long phone scene.
 */

export const FPS = 30;

export const SCENES = {
  logo: 100,
  engines: 130,
  direct: 115,
  product: 700,
  lightDark: 112,
  privacy: 130,
  end: 125,
} as const;

export const TRANSITIONS = {
  logoToEngines: 22,
  enginesToDirect: 20,
  directToProduct: 14,
  // Product fades its phone out and LightDark raises a new one (no overlap),
  // and LightDark wipes itself to black, so Privacy follows with a hard cut.
  privacyToEnd: 16,
} as const;

export const EXPLAINER_DURATION =
  Object.values(SCENES).reduce((a, b) => a + b, 0) -
  Object.values(TRANSITIONS).reduce((a, b) => a + b, 0);

/** Beats inside the Product scene (frames relative to the scene start). */
export const PRODUCT = {
  // Home: phone rises in, then taps "Store".
  phoneIn: 0,
  tapStore: 50,
  push: 62, // iOS push from home to the query screen
  pushDur: 22,

  // SQL editor
  zoomEditor: 80,
  typeStart: 102,
  autocompleteAt: 138, // popover appears after "ORD"
  autocompleteAccept: 154,
  typeTailStart: 157,
  runPress: 180,
  runExecStart: 186,
  runExecEnd: 198,

  // Results: Cards → Table → JSON
  resultsIn: 200,
  toTable: 242,
  toJson: 286,

  // Visual builder
  toBuilder: 345,

  // Safety: dangerous-statement confirm + auto-rollback
  backToSql: 442,
  dangerTypeStart: 460,
  dangerRunPress: 496,
  alertIn: 504,
  alertTap: 560,
  alertOut: 568,
  bannerIn: 588,
  end: 700,
} as const;

/** Teaser: an excerpt of the Product scene plus the closing lockup, loops cleanly. */
export const TEASER = {
  productFrom: 92, // start inside the Product scene (editor already on screen)
  productDur: 250,
  endDur: 78,
  crossfade: 14,
} as const;

export const TEASER_DURATION = TEASER.productDur + TEASER.endDur - TEASER.crossfade;

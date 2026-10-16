import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Eyebrow, KineticText, serifAccent } from "../components/Kinetic";
import { PHONE_H, PHONE_W, Phone, SCREEN_W, Screenshot } from "../components/Phone";
import { QueryScreen, type QueryScreenState } from "../components/phone-ui/QueryScreen";
import { keyed, mix, progress } from "../lib/anim";
import { typedText } from "../lib/sql";
import { colors, ease, fonts } from "../theme";
import { PRODUCT as P } from "../timeline";

/** Where the phone sits when the camera is at rest. */
const PHONE_X = 1370;
const BASE_SCALE = 1.06;

const QUERY = "SELECT name, plan, mrr\nFROM customers\nWHERE mrr > 100\nORD";
const DANGER = "DELETE FROM carts\nWHERE updated_at < '2026-01-01';";

/** Pure function of the frame: every bit of in-phone state for the query screen. */
const queryState = (f: number): QueryScreenState => {
  const inSafety = f >= P.backToSql;

  const sql = inSafety
    ? typedText(f, [{ text: DANGER, start: P.dangerTypeStart, cpf: 2 }])
    : typedText(f, [
        { text: QUERY, start: P.typeStart, cpf: 1.7 },
        { text: "ER BY ", start: P.autocompleteAccept },
        { text: "mrr DESC;", start: P.typeTailStart, cpf: 1.3 },
      ]);

  // Solid caret while typing, iOS-style blink when idle.
  const typing =
    (f >= P.typeStart && f < P.typeTailStart + 10) ||
    (f >= P.dangerTypeStart && f < P.dangerTypeStart + 30);
  const editing =
    (f >= P.push + 10 && f < P.runPress) || (f >= P.backToSql + 6 && f < P.dangerRunPress);
  const caret = editing && (typing || Math.floor(f / 16) % 2 === 0);

  const press = (at: number) => progress(f, at, 3) - progress(f, at + 6, 6);

  return {
    sql,
    caret,
    tab: keyed(
      f,
      0,
      [
        { at: P.toBuilder, dur: 12, value: 1 },
        { at: P.backToSql, dur: 12, value: 0 },
      ],
      ease.out,
    ),
    builder: progress(f, P.toBuilder + 2, 14) - progress(f, P.backToSql + 2, 12),
    autocomplete: !inSafety && sql.endsWith("ORD") ? 1 : 0,
    autocompletePress: progress(f, P.autocompleteAccept - 6, 3),
    runPress: press(P.runPress) + press(P.dangerRunPress),
    runExec:
      progress(f, P.runExecStart, 7) -
      progress(f, P.runExecEnd, 7) +
      progress(f, P.alertOut + 4, 6) -
      progress(f, P.bannerIn - 4, 6),
    results: inSafety ? 0 : progress(f, P.resultsIn, 16),
    resultMode: keyed(
      f,
      0,
      [
        { at: P.toTable, dur: 10, value: 1 },
        { at: P.toJson, dur: 10, value: 2 },
      ],
      ease.inOut,
    ),
    alert: progress(f, P.alertIn, 12) - progress(f, P.alertOut, 8, ease.in),
    alertPress: progress(f, P.alertTap, 3),
    banner: progress(f, P.bannerIn, 14),
    secondsLeft: Math.max(0, 20 - Math.floor(Math.max(0, f - P.bannerIn) / 30)),
  };
};

/** Camera: zoom (s), the phone point in focus (fy, phone points) and where it lands on screen (py). */
const camera = (f: number) => {
  const keys = (value: (k: { s: number; fy: number; py: number }) => number) => {
    const shots = [
      { at: P.zoomEditor, dur: 30, s: 1.55, fy: 249, py: 470 },
      { at: P.runExecStart, dur: 32, s: 1.18, fy: 533, py: 600 },
      { at: P.toBuilder - 6, dur: 30, s: 1.0, fy: PHONE_H / 2, py: 540 },
      { at: P.backToSql, dur: 28, s: 1.55, fy: 249, py: 470 },
      { at: P.dangerRunPress + 2, dur: 26, s: 1.38, fy: 455, py: 585 },
      { at: P.bannerIn - 6, dur: 28, s: 1.42, fy: 345, py: 520 },
    ];
    return keyed(
      f,
      value({ s: 1, fy: PHONE_H / 2, py: 540 }),
      shots.map((k) => ({ at: k.at, dur: k.dur, value: value(k) })),
    );
  };
  return { s: keys((k) => k.s), fy: keys((k) => k.fy), py: keys((k) => k.py) };
};

export const ProductScene: React.FC = () => {
  const f = useCurrentFrame();
  const state = queryState(f);
  const cam = camera(f);
  const S = BASE_SCALE * cam.s;

  // Entrance: rise + un-tilt.
  const enter = progress(f, P.phoneIn, 36);
  const push = progress(f, P.push, P.pushDur, ease.drawer);
  const storePress = progress(f, P.tapStore, 4) - progress(f, P.push + 4, 10);
  // Exit: the phone sinks and fades so the next scene's phone can rise in.
  const outro = progress(f, P.end - 16, 16, ease.in);

  return (
    <AbsoluteFill style={{ background: colors.canvas, overflow: "hidden" }}>
      <Glow />
      <Captions />

      <div
        style={{
          position: "absolute",
          left: PHONE_X - (PHONE_W / 2) * S,
          top: cam.py - cam.fy * S,
          width: PHONE_W,
          height: PHONE_H,
          transformOrigin: "0 0",
          scale: `${S}`,
          translate: `0px ${mix(320, 0, enter) + mix(0, 60, outro)}px`,
          opacity: Math.min(1, enter * 1.6) * (1 - outro),
          perspective: 2000,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 100%",
            rotate: `x ${mix(14, 0, enter)}deg`,
          }}
        >
          <Phone>
            {/* Home → query screen: iOS push */}
            {push < 1 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  translate: `${mix(0, -SCREEN_W * 0.3, push)}px 0px`,
                }}
              >
                <Screenshot name="home-light" />
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 50 + 104.5,
                    width: 362,
                    height: 63.5,
                    borderRadius: 12,
                    background: `rgba(0,0,0,${0.07 * storePress})`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `rgba(0,0,0,${0.12 * push})`,
                  }}
                />
              </div>
            ) : null}
            {push > 0 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  translate: `${mix(SCREEN_W, 0, push)}px 0px`,
                  boxShadow: push < 1 ? "-10px 0 30px rgba(0,0,0,0.12)" : undefined,
                }}
              >
                <QueryScreen state={state} />
              </div>
            ) : null}
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A soft violet bloom behind the phone. */
const Glow: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: PHONE_X - 700,
      top: -200,
      width: 1400,
      height: 1400,
      borderRadius: "50%",
      background:
        "radial-gradient(closest-side, rgba(110,86,207,0.16), rgba(110,86,207,0.05) 55%, rgba(110,86,207,0) 100%)",
    }}
  />
);

const titleStyle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 84,
  fontWeight: 600,
  letterSpacing: "-0.04em",
  lineHeight: 1.02,
  color: colors.ink,
};

const subStyle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 38,
  fontWeight: 400,
  letterSpacing: "-0.015em",
  lineHeight: 1.3,
  color: colors.secondary,
  marginTop: 30,
  maxWidth: 680,
};

const Caption: React.FC<{
  start: number;
  end: number;
  eyebrow: string;
  title: React.ComponentProps<typeof KineticText>["content"];
  sub?: string;
}> = ({ start, end, eyebrow, title, sub }) => {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 0,
        bottom: 0,
        width: 780,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Eyebrow start={start} exitAt={end - 10} style={{ marginBottom: 34 }}>
        {eyebrow}
      </Eyebrow>
      <KineticText content={title} start={start + 4} exitAt={end - 10} style={titleStyle} />
      {sub ? (
        <KineticText
          content={sub}
          start={start + 14}
          stagger={1.5}
          rise={16}
          blur={4}
          exitAt={end - 10}
          style={subStyle}
        />
      ) : null}
    </div>
  );
};

const violetSerif = serifAccent(colors.violet);

const Captions: React.FC = () => (
  <>
    <Caption
      start={8}
      end={P.push + 12}
      eyebrow="Connections"
      title={[{ t: "Every database, " }, { t: "\n" }, { t: "one tap away.", style: violetSerif }]}
      sub="Your saved servers, side by side."
    />
    <Caption
      start={P.push + 16}
      end={P.resultsIn - 4}
      eyebrow="SQL editor"
      title="Syntax-highlighted SQL."
      sub="With keyword autocomplete that knows where you are."
    />
    <ResultsCaption start={P.resultsIn} end={P.toBuilder - 2} />
    <Caption
      start={P.toBuilder + 2}
      end={P.backToSql - 2}
      eyebrow="Visual builder"
      title={[{ t: "Or skip the " }, { t: "typing.", style: violetSerif }]}
      sub="Build queries for SQL and MongoDB. Browse the schema, reuse history and snippets."
    />
    <Caption
      start={P.backToSql + 2}
      end={P.alertOut + 6}
      eyebrow="Safety"
      title="Destructive queries ask first."
      sub="UPDATE, DELETE, DROP and friends need a confirm."
    />
    <Caption
      start={P.alertOut + 8}
      end={P.end - 4}
      eyebrow="Transactions"
      title={[
        { t: "Forgot to commit? " },
        { t: "\n" },
        { t: "It rolls back.", style: violetSerif },
      ]}
      sub="Wrapped statements auto-rollback when the timer runs out."
    />
  </>
);

/** "Cards. Table. JSON." stacked; the active view lights up in sync with the phone. */
const ResultsCaption: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const f = useCurrentFrame();
  if (f < start || f >= end) return null;
  const mode = keyed(f, 0, [
    { at: P.toTable, dur: 10, value: 1 },
    { at: P.toJson, dur: 10, value: 2 },
  ]);
  const exit = progress(f, end - 10, 10, ease.in);
  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 0,
        bottom: 0,
        width: 780,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Eyebrow start={start} exitAt={end - 10} style={{ marginBottom: 34 }}>
        Results
      </Eyebrow>
      {["Cards.", "Table.", "JSON."].map((word, i) => {
        const p = progress(f, start + 4 + i * 4, 20);
        const active = Math.max(0, 1 - Math.abs(mode - i));
        return (
          <div
            key={word}
            style={{
              ...titleStyle,
              fontSize: 112,
              lineHeight: 1.04,
              opacity: p * mix(0.16, 1, active) * (1 - exit),
              translate: `${mix(0, 18, active)}px ${mix(28, 0, p)}px`,
              filter: p < 1 ? `blur(${mix(8, 0, p)}px)` : undefined,
              color: active > 0.5 ? colors.ink : colors.ink,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: colors.violet,
                opacity: active,
                scale: `${mix(0.6, 1, active)}`,
                marginLeft: -40,
              }}
            />
            {word}
          </div>
        );
      })}
      <KineticText
        content="One result, three ways to read it."
        start={start + 18}
        stagger={1.5}
        rise={16}
        blur={4}
        exitAt={end - 10}
        style={subStyle}
      />
    </div>
  );
};

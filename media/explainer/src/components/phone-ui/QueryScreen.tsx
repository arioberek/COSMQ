import type React from "react";
import { useCurrentFrame } from "remotion";
import { mix } from "../../lib/anim";
import { tokenizeLines } from "../../lib/sql";
import { colors, fonts } from "../../theme";
import { SAFE_TOP, SCREEN_H, SCREEN_W, Screenshot } from "../Phone";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle,
  Clock,
  ClockFilled,
  Ellipsis,
  Grid,
  Play,
  Spinner,
} from "./icons";

/**
 * The query screen, rebuilt in code so typing, taps and state changes animate
 * crisply. Coordinates are in screen points, measured from the real app
 * screenshots (light theme). Everything below the toolbar that is static
 * (result cards, table, JSON, builder) is cropped from those screenshots.
 *
 * All animated state comes in as numbers so the scene owns the timeline.
 */
export type QueryScreenState = {
  sql: string;
  caret: boolean;
  /** 0 = SQL tab, 1 = Builder tab (thumb position). */
  tab: number;
  /** Builder content crossfade 0..1. */
  builder: number;
  /** Autocomplete popover visibility 0..1 and first-row press 0..1. */
  autocomplete: number;
  autocompletePress: number;
  runPress: number;
  /** Run button → spinner morph 0..1. */
  runExec: number;
  /** Results visibility 0..1 and view mode 0 (Cards) .. 2 (JSON). */
  results: number;
  resultMode: number;
  /** Dangerous-statement alert 0..1, and "Wrap in Transaction" press 0..1. */
  alert: number;
  alertPress: number;
  /** Transaction banner visibility 0..1 and seconds left before auto-rollback. */
  banner: number;
  secondsLeft: number;
};

const Y = (y: number) => SAFE_TOP + y;

export const QueryScreen: React.FC<{ state: QueryScreenState }> = ({ state }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: colors.canvas,
        fontFamily: fonts.ui,
        color: colors.black,
      }}
    >
      <NavBar />
      <MainTabs tab={state.tab} />

      {/* SQL tab content */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - state.builder }}>
        <Editor sql={state.sql} caret={state.caret} />
        <Toolbar runPress={state.runPress} runExec={state.runExec} />
        <Results visible={state.results} mode={state.resultMode} />
        <TransactionBanner visible={state.banner} secondsLeft={state.secondsLeft} />
      </div>

      {/* Builder tab content, cropped from the real screen below the tabs */}
      {state.builder > 0 ? (
        <Screenshot
          name="builder-light"
          cropTop={106}
          style={{
            opacity: state.builder,
            filter: state.builder < 1 ? `blur(${mix(4, 0, state.builder)}px)` : undefined,
          }}
        />
      ) : null}

      <Autocomplete visible={state.autocomplete} press={state.autocompletePress} />
      <Alert visible={state.alert} press={state.alertPress} />
    </div>
  );
};

const NavBar: React.FC = () => (
  <>
    <ArrowLeft
      size={22}
      color={colors.violet}
      strokeWidth={2.2}
      style={{ position: "absolute", left: 15, top: Y(21) }}
    />
    <div
      style={{
        position: "absolute",
        left: 57,
        top: Y(18),
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
    >
      Store
    </div>
    <Clock
      size={21}
      color={colors.violet}
      strokeWidth={1.8}
      style={{ position: "absolute", left: 279, top: Y(21.5) }}
    />
    <Bookmark
      size={21}
      color={colors.violet}
      strokeWidth={1.8}
      style={{ position: "absolute", left: 323, top: Y(21.5) }}
    />
    <Ellipsis
      size={21}
      color={colors.violet}
      strokeWidth={1.8}
      style={{ position: "absolute", left: 367, top: Y(21.5) }}
    />
  </>
);

/** iOS segmented control with a sliding thumb. */
const Segmented: React.FC<{
  labels: string[];
  value: number;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}> = ({ labels, value, left, top, width, height, fontSize }) => {
  const seg = (width - 4) / labels.length;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: 9,
        background: "rgba(118, 118, 128, 0.12)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 2 + value * seg,
          top: 2,
          width: seg,
          height: height - 4,
          borderRadius: 7,
          background: colors.white,
          boxShadow: "0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)",
        }}
      />
      {labels.map((label, i) => {
        const active = Math.max(0, 1 - Math.abs(value - i));
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 2 + i * seg,
              top: 0,
              width: seg,
              height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize,
              fontWeight: active > 0.5 ? 600 : 400,
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

const MainTabs: React.FC<{ tab: number }> = ({ tab }) => (
  <Segmented
    labels={["SQL", "Builder"]}
    value={tab}
    left={16}
    top={Y(72.5)}
    width={362}
    height={31.5}
    fontSize={15}
  />
);

const LINE_H = 22;

const Editor: React.FC<{ sql: string; caret: boolean }> = ({ sql, caret }) => {
  const lines = tokenizeLines(sql);
  const lastLine = lines[lines.length - 1];
  const caretCol = lastLine.reduce((n, t) => n + t.text.length, 0);
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        top: Y(116),
        width: 362,
        height: 140,
        borderRadius: 12,
        background: colors.surface,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 15,
          top: 12,
          fontFamily: fonts.code,
          fontSize: 15,
          lineHeight: `${LINE_H}px`,
          whiteSpace: "pre",
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ height: LINE_H }}>
            {line.map((t, j) => (
              <span key={j} style={{ color: t.color }}>
                {t.text}
              </span>
            ))}
          </div>
        ))}
        {caret ? (
          <div
            style={{
              position: "absolute",
              // JetBrains Mono advance width is 0.6em.
              left: caretCol * 15 * 0.6 - 0.5,
              top: (lines.length - 1) * LINE_H + 2,
              width: 2,
              height: 18,
              borderRadius: 1,
              background: colors.violet,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

const Toolbar: React.FC<{ runPress: number; runExec: number }> = ({ runPress, runExec }) => {
  const frame = useCurrentFrame();
  const width = mix(89, 44, runExec);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 16,
          top: Y(274),
          width: 92,
          height: 32,
          borderRadius: 16,
          background: "rgba(118, 118, 128, 0.12)",
          display: "flex",
          alignItems: "center",
          gap: 7,
          paddingLeft: 12,
          fontSize: 16,
        }}
      >
        <Grid size={15} color={colors.black} strokeWidth={1.7} />
        Tables
      </div>
      <div
        style={{
          position: "absolute",
          left: 378 - width,
          top: Y(268),
          width,
          height: 44,
          borderRadius: mix(12, 22, runExec),
          background: colors.violet,
          filter: runPress > 0 ? `brightness(${mix(1, 0.86, runPress)})` : undefined,
          scale: `${mix(1, 0.97, runPress)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: colors.white,
            fontSize: 18,
            fontWeight: 600,
            opacity: 1 - Math.min(1, runExec * 2.5),
            scale: `${mix(1, 0.9, Math.min(1, runExec * 2))}`,
            whiteSpace: "nowrap",
          }}
        >
          <Play size={15} color={colors.white} />
          Run
        </div>
        {runExec > 0 ? (
          <div style={{ position: "absolute", opacity: Math.max(0, runExec * 2 - 1) }}>
            <Spinner size={20} color={colors.white} frame={frame} />
          </div>
        ) : null}
      </div>
    </>
  );
};

const RESULT_SCREENS = ["results-cards-light", "results-table-light", "results-json-light"];

const Results: React.FC<{ visible: number; mode: number }> = ({ visible, mode }) => {
  if (visible <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visible,
        translate: `0px ${mix(14, 0, visible)}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 17,
          top: Y(335),
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 15,
          color: "rgba(60, 60, 67, 0.6)",
        }}
      >
        <CheckCircle size={14} color="#34c759" />5 rows · 15 ms
      </div>
      <Segmented
        labels={["Cards", "Table", "JSON"]}
        value={mode}
        left={191.6}
        top={Y(328.5)}
        width={186.4}
        height={32}
        fontSize={15.5}
      />
      {RESULT_SCREENS.map((name, i) => {
        const o = Math.max(0, 1 - Math.abs(mode - i));
        if (o <= 0) return null;
        return (
          <Screenshot
            key={name}
            name={name}
            cropTop={362}
            style={{ opacity: o, filter: o < 1 ? `blur(${mix(5, 0, o)}px)` : undefined }}
          />
        );
      })}
    </div>
  );
};

const Autocomplete: React.FC<{ visible: number; press: number }> = ({ visible, press }) => {
  if (visible <= 0) return null;
  const rows = ["ORDER BY", "ORDER"];
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        width: 362,
        top: Y(116 - 6 - 88),
        height: 88,
        borderRadius: 12,
        background: colors.white,
        border: "0.5px solid rgba(60,60,67,0.18)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
        overflow: "hidden",
        // Appears with typing, so no animation in the app; a 2-frame fade here.
        opacity: visible,
      }}
    >
      {rows.map((row, i) => (
        <div
          key={row}
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            fontFamily: fonts.code,
            fontSize: 15,
            borderBottom: i === 0 ? "0.5px solid rgba(60,60,67,0.29)" : undefined,
            background: i === 0 ? `rgba(118,118,128,${0.2 * press})` : undefined,
          }}
        >
          <span style={{ color: colors.violet, fontWeight: 700 }}>ORD</span>
          {row.slice(3)}
        </div>
      ))}
    </div>
  );
};

const Alert: React.FC<{ visible: number; press: number }> = ({ visible, press }) => {
  if (visible <= 0) return null;
  const hairline = "0.5px solid rgba(60, 60, 67, 0.29)";
  const button: React.CSSProperties = {
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    borderTop: hairline,
    letterSpacing: "-0.02em",
  };
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.2 * visible})` }} />
      <div
        style={{
          position: "absolute",
          left: (SCREEN_W - 270) / 2,
          top: SCREEN_H / 2 - 128,
          width: 270,
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(242, 242, 247, 0.97)",
          opacity: visible,
          scale: `${mix(1.08, 1, visible)}`,
          textAlign: "center",
        }}
      >
        <div style={{ padding: "19px 16px 18px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>Run DELETE?</div>
          <div style={{ fontSize: 13, lineHeight: "17px", marginTop: 3 }}>
            This statement may modify or destroy data. Wrapping it in a transaction lets you roll
            back if it goes wrong.
          </div>
        </div>
        <div
          style={{
            ...button,
            color: colors.iosBlue,
            background: `rgba(118,118,128,${0.22 * press})`,
          }}
        >
          Wrap in Transaction
        </div>
        <div style={{ ...button, color: colors.iosRed }}>Run Anyway</div>
        <div style={{ ...button, color: colors.iosBlue, fontWeight: 600 }}>Cancel</div>
      </div>
    </>
  );
};

const TransactionBanner: React.FC<{ visible: number; secondsLeft: number }> = ({
  visible,
  secondsLeft,
}) => {
  if (visible <= 0) return null;
  const small: React.CSSProperties = {
    height: 30,
    padding: "0 12px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    fontSize: 15,
    fontWeight: 600,
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        top: Y(326),
        width: 362,
        borderRadius: 12,
        padding: 14,
        background: colors.warningMuted,
        opacity: visible,
        translate: `0px ${mix(8, 0, visible)}px`,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ marginTop: 1 }}>
          <ClockFilled size={20} color={colors.warning} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: colors.warning,
                letterSpacing: "-0.02em",
              }}
            >
              Transaction Open
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.warning }}>Hide</div>
          </div>
          <div
            style={{ fontSize: 13, lineHeight: "18px", color: "rgba(60,60,67,0.6)", marginTop: 2 }}
          >
            Auto-rollback in{" "}
            <span
              style={{ color: colors.warning, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {secondsLeft}s
            </span>
            . Commit to keep the changes, or roll back to undo them.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <div style={{ ...small, background: colors.dangerMuted, color: colors.danger }}>
          Roll Back
        </div>
        <div style={{ ...small, background: "rgba(110, 86, 207, 0.12)", color: colors.violet }}>
          Commit
        </div>
      </div>
    </div>
  );
};

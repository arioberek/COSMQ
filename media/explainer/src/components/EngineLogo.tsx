import type React from "react";
import { Img, staticFile } from "remotion";
import { ALIEN_PATHS, ALIEN_VIEWBOX, ENGINE_PATHS } from "../assets/paths";

export type Engine = {
  id: string;
  name: string;
  /** Brand color used to tint the monochrome logo. */
  color: string;
};

/** The databases COSMQ talks to directly (logos from apps/mobile/assets/icons). */
export const ENGINES: Engine[] = [
  { id: "postgresql", name: "PostgreSQL", color: "#336791" },
  { id: "mysql", name: "MySQL", color: "#00758f" },
  { id: "mariadb", name: "MariaDB", color: "#003545" },
  { id: "cockroachdb", name: "CockroachDB", color: "#6933ff" },
  { id: "mongodb", name: "MongoDB", color: "#47a248" },
  { id: "sqlite", name: "SQLite", color: "#0f80cc" },
];

/** A monochrome engine logo (Simple Icons path), tinted with any color. */
export const EngineLogo: React.FC<{
  id: string;
  color: string;
  size: number;
  style?: React.CSSProperties;
}> = ({ id, color, size, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d={ENGINE_PATHS[id]} fill={color} />
  </svg>
);

/** The COSMQ alien mascot, drawn in a single color. */
export const Alien: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({
  size,
  color,
  style,
}) => (
  <svg width={size} viewBox={ALIEN_VIEWBOX} style={{ color, ...style }}>
    {ALIEN_PATHS.map((p, i) => (
      <path key={i} d={p.d} fill={p.fill} />
    ))}
  </svg>
);

/** The app icon as an iOS-style rounded tile. */
export const AppIcon: React.FC<{ size: number; dark?: boolean; style?: React.CSSProperties }> = ({
  size,
  dark = false,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.2237,
      overflow: "hidden",
      flexShrink: 0,
      ...style,
    }}
  >
    <Img
      src={staticFile(dark ? "brand/icon-dark.png" : "brand/icon.png")}
      style={{ width: size, height: size, display: "block" }}
    />
  </div>
);

import type React from "react";

type IconProps = { size: number; color: string; strokeWidth?: number; style?: React.CSSProperties };

const Stroke: React.FC<IconProps & { children: React.ReactNode }> = ({
  size,
  color,
  strokeWidth = 2,
  style,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

export const ArrowLeft: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Stroke>
);

export const Clock: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Stroke>
);

export const Bookmark: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </Stroke>
);

export const Ellipsis: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="12" r="0.6" fill={p.color} />
    <circle cx="12" cy="12" r="0.6" fill={p.color} />
    <circle cx="16" cy="12" r="0.6" fill={p.color} />
  </Stroke>
);

export const Grid: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Stroke>
);

export const Play: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M6 4.2v15.6a1 1 0 0 0 1.5.86l13-7.8a1 1 0 0 0 0-1.72l-13-7.8A1 1 0 0 0 6 4.2Z"
      fill={color}
    />
  </svg>
);

export const CheckCircle: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={color} />
    <path
      d="m7 12.5 3.2 3.2L17 9"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClockFilled: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={color} />
    <path
      d="M12 6.5V12l3.5 2"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** iOS-style activity indicator: 8 spokes, rotating in steps. */
export const Spinner: React.FC<{ size: number; color: string; frame: number }> = ({
  size,
  color,
  frame,
}) => {
  const step = Math.floor(frame / 2) % 8;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="12"
          y1="3"
          x2="12"
          y2="7.5"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity={0.25 + 0.75 * (((i - step + 8) % 8) / 7)}
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </svg>
  );
};

// Lucide-style icons for the privacy beat.
export const KeyIcon: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r=".5" fill={p.color} />
  </Stroke>
);

export const FaceIcon: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
  </Stroke>
);

export const EyeOffIcon: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </Stroke>
);

export const CodeIcon: React.FC<IconProps> = (p) => (
  <Stroke {...p}>
    <path d="m16 18 6-6-6-6" />
    <path d="m8 6-6 6 6 6" />
  </Stroke>
);

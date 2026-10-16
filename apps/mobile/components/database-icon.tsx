import { type FC, memo } from "react";
import type { SvgProps } from "react-native-svg";
import { useTheme, YStack } from "tamagui";
import CockroachdbIcon from "../assets/icons/cockroachdb.svg";
import MariadbIcon from "../assets/icons/mariadb.svg";
import MongodbIcon from "../assets/icons/mongodb.svg";
import MysqlIcon from "../assets/icons/mysql.svg";
import PostgresqlIcon from "../assets/icons/postgresql.svg";
import SqliteIcon from "../assets/icons/sqlite.svg";
import { CONNECTION_COLORS, type DatabaseType } from "../lib/types";

const DATABASE_ICONS: Record<DatabaseType, FC<SvgProps>> = {
  postgres: PostgresqlIcon,
  mysql: MysqlIcon,
  mariadb: MariadbIcon,
  sqlite: SqliteIcon,
  cockroachdb: CockroachdbIcon,
  mongodb: MongodbIcon,
};

type DatabaseIconProps = {
  type: DatabaseType;
  size?: number;
  color?: string;
};

/** Monochrome database logo, filled with `color` (defaults to the label color). */
export const DatabaseIcon: FC<DatabaseIconProps> = memo(function DatabaseIcon({
  type,
  size = 32,
  color,
}) {
  const theme = useTheme();
  const Icon = DATABASE_ICONS[type];
  const fillColor = color ?? theme.color.val;
  return <Icon width={size} height={size} fill={fillColor} />;
});

type DatabaseTileProps = {
  type: DatabaseType;
  /** Tile edge length in points. The logo and corner radius scale with it. */
  size?: number;
  /** Connection color tag. Tagged tiles are filled with it and show a white logo. */
  tag?: string;
};

const isConnectionColor = (value: string | undefined): value is string =>
  !!value && (CONNECTION_COLORS as readonly string[]).includes(value);

/** App-icon style tile: the database logo on a rounded square ($fill or the color tag). */
export const DatabaseTile: FC<DatabaseTileProps> = memo(function DatabaseTile({
  type,
  size = 36,
  tag,
}) {
  const theme = useTheme();
  const tint = isConnectionColor(tag) ? tag : null;

  return (
    <YStack
      width={size}
      height={size}
      borderRadius={Math.round(size * 0.235)}
      style={{ borderCurve: "continuous" }}
      alignItems="center"
      justifyContent="center"
      backgroundColor={tint ?? "$fill"}
    >
      <DatabaseIcon
        type={type}
        size={Math.round(size * 0.56)}
        color={tint ? theme.textOnAccent.val : theme.color.val}
      />
    </YStack>
  );
});

import type React from "react";
import PostgresIcon from '../assets/icons/postgresql.svg';
import MysqlIcon from '../assets/icons/mysql.svg';
import MariadbIcon from '../assets/icons/mariadb.svg';
import SqliteIcon from '../assets/icons/sqlite.svg';
import CockroachIcon from '../assets/icons/cockroachdb.svg';
import MongoIcon from '../assets/icons/mongodb.svg';

type IconProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const Icons = {
  postgresql: (props: IconProps) => (
    <img src={PostgresIcon.src} alt="PostgreSQL" {...props} />
  ),
  mysql: (props: IconProps) => (
    <img src={MysqlIcon.src} alt="MySQL" {...props} />
  ),
  mariadb: (props: IconProps) => (
    <img src={MariadbIcon.src} alt="MariaDB" {...props} />
  ),
  sqlite: (props: IconProps) => (
    <img src={SqliteIcon.src} alt="SQLite" {...props} />
  ),
  cockroachdb: (props: IconProps) => (
    <img src={CockroachIcon.src} alt="CockroachDB" {...props} />
  ),
  mongodb: (props: IconProps) => (
    <img src={MongoIcon.src} alt="MongoDB" {...props} />
  ),
};

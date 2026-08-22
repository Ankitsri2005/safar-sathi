import type { Knex } from "knex";
import path from "path";
import { config } from "./index";

const connection = config.db.connectionString
  ? { connectionString: config.db.connectionString, ssl: config.db.ssl }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: config.db.ssl,
    };

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: config.db.connectionString
      ? { connectionString: config.db.connectionString }
      : {
          host: config.db.host,
          port: config.db.port,
          database: config.db.name,
          user: config.db.user,
          password: config.db.password,
        },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, "../../migrations"),
      extension: "ts",
    },
    seeds: {
      directory: path.resolve(__dirname, "../../seeds"),
      extension: "ts",
    },
  },

  production: {
    client: "pg",
    connection,
    pool: { min: 2, max: 20 },
    migrations: {
      directory: path.resolve(__dirname, "../../migrations"),
      extension: "ts",
    },
    seeds: {
      directory: path.resolve(__dirname, "../../seeds"),
      extension: "ts",
    },
  },
};

export default knexConfig;

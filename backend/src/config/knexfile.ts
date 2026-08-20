import type { Knex } from "knex";
import { config } from "./index";

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: "../../migrations",
      extension: "ts",
    },
    seeds: {
      directory: "../../seeds",
      extension: "ts",
    },
  },

  production: {
    client: "pg",
    connection: {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 20 },
    migrations: {
      directory: "../../migrations",
      extension: "ts",
    },
  },
};

export default knexConfig;

import knex from "knex";
import knexConfig from "./knexfile";
import { config } from "./index";

const env = config.nodeEnv === "production" ? "production" : "development";
const db = knex(knexConfig[env] || knexConfig.development);

export default db;

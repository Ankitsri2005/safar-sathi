import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`[FATAL] Missing required environment variable: ${name}. Set it in your .env file.`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",

  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "smart_tourist_safety",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },

  jwt: {
    secret: requireEnv("JWT_SECRET", "dev-secret-do-not-use-in-production"),
    expiresIn: process.env.JWT_EXPIRES_IN || "24h", // 24h default, not 7d
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-encryption-key",
  },

  blockchain: {
    salt: process.env.BLOCKCHAIN_SALT || "dev-salt",
  },

  uploadDir: process.env.UPLOAD_DIR || "./uploads",

  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || "",

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};

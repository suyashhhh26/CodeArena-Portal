/* ──────────────────────────────────────────────────────────────
   Centralised application configuration
   ────────────────────────────────────────────────────────────── */
module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  jwt: {
    secret: process.env.JWT_SECRET || "fallback_dev_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  db: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "codearena",
  },
};

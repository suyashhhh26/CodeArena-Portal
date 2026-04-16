/* ──────────────────────────────────────────────────────────────
   MySQL Connection Pool (mysql2 — promise wrapper)
   ────────────────────────────────────────────────────────────── */
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "codearena",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Verify the database connection on startup.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅  MySQL connected — database:", process.env.DB_NAME);
    connection.release();
  } catch (err) {
    console.error("❌  MySQL connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };

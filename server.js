/* ──────────────────────────────────────────────────────────────
   CodeArena — Entry Point (Hackathon Discovery Platform)
   ────────────────────────────────────────────────────────────── */
require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const morgan       = require("morgan");
const cookieParser = require("cookie-parser");
const path         = require("path");

const { testConnection } = require("./backend/config/db");
const errorHandler       = require("./backend/middleware/errorHandler");

// ─── Route imports ───────────────────────────────────────────
const authRoutes       = require("./backend/routes/authRoutes");
const hackathonRoutes  = require("./backend/routes/hackathonRoutes");
const savedRoutes      = require("./backend/routes/savedRoutes");
const teamRoutes       = require("./backend/routes/teamRoutes");
const adminRoutes      = require("./backend/routes/adminRoutes");
const organizerRoutes  = require("./backend/routes/organizerRoutes");
const userRoutes      = require("./backend/routes/userRoutes");
const aiRoutes         = require("./backend/routes/aiRoutes");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Global middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// ─── Serve static frontend files ─────────────────────────────
app.use(express.static(path.join(__dirname, "frontend")));

// ─── API routes ──────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/saved",      savedRoutes);
app.use("/api/teams",      teamRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/organizer",  organizerRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/ai",         aiRoutes);

// ─── Catch-all: serve the landing page ──────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "pages", "index.html"));
});

// ─── Central error handler ──────────────────────────────────
app.use(errorHandler);

// ─── Boot ────────────────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀  CodeArena server running → http://localhost:${PORT}\n`);
  });
}

start();

// Server started and listening for changes!

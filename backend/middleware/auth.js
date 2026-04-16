/* ──────────────────────────────────────────────────────────────
   JWT Authentication Middleware
   ────────────────────────────────────────────────────────────── */
const jwt = require("jsonwebtoken");
const config = require("../config/config");

/**
 * Protect routes — verifies the Bearer token from the
 * Authorization header or the httpOnly "token" cookie.
 */
function protect(req, res, next) {
  let token = null;

  // 1. Check Authorization header (Bearer <token>)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Fallback to httpOnly cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorised — please log in",
      code: "NO_TOKEN",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, username, role, iat, exp }
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Session expired — please log in again"
        : "Invalid token — please log in again";

    return res.status(401).json({
      success: false,
      message,
      code: err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
    });
  }
}

/**
 * Restrict access to specific roles.
 * Usage: authorise("admin")
 */
function authorise(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — insufficient permissions",
        code: "FORBIDDEN",
      });
    }
    next();
  };
}

module.exports = { protect, authorise };

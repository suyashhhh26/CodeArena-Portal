/* ──────────────────────────────────────────────────────────────
   Input Validation Middleware
   ────────────────────────────────────────────────────────────── */

/**
 * Validates registration input.
 */
function validateRegister(req, res, next) {
  const { username, email, password } = req.body;
  const errors = [];

  // Username
  if (!username || typeof username !== "string") {
    errors.push("Username is required");
  } else {
    const trimmed = username.trim();
    if (trimmed.length < 3) errors.push("Username must be at least 3 characters");
    if (trimmed.length > 30) errors.push("Username must be 30 characters or less");
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Email
  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) errors.push("Please enter a valid email address");
  }

  // Password
  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else {
    if (password.length < 6)   errors.push("Password must be at least 6 characters");
    if (password.length > 128) errors.push("Password must be 128 characters or less");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  next();
}

/**
 * Validates login input.
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push("Email is required");
  }

  if (!password || typeof password !== "string" || !password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  next();
}

module.exports = { validateRegister, validateLogin };

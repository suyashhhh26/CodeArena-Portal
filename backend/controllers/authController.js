/* ──────────────────────────────────────────────────────────────
   Auth Controller — register / login / logout / me
   ────────────────────────────────────────────────────────────── */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");

/** Generate a signed JWT for the given user. */
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/** Set JWT as an httpOnly cookie + return it in the JSON body. */
function sendTokenResponse(res, statusCode, user) {
  const token = signToken(user);

  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        score: user.score || 0,
      },
    });
}

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role, college } = req.body;

    // Check duplicates
    const existingEmail = await User.findByEmail(email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    const existingUsername = await User.findByUsername(username.trim());
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    // Hash password (cost factor 12)
    const password_hash = await bcrypt.hash(password, 12);

    const result = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: role || 'student',
      college: college || null
    });

    const userId = result.insertId;

    // If role is organizer, add an entry to organizers table
    if (role === 'organizer') {
      const { pool } = require("../config/db");
      await pool.execute(
        "INSERT INTO organizers (user_id, org_name) VALUES (?, ?)",
        [userId, college || username.trim()]
      );
    }

    const newUser = await User.findById(userId);
    sendTokenResponse(res, 201, newUser);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    sendTokenResponse(res, 200, user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = (_req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      expires: new Date(0), // expire immediately
    })
    .json({ success: true, message: "Logged out successfully" });
};

/**
 * GET /api/auth/me   (protected)
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id:          user.id,
        username:    user.username,
        email:       user.email,
        role:        user.role,
        bio:         user.bio,
        skills:      user.skills,
        avatar_url:  user.avatar_url,
        github_url:  user.github_url,
        linkedin_url:user.linkedin_url,
        created_at:  user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile  (protected)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { bio, skills, college, interests, avatar_url, github_url, linkedin_url, resume_url } = req.body;
    await User.updateProfile(req.user.id, {
      bio:         bio || null,
      skills:      skills || null,
      college:     college || null,
      interests:   interests || null,
      avatar_url:  avatar_url || null,
      github_url:  github_url || null,
      linkedin_url:linkedin_url || null,
      resume_url:  resume_url || null,
    });
    const updated = await User.findById(req.user.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
};

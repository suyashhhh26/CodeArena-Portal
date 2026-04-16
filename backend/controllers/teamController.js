/* ──────────────────────────────────────────────────────────────
   Team Controller — posts & requests
   ────────────────────────────────────────────────────────────── */
const TeamPost    = require("../models/TeamPost");
const TeamRequest = require("../models/TeamRequest");

/** GET /api/teams */
exports.getAllPosts = async (req, res, next) => {
  try {
    const { status, hackathonId, skills, search } = req.query;
    const filters = { status: status || "open" };
    if (hackathonId) filters.hackathonId = hackathonId;
    if (skills)      filters.skills      = skills;
    if (search)      filters.search      = search;

    const posts = await TeamPost.findAll(filters);
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) { next(err); }
};

/** GET /api/teams/:id */
exports.getPost = async (req, res, next) => {
  try {
    const post = await TeamPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Team post not found" });

    // Include requests only if the viewer is the owner
    let requests = [];
    if (req.user && req.user.id === post.owner_id) {
      requests = await TeamRequest.findByPost(post.id);
    }

    res.json({ success: true, data: { ...post, requests } });
  } catch (err) { next(err); }
};

/** POST /api/teams */
exports.createPost = async (req, res, next) => {
  try {
    const result = await TeamPost.create({ ...req.body, owner_id: req.user.id });
    const created = await TeamPost.findById(result.insertId);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

/** POST /api/teams/:id/request */
exports.requestToJoin = async (req, res, next) => {
  try {
    const post = await TeamPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.owner_id === req.user.id)
      return res.status(400).json({ success: false, message: "You own this post" });
    if (post.status !== "open")
      return res.status(400).json({ success: false, message: "This team is no longer recruiting" });

    const already = await TeamRequest.hasRequested(post.id, req.user.id);
    if (already) return res.status(409).json({ success: false, message: "You already requested to join" });

    await TeamRequest.create({ post_id: post.id, requester_id: req.user.id, message: req.body.message });
    res.status(201).json({ success: true, message: "Join request sent" });
  } catch (err) { next(err); }
};

/** PATCH /api/teams/requests/:requestId */
exports.respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ success: false, message: "Status must be accepted or rejected" });

    await TeamRequest.updateStatus(req.params.requestId, status);

    // If accepted, increment member count
    if (status === "accepted") {
      // fetch request to get post id
      const [rows] = await require("../config/db").pool.execute(
        `SELECT * FROM team_requests WHERE id = ?`, [req.params.requestId]
      );
      if (rows[0]) {
        await require("../config/db").pool.execute(
          `UPDATE team_posts SET current_members = current_members + 1 WHERE id = ?`,
          [rows[0].post_id]
        );
      }
    }

    res.json({ success: true, message: `Request ${status}` });
  } catch (err) { next(err); }
};

/** GET /api/teams/my-posts */
exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await TeamPost.findByOwner(req.user.id);
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) { next(err); }
};

/** GET /api/teams/my-requests */
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await TeamRequest.findByRequester(req.user.id);
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) { next(err); }
};

/** DELETE /api/teams/:id */
exports.deletePost = async (req, res, next) => {
  try {
    const post = await TeamPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.owner_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Not authorised" });

    await TeamPost.delete(req.params.id);
    res.json({ success: true, message: "Post deleted" });
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════════════
   CodeArena — Dashboard JS
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isLoggedIn()) {
    document.getElementById("auth-gate").classList.remove("hidden");
    document.getElementById("dashboard-layout").style.display = "none";
    return;
  }

  const user = Auth.getUser();

  // Sidebar profile
  document.getElementById("sidebar-avatar").textContent = (user.username || "U")[0].toUpperCase();
  document.getElementById("sidebar-name").textContent   = user.username;
  document.getElementById("sidebar-role").textContent   = user.role === "admin" ? "Administrator" : "Member";

  // Logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    Auth.clear();
    window.location.href = "/pages/index.html";
  });

  // Tab navigation
  const tabs = {
    "tab-saved":           "section-saved",
    "tab-registrations":   "section-registrations",
    "tab-deadlines":       "section-deadlines",
    "tab-recommendations": "section-recommendations",
    "tab-my-posts":        "section-my-posts",
    "tab-my-requests":     "section-my-requests",
    "tab-incoming":        "section-incoming",
    "tab-profile":         "section-profile",
  };
  Object.entries(tabs).forEach(([tabId, secId]) => {
    document.getElementById(tabId)?.addEventListener("click", (e) => {
      e.preventDefault();
      activateTab(tabId, secId);
    });
  });

  // Load all data
  await Promise.all([
    loadSaved(), 
    loadRegistrations(), 
    loadMyPosts(), 
    loadMyRequests(), 
    loadIncoming(), 
    loadProfile()
  ]);

  // Default tab
  activateTab("tab-saved", "section-saved");

  // Profile form
  document.getElementById("profile-form")?.addEventListener("submit", saveProfile);
});

function activateTab(tabId, secId) {
  // Deactivate all
  document.querySelectorAll(".sidebar__link").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".dash-section").forEach(el => el.style.display = "none");

  // Activate target
  document.getElementById(tabId)?.classList.add("active");
  const sec = document.getElementById(secId);
  if (sec) sec.style.display = "";
}

/* ─── Load Saved Hackathons ─── */
async function loadSaved() {
  const list = document.getElementById("saved-list");
  const badge = document.getElementById("saved-count-badge");
  const statEl = document.getElementById("stat-saved");
  const deadlineList = document.getElementById("deadlines-list");

  try {
    const res = await apiFetch("/api/saved");
    const items = res.data || [];

    badge.textContent = items.length;
    statEl.textContent = items.length;

    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔖</div><h3 class="empty-state__title">No saved hackathons</h3><p><a href="/pages/hackathons.html" style="color:var(--clr-cyan)">Discover hackathons →</a></p></div>`;
    } else {
      list.innerHTML = items.map(h => {
        const deadline = formatCountdownInline(h.registration_end);
        return `
          <div class="saved-item">
            <span class="saved-item__icon">${getHackEmoji(h)}</span>
            <div class="saved-item__info">
              <div class="saved-item__title">${h.title}</div>
              <div class="saved-item__meta">${h.organizer} · ${deadline.text}</div>
            </div>
            <div class="saved-item__actions">
              <a href="/pages/hackathon-detail.html?id=${h.id}" class="btn btn--ghost btn--sm">View</a>
              <button class="btn btn--danger btn--sm unsave-btn" data-id="${h.id}">Remove</button>
            </div>
          </div>
        `;
      }).join("");

      // Unsave buttons
      list.querySelectorAll(".unsave-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          try {
            await apiFetch(`/api/saved/${btn.dataset.id}`, { method: "POST" });
            showToast("Removed from saved", "info");
            loadSaved();
          } catch { showToast("Error removing", "error"); }
        });
      });
    }

    // Deadlines (upcoming within 30 days)
    const upcoming = items
      .filter(h => new Date(h.registration_end) > new Date())
      .sort((a,b) => new Date(a.registration_end) - new Date(b.registration_end));

    document.getElementById("stat-deadlines").textContent = upcoming.length;

    if (!upcoming.length) {
      deadlineList.innerHTML = `<div class="empty-state"><div class="empty-state__icon">✅</div><h3 class="empty-state__title">No upcoming deadlines</h3></div>`;
    } else {
      deadlineList.innerHTML = upcoming.map(h => {
        const {text, urgent} = formatCountdownInline(h.registration_end);
        return `
          <div class="deadline-item${urgent ? " urgent" : ""}">
            <div style="flex:1">
              <div class="deadline-item__title">${h.title}</div>
              <div class="deadline-item__date">Closes: ${formatDateTime(h.registration_end)}</div>
            </div>
            <div class="deadline-item__countdown">
              <span class="badge ${urgent ? "badge--red" : "badge--cyan"}">${text}</span>
            </div>
          </div>
        `;
      }).join("");
    }
    loadRecommendations(items.map(h => h.id));
  } catch (err) {
    list.innerHTML = `<p style="color:var(--clr-red)">Error: ${err.message}</p>`;
  }
}

/* ─── My Registered Hackathons ─── */
async function loadRegistrations() {
    const el = document.getElementById("registrations-list");
    const statEl = document.getElementById("stat-registrations");
    try {
        const res = await apiFetch("/api/users/me/registrations"); // I need to create this endpoint
        const items = res.data || [];
        if(statEl) statEl.textContent = items.length;

        if (!items.length) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🚀</div><h3 class="empty-state__title">Not registered for any events</h3><p><a href="/pages/hackathons.html" style="color:var(--clr-cyan)">Browse active hackathons →</a></p></div>`;
            return;
        }

        el.innerHTML = items.map(h => `
            <div class="saved-item">
                <span class="saved-item__icon">${getHackEmoji(h)}</span>
                <div class="saved-item__info">
                    <div class="saved-item__title">${h.title}</div>
                    <div class="saved-item__meta">${h.organizer} · Status: <span class="badge ${h.status==='approved'?'badge--green':'badge--yellow'}">${h.status}</span></div>
                </div>
                <div class="saved-item__actions">
                    <a href="/pages/hackathon-detail.html?id=${h.id}" class="btn btn--primary btn--sm">View Portal</a>
                </div>
            </div>
        `).join("");
    } catch {}
}

/* ─── Recommendations ─── */
async function loadRecommendations(savedIds = []) {
  const el = document.getElementById("recommendations-list");
  try {
    const res = await apiFetch("/api/hackathons?featured=true");
    const recs = (res.data || []).filter(h => !savedIds.includes(h.id)).slice(0, 4);

    if (!recs.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:span 2"><div class="empty-state__icon">✨</div><h3 class="empty-state__title">You've seen everything!</h3><p>Check back soon for new listings.</p></div>`;
      return;
    }
    el.innerHTML = recs.map(h => {
      const deadline = formatCountdownInline(h.registration_end);
      return `
        <div class="saved-item" style="cursor:pointer" onclick="location.href='/pages/hackathon-detail.html?id=${h.id}'">
          <span class="saved-item__icon">${getHackEmoji(h)}</span>
          <div class="saved-item__info">
            <div class="saved-item__title">${h.title}</div>
            <div class="saved-item__meta">${h.organizer} · ${h.mode} · ${deadline.text}</div>
          </div>
          <span class="badge badge--cyan">Featured</span>
        </div>
      `;
    }).join("");
  } catch {}
}

/* ─── My Team Posts ─── */
async function loadMyPosts() {
  const el     = document.getElementById("my-posts-list");
  const statEl = document.getElementById("stat-posts");
  try {
    const res   = await apiFetch("/api/teams/user/my-posts");
    const posts = res.data || [];
    statEl.textContent = posts.length;

    if (!posts.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">👥</div><h3 class="empty-state__title">No team posts yet</h3><p><a href="/pages/team-finder.html" style="color:var(--clr-cyan)">Create a team post →</a></p></div>`;
      return;
    }
    el.innerHTML = posts.map(p => `
      <div class="saved-item">
        <span class="saved-item__icon">👥</span>
        <div class="saved-item__info">
          <div class="saved-item__title">${p.title}</div>
          <div class="saved-item__meta">${p.hackathon_name || "General"} · ${p.status} · ${p.current_members}/${p.team_size_max} members</div>
        </div>
        <div class="saved-item__actions">
          <span class="badge ${p.status==="open"?"badge--green":"badge--red"}">${p.status}</span>
        </div>
      </div>
    `).join("");
  } catch {}
}

/* ─── My Join Requests ─── */
async function loadMyRequests() {
  const el     = document.getElementById("my-requests-list");
  const statEl = document.getElementById("stat-requests");
  try {
    const res  = await apiFetch("/api/teams/user/my-requests");
    const reqs = res.data || [];
    statEl.textContent = reqs.length;

    if (!reqs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📬</div><h3 class="empty-state__title">No join requests sent</h3><p><a href="/pages/team-finder.html" style="color:var(--clr-cyan)">Browse teams →</a></p></div>`;
      return;
    }
    const statusColor = { pending:"badge--yellow", accepted:"badge--green", rejected:"badge--red" };
    el.innerHTML = reqs.map(r => `
      <div class="team-request-item">
        <div class="team-request-item__avatar">${(r.owner_name||"?")[0].toUpperCase()}</div>
        <div class="team-request-item__info">
          <div class="team-request-item__name">${r.post_title}</div>
          <div class="team-request-item__meta">Owner: ${r.owner_name}</div>
        </div>
        <span class="badge ${statusColor[r.status]||"badge--cyan"}">${r.status}</span>
      </div>
    `).join("");
  } catch {}
}

/* ─── Incoming Requests (for my team posts) ─── */
async function loadIncoming() {
  const el    = document.getElementById("incoming-list");
  const badge = document.getElementById("incoming-count-badge");
  try {
    // Fetch my posts first, then their requests
    const postsRes = await apiFetch("/api/teams/user/my-posts");
    const posts    = postsRes.data || [];

    const results = await Promise.all(posts.map(p => apiFetch(`/api/teams/${p.id}`).then(res => ({ ...res, postTitle: p.title }))));
    const allRequests = [];
    results.forEach(res => {
      (res.data?.requests || []).forEach(r => {
        allRequests.push({ ...r, postTitle: res.postTitle, postId: res.data.id });
      });
    });

    const pending = allRequests.filter(r => r.status === "pending");
    if (pending.length > 0) {
      badge.textContent = pending.length;
      badge.style.display = "";
    }

    if (!allRequests.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><h3 class="empty-state__title">No incoming requests</h3></div>`;
      return;
    }

    el.innerHTML = allRequests.map(r => `
      <div class="team-request-item">
        <div class="team-request-item__avatar" style="background:var(--clr-purple-glow);color:var(--clr-purple)">${(r.username||"?")[0].toUpperCase()}</div>
        <div class="team-request-item__info">
          <div class="team-request-item__name">${r.username} <span style="color:var(--clr-text-400);font-weight:400">→</span> ${r.postTitle}</div>
          <div class="team-request-item__meta">Skills: ${r.skills || "Not specified"}</div>
        </div>
        <div class="team-request-item__actions">
          ${r.status === "pending" ? `
            <button class="btn btn--primary btn--sm accept-req" data-id="${r.id}">Accept</button>
            <button class="btn btn--danger btn--sm reject-req" data-id="${r.id}">Reject</button>
          ` : `<span class="badge ${r.status==="accepted"?"badge--green":"badge--red"}">${r.status}</span>`}
        </div>
      </div>
    `).join("");

    el.querySelectorAll(".accept-req").forEach(btn => {
      btn.addEventListener("click", () => respondRequest(btn.dataset.id, "accepted"));
    });
    el.querySelectorAll(".reject-req").forEach(btn => {
      btn.addEventListener("click", () => respondRequest(btn.dataset.id, "rejected"));
    });
  } catch {}
}

async function respondRequest(requestId, status) {
  try {
    await apiFetch(`/api/teams/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    showToast(`Request ${status}`, "success");
    loadIncoming();
  } catch (err) { showToast(err.message, "error"); }
}

/* ─── Profile ─── */
async function loadProfile() {
  try {
    const res = await apiFetch("/api/auth/me");
    const u   = res.user;
    if (u.college)     document.getElementById("profile-college").value  = u.college;
    if (u.skills)      document.getElementById("profile-skills").value   = u.skills;
    if (u.interests)   document.getElementById("profile-interests").value= u.interests;
    if (u.bio)         document.getElementById("profile-bio").value      = u.bio;
    if (u.github_url)  document.getElementById("profile-github").value   = u.github_url;
    if (u.resume_url)  document.getElementById("profile-resume").value   = u.resume_url;
  } catch {}
}

async function saveProfile(e) {
  e.preventDefault();
  const msgEl   = document.getElementById("profile-msg");
  const spinner = document.getElementById("profile-spinner");
  const btn     = document.getElementById("profile-save-btn");
  spinner.classList.remove("hidden");
  btn.disabled = true;

  try {
    await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        college:      document.getElementById("profile-college").value,
        skills:       document.getElementById("profile-skills").value,
        interests:    document.getElementById("profile-interests").value,
        bio:          document.getElementById("profile-bio").value,
        github_url:   document.getElementById("profile-github").value,
        resume_url:   document.getElementById("profile-resume").value,
      }),
    });
    msgEl.className  = "form-success";
    msgEl.textContent = "Profile updated successfully!";
    showToast("Profile saved!", "success");
  } catch (err) {
    msgEl.className   = "form-error";
    msgEl.textContent = err.message;
  } finally {
    spinner.classList.add("hidden");
    btn.disabled = false;
  }
}

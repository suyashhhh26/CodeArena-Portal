/* ═══════════════════════════════════════════════════════════════
   CodeArena — Team Finder JS
   ═══════════════════════════════════════════════════════════════ */

let hackathonsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadPosts(), loadHackathonOptions()]);
  bindEvents();
});

/* ─── Load team posts ─── */
async function loadPosts(filters = {}) {
  const grid   = document.getElementById("team-posts-grid");
  const noRes  = document.getElementById("team-no-results");
  grid.innerHTML = `
    <div class="loading-skeleton" style="height:220px"></div>
    <div class="loading-skeleton" style="height:220px"></div>
    <div class="loading-skeleton" style="height:220px"></div>
    <div class="loading-skeleton" style="height:220px"></div>
  `;

  try {
    const params = new URLSearchParams({ status: "open", ...filters });
    const res    = await apiFetch(`/api/teams?${params}`);
    const posts  = res.data || [];

    grid.innerHTML = "";
    if (!posts.length) {
      noRes.classList.remove("hidden");
      return;
    }
    noRes.classList.add("hidden");
    posts.forEach((p, i) => grid.appendChild(buildPostCard(p, i)));
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:span 2"><div class="empty-state__icon">⚠️</div><h3 class="empty-state__title">Failed to load</h3><p>${err.message}</p></div>`;
  }
}

function buildPostCard(p, idx) {
  const div = document.createElement("div");
  div.className = "team-card";
  div.style.animationDelay = `${Math.min(idx * 0.05, 0.4)}s`;

  const statusMap = { open:"badge--green", closed:"badge--red", full:"badge--yellow" };
  const spots = p.team_size_max - p.current_members;
  const initial = (p.owner_name || "?")[0].toUpperCase();

  div.innerHTML = `
    <div class="team-card__header">
      <h3 class="team-card__title">${escHtml(p.title)}</h3>
      <span class="badge ${statusMap[p.status]||"badge--cyan"} team-card__status">${p.status}</span>
    </div>
    ${p.hackathon_name ? `<div class="team-card__hackathon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${escHtml(p.hackathon_name)}</div>` : ""}
    <p class="team-card__desc">${escHtml(p.description)}</p>
    ${p.skills_needed ? `<div class="team-card__skills" id="skills-${p.id}"></div>` : ""}
    <div class="team-card__footer">
      <div class="team-card__owner">
        <div class="team-card__owner-avatar">${initial}</div>
        ${escHtml(p.owner_name)}
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="team-card__spots"><span>${spots}</span> spot${spots!==1?"s":""} open</span>
        ${p.status === "open" ? `<button class="btn btn--purple btn--sm join-btn" data-id="${p.id}" data-title="${escHtml(p.title)}">Request to Join</button>` : ""}
      </div>
    </div>
  `;

  // Skills
  if (p.skills_needed) {
    renderSkillTags(p.skills_needed, div.querySelector(`#skills-${p.id}`));
  }

  // Join button
  div.querySelector(".join-btn")?.addEventListener("click", (e) => {
    if (!Auth.isLoggedIn()) { showToast("Log in to request to join a team", "info"); return; }
    const user = Auth.getUser();
    if (user.id === p.owner_id) { showToast("You own this post", "info"); return; }
    openRequestModal(p.id, p.title);
  });

  return div;
}

/* ─── Load hackathon options for create post modal ─── */
async function loadHackathonOptions() {
  try {
    const res = await apiFetch("/api/hackathons");
    hackathonsList = res.data || [];
    const select = document.getElementById("post-hackathon");
    if (select) {
      hackathonsList.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.id;
        opt.textContent = h.title;
        select.appendChild(opt);
      });
    }
  } catch {}
}

/* ─── Create post modal ─── */
function openCreateModal() {
  document.getElementById("create-post-modal").classList.add("open");
}
function closeCreateModal() {
  document.getElementById("create-post-modal").classList.remove("open");
  document.getElementById("create-post-error").classList.add("hidden");
  document.getElementById("post-title").value       = "";
  document.getElementById("post-description").value = "";
  document.getElementById("post-skills").value      = "";
  document.getElementById("post-contact").value     = "";
  document.getElementById("post-hackathon").value   = "";
}

/* ─── Request modal ─── */
let _requestPostId = null;
function openRequestModal(postId, postTitle) {
  _requestPostId = postId;
  document.getElementById("request-post-title").textContent = postTitle;
  document.getElementById("request-modal").classList.add("open");
}
function closeRequestModal() {
  document.getElementById("request-modal").classList.remove("open");
  document.getElementById("request-message").value = "";
  document.getElementById("request-error").classList.add("hidden");
  _requestPostId = null;
}

/* ─── Bind events ─── */
function bindEvents() {
  // Create modal open/close
  document.getElementById("create-post-btn")?.addEventListener("click", () => {
    if (!Auth.isLoggedIn()) { showToast("Please log in to create a team post","info"); return; }
    openCreateModal();
  });
  document.getElementById("create-post-btn-2")?.addEventListener("click", () => {
    if (!Auth.isLoggedIn()) { showToast("Please log in","info"); return; }
    openCreateModal();
  });
  document.getElementById("close-create-modal")?.addEventListener("click", closeCreateModal);
  document.getElementById("cancel-create-modal")?.addEventListener("click", closeCreateModal);
  document.getElementById("create-post-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeCreateModal();
  });

  // Request modal
  document.getElementById("close-request-modal")?.addEventListener("click", closeRequestModal);
  document.getElementById("cancel-request-modal")?.addEventListener("click", closeRequestModal);
  document.getElementById("request-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeRequestModal();
  });

  // Submit create post
  document.getElementById("submit-post-btn")?.addEventListener("click", submitCreatePost);

  // Submit request
  document.getElementById("submit-request-btn")?.addEventListener("click", submitRequest);

  // Search/filter
  const searchInput = document.getElementById("team-search");
  const skillFilter = document.getElementById("team-skill-filter");
  const statusFilter= document.getElementById("team-status-filter");

  function applyFilters() {
    loadPosts({
      search: searchInput?.value.trim() || undefined,
      skills: skillFilter?.value.trim() || undefined,
      status: statusFilter?.value || "open",
    });
  }
  searchInput?.addEventListener("input",  debounce(applyFilters, 400));
  skillFilter?.addEventListener("input",  debounce(applyFilters, 400));
  statusFilter?.addEventListener("change", applyFilters);
}

/* ─── Submit create post ─── */
async function submitCreatePost() {
  const title       = document.getElementById("post-title").value.trim();
  const description = document.getElementById("post-description").value.trim();
  const skills      = document.getElementById("post-skills").value.trim();
  const teamSize    = document.getElementById("post-team-size").value;
  const hackId      = document.getElementById("post-hackathon").value;
  const contact     = document.getElementById("post-contact").value.trim();
  const errEl       = document.getElementById("create-post-error");
  const spinner     = document.getElementById("post-spinner");

  if (!title || !description) {
    errEl.textContent = "Title and description are required";
    errEl.classList.remove("hidden");
    return;
  }

  spinner.classList.remove("hidden");
  document.getElementById("submit-post-btn").disabled = true;

  try {
    await apiFetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({
        title, description,
        skills_needed: skills,
        team_size_max: parseInt(teamSize),
        hackathon_id:  hackId || null,
        contact_info:  contact,
      }),
    });
    showToast("Team post created! 🎉", "success");
    closeCreateModal();
    loadPosts();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
    document.getElementById("submit-post-btn").disabled = false;
  }
}

/* ─── Submit join request ─── */
async function submitRequest() {
  const message = document.getElementById("request-message").value.trim();
  const errEl   = document.getElementById("request-error");
  const spinner = document.getElementById("request-spinner");

  spinner.classList.remove("hidden");
  document.getElementById("submit-request-btn").disabled = true;

  try {
    await apiFetch(`/api/teams/${_requestPostId}/request`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    showToast("Join request sent! 🙌", "success");
    closeRequestModal();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
    document.getElementById("submit-request-btn").disabled = false;
  }
}

function debounce(fn, d) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; }
function escHtml(s="") { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

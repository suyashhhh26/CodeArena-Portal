/* ═══════════════════════════════════════════════════════════════
   CodeArena — Admin Dashboard JS
   ═══════════════════════════════════════════════════════════════ */

let _deleteTargetId   = null;
let _deleteTargetName = "";
let _editMode         = false;

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    document.getElementById("auth-gate").classList.remove("hidden");
    document.getElementById("admin-layout").style.display = "none";
    return;
  }

  document.getElementById("admin-name").textContent = Auth.getUser()?.username || "Admin";

  document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
    Auth.clear();
    window.location.href = "/pages/index.html";
  });

  // Tab navigation
  const tabs = {
    "atab-overview":  "asection-overview",
    "atab-hackathons":"asection-hackathons",
    "atab-users":     "asection-users",
    "atab-organizers":"asection-organizers",
    "atab-add":       "asection-add",
  };
  Object.entries(tabs).forEach(([tabId, secId]) => {
    document.getElementById(tabId)?.addEventListener("click", (e) => {
      e.preventDefault();
      activateAdminTab(tabId, secId);
    });
  });

  // Load data
  await Promise.all([loadOverview(), loadHackathonsTable(), loadUsers(), loadOrganizers()]);

  // Add hackathon btn (from table header)
  document.getElementById("admin-add-hack-btn")?.addEventListener("click", () => {
    resetForm();
    activateAdminTab("atab-add", "asection-add");
  });

  // Hack form submit
  document.getElementById("hack-form")?.addEventListener("submit", submitHackathon);
  document.getElementById("hack-form-cancel")?.addEventListener("click", () => {
    activateAdminTab("atab-hackathons", "asection-hackathons");
  });

  // Delete modal
  document.getElementById("close-delete-modal")?.addEventListener("click", closeDeleteModal);
  document.getElementById("cancel-delete-btn")?.addEventListener("click", closeDeleteModal);
  document.getElementById("confirm-delete-btn")?.addEventListener("click", confirmDelete);
  document.getElementById("confirm-delete-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  // Sync Unstop
  document.getElementById("admin-sync-unstop-btn")?.addEventListener("click", syncUnstop);

  // Back from submissions map
  document.getElementById("admin-back-submissions")?.addEventListener("click", () => {
    document.getElementById("asection-submissions").classList.add("hidden");
    document.getElementById("admin-layout").style.display = ""; // restore sidebar
    activateAdminTab("atab-hackathons", "asection-hackathons");
  });
});

function activateAdminTab(tabId, secId) {
  document.querySelectorAll(".sidebar__link").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(`[id^="asection-"]`).forEach(el => el.classList.add("hidden"));
  document.getElementById(tabId)?.classList.add("active");
  document.getElementById(secId)?.classList.remove("hidden");
}

/* ─── Overview ─── */
async function loadOverview() {
  try {
    const res = await apiFetch("/api/admin/dashboard");
    const d   = res.data;
    document.getElementById("admin-stat-users").textContent    = d.userCount;
    document.getElementById("admin-stat-hacks").textContent    = d.hackCount;
    document.getElementById("admin-stat-teams").textContent    = d.teamCount;

    const upcoming = (d.byStatus || []).find(s => s.status === "upcoming");
    document.getElementById("admin-stat-upcoming").textContent = upcoming?.cnt || 0;

    const breakdown = document.getElementById("admin-status-breakdown");
    if (d.byStatus) {
      const colors = { upcoming:"badge--cyan", ongoing:"badge--green", ended:"badge--red" };
      breakdown.innerHTML = d.byStatus.map(s =>
        `<span class="badge ${colors[s.status]||"badge--cyan"}" style="font-size:0.85rem;padding:6px 16px">${capitalize(s.status)}: ${s.cnt}</span>`
      ).join("");
    }
  } catch (err) { console.error(err); }
}

/* ─── Hackathons table ─── */
async function loadHackathonsTable() {
  const tbody = document.getElementById("admin-hack-tbody");
  try {
    const res  = await apiFetch("/api/admin/hackathons");
    const list = res.data || [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--clr-text-400);padding:24px">No hackathons yet. Add one!</td></tr>`;
      return;
    }

    const statusMap = { upcoming:"badge--cyan", ongoing:"badge--green", ended:"badge--red" };
    tbody.innerHTML = list.map(h => `
      <tr>
        <td style="color:var(--clr-text-400)">${h.id}</td>
        <td><strong style="color:var(--clr-text-100)">${escHtml(h.title)}</strong>${h.featured ? ' <span class="badge badge--yellow" style="font-size:0.6rem">Featured</span>' : ""}</td>
        <td>${escHtml(h.organizer)}</td>
        <td><span class="badge badge--purple">${h.mode}</span></td>
        <td><span class="badge ${statusMap[h.status]||"badge--cyan"}">${h.status}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.8rem">${formatDate(h.registration_end)}</td>
        <td style="color:var(--clr-yellow)">${h.prize_pool || "—"}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn--primary btn--sm view-subs-btn" data-id="${h.id}" data-name="${escHtml(h.title)}">Subs</button>
            <button class="btn btn--ghost btn--sm edit-btn" data-id="${h.id}">Edit</button>
            <button class="btn btn--danger btn--sm delete-btn" data-id="${h.id}" data-name="${escHtml(h.title)}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

    // Edit buttons
    tbody.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const hack = list.find(h => h.id == btn.dataset.id);
        if (hack) populateEditForm(hack);
        activateAdminTab("atab-add", "asection-add");
      });
    });

    // Delete buttons
    tbody.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });

    // View Subs buttons
    tbody.querySelectorAll(".view-subs-btn").forEach(btn => {
      btn.addEventListener("click", () => openSubmissionsPanel(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--clr-red);padding:24px">Error: ${err.message}</td></tr>`;
  }
}

let _currentHackIdForSubs = null;

async function openSubmissionsPanel(hackId, hackName) {
  _currentHackIdForSubs = hackId;
  
  // hide regular dashboard layout
  document.getElementById("admin-layout").style.display = "none";
  document.getElementById("asection-submissions").classList.remove("hidden");
  document.getElementById("subs-hack-name").textContent = hackName;

  await loadSubmissionsTable(hackId);
}

async function loadSubmissionsTable(hackId) {
  const tbody = document.getElementById("admin-subs-tbody");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px">Loading...</td></tr>`;
  
  try {
    const res = await apiFetch(`/api/hackathons/${hackId}/submissions`);
    const subs = res.data || [];

    if (!subs.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--clr-text-400);padding:24px">No submissions yet for this hackathon.</td></tr>`;
      return;
    }

    tbody.innerHTML = subs.map(s => `
      <tr>
        <td><strong>${escHtml(s.username)}</strong></td>
        <td>${escHtml(s.project_title)}</td>
        <td><a href="${escHtml(s.repo_url)}" target="_blank" style="color:var(--clr-cyan)">Repo</a></td>
        <td>${s.demo_url ? `<a href="${escHtml(s.demo_url)}" target="_blank" style="color:var(--clr-yellow)">Demo</a>` : "—"}</td>
        <td style="font-size:0.8rem">${formatDate(s.submitted_at)}</td>
        <td>
          <input type="number" id="score-input-${s.id}" value="${s.score || ''}" min="0" max="100" class="form-input" style="width:70px; padding:4px;" />
        </td>
        <td>
          <button class="btn btn--primary btn--sm save-score-btn" data-subid="${s.id}">Save</button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".save-score-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const subId = btn.dataset.subid;
        const score = document.getElementById(`score-input-${subId}`).value;
        if (!score) return showToast("Enter a valid score", "error");
        
        try {
          await apiFetch(`/api/hackathons/${hackId}/submissions/${subId}/score`, {
            method: "PUT",
            body: JSON.stringify({ score: parseInt(score, 10), feedback: "" })
          });
          showToast("Score updated successfully!", "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--clr-red);padding:24px">Error: ${err.message}</td></tr>`;
  }
}

/* ─── Users table ─── */
async function loadUsers() {
  const tbody = document.getElementById("admin-users-tbody");
  try {
    const res   = await apiFetch("/api/admin/users?role=student");
    const users = res.data || [];

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--clr-text-400);padding:24px">No students yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="color:var(--clr-text-400)">${u.id}</td>
        <td><strong style="color:var(--clr-text-100)">${escHtml(u.username)}</strong></td>
        <td>${escHtml(u.email)}</td>
        <td>${u.skills ? u.skills.split(",").slice(0,3).map(s=>`<span class="skill-tag" style="font-size:0.68rem">${s.trim()}</span>`).join(" ") : "—"}</td>
        <td style="font-size:0.8rem;color:var(--clr-text-400)">${formatDate(u.created_at)}</td>
      </tr>
    `).join("");
  } catch {}
}

/* ─── Organizers table ─── */
async function loadOrganizers() {
  const tbody = document.getElementById("admin-orgs-tbody");
  try {
    const res   = await apiFetch("/api/admin/organizers");
    const orgs = res.data || [];

    if (!orgs.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--clr-text-400);padding:24px">No organizers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orgs.map(o => `
      <tr>
        <td style="color:var(--clr-text-400)">${o.user_id}</td>
        <td><strong style="color:var(--clr-text-100)">${escHtml(o.org_name)}</strong></td>
        <td>${escHtml(o.username)}</td>
        <td><span class="badge ${o.verified ? "badge--green" : "badge--yellow"}">${o.verified ? "Verified" : "Pending"}</span></td>
        <td style="font-size:0.8rem;color:var(--clr-text-400)">${formatDate(o.created_at)}</td>
        <td>
           <button class="btn btn--ghost btn--sm verify-btn" data-id="${o.user_id}" ${o.verified ? 'disabled' : ''}>Verify</button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".verify-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await apiFetch(`/api/admin/organizers/${btn.dataset.id}/verify`, { method: "POST" });
          showToast("Organizer verified!", "success");
          loadOrganizers();
        } catch (err) { showToast(err.message, "error"); }
      });
    });

  } catch {}
}

/* ─── Hackathon form ─── */
function resetForm() {
  _editMode = false;
  document.getElementById("hack-form-id").value = "";
  document.getElementById("hack-form").reset();
  document.getElementById("hack-form-title").textContent      = "Add New Hackathon";
  document.getElementById("hack-form-submit-text").textContent = "Add Hackathon";
  document.getElementById("hack-form-error").classList.add("hidden");
}

function populateEditForm(h) {
  _editMode = true;
  document.getElementById("hack-form-title").textContent      = "Edit Hackathon";
  document.getElementById("hack-form-submit-text").textContent = "Save Changes";
  document.getElementById("hack-form-id").value        = h.id;
  document.getElementById("hf-title").value            = h.title || "";
  document.getElementById("hf-organizer").value        = h.organizer || "";
  document.getElementById("hf-theme").value            = h.theme || "";
  document.getElementById("hf-mode").value             = h.mode || "online";
  document.getElementById("hf-difficulty").value       = h.difficulty || "open";
  document.getElementById("hf-prize-pool").value       = h.prize_pool || "";
  document.getElementById("hf-prize-amount").value     = h.prize_amount || "";
  document.getElementById("hf-reg-link").value         = h.registration_link || "";
  document.getElementById("hf-reg-end").value          = h.registration_end?.slice(0,16) || "";
  document.getElementById("hf-hack-start").value       = h.hackathon_start?.slice(0,16) || "";
  document.getElementById("hf-hack-end").value         = h.hackathon_end?.slice(0,16) || "";
  document.getElementById("hf-location").value         = h.location || "";
  document.getElementById("hf-min-team").value         = h.min_team_size || 1;
  document.getElementById("hf-max-team").value         = h.max_team_size || 4;
  document.getElementById("hf-tags").value             = h.tags || "";
  document.getElementById("hf-description").value      = h.description || "";
  document.getElementById("hf-eligibility").value      = h.eligibility || "";
  document.getElementById("hf-rules").value            = h.rules || "";
  document.getElementById("hf-status").value           = h.status || "upcoming";
  document.getElementById("hf-featured").checked       = !!h.featured;
}

async function submitHackathon(e) {
  e.preventDefault();
  const errEl   = document.getElementById("hack-form-error");
  const spinner = document.getElementById("hack-form-spinner");
  errEl.classList.add("hidden");
  spinner.classList.remove("hidden");
  document.getElementById("hack-form-submit").disabled = true;

  const body = {
    title:             document.getElementById("hf-title").value.trim(),
    organizer:         document.getElementById("hf-organizer").value.trim(),
    theme:             document.getElementById("hf-theme").value.trim(),
    mode:              document.getElementById("hf-mode").value,
    difficulty:        document.getElementById("hf-difficulty").value,
    prize_pool:        document.getElementById("hf-prize-pool").value.trim(),
    prize_amount:      parseInt(document.getElementById("hf-prize-amount").value) || 0,
    registration_link: document.getElementById("hf-reg-link").value.trim(),
    registration_end:  document.getElementById("hf-reg-end").value,
    hackathon_start:   document.getElementById("hf-hack-start").value || null,
    hackathon_end:     document.getElementById("hf-hack-end").value || null,
    location:          document.getElementById("hf-location").value.trim(),
    min_team_size:     parseInt(document.getElementById("hf-min-team").value) || 1,
    max_team_size:     parseInt(document.getElementById("hf-max-team").value) || 4,
    tags:              document.getElementById("hf-tags").value.trim(),
    description:       document.getElementById("hf-description").value.trim(),
    eligibility:       document.getElementById("hf-eligibility").value.trim(),
    rules:             document.getElementById("hf-rules").value.trim(),
    status:            document.getElementById("hf-status").value,
    featured:          document.getElementById("hf-featured").checked,
  };

  try {
    const id = document.getElementById("hack-form-id").value;
    if (_editMode && id) {
      await apiFetch(`/api/hackathons/${id}`, { method: "PUT", body: JSON.stringify(body) });
      showToast("Hackathon updated!", "success");
    } else {
      await apiFetch("/api/hackathons", { method: "POST", body: JSON.stringify(body) });
      showToast("Hackathon created!", "success");
    }
    resetForm();
    await loadHackathonsTable();
    activateAdminTab("atab-hackathons", "asection-hackathons");
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
    document.getElementById("hack-form-submit").disabled = false;
  }
}

/* ─── Delete modal ─── */
function openDeleteModal(id, name) {
  _deleteTargetId   = id;
  _deleteTargetName = name;
  document.getElementById("delete-hack-name").textContent = name;
  document.getElementById("confirm-delete-modal").classList.add("open");
}
function closeDeleteModal() {
  document.getElementById("confirm-delete-modal").classList.remove("open");
  _deleteTargetId = null;
}
async function confirmDelete() {
  try {
    await apiFetch(`/api/hackathons/${_deleteTargetId}`, { method: "DELETE" });
    showToast("Hackathon deleted", "info");
    closeDeleteModal();
    loadHackathonsTable();
    loadOverview();
  } catch (err) { showToast(err.message, "error"); }
}

function capitalize(s="") { return s.charAt(0).toUpperCase()+s.slice(1); }
function escHtml(s="")    { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

async function syncUnstop() {
  const btn = document.getElementById("admin-sync-unstop-btn");
  const originalHtml = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;margin-right:8px"></span> Syncing...`;
  
  try {
    const res = await apiFetch("/api/ai/sync-external", { method: "POST" });
    showToast(res.message, res.savedCount > 0 ? "success" : "info");
    if (res.savedCount > 0) {
      await loadHackathonsTable();
      await loadOverview();
    }
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

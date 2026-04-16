/* ═══════════════════════════════════════════════════════════════
   CodeArena — Organizer Portal JS
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.isLoggedIn() || (Auth.getUser().role !== "organizer" && Auth.getUser().role !== "admin")) {
      document.getElementById("auth-gate")?.classList.remove("hidden");
      document.getElementById("organizer-layout").style.display = "none";
      return;
    }
  
    const user = Auth.getUser();
    document.getElementById("org-avatar").textContent = (user.username || "O")[0].toUpperCase();
    document.getElementById("org-username").textContent = user.username;
  
    // Logout
    document.getElementById("organizer-logout-btn")?.addEventListener("click", () => {
      Auth.clear();
      window.location.href = "/pages/login.html";
    });
  
    // Tab logic
    const tabs = {
      "otab-overview":     "osection-overview",
      "otab-hackathons":   "osection-hackathons",
      "otab-participants": "osection-participants",
      "otab-submissions":  "osection-submissions",
      "otab-eval":         "osection-eval",
      "otab-results":      "osection-results",
      "otab-attendance":   "osection-attendance",
      "otab-add":          "osection-add",
    };
  
    Object.entries(tabs).forEach(([tid, sid]) => {
      document.getElementById(tid)?.addEventListener("click", (e) => {
        e.preventDefault();
        activateTab(tid, sid);
      });
    });
  
    // Filter logic
    document.getElementById("op-hackathon-filter")?.addEventListener("change", (e) => loadParticipants(e.target.value));
    document.getElementById("os-hackathon-filter")?.addEventListener("change", (e) => loadSubmissions(e.target.value));
    document.getElementById("or-hackathon-filter")?.addEventListener("change", (e) => loadLeaderboard(e.target.value));
    
    document.getElementById("btn-calc-leaderboard")?.addEventListener("click", () => loadLeaderboard(document.getElementById("or-hackathon-filter").value));
    document.getElementById("btn-gen-certs")?.addEventListener("click", handleCertificateGeneration);

    // Actions
    document.getElementById("org-add-hack-btn")?.addEventListener("click", () => activateTab("otab-add", "osection-add"));
    document.getElementById("org-hack-form")?.addEventListener("submit", handleFormSubmit);
    document.getElementById("of-cancel")?.addEventListener("click", () => activateTab("otab-hackathons", "osection-hackathons"));
  
    // Initial load
    await Promise.all([loadStats(), loadMyHackathons()]);
});

function activateTab(tid, sid) {
    document.querySelectorAll(".sidebar__link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll("main > div").forEach(s => s.classList.add("hidden"));
    
    const targetTab = document.getElementById(tid);
    const targetSec = document.getElementById(sid);
    
    if(targetTab) targetTab.classList.add("active");
    if(targetSec) targetSec.classList.remove("hidden");
}

async function loadStats() {
    try {
        const res = await apiFetch("/api/organizer/stats");
        const d = res.data;
        document.getElementById("org-stat-hacks").textContent = d.hackCount;
        document.getElementById("org-stat-participants").textContent = d.participantCount;
        document.getElementById("org-stat-subs").textContent = d.submissionCount;
    } catch(err) { console.error(err); }
}

async function loadMyHackathons() {
    const tbody = document.getElementById("org-hack-tbody");
    const pFilter = document.getElementById("op-hackathon-filter");
    const sFilter = document.getElementById("os-hackathon-filter");
    const rFilter = document.getElementById("or-hackathon-filter");

    try {
      const res = await apiFetch("/api/hackathons?creator=" + Auth.getUser().id);
      const hacks = res.data || [];
  
      if (!hacks.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--clr-text-400);padding:24px">No hackathons hosted yet. Start by creating one!</td></tr>`;
        return;
      }
  
      tbody.innerHTML = hacks.map(h => `
        <tr>
          <td style="font-weight:600">${h.title}</td>
          <td>${h.mode}</td>
          <td><span class="badge ${h.status === "upcoming" ? "badge--green" : "badge--purple"}">${h.status}</span></td>
          <td>${formatDate(h.registration_end)}</td>
          <td>${h.participant_count || 0}</td>
          <td>
            <div style="display:flex;gap:8px">
              <button class="btn btn--ghost btn--sm edit-btn" data-id="${h.id}">Edit</button>
              <button class="btn btn--danger btn--sm delete-btn" data-id="${h.id}">✕</button>
            </div>
          </td>
        </tr>
      `).join("");

      // Populate filters
      const options = `<option value="">Select Hackathon...</option>` + hacks.map(h => `<option value="${h.id}">${h.title}</option>`).join("");
      if (pFilter) pFilter.innerHTML = options;
      if (sFilter) sFilter.innerHTML = options;
      if (rFilter) rFilter.innerHTML = options;
  
      // Edit logic
      tbody.querySelectorAll(".edit-btn").forEach(btn => {
          btn.addEventListener("click", () => {
              const h = hacks.find(x => x.id == btn.dataset.id);
              populateEditForm(h);
              activateTab("otab-add", "osection-add");
          });
      });

      // Delete logic
      tbody.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this hackathon?")) return;
          try {
            await apiFetch(`/api/hackathons/${btn.dataset.id}`, { method: "DELETE" });
            showToast("Deleted", "success");
            loadMyHackathons();
            loadStats();
          } catch (err) { showToast(err.message, "error"); }
        });
      });
  
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--clr-red);padding:24px">Error: ${err.message}</td></tr>`;
    }
}

async function loadParticipants(hackId) {
    if (!hackId) return;
    const tbody = document.getElementById("org-participants-tbody");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px">Loading...</td></tr>`;
    
    try {
        const res = await apiFetch(`/api/organizer/registrations/${hackId}`);
        const data = res.data || [];

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--clr-text-400)">No participants registered yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(r => `
            <tr>
                <td><strong>${r.username}</strong><br><small style="color:var(--clr-text-400)">${r.email}</small></td>
                <td>${r.college || "—"}</td>
                <td>${r.skills || "—"}</td>
                <td><span class="badge ${r.status==='approved'?'badge--green':r.status==='rejected'?'badge--red':'badge--cyan'}">${r.status}</span></td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn--primary btn--sm reg-action" data-id="${r.id}" data-status="approved">Approve</button>
                        <button class="btn btn--danger btn--sm reg-action" data-id="${r.id}" data-status="rejected">Reject</button>
                    </div>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".reg-action").forEach(btn => {
            btn.addEventListener("click", async () => {
                try {
                    await apiFetch(`/api/organizer/registrations/${btn.dataset.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: btn.dataset.status })
                    });
                    showToast(`Participant ${btn.dataset.status}`, "success");
                    loadParticipants(hackId);
                } catch(e) { showToast(e.message, "error"); }
            });
        });

    } catch(err) { tbody.innerHTML = `<tr><td colspan="5" style="color:var(--clr-red);padding:20px">Error: ${err.message}</td></tr>`; }
}

async function loadSubmissions(hackId) {
    if (!hackId) return;
    const tbody = document.getElementById("org-submissions-tbody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px">Loading...</td></tr>`;

    try {
        const res = await apiFetch(`/api/organizer/submissions/${hackId}`);
        const data = res.data || [];

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--clr-text-400)">No submissions received yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(s => `
            <tr>
                <td><strong>${s.username}</strong></td>
                <td>${s.project_title}</td>
                <td>
                    <div style="display:flex;gap:8px">
                        <a href="${s.repo_url}" target="_blank" class="btn btn--ghost btn--sm">Repo</a>
                        ${s.demo_url ? `<a href="${s.demo_url}" target="_blank" class="btn btn--ghost btn--sm" style="color:var(--clr-yellow)">Demo</a>` : ""}
                    </div>
                </td>
                <td>${formatDate(s.submitted_at)}</td>
                <td><span class="badge badge--cyan">${s.score || "Pending"}</span></td>
                <td>
                    <button class="btn btn--primary btn--sm" onclick="showToast('Scoring directly from table coming soon','info')">Score</button>
                </td>
            </tr>
        `).join("");
    } catch(err) { tbody.innerHTML = `<tr><td colspan="6" style="color:var(--clr-red);padding:20px">Error: ${err.message}</td></tr>`; }
}

async function loadLeaderboard(hackId) {
    if (!hackId) return;
    const tbody = document.getElementById("org-leaderboard-tbody");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px">Calculating ranks...</td></tr>`;

    try {
        const res = await apiFetch(`/api/organizer/submissions/${hackId}`);
        const data = res.data || [];

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--clr-text-400)">No submissions to rank yet.</td></tr>`;
            return;
        }

        // Sort by score descending
        data.sort((a,b) => (b.score || 0) - (a.score || 0));

        tbody.innerHTML = data.map((s, idx) => `
            <tr>
                <td><span class="badge ${idx===0?'badge--yellow':idx===1?'badge--purple':idx===2?'badge--cyan':'badge--ghost'}">${idx + 1}</span></td>
                <td><strong>${s.username}</strong></td>
                <td>${s.project_title}</td>
                <td style="font-family:var(--font-mono)">${s.score || "—"}</td>
                <td>${idx === 0 ? "🏆 Winner" : idx === 1 ? "🥈 Runner Up" : idx === 2 ? "🥉 2nd Runner Up" : "—"}</td>
            </tr>
        `).join("");
    } catch(err) { tbody.innerHTML = `<tr><td colspan="5" style="color:var(--clr-red);padding:20px">Error: ${err.message}</td></tr>`; }
}

async function handleCertificateGeneration() {
    const hackId = document.getElementById("or-hackathon-filter").value;
    if (!hackId) return showToast("Please select a hackathon first", "info");
    
    showToast("AI is generating certificates for all participants...", "success");
    // Mock simulation
    setTimeout(() => {
        showToast("Certificates generated and ready for bulk download!", "success");
    }, 3000);
}

function populateEditForm(h) {
    document.getElementById("of-id").value = h.id;
    document.getElementById("of-title").value = h.title;
    document.getElementById("of-theme").value = h.theme || "";
    document.getElementById("of-mode").value = h.mode || "online";
    document.getElementById("of-reg-end").value = h.registration_end ? h.registration_end.slice(0, 16) : "";
    document.getElementById("of-prize").value = h.prize_pool || "";
    document.getElementById("of-desc").value = h.description || "";
    document.getElementById("org-form-title").textContent = "Update Hackathon";
    document.getElementById("of-submit").textContent = "Save Changes";
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("of-submit");
    const id = document.getElementById("of-id").value;
  
    const payload = {
      title: document.getElementById("of-title").value,
      organizer: Auth.getUser().username,
      theme: document.getElementById("of-theme").value,
      mode: document.getElementById("of-mode").value,
      registration_end: document.getElementById("of-reg-end").value,
      prize_pool: document.getElementById("of-prize").value,
      description: document.getElementById("of-desc").value,
      status: "upcoming"
    };
  
    btn.disabled = true;
    try {
      if (id) {
        await apiFetch(`/api/hackathons/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Updated!", "success");
      } else {
        await apiFetch("/api/hackathons", { method: "POST", body: JSON.stringify(payload) });
        showToast("Published!", "success");
      }
      document.getElementById("org-hack-form").reset();
      document.getElementById("of-id").value = "";
      document.getElementById("org-form-title").textContent = "Host New Hackathon";
      document.getElementById("of-submit").textContent = "Publish Hackathon";
      
      loadMyHackathons();
      loadStats();
      activateTab("otab-hackathons", "osection-hackathons");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
    }
}

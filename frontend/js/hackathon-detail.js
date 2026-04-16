/* ═══════════════════════════════════════════════════════════════
   CodeArena — Hackathon Detail Page JS
   ═══════════════════════════════════════════════════════════════ */

let countdownTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get("id");

  if (!id) { showError(); return; }

  try {
    const res  = await apiFetch(`/api/hackathons/${id}`);
    const hack = res.data;
    renderDetail(hack);
    startCountdown(hack.registration_end);

    // Check if saved & registered
    if (Auth.isLoggedIn()) {
      const [savedRes, checkReg] = await Promise.all([
        apiFetch(`/api/saved/${id}/status`),
        apiFetch(`/api/hackathons/${id}/status`).catch(() => ({ registered: false }))
      ]);
      updateSaveBtn(savedRes.saved);
      updateRegistrationState(checkReg.registered, hack);
    } else {
      updateRegistrationState(false, hack);
    }
  } catch {
    showError();
  }
});

function renderDetail(h) {
  document.title = `${h.title} — CodeArena`;

  // Show content
  document.getElementById("detail-loading").classList.add("hidden");
  document.getElementById("detail-content").classList.remove("hidden");

  // Hero
  const emoji    = getHackEmoji(h);
  const gradient = GRADIENTS[h.id % GRADIENTS.length];
  const hero     = document.getElementById("detail-hero");
  hero.style.background = `${gradient}, var(--clr-bg-800)`;

  document.getElementById("detail-title").textContent     = h.title;
  document.getElementById("detail-organizer").innerHTML   = `by <strong>${h.organizer}</strong>`;

  // Badges
  const badgesEl  = document.getElementById("detail-badges");
  const modeIcon  = {online:"🌐",offline:"📍",hybrid:"🔄"}[h.mode] || "";
  const diffMap   = {beginner:"badge--green",intermediate:"badge--yellow",advanced:"badge--red",open:"badge--cyan"};
  badgesEl.innerHTML = `
    <span class="badge badge--cyan">${h.theme || "Open Track"}</span>
    <span class="badge badge--purple">${modeIcon} ${capitalize(h.mode)}</span>
    <span class="badge ${diffMap[h.difficulty]||"badge--cyan"}">${capitalize(h.difficulty)}</span>
    ${h.status === "ongoing" ? '<span class="badge badge--green">🟢 Ongoing</span>' : ""}
    ${h.featured ? '<span class="badge badge--yellow">⭐ Featured</span>' : ""}
  `;

  // Register buttons logic
  const regBtn         = document.getElementById("detail-register-btn");
  const regLink        = document.getElementById("detail-register-link");
  const internalRegBtn = document.getElementById("detail-register-internal-btn");

  internalRegBtn?.addEventListener("click", async () => {
    if (!Auth.isLoggedIn()) return showToast("Log in to register", "info");
    try {
      const res = await apiFetch(`/api/hackathons/${h.id}/register`, { method: "POST" });
      showToast(res.message, "success");
      updateRegistrationState(true, h);
    } catch (err) { showToast(err.message, "error"); }
  });

  if (h.registration_link) {
    regBtn?.addEventListener("click",  () => window.open(h.registration_link, "_blank", "noopener"));
    if (regLink) regLink.href = h.registration_link;
  } else {
    if (regBtn) {
        regBtn.textContent = "No External Link";
        regBtn.disabled    = true;
    }
    regLink?.classList.add("hidden");
  }

  // Save button
  document.getElementById("detail-save-btn").addEventListener("click", async () => {
    if (!Auth.isLoggedIn()) { showToast("Please log in to save hackathons","info"); return; }
    try {
      const res = await apiFetch(`/api/saved/${h.id}`, { method: "POST" });
      updateSaveBtn(res.saved);
      showToast(res.message, "success");
    } catch { showToast("Could not update", "error"); }
  });

  // Description
  document.getElementById("detail-description").textContent = h.description || "—";

  // Eligibility
  if (h.eligibility) {
    document.getElementById("detail-eligibility").textContent = h.eligibility;
  } else {
    document.getElementById("detail-eligibility-sec").style.display = "none";
  }

  // Rules
  if (h.rules) {
    document.getElementById("detail-rules").textContent = h.rules;
  } else {
    document.getElementById("detail-rules-sec").style.display = "none";
  }

  // Timeline
  buildTimeline(h);

  // Quick info sidebar
  const infoList = document.getElementById("detail-info-list");
  const rows = [
    { label: "Organizer",    val: h.organizer, icon: "🏢" },
    { label: "Mode",         val: `${modeIcon} ${capitalize(h.mode)}`, icon: "" },
    { label: "Reg. Opens",   val: h.registration_start ? formatDate(h.registration_start) : "Open", icon: "📅" },
    { label: "Reg. Closes",  val: formatDate(h.registration_end), icon: "⏰" },
    { label: "Event Starts", val: h.hackathon_start ? formatDate(h.hackathon_start) : "TBA", icon: "🗓️" },
    { label: "Event Ends",   val: h.hackathon_end   ? formatDate(h.hackathon_end)   : "TBA", icon: "🏁" },
    { label: "Team Size",    val: `${h.min_team_size}–${h.max_team_size} members`, icon: "👥" },
    { label: "Difficulty",   val: capitalize(h.difficulty), icon: "🎯" },
    { label: "Location",     val: h.location || (h.mode === "online" ? "Online" : "TBA"), icon: "📍" },
  ];
  infoList.innerHTML = rows.map(r => `
    <div class="detail-info-row">
      <span class="detail-info-row__label">${r.icon} ${r.label}</span>
      <span class="detail-info-row__value">${r.val}</span>
    </div>
  `).join("");

  // Prize
  if (h.prize_pool) {
    document.getElementById("detail-prize").textContent = h.prize_pool;
  } else {
    document.getElementById("detail-prize-card").style.display = "none";
  }

  // Tags
  if (h.tags) {
    const tagsEl = document.getElementById("detail-tags");
    h.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(tag => {
      const span = document.createElement("span");
      span.className = "skill-tag";
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
  } else {
    document.getElementById("detail-tags-card").style.display = "none";
  }
}

function buildTimeline(h) {
  const el = document.getElementById("detail-timeline");
  const items = [
    { title: "Registration Opens",  date: h.registration_start },
    { title: "Registration Closes", date: h.registration_end },
    { title: "Hackathon Begins",    date: h.hackathon_start },
    { title: "Submission Deadline / Hackathon Ends", date: h.hackathon_end },
  ].filter(i => i.date);

  el.innerHTML = items.map(item => `
    <div class="timeline-item">
      <div class="timeline-item__line">
        <div class="timeline-item__dot"></div>
        <div class="timeline-item__connector"></div>
      </div>
      <div class="timeline-item__content">
        <div class="timeline-item__title">${item.title}</div>
        <div class="timeline-item__date">${formatDateTime(item.date)}</div>
      </div>
    </div>
  `).join("");
}

function startCountdown(deadlineISO) {
  const timerEl = document.getElementById("detail-countdown-timer");
  const dateEl  = document.getElementById("detail-countdown-date");

  dateEl.textContent = `Registration deadline: ${formatDateTime(deadlineISO)}`;

  function renderBlocks(c) {
    timerEl.innerHTML = [
      { num: c.d, unit: "Days" },
      { num: c.h, unit: "Hours" },
      { num: c.m, unit: "Mins" },
      { num: c.s, unit: "Secs" },
    ].map(b => `
      <div class="countdown-block">
        <span class="countdown-block__num">${String(b.num).padStart(2,"0")}</span>
        <span class="countdown-block__label">${b.unit}</span>
      </div>
    `).join('<span class="countdown-sep">:</span>');
  }

  function tick() {
    const c = buildCountdown(deadlineISO);
    if (!c) {
      timerEl.innerHTML = `<span style="color:var(--clr-red);font-family:var(--font-mono);font-size:1.2rem">Registration Closed</span>`;
      clearInterval(countdownTimer);
      return;
    }
    renderBlocks(c);
  }

  tick();
  countdownTimer = setInterval(tick, 1000);
}

function updateSaveBtn(isSaved) {
  const btn = document.getElementById("detail-save-btn");
  if (!btn) return;
  btn.innerHTML = isSaved
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--clr-cyan)" stroke="var(--clr-cyan)" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg> Saved`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg> Save Hackathon`;
  btn.style.color = isSaved ? "var(--clr-cyan)" : "";
}

function showError() {
  document.getElementById("detail-loading")?.classList.add("hidden");
  document.getElementById("detail-error")?.classList.remove("hidden");
}

function updateRegistrationState(isRegistered, hack) {
  const heroBtn    = document.getElementById("detail-register-btn");
  const internalBtn = document.getElementById("detail-register-internal-btn");
  const subSec      = document.getElementById("detail-submission-sec");

  if (isRegistered) {
    if (heroBtn) {
       heroBtn.textContent = "✓ Registered";
       heroBtn.classList.replace("btn--primary", "btn--secondary");
       heroBtn.disabled = true;
    }
    if (internalBtn) {
       internalBtn.textContent = "✓ Registered";
       internalBtn.disabled = true;
       internalBtn.classList.replace("btn--primary", "btn--secondary");
    }
    subSec?.classList.remove("hidden");
    
    // Bind submission form if not already
    const form = document.getElementById("submission-form");
    if (form && !form.dataset.bound) {
       form.dataset.bound = "true";
       form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const btn = document.getElementById("submit-proj-btn");
          btn.disabled = true;
          try {
             await apiFetch(`/api/hackathons/${hack.id}/submit`, {
                method: "POST",
                body: JSON.stringify({
                    project_title: document.getElementById("sub-title").value,
                    repo_url:      document.getElementById("sub-repo").value,
                    demo_url:      document.getElementById("sub-demo").value,
                    description:   document.getElementById("sub-desc").value
                })
             });
             showToast("Project submitted successfully!", "success");
          } catch(err) { showToast(err.message, "error"); }
          finally { btn.disabled = false; }
       });
    }
  } else {
    subSec?.classList.add("hidden");
  }
}

function capitalize(s = "") { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ═══════════════════════════════════════════════════════════════
   CodeArena — Landing Page JS
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  // Hide sign-up button if already logged in (navbar handles the rest)
  if (Auth.isLoggedIn()) {
    document.getElementById("hero-signup-btn")?.remove();
    const cta = document.getElementById("cta-signup-btn");
    if (cta) { cta.textContent = "Go to Dashboard"; cta.href = "/pages/dashboard.html"; }
  }

  // Animate stats counter
  animateCounters();

  // Load featured hackathons dynamically (if needed, static cards already shown)
  try {
    const res = await apiFetch("/api/hackathons?featured=true");
    if (res.data && res.data.length > 0) {
      renderFeatured(res.data.slice(0, 3));
    }
  } catch (_) {
    // Keep static cards as fallback
  }
});

function animateCounters() {
  const counters = document.querySelectorAll(".hero__stat-num span");
  counters.forEach(el => {
    const raw  = el.textContent.replace(/[^0-9]/g,"");
    const end  = parseInt(raw, 10);
    if (!end) return;
    let current = 0;
    const step  = Math.ceil(end / 50);
    const timer = setInterval(() => {
      current = Math.min(current + step, end);
      el.textContent = el.textContent.replace(/[0-9,]+/, current.toLocaleString("en-IN"));
      if (current >= end) clearInterval(timer);
    }, 30);
  });
}

function renderFeatured(hackathons) {
  const grid = document.getElementById("featured-hackathons");
  if (!grid || !hackathons.length) return;
  grid.innerHTML = "";
  hackathons.forEach((h, i) => {
    const card = buildHackCard(h, i);
    grid.appendChild(card);
  });
}

function buildHackCard(h, idx) {
  const div = document.createElement("div");
  div.className = "hack-card";
  div.style.animationDelay = `${idx * 0.1 + 0.1}s`;

  const deadline = formatCountdownInline(h.registration_end);
  const emoji    = getHackEmoji(h);
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const modeIcon = { online: "🌐", offline: "📍", hybrid: "🔄" }[h.mode] || "";
  const diffBadge = { beginner:"badge--green", intermediate:"badge--yellow", advanced:"badge--red", open:"badge--cyan" }[h.difficulty] || "badge--cyan";

  div.innerHTML = `
    <div class="hack-card__banner">
      <div class="hack-card__banner-gradient" style="background:${gradient}"></div>
      <span class="hack-card__organizer-badge">${h.organizer}</span>
      <span class="hack-card__emoji">${emoji}</span>
      ${h.featured ? '<span class="hack-card__featured-ribbon">Featured</span>' : ""}
    </div>
    <div class="hack-card__body">
      <h3 class="hack-card__title">${h.title}</h3>
      <div class="hack-card__tags">
        <span class="badge badge--cyan">${h.theme || "Open"}</span>
        <span class="badge badge--purple">${modeIcon} ${h.mode}</span>
        <span class="badge ${diffBadge}">${h.difficulty}</span>
      </div>
      <div class="hack-card__meta">
        ${h.prize_pool ? `<div class="hack-card__meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>${h.prize_pool}</div>` : ""}
        <div class="hack-card__meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Deadline: ${formatDate(h.registration_end)}</div>
      </div>
    </div>
    <div class="hack-card__footer">
      <div class="hack-card__deadline">Closes: <span class="hack-card__deadline-val${deadline.urgent?' urgent':''}">${deadline.text}</span></div>
      <a href="/pages/hackathon-detail.html?id=${h.id}" class="btn btn--primary btn--sm">View →</a>
    </div>
  `;

  div.querySelector(".hack-card__banner").addEventListener("click", () => {
    window.location.href = `/pages/hackathon-detail.html?id=${h.id}`;
  });
  return div;
}

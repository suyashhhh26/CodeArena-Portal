/* ═══════════════════════════════════════════════════════════════
   CodeArena — Hackathons Discovery Page JS
   ═══════════════════════════════════════════════════════════════ */

let allHackathons = [];
let countdownIntervals = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadHackathons();
  bindFilters();
  bindMobileFilter();
});

async function loadHackathons() {
  try {
    const res = await apiFetch("/api/hackathons");
    allHackathons = res.data || [];
    document.getElementById("hack-total-count").textContent = allHackathons.length;
    renderHackathons(allHackathons);
  } catch (err) {
    document.getElementById("hackathons-grid").innerHTML =
      `<div class="empty-state" style="grid-column:span 2"><div class="empty-state__icon">⚠️</div><h3 class="empty-state__title">Failed to load hackathons</h3><p>${err.message}</p></div>`;
  }
}

function renderHackathons(list) {
  // Clear old countdowns
  countdownIntervals.forEach(clearInterval);
  countdownIntervals = [];

  const grid    = document.getElementById("hackathons-grid");
  const noRes   = document.getElementById("no-results");
  const count   = document.getElementById("showing-count");

  grid.innerHTML = "";
  count.textContent = list.length;

  if (!list.length) {
    noRes.classList.remove("hidden");
    return;
  }
  noRes.classList.add("hidden");

  list.forEach((h, i) => {
    const card = buildCard(h, i);
    grid.appendChild(card);
  });
}

function buildCard(h, idx) {
  const div = document.createElement("div");
  div.className = "hack-card";
  div.style.animationDelay = `${Math.min(idx * 0.05, 0.5)}s`;

  const emoji    = getHackEmoji(h);
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const modeIcon = { online:"🌐", offline:"📍", hybrid:"🔄" }[h.mode] || "";
  const diffMap  = { beginner:"badge--green", intermediate:"badge--yellow", advanced:"badge--red", open:"badge--cyan" };

  const deadlineId = `dl-${h.id}`;

  div.innerHTML = `
    <div class="hack-card__banner" style="cursor:pointer">
      <div class="hack-card__banner-gradient" style="background:${gradient}"></div>
      <span class="hack-card__organizer-badge">${escHtml(h.organizer)}</span>
      <button class="hack-card__bookmark${Auth.isLoggedIn()?' saveable':''}" data-id="${h.id}" aria-label="Save hackathon">🔖</button>
      <span class="hack-card__emoji">${emoji}</span>
      ${h.featured ? '<span class="hack-card__featured-ribbon">⭐ Featured</span>' : ""}
    </div>
    <div class="hack-card__body">
      <h3 class="hack-card__title">${escHtml(h.title)}</h3>
      <div class="hack-card__tags">
        <span class="badge badge--cyan">${escHtml(h.theme || "Open")}</span>
        <span class="badge badge--purple">${modeIcon} ${h.mode}</span>
        <span class="badge ${diffMap[h.difficulty]||'badge--cyan'}">${h.difficulty}</span>
        ${h.prize_pool ? `<span class="prize-chip">💰 ${escHtml(h.prize_pool)}</span>` : ""}
      </div>
      <div class="hack-card__meta">
        <div class="hack-card__meta-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          Teams of ${h.min_team_size}–${h.max_team_size}
        </div>
        ${h.location ? `<div class="hack-card__meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escHtml(h.location)}</div>` : ""}
      </div>
    </div>
    <div class="hack-card__footer">
      <div class="hack-card__deadline">Closes: <span class="hack-card__deadline-val" id="${deadlineId}">…</span></div>
      <a href="/pages/hackathon-detail.html?id=${h.id}" class="btn btn--primary btn--sm">View Details →</a>
    </div>
  `;

  // Live countdown
  function tick() {
    const el = document.getElementById(deadlineId);
    if (!el) return;
    const {text, urgent} = formatCountdownInline(h.registration_end);
    el.textContent = text;
    el.className   = `hack-card__deadline-val${urgent ? " urgent" : ""}`;
  }
  tick();
  countdownIntervals.push(setInterval(tick, 60000));

  // Bookmark button
  const bookmarkBtn = div.querySelector(".hack-card__bookmark");
  bookmarkBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!Auth.isLoggedIn()) {
      showToast("Log in to save hackathons", "info");
      return;
    }
    try {
      const res = await apiFetch(`/api/saved/${h.id}`, { method: "POST" });
      bookmarkBtn.classList.toggle("saved", res.saved);
      showToast(res.message, "success");
    } catch { showToast("Could not update saved status", "error"); }
  });

  // Card click nav
  div.querySelector(".hack-card__banner").addEventListener("click", () => {
    window.location.href = `/pages/hackathon-detail.html?id=${h.id}`;
  });
  div.querySelector(".hack-card__title").addEventListener("click", () => {
    window.location.href = `/pages/hackathon-detail.html?id=${h.id}`;
  });

  // Pre-mark saved bookmarks
  if (Auth.isLoggedIn()) {
    apiFetch(`/api/saved/${h.id}/status`).then(r => {
      if (r.saved) bookmarkBtn.classList.add("saved");
    }).catch(() => {});
  }

  return div;
}

function bindFilters() {
  const searchInput = document.getElementById("filter-search");
  const themeSelect = document.getElementById("filter-theme");
  const prizeSelect = document.getElementById("filter-prize");
  const clearBtn    = document.getElementById("clear-filters-btn");
  const applyBtn    = document.getElementById("apply-filters-btn");
  const sortSelect  = document.getElementById("sort-select");

  function applyFilters() {
    const search    = searchInput?.value.trim().toLowerCase() || "";
    const mode      = document.querySelector('input[name="mode"]:checked')?.value || "";
    const difficulty= document.querySelector('input[name="difficulty"]:checked')?.value || "";
    const theme     = themeSelect?.value || "";
    const minPrize  = parseInt(prizeSelect?.value || "0") || 0;
    const sort      = sortSelect?.value || "deadline";

    let filtered = allHackathons.filter(h => {
      if (search && !(`${h.title} ${h.organizer} ${h.tags} ${h.theme}`.toLowerCase().includes(search))) return false;
      if (mode && h.mode !== mode) return false;
      if (difficulty && h.difficulty !== difficulty) return false;
      if (theme && !(h.theme || "").toLowerCase().includes(theme.toLowerCase())) return false;
      if (minPrize && (h.prize_amount || 0) < minPrize) return false;
      return true;
    });

    // Sort
    if (sort === "prize")    filtered.sort((a,b) => (b.prize_amount||0) - (a.prize_amount||0));
    if (sort === "deadline") filtered.sort((a,b) => new Date(a.registration_end) - new Date(b.registration_end));
    if (sort === "latest")   filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    renderHackathons(filtered);
  }

  applyBtn?.addEventListener("click", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);
  searchInput?.addEventListener("input", debounce(applyFilters, 400));

  clearBtn?.addEventListener("click", () => {
    searchInput && (searchInput.value = "");
    themeSelect && (themeSelect.value = "");
    prizeSelect && (prizeSelect.value = "");
    document.querySelector('input[name="mode"][value=""]')?.click();
    document.querySelector('input[name="difficulty"][value=""]')?.click();
    renderHackathons(allHackathons);
  });
}

function bindMobileFilter() {
  const btn   = document.getElementById("mobile-filter-btn");
  const panel = document.getElementById("filters-panel");
  btn?.addEventListener("click", () => panel?.classList.toggle("open"));
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function escHtml(str = "") {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

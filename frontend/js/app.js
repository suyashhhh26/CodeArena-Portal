/* ═══════════════════════════════════════════════════════════════
   CodeArena — Global App Utilities
   ═══════════════════════════════════════════════════════════════ */

/* ─── Token / Auth helpers ──────────────────────────────────── */
const Auth = {
  getToken()  { return localStorage.getItem("ca_token"); },
  getUser()   { try { return JSON.parse(localStorage.getItem("ca_user")); } catch { return null; } },
  setSession(token, user) {
    localStorage.setItem("ca_token", token);
    localStorage.setItem("ca_user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("ca_token");
    localStorage.removeItem("ca_user");
  },
  isLoggedIn()  { return !!this.getToken(); },
  isAdmin()     { const u = this.getUser(); return u && u.role === "admin"; },
};

/* ─── Fetch wrapper ─────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(path, { ...options, headers });
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const err = new Error(data.message || (typeof data === "string" ? data : "Request failed"));
      err.status = res.status;
      err.data   = data;
      throw err;
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${path}:`, err);
    throw err;
  }
}

/* ─── Toast notifications ───────────────────────────────────── */
function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─── Countdown engine ──────────────────────────────────────── */
function buildCountdown(deadlineISO) {
  const diff = new Date(deadlineISO) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000)  / 60000);
  const s = Math.floor((diff % 60000)    / 1000);
  return { d, h, m, s, diff };
}

function formatCountdownInline(deadlineISO) {
  const c = buildCountdown(deadlineISO);
  if (!c) return { text: "Closed", urgent: true };
  if (c.d > 0) return { text: `${c.d}d ${c.h}h left`, urgent: c.d < 3 };
  if (c.h > 0) return { text: `${c.h}h ${c.m}m left`, urgent: true };
  return { text: `${c.m}m left`, urgent: true };
}

/* ─── Date formatting ───────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

/* ─── Skill tags renderer ───────────────────────────────────── */
function renderSkillTags(skillsStr, containerEl, className = "skill-tag") {
  if (!skillsStr) return;
  skillsStr.split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = s;
    containerEl.appendChild(span);
  });
}

/* ─── Hackathon theme emoji ─────────────────────────────────── */
const THEME_EMOJI = {
  "AI": "🤖","ML": "🤖","Blockchain": "⛓️","Web3": "⛓️","DeFi": "⛓️",
  "FinTech": "💳","Finance": "💳","Health": "🏥","Space": "🚀","NASA": "🚀",
  "GovTech": "🏛️","Sustainability": "🌱","ClimaTech": "🌱","Google": "🎨",
  "Social": "🤝",
};
function getHackEmoji(hack) {
  const haystack = [(hack.theme||""),(hack.tags||""),(hack.title||"")].join(" ");
  for (const [k,v] of Object.entries(THEME_EMOJI)) {
    if (haystack.includes(k)) return v;
  }
  return "🏆";
}

/* ─── Banner gradients ──────────────────────────────────────── */
const GRADIENTS = [
  "linear-gradient(135deg,rgba(0,255,225,0.12),rgba(168,85,247,0.12))",
  "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(244,114,182,0.12))",
  "linear-gradient(135deg,rgba(251,191,36,0.1),rgba(0,255,225,0.1))",
  "linear-gradient(135deg,rgba(52,211,153,0.1),rgba(0,255,225,0.1))",
  "linear-gradient(135deg,rgba(244,114,182,0.1),rgba(251,191,36,0.08))",
];

/* ─── Navbar auth state ─────────────────────────────────────── */
function initNavbar() {
  const actionsEl    = document.getElementById("navbar-actions");
  const mobileToggle = document.getElementById("mobile-toggle");
  const links        = document.getElementById("navbar-links");

  if (mobileToggle && links) {
    mobileToggle.addEventListener("click", () => links.classList.toggle("open"));
  }
  if (!actionsEl) return;

  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    const initial = (user?.username || "U")[0].toUpperCase();
    
    let dashboardLink = "/pages/dashboard.html";
    let dashboardText = "Student Dash";
    
    if (user.role === "admin") {
      dashboardLink = "/pages/admin.html";
      dashboardText = "Admin Panel";
    } else if (user.role === "organizer") {
      dashboardLink = "/pages/organizer.html";
      dashboardText = "Organizer Hub";
    }

    actionsEl.innerHTML = `
      <a href="${dashboardLink}" class="btn btn--secondary btn--sm">
        <span style="width:20px;height:20px;border-radius:50%;background:var(--clr-purple);display:inline-flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;color:white;margin-right:6px">${initial}</span>
        ${dashboardText}
      </a>
      <button class="btn btn--ghost btn--sm" id="nav-logout-btn">Log Out</button>
    `;
    document.getElementById("nav-logout-btn")?.addEventListener("click", () => {
      Auth.clear();
      window.location.href = "/pages/index.html";
    });
    document.getElementById("nav-login")?.remove();
    document.getElementById("nav-signup")?.remove();
  }
}

/* ─── Light/Dark Theme Toggle ──────────────────────────────── */
function initTheme() {
  const currentTheme = localStorage.getItem("ca_theme") || "dark";
  if (currentTheme === "light") document.documentElement.setAttribute("data-theme", "light");

  const btn = document.createElement("button");
  btn.innerHTML = currentTheme === "light" ? "🌙" : "☀️";
  btn.title = "Toggle Light/Dark Theme";
  btn.style.cssText = "position:fixed;bottom:24px;left:24px;z-index:9998;background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:50%;width:48px;height:48px;font-size:1.5rem;box-shadow:var(--shadow-card);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--transition);";
  
  btn.onmouseover = () => btn.style.transform = "scale(1.1)";
  btn.onmouseout = () => btn.style.transform = "scale(1)";

  btn.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("ca_theme", "dark");
      btn.innerHTML = "☀️";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("ca_theme", "light");
      btn.innerHTML = "🌙";
    }
  });

  document.body.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initTheme();
});

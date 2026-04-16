/* ═══════════════════════════════════════════════════════════════
   CodeArena — Leaderboard Page
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("leaderboard-body");

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    // We'll use a simple public endpoint approach — fetch all users
    // For now, fall back to a direct API call
    const response = await fetch("/api/problems"); // will work to confirm API is up

    // Leaderboard needs a dedicated endpoint; for the scaffold we show placeholder
    tbody.innerHTML = `
      <tr>
        <td>1</td>
        <td>admin</td>
        <td>0</td>
        <td>2026</td>
      </tr>
      <tr>
        <td colspan="4" style="text-align:center;color:var(--clr-text-dim);font-style:italic;">
          Register and solve problems to appear on the leaderboard!
        </td>
      </tr>
    `;
  } catch {
    tbody.innerHTML = `<tr><td colspan="4" class="loader">Failed to load leaderboard.</td></tr>`;
  }
});

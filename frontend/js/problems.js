/* ═══════════════════════════════════════════════════════════════
   CodeArena — Problems List Page
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("problems-list");
  const loaderEl = document.getElementById("problems-loader");
  const filtersEl = document.getElementById("difficulty-filters");

  let allProblems = [];

  /* ─── Fetch problems ────────────────────────────────── */
  try {
    const data = await apiFetch("/problems");
    allProblems = data.data;
    render(allProblems);
  } catch (err) {
    loaderEl.textContent = "Failed to load problems.";
  }

  /* ─── Render helper ─────────────────────────────────── */
  function render(problems) {
    loaderEl.classList.add("hidden");

    if (problems.length === 0) {
      listEl.innerHTML = `<p class="loader">No problems found.</p>`;
      return;
    }

    const html = problems
      .map(
        (p) => `
      <a href="/pages/editor.html?id=${p.id}" class="problem-row" data-difficulty="${p.difficulty}">
        <span class="problem-row__title">${p.title}</span>
        <span class="badge badge--${p.difficulty}">${p.difficulty}</span>
      </a>`
      )
      .join("");

    listEl.innerHTML = html;
  }

  /* ─── Difficulty filter ─────────────────────────────── */
  if (filtersEl) {
    filtersEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;

      // Toggle active class
      filtersEl.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      const diff = chip.dataset.difficulty;
      if (diff === "all") {
        render(allProblems);
      } else {
        render(allProblems.filter((p) => p.difficulty === diff));
      }
    });
  }
});

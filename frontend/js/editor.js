/* ═══════════════════════════════════════════════════════════════
   CodeArena — Editor Page Logic
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("id");

  if (!problemId) {
    document.getElementById("problem-title").textContent = "No problem selected.";
    return;
  }

  /* ─── Load problem details ─────────────────────────── */
  try {
    const { data: problem } = await apiFetch(`/problems/${problemId}`);

    document.getElementById("problem-title").textContent = problem.title;

    const badge = document.getElementById("problem-difficulty");
    badge.textContent = problem.difficulty;
    badge.className = `badge badge--${problem.difficulty}`;

    document.getElementById("problem-description").textContent = problem.description;
    document.getElementById("problem-input-format").textContent = problem.input_format || "—";
    document.getElementById("problem-output-format").textContent = problem.output_format || "—";
    document.getElementById("problem-constraints").textContent = problem.constraints || "—";
    document.getElementById("problem-sample-input").textContent = problem.sample_input || "—";
    document.getElementById("problem-sample-output").textContent = problem.sample_output || "—";
  } catch (err) {
    document.getElementById("problem-title").textContent = "Error loading problem.";
  }

  /* ─── Submit code ──────────────────────────────────── */
  const submitBtn = document.getElementById("submit-btn");
  const codeEditor = document.getElementById("code-editor");
  const languageSelect = document.getElementById("language-select");
  const resultEl = document.getElementById("submission-result");

  submitBtn.addEventListener("click", async () => {
    // Protected action — require auth
    if (!requireAuth()) return;

    const code = codeEditor.value.trim();
    if (!code) {
      resultEl.classList.remove("hidden", "accepted", "wrong");
      resultEl.classList.add("pending");
      resultEl.textContent = "⚠ Please write some code before submitting.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const { data: submission } = await apiFetch("/submissions", {
        method: "POST",
        body: JSON.stringify({
          problem_id: problemId,
          language: languageSelect.value,
          code,
        }),
      });

      resultEl.classList.remove("hidden", "accepted", "wrong", "pending");
      const statusClass = submission.status === "accepted" ? "accepted" : submission.status === "wrong_answer" ? "wrong" : "pending";
      resultEl.classList.add(statusClass);
      resultEl.textContent = `Verdict: ${submission.status.replace(/_/g, " ").toUpperCase()}  •  Runtime: ${submission.runtime_ms}ms`;
    } catch (err) {
      resultEl.classList.remove("hidden", "accepted", "pending");
      resultEl.classList.add("wrong");
      resultEl.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
});

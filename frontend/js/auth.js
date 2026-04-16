/* ═══════════════════════════════════════════════════════════════
   CodeArena — Auth JS (login + register)
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    let redirect = "/pages/dashboard.html";
    if (user.role === "admin")     redirect = "/pages/admin.html";
    if (user.role === "organizer") redirect = "/pages/organizer.html";
    window.location.href = redirect;
    return;
  }

  /* ─── Shared: password toggle ─── */
  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrapper").querySelector("input");
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });

  /* ─── Register Form ─── */
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    const pwdInput  = document.getElementById("password");
    const bar       = document.getElementById("strength-bar");
    const label     = document.getElementById("strength-label");

    // Password strength meter
    pwdInput?.addEventListener("input", () => {
      const v = pwdInput.value;
      let score = 0;
      if (v.length >= 6)  score++;
      if (v.length >= 10) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;

      const pct   = (score / 5) * 100;
      const color = score <= 1 ? "var(--clr-red)" : score <= 3 ? "var(--clr-yellow)" : "var(--clr-green)";
      const text  = score <= 1 ? "Weak" : score <= 3 ? "Fair" : "Strong";

      if (bar)   { bar.style.width = pct + "%"; bar.style.background = color; }
      if (label) { label.textContent = v ? text : ""; label.style.color = color; }
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFormErrors();

      const username = document.getElementById("username").value.trim();
      const email    = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirm  = document.getElementById("confirm-password").value;
      const role     = document.querySelector('input[name="role"]:checked')?.value || 'student';

      // Client-side validation
      let valid = true;
      if (!username || username.length < 3) {
        setFieldError("username", "Username must be at least 3 characters");
        valid = false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setFieldError("username", "Only letters, numbers and underscores allowed");
        valid = false;
      }
      if (!email || !email.includes("@")) {
        setFieldError("email", "Enter a valid email address");
        valid = false;
      }
      if (!password || password.length < 6) {
        setFieldError("password", "Password must be at least 6 characters");
        valid = false;
      }
      if (password !== confirm) {
        setFieldError("confirm", "Passwords do not match");
        valid = false;
      }
      if (!valid) return;

      setLoading(true, "register-btn", "register-spinner");

      try {
        const data = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ username, email, password, role }),
        });
        Auth.setSession(data.token, data.user);
        showToast("Welcome to CodeArena! 🎉", "success");
        
        let redirect = "/pages/dashboard.html";
        if (data.user.role === "admin")     redirect = "/pages/admin.html";
        if (role === "organizer") redirect = "/pages/organizer.html"; // check the 'role' variable from form

        setTimeout(() => { window.location.href = redirect; }, 800);
      } catch (err) {
        document.getElementById("register-error").textContent = err.message;
        document.getElementById("register-error").classList.remove("hidden");
      } finally {
        setLoading(false, "register-btn", "register-spinner");
      }
    });
  }

  /* ─── Login Form ─── */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFormErrors();

      const email    = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      let valid = true;
      if (!email) { setFieldError("email", "Email is required"); valid = false; }
      if (!password) { setFieldError("password", "Password is required"); valid = false; }
      if (!valid) return;

      setLoading(true, "login-btn", "login-spinner");

      try {
        const data = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        Auth.setSession(data.token, data.user);
        showToast("Welcome back! 👋", "success");

        let redirect = "/pages/dashboard.html";
        if (data.user.role === "admin")     redirect = "/pages/admin.html";
        if (data.user.role === "organizer") redirect = "/pages/organizer.html";
        
        setTimeout(() => { window.location.href = redirect; }, 600);
      } catch (err) {
        document.getElementById("login-error").textContent = err.message;
        document.getElementById("login-error").classList.remove("hidden");
      } finally {
        setLoading(false, "login-btn", "login-spinner");
      }
    });
  }

  /* ─── Helpers ─── */
  function setFieldError(field, msg) {
    const hint = document.getElementById(`hint-${field}`);
    const grp  = document.getElementById(`group-${field}`);
    if (hint) { hint.textContent = msg; hint.style.color = "var(--clr-red)"; }
    if (grp)  grp.querySelector("input")?.style.setProperty("border-color","var(--clr-red)","important");
  }

  function clearFormErrors() {
    document.querySelectorAll(".form-hint").forEach(el => { el.textContent = ""; el.style.color = ""; });
    document.querySelectorAll(".form-input").forEach(el => el.style.borderColor = "");
    document.querySelectorAll(".form-error").forEach(el => el.classList.add("hidden"));
  }

  function setLoading(on, btnId, spinnerId) {
    const btn     = document.getElementById(btnId);
    const spinner = document.getElementById(spinnerId);
    const text    = btn?.querySelector(".btn__text");
    if (on) {
      btn?.setAttribute("disabled", true);
      spinner?.classList.remove("hidden");
      if (text) text.style.opacity = "0.7";
    } else {
      btn?.removeAttribute("disabled");
      spinner?.classList.add("hidden");
      if (text) text.style.opacity = "";
    }
  }
});

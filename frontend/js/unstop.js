document.addEventListener("DOMContentLoaded", () => {
    const registerBtn = document.getElementById("detail-register-internal-btn");
    const submitForm = document.getElementById("submission-form");

    // Fetch the hackathon ID from the URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const hackathonId = urlParams.get("id");

    if (!hackathonId) return;

    if (registerBtn) {
        registerBtn.addEventListener("click", async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                if (typeof showToast === 'function') {
                    showToast("Please log in to register for this hackathon.", "error");
                } else {
                    alert("Please log in to register.");
                }
                setTimeout(() => {
                    window.location.href = `/pages/login.html?redirect=/pages/hackathon-detail.html?id=${hackathonId}`;
                }, 1500);
                return;
            }

            try {
                const res = await fetch(`/api/hackathons/${hackathonId}/register`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();

                if (res.ok) {
                    if (typeof showToast === 'function') showToast("Successfully registered for the hackathon!", "success");
                    else alert("Successfully registered!");

                    registerBtn.innerText = "Registered ✔️";
                    registerBtn.disabled = true;
                    registerBtn.style.backgroundColor = "var(--clr-green)";
                    registerBtn.style.color = "#fff";
                } else {
                    if (typeof showToast === 'function') showToast(data.message || "Failed to register", "error");
                    else alert(data.message || "Failed to register");

                    if (data.message === "Already registered for this hackathon") {
                        registerBtn.innerText = "Registered ✔️";
                        registerBtn.disabled = true;
                        registerBtn.style.backgroundColor = "var(--clr-green)";
                        registerBtn.style.color = "#fff";
                    }
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    if (submitForm) {
        submitForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                if (typeof showToast === 'function') showToast("Please log in to submit your project.", "error");
                else alert("Please log in first.");
                return;
            }

            const payload = {
                project_title: document.getElementById("sub-title").value,
                repo_url: document.getElementById("sub-repo").value,
                demo_url: document.getElementById("sub-demo").value,
                description: document.getElementById("sub-desc").value
            };

            const submitBtn = document.getElementById("submit-proj-btn");
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Submitting...";
            submitBtn.disabled = true;

            try {
                const res = await fetch(`/api/hackathons/${hackathonId}/submit`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (res.ok) {
                    if (typeof showToast === 'function') showToast("Project submitted successfully!", "success");
                    else alert("Project submitted successfully!");
                    submitForm.reset();
                } else {
                    if (typeof showToast === 'function') showToast(data.message || "Submission failed.", "error");
                    else alert(data.message || "Submission failed.");
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') showToast("Network error during submission.", "error");
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});

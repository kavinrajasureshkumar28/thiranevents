/* Landing / role selection / admin login */
(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const modal = document.getElementById("loginModal");
  const closeBtn = document.getElementById("loginClose");
  const form = document.getElementById("loginForm");
  const errEl = document.getElementById("loginError");

  document.querySelectorAll(".role-card").forEach((card) => {
    card.addEventListener("click", () => {
      const role = card.dataset.role;
      if (role === "admin") openLogin();
      else window.location.href = "./participant.html";
    });
  });

  function openLogin() {
    errEl.textContent = "";
    form.reset();
    modal.classList.add("open");
    setTimeout(() => form.querySelector('input[name="username"]').focus(), 60);
  }
  function closeLogin() { modal.classList.remove("open"); }
  closeBtn.addEventListener("click", closeLogin);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeLogin(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLogin(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const u = String(fd.get("username") || "").trim();
    const p = String(fd.get("password") || "");
    if (u === "kavin_2008" && p === "kavin@28") {
      EV.session.login();
      errEl.textContent = "";
      EV.toast("Welcome back, admin", "success");
      setTimeout(() => window.location.href = "./admin.html", 500);
    } else {
      errEl.textContent = "Invalid username or password. Please try again.";
      const box = form.closest(".modal");
      box.classList.remove("shake");
      void box.offsetWidth;
      box.classList.add("shake");
    }
  });

  if (EV.session.isAuthed()) {
    // Show a subtle chip? For now, auto-focus admin path only on click.
  }
})();

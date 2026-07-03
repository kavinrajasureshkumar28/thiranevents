/* ==========================================================
   Eventide — Participant portal
   ========================================================== */
(function () {
  document.getElementById("year").textContent = new Date().getFullYear();

  const grid = document.getElementById("eventsGrid");
  const chips = document.getElementById("categoryChips");
  const pager = document.getElementById("pagination");
  const modalRoot = document.getElementById("modalRoot");

  const state = { search: "", cat: "all", sort: "date", page: 1, pageSize: 9 };

  // Stats
  const today = new Date().toISOString().slice(0,10);
  const allEvents = EV.events.list();
  const upcoming = allEvents.filter(e => e.date >= today && e.status === "Active");
  document.getElementById("sTot").textContent = allEvents.length;
  document.getElementById("sReg").textContent = EV.regs.list().length;
  document.getElementById("sUp").textContent = upcoming.length;
  document.getElementById("sCat").textContent = new Set(allEvents.map(e => e.category)).size;
  document.getElementById("liveCount").textContent = upcoming.length;

  // Category chips
  const cats = ["all", ...Array.from(new Set(allEvents.map(e => e.category)))];
  chips.innerHTML = cats.map(c => `<button data-cat="${c}" class="${c===state.cat?'active':''}">${c === "all" ? "All" : c}</button>`).join("");
  chips.querySelectorAll("[data-cat]").forEach(b => {
    b.addEventListener("click", () => {
      state.cat = b.dataset.cat; state.page = 1;
      chips.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      paint();
    });
  });

  document.getElementById("pSearch").addEventListener("input", e => { state.search = e.target.value; state.page = 1; paint(); });
  document.getElementById("pSort").addEventListener("change", e => { state.sort = e.target.value; paint(); });

  function paint() {
    const q = state.search.trim().toLowerCase();
    let items = EV.events.list().filter(e => e.status !== "Cancelled");
    if (state.cat !== "all") items = items.filter(e => e.category === state.cat);
    if (q) items = items.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
    if (state.sort === "name") items.sort((a,b) => a.name.localeCompare(b.name));
    else if (state.sort === "seats") items.sort((a,b) => seatsLeft(b) - seatsLeft(a));
    else items.sort((a,b) => a.date.localeCompare(b.date));

    if (!items.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1;"><h3>No events found</h3><p>Try a different keyword or category.</p></div>`;
      pager.innerHTML = ""; return;
    }
    const pages = Math.max(1, Math.ceil(items.length / state.pageSize));
    if (state.page > pages) state.page = pages;
    const slice = items.slice((state.page-1)*state.pageSize, (state.page-1)*state.pageSize + state.pageSize);
    grid.innerHTML = slice.map(cardHtml).join("");
    grid.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => openDetail(b.dataset.view)));
    grid.querySelectorAll("[data-reg]").forEach(b => b.addEventListener("click", () => openRegisterForm(b.dataset.reg)));
    pager.innerHTML = pagerHtml(state.page, pages);
    pager.querySelectorAll("[data-p]").forEach(b => {
      if (b.disabled) return;
      b.addEventListener("click", () => { state.page = +b.dataset.p; paint(); window.scrollTo({ top: document.getElementById("events").offsetTop - 20, behavior: "smooth" }); });
    });
  }

  function seatsLeft(e) {
    const used = EV.regs.byEvent(e.id).filter(r => r.status !== "Cancelled").length;
    return Math.max(0, e.max - used);
  }
  function isClosed(e) {
    return e.status !== "Active" || e.deadline < today || seatsLeft(e) === 0;
  }

  function cardHtml(e) {
    const s = seatsLeft(e);
    const closed = isClosed(e);
    return `
      <div class="event-card">
        <div class="event-banner">
          <img src="${e.banner}" alt="${EV.escapeHtml(e.name)}" loading="lazy"/>
          <span class="cat-badge">${e.category}</span>
          <span class="seat-pill">${s} seats left</span>
        </div>
        <div class="event-body">
          <h3>${EV.escapeHtml(e.name)}</h3>
          <div class="event-meta">
            <span>📅 ${EV.fmtDate(e.date)}</span>
            <span>🕒 ${EV.fmtTime(e.time)}</span>
            <span>📍 ${EV.escapeHtml(e.venue)}</span>
          </div>
          <p class="desc">${EV.escapeHtml(e.desc)}</p>
          <div class="event-actions">
            <button class="btn btn-sm" data-view="${e.id}">View details</button>
            <button class="btn btn-sm btn-primary" data-reg="${e.id}" ${closed?'disabled':''} style="margin-left:auto;">
              ${closed ? (s===0 ? "Sold out" : "Closed") : "Register"}
            </button>
          </div>
        </div>
      </div>`;
  }

  function pagerHtml(cur, pages) {
    if (pages <= 1) return "";
    let out = `<button data-p="${cur-1}" ${cur<=1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= pages; i++) out += `<button data-p="${i}" class="${i===cur?'active':''}">${i}</button>`;
    out += `<button data-p="${cur+1}" ${cur>=pages?'disabled':''}>›</button>`;
    return out;
  }

  // -------- Detail modal --------
  function openDetail(id) {
    const e = EV.events.get(id); if (!e) return;
    const s = seatsLeft(e);
    const closed = isClosed(e);
    openModal(`
      <div class="modal wide" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="detail-banner"><img src="${e.banner}" alt=""/></div>
        <div style="display:flex; justify-content:space-between; gap:16px; margin-bottom:10px;">
          <div>
            <span class="cat-badge">${e.category}</span>
            <h2 style="margin-top:8px;">${EV.escapeHtml(e.name)}</h2>
            <p class="muted" style="font-size:13.5px;">by ${EV.escapeHtml(e.organizer)}</p>
          </div>
        </div>
        <div class="detail-meta">
          <span>📅 ${EV.fmtDate(e.date)}</span>
          <span>🕒 ${EV.fmtTime(e.time)}</span>
          <span>📍 ${EV.escapeHtml(e.venue)}</span>
          <span>👥 ${s} of ${e.max} seats left</span>
          <span>⏱ Deadline ${EV.fmtDate(e.deadline)}</span>
        </div>
        <p style="color:var(--text-muted); font-size:14px;">${EV.escapeHtml(e.desc)}</p>
        <div class="modal-actions" style="margin-top:20px;">
          <button class="btn" id="shareBtn">Share</button>
          <button class="btn btn-primary" id="regFromDetail" ${closed?'disabled':''}>${closed ? (s===0 ? "Sold out" : "Closed") : "Register now"}</button>
        </div>
      </div>`);
    document.getElementById("regFromDetail").addEventListener("click", () => { closeModal(); openRegisterForm(id); });
    document.getElementById("shareBtn").addEventListener("click", async () => {
      const shareData = { title: e.name, text: `Check out ${e.name} on Eventide`, url: location.href };
      try { if (navigator.share) { await navigator.share(shareData); } else { await navigator.clipboard.writeText(location.href); EV.toast("Link copied", "success"); } }
      catch {}
    });
  }

  // -------- Register form --------
  function openRegisterForm(eventId) {
    const e = EV.events.get(eventId); if (!e) return;
    openModal(`
      <div class="modal wide" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="modal-head">
          <div class="role-icon small">✎</div>
          <div><h2>Register for event</h2><p class="muted">${EV.escapeHtml(e.name)}</p></div>
        </div>
        <form id="regForm" class="form" novalidate>
          <div class="form-grid">
            <label class="field"><span>Full name *</span><input name="name" required minlength="2" placeholder="Your full name"/></label>
            <label class="field"><span>Email *</span><input type="email" name="email" required placeholder="you@example.com"/></label>
            <label class="field"><span>Phone *</span><input name="phone" required pattern="[0-9+\\-\\s]{7,15}" placeholder="10-digit number"/></label>
            <label class="field"><span>College / Organization *</span><input name="college" required/></label>
            <label class="field"><span>Department</span><input name="dept" placeholder="e.g. CSE"/></label>
            <label class="field"><span>Year</span>
              <select name="year"><option value="">Select</option>${["1","2","3","4","5"].map(y=>`<option>${y}</option>`).join("")}</select>
            </label>
            <label class="field"><span>Gender (optional)</span>
              <select name="gender"><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select>
            </label>
            <label class="field"><span>Event</span>
              <select name="eventId" disabled><option value="${e.id}" selected>${EV.escapeHtml(e.name)}</option></select>
            </label>
            <label class="field full"><span>Additional notes</span><textarea name="notes" placeholder="Anything organizers should know?"></textarea></label>
          </div>
          <label class="check-row"><input type="checkbox" name="terms" required/> I agree to the event Terms and Conditions and consent to data usage for this registration.</label>
          <div class="login-error" id="regError"></div>
          <div class="modal-actions">
            <button type="button" class="btn" data-close>Cancel</button>
            <button type="submit" class="btn btn-primary" id="regSubmit">Complete registration</button>
          </div>
        </form>
      </div>`);
    const form = document.getElementById("regForm");
    const err = document.getElementById("regError");
    form.addEventListener("submit", (evt) => {
      evt.preventDefault();
      err.textContent = "";
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const college = String(fd.get("college") || "").trim();
      if (!name || name.length < 2) return fail("Please enter your full name.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid email address.");
      if (!/^[0-9+\-\s]{7,15}$/.test(phone)) return fail("Please enter a valid phone number.");
      if (!college) return fail("College or organization is required.");
      if (!fd.get("terms")) return fail("Please agree to the terms to continue.");
      if (EV.regs.exists(email, eventId)) return fail("You've already registered for this event with this email.");
      if (seatsLeft(e) === 0) return fail("Sorry, this event is sold out.");

      const btn = document.getElementById("regSubmit");
      btn.innerHTML = `<span class="spinner"></span> Registering...`;
      btn.disabled = true;

      setTimeout(() => {
        const reg = {
          id: EV.regs.nextId(),
          name, email, phone, college,
          dept: String(fd.get("dept")||"").trim(),
          year: String(fd.get("year")||"").trim(),
          gender: String(fd.get("gender")||"").trim(),
          eventId,
          notes: String(fd.get("notes")||"").trim(),
          createdAt: Date.now(),
          status: "Approved",
        };
        EV.regs.save(reg);
        openSuccess(reg, e);
        paint();
      }, 700);

      function fail(m) { err.textContent = m; form.closest(".modal").classList.remove("shake"); void form.offsetWidth; form.closest(".modal").classList.add("shake"); }
    });
  }

  function openSuccess(reg, e) {
    openModal(`
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="success-screen">
          <div class="success-check">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2 style="font-size:22px;">You're in! 🎉</h2>
          <p class="muted" style="margin-top:6px;">Your seat for <b style="color:var(--text);">${EV.escapeHtml(e.name)}</b> is confirmed.</p>
          <div class="reg-id">${reg.id}</div>
          <p class="muted" style="font-size:13px;">Save your registration ID. You'll need it at the venue on ${EV.fmtDate(e.date)}.</p>
          <div class="modal-actions" style="justify-content:center; margin-top:24px;">
            <button class="btn" id="downloadConf">Download confirmation</button>
            <button class="btn btn-primary" data-close>Done</button>
          </div>
        </div>
      </div>`);
    document.getElementById("downloadConf").addEventListener("click", () => downloadTicket(reg, e));
  }

  function downloadTicket(reg, e) {
    const txt =
`EVENTIDE — REGISTRATION CONFIRMATION
===================================
Registration ID : ${reg.id}
Name            : ${reg.name}
Email           : ${reg.email}
Phone           : ${reg.phone}
College         : ${reg.college}

EVENT
-----
Name    : ${e.name}
Category: ${e.category}
Date    : ${EV.fmtDate(e.date)}
Time    : ${EV.fmtTime(e.time)}
Venue   : ${e.venue}
Organizer: ${e.organizer}

Please retain this confirmation. Present your registration ID at the venue.
`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${reg.id}.txt` });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    EV.toast("Confirmation downloaded", "success");
  }

  // -------- Modal helpers --------
  function openModal(html) {
    modalRoot.innerHTML = `<div class="modal-backdrop open">${html}</div>`;
    const back = modalRoot.firstElementChild;
    back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
    back.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeModal));
  }
  function closeModal() { modalRoot.innerHTML = ""; }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  paint();
})();

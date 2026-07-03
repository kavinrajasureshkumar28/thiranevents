/* ==========================================================
   Eventide — Admin App (hash router, all modules)
   ========================================================== */
(function () {
  if (!EV.session.requireAuth("./index.html")) return;

  // --------- Top bar ---------
  document.getElementById("topDate").textContent =
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    if (await EV.confirm("You will be signed out of the admin dashboard.")) {
      EV.session.logout();
      window.location.href = "./index.html";
    }
  });

  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

  const pageRoot = document.getElementById("pageRoot");
  const modalRoot = document.getElementById("modalRoot");

  // --------- Router ---------
  const routes = ["dashboard", "events", "participants", "registrations", "attendance", "settings"];
  function currentRoute() {
    const r = (location.hash.replace("#", "") || "dashboard").split("/")[0];
    return routes.includes(r) ? r : "dashboard";
  }
  function navigate(r) { location.hash = r; }
  window.addEventListener("hashchange", render);
  document.querySelectorAll("[data-nav]").forEach(l => {
    l.addEventListener("click", () => { navigate(l.dataset.nav); sidebar.classList.remove("open"); });
  });

  // Global search shortcut
  const gs = document.getElementById("globalSearch");
  gs.addEventListener("input", () => {
    const r = currentRoute();
    if (r === "events" || r === "participants" || r === "registrations" || r === "attendance") {
      const local = document.getElementById("localSearch");
      if (local) { local.value = gs.value; local.dispatchEvent(new Event("input")); }
    }
  });

  // --------- Render ---------
  function render() {
    const r = currentRoute();
    document.querySelectorAll(".side-link[data-nav]").forEach(l => {
      l.classList.toggle("active", l.dataset.nav === r);
    });
    const fn = { dashboard: renderDashboard, events: renderEvents, participants: renderParticipants,
      registrations: renderRegistrations, attendance: renderAttendance, settings: renderSettings }[r];
    pageRoot.innerHTML = "";
    fn();
  }

  // =========== DASHBOARD ===========
  function renderDashboard() {
    const events = EV.events.list();
    const regs = EV.regs.list();
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(e => e.date >= today);
    const todays = events.filter(e => e.date === today);
    const attended = regs.filter(r => r.status === "Attended").length;
    const cancelled = regs.filter(r => r.status === "Cancelled").length;
    const attendPct = regs.length ? Math.round((attended / regs.length) * 100) : 0;

    // Category counts
    const catCount = {};
    events.forEach(e => catCount[e.category] = (catCount[e.category] || 0) + 1);
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCat = Math.max(1, ...topCats.map(([, v]) => v));

    // Registrations over last 7 days
    const daily = new Array(7).fill(0);
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      daily[6 - i] = regs.filter(r => r.createdAt >= start.getTime() && r.createdAt <= end.getTime()).length;
    }
    const maxDay = Math.max(1, ...daily);

    const recent = [...regs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    const deadlines = [...events].filter(e => e.deadline >= today).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);

    pageRoot.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <h1>Dashboard</h1>
            <p class="muted">Overview of your events, registrations and activity.</p>
          </div>
          <div class="page-actions">
            <button class="btn" data-nav-btn="events">Manage events</button>
            <button class="btn btn-primary" id="quickCreate">+ New event</button>
          </div>
        </div>

        <div class="stats-grid">
          ${statCard("Total events", events.length, "+3 this month", true, iconCal())}
          ${statCard("Total registrations", regs.length, "+" + daily.reduce((a,b)=>a+b,0) + " this week", true, iconUsers())}
          ${statCard("Upcoming events", upcoming.length, todays.length + " happening today", null, iconClock())}
          ${statCard("Attendance rate", attendPct + "%", attended + " attended", true, iconCheck())}
          ${statCard("Today's events", todays.length, todays[0]?.name || "No events today", null, iconStar())}
          ${statCard("Cancelled", cancelled, "of " + regs.length + " total", null, iconX())}
        </div>

        <div class="grid-2">
          <div class="panel">
            <div class="panel-head">
              <div><h3>Registrations · last 7 days</h3><p class="muted">Daily sign-ups across all events</p></div>
              <div class="chart-legend"><span><span class="legend-dot" style="background:var(--grad-primary)"></span>Registrations</span></div>
            </div>
            <div class="chart-bars">
              ${daily.map((v, i) => `<div class="bar" style="height:${Math.max(6, (v/maxDay)*180)}px"><em>${v}</em><span>${labels[i]}</span></div>`).join("")}
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Attendance</h3></div>
            <div class="donut-wrap">
              <div class="donut" style="--p:${attendPct}"><span>${attendPct}%</span></div>
              <div>
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;"><span class="legend-dot" style="background:var(--primary)"></span>Attended · ${attended}</div>
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;"><span class="legend-dot" style="background:rgba(255,255,255,0.1)"></span>Not marked · ${regs.length - attended}</div>
                <div style="font-size:13px; color:var(--text-muted);"><span class="legend-dot" style="background:rgba(239,68,68,0.6)"></span>Cancelled · ${cancelled}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-2" style="margin-top: 16px;">
          <div class="panel">
            <div class="panel-head">
              <div><h3>Recent registrations</h3><p class="muted">Latest 6 sign-ups</p></div>
              <button class="btn btn-sm" data-nav-btn="registrations">View all</button>
            </div>
            <div class="table-wrap">
              <table class="data">
                <thead><tr><th>ID</th><th>Name</th><th>Event</th><th>When</th><th>Status</th></tr></thead>
                <tbody>
                  ${recent.map(r => {
                    const ev = EV.events.get(r.eventId);
                    return `<tr>
                      <td>${r.id}</td>
                      <td>${EV.escapeHtml(r.name)}</td>
                      <td>${EV.escapeHtml(ev?.name || "—")}</td>
                      <td class="muted">${EV.timeAgo(r.createdAt)}</td>
                      <td>${badge(r.status)}</td>
                    </tr>`;
                  }).join("") || `<tr><td colspan="5" class="muted">No registrations yet.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Calendar</h3></div>
            ${miniCalendar(events)}
            <div class="panel-head" style="margin-top:20px;"><h3 style="font-size:14px;">Upcoming deadlines</h3></div>
            <div class="activity-list">
              ${deadlines.map(e => `
                <div class="activity-item">
                  <div class="activity-dot">⏱</div>
                  <div class="activity-body">
                    <div>${EV.escapeHtml(e.name)}</div>
                    <div class="t">Registration closes ${EV.fmtDate(e.deadline)}</div>
                  </div>
                </div>`).join("") || `<p class="muted" style="font-size:13px;">No pending deadlines.</p>`}
            </div>
          </div>
        </div>

        <div class="panel" style="margin-top:16px;">
          <div class="panel-head"><h3>Categories · event distribution</h3></div>
          <div class="chart-bars" style="height:180px;">
            ${topCats.map(([c, v]) => `<div class="bar" style="height:${(v/maxCat)*160}px; background: linear-gradient(180deg, #7C3AED, #2563EB);"><em>${v}</em><span>${c}</span></div>`).join("")}
          </div>
        </div>
      </div>`;

    pageRoot.querySelectorAll("[data-nav-btn]").forEach(b =>
      b.addEventListener("click", () => navigate(b.dataset.navBtn))
    );
    document.getElementById("quickCreate").addEventListener("click", () => openEventForm());
  }

  function statCard(label, value, sub, up, icon) {
    return `<div class="stat-card">
      <div class="stat-icon">${icon}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value" data-count="${typeof value === 'number' ? value : ''}">${value}</div>
      ${sub ? `<div class="stat-sub">${up == null ? '' : (up ? `<span class="up">▲</span>` : `<span class="down">▼</span>`)}<span>${sub}</span></div>` : ""}
    </div>`;
  }

  function badge(status) {
    const key = String(status || "").toLowerCase();
    return `<span class="badge ${key}">${status}</span>`;
  }

  function miniCalendar(events) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0).getDate();
    const startDow = first.getDay();
    const dowLabels = ["S","M","T","W","T","F","S"];
    const eventDates = new Set(events.map(e => e.date));
    const todayStr = now.toISOString().slice(0,10);
    let cells = dowLabels.map(l => `<div class="dow">${l}</div>`).join("");
    for (let i = 0; i < startDow; i++) cells += `<div class="day"></div>`;
    for (let d = 1; d <= last; d++) {
      const iso = new Date(y, m, d).toISOString().slice(0,10);
      const cls = ["day"];
      if (eventDates.has(iso)) cls.push("has-event");
      if (iso === todayStr) cls.push("today");
      cells += `<div class="${cls.join(' ')}">${d}</div>`;
    }
    const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return `<div style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">${monthName}</div>
            <div class="mini-cal">${cells}</div>`;
  }

  // =========== EVENTS ===========
  const eventsState = { search: "", cat: "all", status: "all", page: 1, pageSize: 8 };

  function renderEvents() {
    pageRoot.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1>Events</h1><p class="muted">Create, edit and manage your events.</p></div>
          <div class="page-actions">
            <button class="btn" id="exportEvents">Export CSV</button>
            <button class="btn btn-primary" id="createEvent">+ New event</button>
          </div>
        </div>
        <div class="filters">
          <input id="localSearch" placeholder="Search events..." value="${eventsState.search}" />
          <select id="fCat"><option value="all">All categories</option>${EV.CATEGORIES.map(c => `<option ${eventsState.cat===c?'selected':''}>${c}</option>`).join("")}</select>
          <select id="fStatus">
            <option value="all">All status</option>
            <option ${eventsState.status==='Active'?'selected':''}>Active</option>
            <option ${eventsState.status==='Closed'?'selected':''}>Closed</option>
            <option ${eventsState.status==='Cancelled'?'selected':''}>Cancelled</option>
          </select>
        </div>
        <div id="eventsList"></div>
        <div class="pagination" id="pager"></div>
      </div>`;

    const list = document.getElementById("eventsList");
    const pager = document.getElementById("pager");
    document.getElementById("createEvent").addEventListener("click", () => openEventForm());
    document.getElementById("exportEvents").addEventListener("click", () => exportCSV("events.csv", EV.events.list(), ["id","name","category","date","time","venue","organizer","deadline","max","status"]));
    document.getElementById("localSearch").addEventListener("input", (e) => { eventsState.search = e.target.value; eventsState.page = 1; paint(); });
    document.getElementById("fCat").addEventListener("change", (e) => { eventsState.cat = e.target.value; eventsState.page = 1; paint(); });
    document.getElementById("fStatus").addEventListener("change", (e) => { eventsState.status = e.target.value; eventsState.page = 1; paint(); });

    function paint() {
      const q = eventsState.search.trim().toLowerCase();
      let items = EV.events.list().filter(e => {
        if (eventsState.cat !== "all" && e.category !== eventsState.cat) return false;
        if (eventsState.status !== "all" && e.status !== eventsState.status) return false;
        if (q && !(e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q))) return false;
        return true;
      });
      items.sort((a, b) => a.date.localeCompare(b.date));

      if (!items.length) {
        list.innerHTML = `<div class="empty"><h3>No events found</h3><p>Try adjusting your filters or create a new event.</p></div>`;
        pager.innerHTML = ""; return;
      }
      const total = items.length;
      const pages = Math.max(1, Math.ceil(total / eventsState.pageSize));
      if (eventsState.page > pages) eventsState.page = pages;
      const start = (eventsState.page - 1) * eventsState.pageSize;
      const slice = items.slice(start, start + eventsState.pageSize);

      list.innerHTML = `<div class="events-grid">${slice.map(eventCardHtml).join("")}</div>`;
      list.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => openEventDetail(b.dataset.view)));
      list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openEventForm(b.dataset.edit)));
      list.querySelectorAll("[data-dup]").forEach(b => b.addEventListener("click", () => duplicateEvent(b.dataset.dup)));
      list.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteEvent(b.dataset.del)));
      pager.innerHTML = paginationHtml(eventsState.page, pages, (p) => { eventsState.page = p; paint(); });
      wirePagination(pager, (p) => { eventsState.page = p; paint(); });
    }
    paint();
  }

  function eventCardHtml(e) {
    const regs = EV.regs.byEvent(e.id).filter(r => r.status !== "Cancelled").length;
    const seats = Math.max(0, e.max - regs);
    return `
      <div class="event-card">
        <div class="event-banner">
          <img src="${e.banner}" alt="${EV.escapeHtml(e.name)} banner" loading="lazy" />
          <span class="cat-badge">${e.category}</span>
          <span class="seat-pill">${seats} seats left</span>
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
            <button class="btn btn-sm" data-view="${e.id}">View</button>
            <button class="btn btn-sm" data-edit="${e.id}">Edit</button>
            <button class="btn btn-sm" data-dup="${e.id}">Duplicate</button>
            <button class="btn btn-sm btn-danger" data-del="${e.id}" style="margin-left:auto;">Delete</button>
          </div>
        </div>
      </div>`;
  }

  async function deleteEvent(id) {
    const ev = EV.events.get(id);
    if (!ev) return;
    if (await EV.confirm(`Delete "${ev.name}"? All ${EV.regs.byEvent(id).length} registrations will also be removed.`)) {
      EV.events.remove(id);
      EV.toast("Event deleted", "success");
      render();
    }
  }
  function duplicateEvent(id) {
    const ev = EV.events.get(id);
    if (!ev) return;
    const copy = { ...ev, id: EV.events.nextId(), name: ev.name + " (Copy)" };
    EV.events.save(copy);
    EV.toast("Event duplicated", "success");
    render();
  }

  function openEventForm(id) {
    const editing = id ? EV.events.get(id) : null;
    const e = editing || {
      id: EV.events.nextId(), name: "", category: EV.CATEGORIES[0],
      date: new Date().toISOString().slice(0,10), time: "10:00",
      venue: "", organizer: "", desc: "",
      deadline: new Date().toISOString().slice(0,10), max: 100, banner: "", status: "Active",
    };
    openModal(`
      <div class="modal wide" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="modal-head">
          <div class="role-icon small">✦</div>
          <div><h2>${editing ? "Edit event" : "New event"}</h2><p class="muted">${e.id}</p></div>
        </div>
        <form id="evForm" class="form">
          <div class="form-grid">
            <label class="field full"><span>Event name *</span><input name="name" required value="${EV.escapeHtml(e.name)}"/></label>
            <label class="field"><span>Category</span>
              <select name="category">${EV.CATEGORIES.map(c => `<option ${c===e.category?'selected':''}>${c}</option>`).join("")}</select>
            </label>
            <label class="field"><span>Status</span>
              <select name="status">${["Active","Closed","Cancelled"].map(s => `<option ${s===e.status?'selected':''}>${s}</option>`).join("")}</select>
            </label>
            <label class="field"><span>Date *</span><input type="date" name="date" required value="${e.date}"/></label>
            <label class="field"><span>Time *</span><input type="time" name="time" required value="${e.time}"/></label>
            <label class="field"><span>Venue *</span><input name="venue" required value="${EV.escapeHtml(e.venue)}"/></label>
            <label class="field"><span>Organizer *</span><input name="organizer" required value="${EV.escapeHtml(e.organizer)}"/></label>
            <label class="field"><span>Registration deadline *</span><input type="date" name="deadline" required value="${e.deadline}"/></label>
            <label class="field"><span>Max participants *</span><input type="number" name="max" min="1" required value="${e.max}"/></label>
            <label class="field full"><span>Banner image URL (optional)</span><input name="banner" placeholder="https://..." value="${EV.escapeHtml(e.banner && !e.banner.startsWith('data:') ? e.banner : '')}"/></label>
            <label class="field full"><span>Description *</span><textarea name="desc" required>${EV.escapeHtml(e.desc)}</textarea></label>
          </div>
          <div class="modal-actions" style="margin-top:8px;">
            <button type="button" class="btn" data-close>Cancel</button>
            <button type="submit" class="btn btn-primary">${editing ? "Save changes" : "Create event"}</button>
          </div>
        </form>
      </div>`);
    document.getElementById("evForm").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const fd = new FormData(evt.target);
      const out = { ...e };
      ["name","category","status","date","time","venue","organizer","deadline","banner","desc"].forEach(k => out[k] = String(fd.get(k) || "").trim());
      out.max = Math.max(1, parseInt(fd.get("max"), 10) || 1);
      if (!out.banner) {
        // reuse existing banner or generate
        out.banner = editing?.banner || `data:image/svg+xml;utf8,` + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='#2563EB'/><stop offset='1' stop-color='#7C3AED'/></linearGradient></defs><rect width='800' height='400' fill='url(#g)'/><text x='40' y='360' font-family='Inter' font-size='42' font-weight='700' fill='rgba(255,255,255,0.92)'>${out.name}</text></svg>`);
      }
      EV.events.save(out);
      closeModal();
      EV.toast(editing ? "Event updated" : "Event created", "success");
      render();
    });
  }

  function openEventDetail(id) {
    const e = EV.events.get(id); if (!e) return;
    const regs = EV.regs.byEvent(id);
    const active = regs.filter(r => r.status !== "Cancelled").length;
    openModal(`
      <div class="modal wide" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="detail-banner"><img src="${e.banner}" alt=""/></div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:10px;">
          <div>
            <span class="cat-badge">${e.category}</span>
            <h2 style="margin-top:8px;">${EV.escapeHtml(e.name)}</h2>
            <p class="muted" style="font-size:13.5px;">by ${EV.escapeHtml(e.organizer)}</p>
          </div>
          ${badge(e.status)}
        </div>
        <div class="detail-meta">
          <span>📅 ${EV.fmtDate(e.date)}</span>
          <span>🕒 ${EV.fmtTime(e.time)}</span>
          <span>📍 ${EV.escapeHtml(e.venue)}</span>
          <span>👥 ${active} / ${e.max} registered</span>
          <span>⏱ Deadline ${EV.fmtDate(e.deadline)}</span>
        </div>
        <p style="color:var(--text-muted); font-size:14px;">${EV.escapeHtml(e.desc)}</p>
        <div class="modal-actions" style="margin-top:20px;">
          <button class="btn" data-close>Close</button>
          <button class="btn btn-primary" id="editFromDetail">Edit event</button>
        </div>
      </div>`);
    document.getElementById("editFromDetail").addEventListener("click", () => { closeModal(); openEventForm(id); });
  }

  // =========== PARTICIPANTS / REGISTRATIONS ===========
  const partState = { search: "", event: "all", status: "all", page: 1, pageSize: 12, sort: "date_desc" };

  function renderParticipants() { renderRegList("participants"); }
  function renderRegistrations() { renderRegList("registrations"); }

  function renderRegList(mode) {
    const isReg = mode === "registrations";
    pageRoot.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <h1>${isReg ? "Registrations" : "Participants"}</h1>
            <p class="muted">${isReg ? "Manage registration status and details." : "All registered participants."}</p>
          </div>
          <div class="page-actions">
            <button class="btn" id="exportRegs">Export CSV</button>
            <button class="btn" onclick="window.print()">Print</button>
          </div>
        </div>
        <div class="filters">
          <input id="localSearch" placeholder="Search by name, email, ID..." value="${partState.search}"/>
          <select id="fEvent"><option value="all">All events</option>
            ${EV.events.list().map(e => `<option value="${e.id}" ${partState.event===e.id?'selected':''}>${EV.escapeHtml(e.name)}</option>`).join("")}
          </select>
          <select id="fStatus">
            <option value="all">All status</option>
            ${["Pending","Approved","Rejected","Cancelled","Attended"].map(s => `<option ${partState.status===s?'selected':''}>${s}</option>`).join("")}
          </select>
          <select id="fSort">
            <option value="date_desc" ${partState.sort==='date_desc'?'selected':''}>Newest first</option>
            <option value="date_asc" ${partState.sort==='date_asc'?'selected':''}>Oldest first</option>
            <option value="name" ${partState.sort==='name'?'selected':''}>Name A-Z</option>
          </select>
        </div>
        <div class="panel" style="padding:0;">
          <div class="table-wrap"><table class="data" id="regsTable"></table></div>
        </div>
        <div class="pagination" id="pager"></div>
      </div>`;

    const t = document.getElementById("regsTable");
    const pager = document.getElementById("pager");

    document.getElementById("exportRegs").addEventListener("click", () => {
      const rows = getFiltered().map(r => ({ ...r, event: EV.events.get(r.eventId)?.name || "" }));
      exportCSV("registrations.csv", rows, ["id","name","email","phone","college","dept","year","event","status","createdAt"]);
    });
    document.getElementById("localSearch").addEventListener("input", e => { partState.search = e.target.value; partState.page = 1; paint(); });
    document.getElementById("fEvent").addEventListener("change", e => { partState.event = e.target.value; partState.page = 1; paint(); });
    document.getElementById("fStatus").addEventListener("change", e => { partState.status = e.target.value; partState.page = 1; paint(); });
    document.getElementById("fSort").addEventListener("change", e => { partState.sort = e.target.value; paint(); });

    function getFiltered() {
      const q = partState.search.trim().toLowerCase();
      let items = EV.regs.list().filter(r => {
        if (partState.event !== "all" && r.eventId !== partState.event) return false;
        if (partState.status !== "all" && r.status !== partState.status) return false;
        if (q && !(r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.phone.includes(q))) return false;
        return true;
      });
      if (partState.sort === "date_asc") items.sort((a,b)=>a.createdAt-b.createdAt);
      else if (partState.sort === "name") items.sort((a,b)=>a.name.localeCompare(b.name));
      else items.sort((a,b)=>b.createdAt-a.createdAt);
      return items;
    }

    function paint() {
      const items = getFiltered();
      if (!items.length) {
        t.innerHTML = `<tbody><tr><td class="muted" style="padding:40px; text-align:center;">No records match your filters.</td></tr></tbody>`;
        pager.innerHTML = ""; return;
      }
      const pages = Math.max(1, Math.ceil(items.length / partState.pageSize));
      if (partState.page > pages) partState.page = pages;
      const slice = items.slice((partState.page-1)*partState.pageSize, (partState.page-1)*partState.pageSize + partState.pageSize);
      t.innerHTML = `
        <thead><tr>
          <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>College</th><th>Event</th><th>Date</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${slice.map(r => {
          const ev = EV.events.get(r.eventId);
          return `<tr>
            <td>${r.id}</td>
            <td>${EV.escapeHtml(r.name)}</td>
            <td>${EV.escapeHtml(r.email)}</td>
            <td>${EV.escapeHtml(r.phone)}</td>
            <td>${EV.escapeHtml(r.college)}</td>
            <td>${EV.escapeHtml(ev?.name || "—")}</td>
            <td class="muted">${new Date(r.createdAt).toLocaleDateString()}</td>
            <td>${badge(r.status)}</td>
            <td class="actions">
              <button class="btn btn-sm" data-view="${r.id}">View</button>
              <button class="btn btn-sm" data-edit="${r.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-del="${r.id}">Delete</button>
            </td>
          </tr>`;
        }).join("")}</tbody>`;
      t.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => openRegDetail(b.dataset.view)));
      t.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openRegEdit(b.dataset.edit)));
      t.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteReg(b.dataset.del)));
      pager.innerHTML = paginationHtml(partState.page, pages);
      wirePagination(pager, (p) => { partState.page = p; paint(); });
    }
    paint();
  }

  async function deleteReg(id) {
    const r = EV.regs.get(id); if (!r) return;
    if (await EV.confirm(`Delete registration ${r.id} (${r.name})?`)) {
      EV.regs.remove(id);
      EV.toast("Registration deleted", "success");
      render();
    }
  }
  function openRegDetail(id) {
    const r = EV.regs.get(id); if (!r) return;
    const ev = EV.events.get(r.eventId);
    openModal(`
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="modal-head">
          <div class="role-icon small">👤</div>
          <div><h2>${EV.escapeHtml(r.name)}</h2><p class="muted">${r.id}</p></div>
        </div>
        <div class="form">
          <div class="detail-meta">
            <span>✉ ${EV.escapeHtml(r.email)}</span>
            <span>📞 ${EV.escapeHtml(r.phone)}</span>
            <span>🎓 ${EV.escapeHtml(r.college)}</span>
            <span>${EV.escapeHtml(r.dept)} · Year ${EV.escapeHtml(r.year)}</span>
          </div>
          <div class="panel" style="padding:14px;">
            <div class="muted" style="font-size:12px; margin-bottom:6px;">EVENT</div>
            <div>${EV.escapeHtml(ev?.name || "—")}</div>
            <div class="muted" style="font-size:12.5px; margin-top:4px;">${ev ? EV.fmtDate(ev.date) + " · " + ev.venue : ""}</div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="muted" style="font-size:13px;">Status:</span> ${badge(r.status)}
            <span class="muted" style="font-size:12.5px; margin-left:auto;">${EV.timeAgo(r.createdAt)}</span>
          </div>
          ${r.notes ? `<div class="muted" style="font-size:13px;">Notes: ${EV.escapeHtml(r.notes)}</div>` : ""}
        </div>
        <div class="modal-actions" style="margin-top:20px;">
          <button class="btn" data-close>Close</button>
          <button class="btn btn-primary" id="editFromDetailReg">Edit</button>
        </div>
      </div>`);
    document.getElementById("editFromDetailReg").addEventListener("click", () => { closeModal(); openRegEdit(id); });
  }
  function openRegEdit(id) {
    const r = EV.regs.get(id); if (!r) return;
    openModal(`
      <div class="modal wide" role="dialog" aria-modal="true">
        <button class="modal-close" data-close>×</button>
        <div class="modal-head">
          <div class="role-icon small">✎</div>
          <div><h2>Edit registration</h2><p class="muted">${r.id}</p></div>
        </div>
        <form id="regForm" class="form">
          <div class="form-grid">
            <label class="field"><span>Name</span><input name="name" value="${EV.escapeHtml(r.name)}" required/></label>
            <label class="field"><span>Email</span><input type="email" name="email" value="${EV.escapeHtml(r.email)}" required/></label>
            <label class="field"><span>Phone</span><input name="phone" value="${EV.escapeHtml(r.phone)}" required/></label>
            <label class="field"><span>College</span><input name="college" value="${EV.escapeHtml(r.college)}"/></label>
            <label class="field"><span>Department</span><input name="dept" value="${EV.escapeHtml(r.dept)}"/></label>
            <label class="field"><span>Year</span><input name="year" value="${EV.escapeHtml(r.year)}"/></label>
            <label class="field"><span>Event</span>
              <select name="eventId">${EV.events.list().map(e => `<option value="${e.id}" ${e.id===r.eventId?'selected':''}>${EV.escapeHtml(e.name)}</option>`).join("")}</select>
            </label>
            <label class="field"><span>Status</span>
              <select name="status">${["Pending","Approved","Rejected","Cancelled","Attended"].map(s => `<option ${s===r.status?'selected':''}>${s}</option>`).join("")}</select>
            </label>
            <label class="field full"><span>Notes</span><textarea name="notes">${EV.escapeHtml(r.notes || "")}</textarea></label>
          </div>
          <div class="modal-actions" style="margin-top:8px;">
            <button type="button" class="btn" data-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </div>
        </form>
      </div>`);
    document.getElementById("regForm").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const fd = new FormData(evt.target);
      const upd = { ...r };
      ["name","email","phone","college","dept","year","eventId","status","notes"].forEach(k => upd[k] = String(fd.get(k) || "").trim());
      EV.regs.save(upd);
      closeModal();
      EV.toast("Registration updated", "success");
      render();
    });
  }

  // =========== ATTENDANCE ===========
  const attState = { eventId: null, search: "" };

  function renderAttendance() {
    const events = EV.events.list();
    if (!attState.eventId && events[0]) attState.eventId = events[0].id;
    pageRoot.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div><h1>Attendance</h1><p class="muted">Mark attendance for approved participants.</p></div>
          <div class="page-actions">
            <button class="btn" id="markAllPresent">Mark all present</button>
            <button class="btn" id="exportAtt">Export CSV</button>
          </div>
        </div>
        <div class="filters">
          <select id="attEvent">${events.map(e => `<option value="${e.id}" ${e.id===attState.eventId?'selected':''}>${EV.escapeHtml(e.name)}</option>`).join("")}</select>
          <input id="localSearch" placeholder="Search participants..." value="${attState.search}"/>
        </div>
        <div class="stats-grid" id="attStats"></div>
        <div class="panel" style="padding:0;"><div class="table-wrap"><table class="data" id="attTable"></table></div></div>
      </div>`;

    document.getElementById("attEvent").addEventListener("change", (e) => { attState.eventId = e.target.value; paint(); });
    document.getElementById("localSearch").addEventListener("input", (e) => { attState.search = e.target.value; paint(); });
    document.getElementById("markAllPresent").addEventListener("click", async () => {
      if (await EV.confirm("Mark every participant of this event as Attended?")) {
        EV.regs.byEvent(attState.eventId).filter(r => r.status !== "Cancelled").forEach(r => {
          r.status = "Attended"; EV.regs.save(r);
        });
        EV.toast("All marked present", "success"); paint();
      }
    });
    document.getElementById("exportAtt").addEventListener("click", () => {
      const rows = EV.regs.byEvent(attState.eventId).map(r => ({ id:r.id, name:r.name, email:r.email, present: r.status === "Attended" ? "Yes" : "No", status: r.status }));
      exportCSV("attendance.csv", rows, ["id","name","email","present","status"]);
    });

    function paint() {
      const q = attState.search.trim().toLowerCase();
      const all = EV.regs.byEvent(attState.eventId).filter(r => r.status !== "Cancelled");
      const list = all.filter(r => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
      const present = all.filter(r => r.status === "Attended").length;
      const pct = all.length ? Math.round(present / all.length * 100) : 0;

      document.getElementById("attStats").innerHTML = `
        ${statCard("Total registered", all.length, "excluding cancelled", null, iconUsers())}
        ${statCard("Present", present, "marked attended", null, iconCheck())}
        ${statCard("Absent", all.length - present, "not marked", null, iconX())}
        ${statCard("Attendance %", pct + "%", "of this event", null, iconStar())}
      `;

      const t = document.getElementById("attTable");
      if (!list.length) {
        t.innerHTML = `<tbody><tr><td class="muted" style="padding:40px; text-align:center;">No participants for this event.</td></tr></tbody>`;
        return;
      }
      t.innerHTML = `
        <thead><tr><th style="width:44px;"></th><th>ID</th><th>Name</th><th>Email</th><th>College</th><th>Status</th></tr></thead>
        <tbody>${list.map(r => `
          <tr>
            <td><input type="checkbox" data-att="${r.id}" ${r.status==='Attended'?'checked':''} style="width:18px; height:18px; accent-color: var(--success);"/></td>
            <td>${r.id}</td>
            <td>${EV.escapeHtml(r.name)}</td>
            <td>${EV.escapeHtml(r.email)}</td>
            <td>${EV.escapeHtml(r.college)}</td>
            <td>${badge(r.status)}</td>
          </tr>`).join("")}
        </tbody>`;
      t.querySelectorAll("[data-att]").forEach(cb => {
        cb.addEventListener("change", () => {
          const r = EV.regs.get(cb.dataset.att);
          r.status = cb.checked ? "Attended" : "Approved";
          EV.regs.save(r);
          EV.toast(cb.checked ? "Marked present" : "Marked absent");
          paint();
        });
      });
    }
    paint();
  }

  // =========== SETTINGS ===========
  function renderSettings() {
    pageRoot.innerHTML = `
      <div class="page" style="max-width: 720px;">
        <div class="page-head"><div><h1>Settings</h1><p class="muted">Workspace preferences and data controls.</p></div></div>
        <div class="panel">
          <div class="panel-head"><h3>Profile</h3></div>
          <div style="display:flex; gap:16px; align-items:center;">
            <div class="avatar" style="width:56px; height:56px; font-size:18px;">KA</div>
            <div>
              <div style="font-weight:600;">Kavin (Administrator)</div>
              <div class="muted" style="font-size:13px;">kavin_2008 · Signed in</div>
            </div>
          </div>
        </div>
        <div class="panel" style="margin-top:16px;">
          <div class="panel-head"><h3>Danger zone</h3></div>
          <p class="muted" style="font-size:13.5px; margin-bottom:16px;">Reset seeded demo data or clear everything. This affects local storage only.</p>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="reseed">Reset to demo data</button>
            <button class="btn btn-danger" id="wipe">Clear all data</button>
          </div>
        </div>
      </div>`;
    document.getElementById("reseed").addEventListener("click", async () => {
      if (await EV.confirm("Restore original demo events and registrations? Your current data will be replaced.")) {
        localStorage.removeItem(EV.KEYS.seeded);
        localStorage.removeItem(EV.KEYS.events);
        localStorage.removeItem(EV.KEYS.regs);
        localStorage.removeItem(EV.KEYS.seq);
        EV.seed();
        EV.toast("Demo data restored", "success");
        render();
      }
    });
    document.getElementById("wipe").addEventListener("click", async () => {
      if (await EV.confirm("Delete ALL events and registrations? This cannot be undone.")) {
        localStorage.setItem(EV.KEYS.events, "[]");
        localStorage.setItem(EV.KEYS.regs, "[]");
        localStorage.setItem(EV.KEYS.seq, "0");
        EV.toast("All data cleared");
        render();
      }
    });
  }

  // ============ Modal utilities ============
  function openModal(html) {
    modalRoot.innerHTML = `<div class="modal-backdrop open">${html}</div>`;
    const back = modalRoot.firstElementChild;
    back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
    back.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeModal));
  }
  function closeModal() { modalRoot.innerHTML = ""; }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // ============ Pagination ============
  function paginationHtml(current, pages) {
    if (pages <= 1) return "";
    let out = `<button data-p="${current-1}" ${current<=1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
      out += `<button data-p="${i}" class="${i===current?'active':''}">${i}</button>`;
    }
    out += `<button data-p="${current+1}" ${current>=pages?'disabled':''}>›</button>`;
    return out;
  }
  function wirePagination(el, cb) {
    el.querySelectorAll("[data-p]").forEach(b => {
      if (b.disabled) return;
      b.addEventListener("click", () => cb(+b.dataset.p));
    });
  }

  // ============ CSV export ============
  function exportCSV(filename, rows, cols) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const csv = [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    EV.toast("Exported " + filename, "success");
  }

  // ============ Icons ============
  function iconCal()   { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`; }
  function iconUsers() { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`; }
  function iconClock() { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`; }
  function iconCheck() { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 6 9 17l-5-5"/></svg>`; }
  function iconStar()  { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l3 7 7 .8-5.4 4.7 1.7 7-6.3-3.8L5.7 21.5l1.7-7L2 9.8 9 9z"/></svg>`; }
  function iconX()     { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 6 6 18M6 6l12 12"/></svg>`; }

  render();
})();

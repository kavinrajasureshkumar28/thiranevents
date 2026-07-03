/* ==========================================================
   Eventide — Data Layer (localStorage + seed data)
   Global namespace: window.EV
   ========================================================== */
(function () {
  const KEYS = {
    events: "ev_events",
    regs: "ev_registrations",
    seq: "ev_reg_seq",
    session: "ev_admin_session",
    seeded: "ev_seeded_v1",
  };

  const CATEGORIES = [
    "Workshop", "Hackathon", "Seminar", "Sports",
    "Technical", "Cultural", "Conference", "Coding Contest",
    "AI Workshop", "Web Development", "Robotics", "Photography",
  ];

  const BANNER = (label, from, to) =>
    `data:image/svg+xml;utf8,` +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stop-color='${from}'/>
            <stop offset='1' stop-color='${to}'/>
          </linearGradient>
          <radialGradient id='r' cx='30%' cy='20%' r='60%'>
            <stop offset='0' stop-color='rgba(255,255,255,0.35)'/>
            <stop offset='1' stop-color='rgba(255,255,255,0)'/>
          </radialGradient>
        </defs>
        <rect width='800' height='400' fill='url(#g)'/>
        <rect width='800' height='400' fill='url(#r)'/>
        <text x='40' y='360' font-family='Inter,sans-serif' font-size='42' font-weight='700' fill='rgba(255,255,255,0.92)'>${label}</text>
      </svg>`
    );

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function seed() {
    if (localStorage.getItem(KEYS.seeded)) return;

    const events = [
      { id: "EVT001", name: "AI Innovators Summit 2026", category: "AI Workshop",       date: daysFromNow(3),   time: "10:00", venue: "Grand Hall, Tech Park", organizer: "AI Society",         desc: "A deep dive into GenAI, LLM agents, and applied ML with industry leaders from OpenAI, Anthropic and Google.", deadline: daysFromNow(1),  max: 200, banner: BANNER("AI Summit",        "#2563EB", "#7C3AED"), status: "Active" },
      { id: "EVT002", name: "HackFront 48 — Global Hackathon", category: "Hackathon",   date: daysFromNow(10),  time: "09:00", venue: "Innovation Center",     organizer: "Dev Community",       desc: "48 hours. Zero limits. Build the future with 500+ hackers and $50K in prizes.",                                deadline: daysFromNow(7),  max: 500, banner: BANNER("HackFront 48",       "#7C3AED", "#EC4899"), status: "Active" },
      { id: "EVT003", name: "Modern Web Development Bootcamp", category: "Web Development", date: daysFromNow(5), time: "14:00", venue: "Auditorium B",         organizer: "Frontend Guild",      desc: "A hands-on bootcamp covering React, TypeScript, Vite and modern deployment workflows.",                          deadline: daysFromNow(3),  max: 120, banner: BANNER("Web Dev Bootcamp",   "#0EA5E9", "#2563EB"), status: "Active" },
      { id: "EVT004", name: "CodeArena — Competitive Coding", category: "Coding Contest", date: daysFromNow(1),  time: "16:00", venue: "Computer Lab 1",       organizer: "Algo Club",           desc: "Live competitive programming battle. ICPC-style problems, live leaderboard and cash prizes.",                    deadline: daysFromNow(0),  max: 80,  banner: BANNER("CodeArena",          "#F59E0B", "#EF4444"), status: "Active" },
      { id: "EVT005", name: "RoboLeague Championship", category: "Robotics",             date: daysFromNow(14),  time: "11:00", venue: "Robotics Arena",        organizer: "Robotics Wing",       desc: "Autonomous robots compete across five brutal challenges. Registration includes hardware kit access.",             deadline: daysFromNow(10), max: 60,  banner: BANNER("RoboLeague",         "#10B981", "#0EA5E9"), status: "Active" },
      { id: "EVT006", name: "Frames — Photography Walk",     category: "Photography",   date: daysFromNow(6),   time: "07:00", venue: "Old Town Square",       organizer: "Frames Club",         desc: "Sunrise photo walk with pro mentors. Bring your camera and curiosity — prints of best shots to be exhibited.",   deadline: daysFromNow(4),  max: 40,  banner: BANNER("Frames",             "#EC4899", "#7C3AED"), status: "Active" },
      { id: "EVT007", name: "Product Design Seminar",        category: "Seminar",       date: daysFromNow(2),   time: "15:00", venue: "Seminar Hall 3",        organizer: "Design Chapter",      desc: "A talk on product taste, systems thinking, and shipping calm, high-quality software.",                          deadline: daysFromNow(1),  max: 100, banner: BANNER("Design Seminar",     "#7C3AED", "#2563EB"), status: "Active" },
      { id: "EVT008", name: "Inter-College Cricket Cup",     category: "Sports",        date: daysFromNow(21),  time: "08:00", venue: "Sports Ground",         organizer: "Sports Council",      desc: "16 teams. One trophy. Register your squad early — limited slots per campus.",                                    deadline: daysFromNow(15), max: 16,  banner: BANNER("Cricket Cup",        "#10B981", "#059669"), status: "Active" },
      { id: "EVT009", name: "Rhapsody — Cultural Night",     category: "Cultural",      date: daysFromNow(9),   time: "18:30", venue: "Main Auditorium",       organizer: "Cultural Committee",  desc: "A night of music, dance and drama featuring student performers and celebrity guests.",                          deadline: daysFromNow(6),  max: 400, banner: BANNER("Rhapsody",           "#EF4444", "#F59E0B"), status: "Active" },
      { id: "EVT010", name: "CloudNative Conference",        category: "Conference",    date: daysFromNow(18),  time: "09:30", venue: "Convention Center",     organizer: "DevOps Society",      desc: "K8s, service mesh, edge computing — hear from engineers building at planet scale.",                              deadline: daysFromNow(14), max: 300, banner: BANNER("CloudNative Conf",   "#0EA5E9", "#7C3AED"), status: "Active" },
      { id: "EVT011", name: "Embedded IoT Workshop",         category: "Workshop",      date: daysFromNow(7),   time: "13:00", venue: "Lab 204",               organizer: "Electronics Club",    desc: "Build a live IoT dashboard with ESP32, sensors and MQTT in a single afternoon.",                                deadline: daysFromNow(5),  max: 50,  banner: BANNER("IoT Workshop",       "#F59E0B", "#EC4899"), status: "Active" },
      { id: "EVT012", name: "Full-Stack TypeScript Deep-Dive", category: "Technical",   date: daysFromNow(12),  time: "10:30", venue: "Auditorium A",          organizer: "TypeScript Guild",    desc: "Advanced patterns, type-level programming, and building resilient full-stack apps end-to-end.",                 deadline: daysFromNow(9),  max: 150, banner: BANNER("TS Deep-Dive",       "#2563EB", "#0EA5E9"), status: "Active" },
    ];

    const regs = [
      { id: "REG0001", name: "Aarav Sharma",     email: "aarav@example.com",     phone: "9876500001", college: "IIT Madras",           dept: "CSE",   year: "3", gender: "Male",   eventId: "EVT001", notes: "",            createdAt: Date.now() - 86400000 * 5, status: "Approved" },
      { id: "REG0002", name: "Priya Nair",       email: "priya@example.com",     phone: "9876500002", college: "NIT Trichy",           dept: "IT",    year: "2", gender: "Female", eventId: "EVT002", notes: "Team of 3",   createdAt: Date.now() - 86400000 * 4, status: "Approved" },
      { id: "REG0003", name: "Rohan Verma",      email: "rohan@example.com",     phone: "9876500003", college: "BITS Pilani",          dept: "ECE",   year: "4", gender: "Male",   eventId: "EVT003", notes: "",            createdAt: Date.now() - 86400000 * 3, status: "Pending"  },
      { id: "REG0004", name: "Ananya Iyer",      email: "ananya@example.com",    phone: "9876500004", college: "Anna University",      dept: "CSE",   year: "3", gender: "Female", eventId: "EVT001", notes: "Vegetarian",  createdAt: Date.now() - 86400000 * 3, status: "Approved" },
      { id: "REG0005", name: "Kabir Singh",      email: "kabir@example.com",     phone: "9876500005", college: "VIT Vellore",          dept: "MECH",  year: "2", gender: "Male",   eventId: "EVT005", notes: "",            createdAt: Date.now() - 86400000 * 2, status: "Approved" },
      { id: "REG0006", name: "Diya Menon",       email: "diya@example.com",      phone: "9876500006", college: "SRM University",       dept: "CSE",   year: "1", gender: "Female", eventId: "EVT007", notes: "",            createdAt: Date.now() - 86400000 * 2, status: "Approved" },
      { id: "REG0007", name: "Vihaan Patel",     email: "vihaan@example.com",    phone: "9876500007", college: "IIIT Hyderabad",       dept: "CSE",   year: "3", gender: "Male",   eventId: "EVT004", notes: "",            createdAt: Date.now() - 86400000 * 2, status: "Attended" },
      { id: "REG0008", name: "Meera Kapoor",     email: "meera@example.com",     phone: "9876500008", college: "IIT Bombay",           dept: "EEE",   year: "4", gender: "Female", eventId: "EVT010", notes: "",            createdAt: Date.now() - 86400000 * 1, status: "Approved" },
      { id: "REG0009", name: "Aryan Reddy",      email: "aryan@example.com",     phone: "9876500009", college: "Osmania University",   dept: "IT",    year: "2", gender: "Male",   eventId: "EVT002", notes: "",            createdAt: Date.now() - 86400000 * 1, status: "Pending"  },
      { id: "REG0010", name: "Ishita Bose",      email: "ishita@example.com",    phone: "9876500010", college: "Jadavpur University",  dept: "CSE",   year: "3", gender: "Female", eventId: "EVT006", notes: "",            createdAt: Date.now() - 3600000 * 20, status: "Approved" },
      { id: "REG0011", name: "Neel Joshi",       email: "neel@example.com",      phone: "9876500011", college: "COEP Pune",            dept: "MECH",  year: "3", gender: "Male",   eventId: "EVT008", notes: "Team captain",createdAt: Date.now() - 3600000 * 10, status: "Approved" },
      { id: "REG0012", name: "Sara Khan",        email: "sara@example.com",      phone: "9876500012", college: "Delhi Technological",  dept: "IT",    year: "2", gender: "Female", eventId: "EVT012", notes: "",            createdAt: Date.now() - 3600000 * 5,  status: "Approved" },
      { id: "REG0013", name: "Aditya Rao",       email: "aditya@example.com",    phone: "9876500013", college: "PES University",       dept: "CSE",   year: "4", gender: "Male",   eventId: "EVT001", notes: "",            createdAt: Date.now() - 3600000 * 3,  status: "Cancelled"},
      { id: "REG0014", name: "Riya Malhotra",    email: "riya@example.com",      phone: "9876500014", college: "Manipal Institute",    dept: "ECE",   year: "3", gender: "Female", eventId: "EVT009", notes: "",            createdAt: Date.now() - 3600000 * 2,  status: "Approved" },
      { id: "REG0015", name: "Arjun Krishnan",   email: "arjun@example.com",     phone: "9876500015", college: "IIT Delhi",            dept: "CSE",   year: "3", gender: "Male",   eventId: "EVT011", notes: "",            createdAt: Date.now() - 3600000,      status: "Approved" },
      { id: "REG0016", name: "Nisha Pillai",     email: "nisha@example.com",     phone: "9876500016", college: "Amrita Vishwa",        dept: "CSE",   year: "2", gender: "Female", eventId: "EVT007", notes: "",            createdAt: Date.now() - 1800000,      status: "Approved" },
      { id: "REG0017", name: "Kartik Shetty",    email: "kartik@example.com",    phone: "9876500017", college: "NIT Surathkal",        dept: "IT",    year: "3", gender: "Male",   eventId: "EVT003", notes: "",            createdAt: Date.now() - 900000,       status: "Approved" },
      { id: "REG0018", name: "Tara Bhatt",       email: "tara@example.com",      phone: "9876500018", college: "SSN College",          dept: "CSE",   year: "2", gender: "Female", eventId: "EVT004", notes: "",            createdAt: Date.now() - 600000,       status: "Attended" },
    ];

    localStorage.setItem(KEYS.events, JSON.stringify(events));
    localStorage.setItem(KEYS.regs, JSON.stringify(regs));
    localStorage.setItem(KEYS.seq, "18");
    localStorage.setItem(KEYS.seeded, "1");
  }

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  // Public API
  const API = {
    KEYS, CATEGORIES,
    seed,
    events: {
      list()   { return read(KEYS.events, []); },
      get(id)  { return this.list().find(e => e.id === id); },
      save(ev) {
        const all = this.list();
        const i = all.findIndex(e => e.id === ev.id);
        if (i >= 0) all[i] = ev; else all.unshift(ev);
        write(KEYS.events, all);
      },
      remove(id) {
        write(KEYS.events, this.list().filter(e => e.id !== id));
        write(KEYS.regs, API.regs.list().filter(r => r.eventId !== id));
      },
      nextId() {
        const all = this.list();
        const n = all.reduce((m, e) => Math.max(m, +(e.id.replace(/\D/g,"") || 0)), 0) + 1;
        return "EVT" + String(n).padStart(3, "0");
      },
    },
    regs: {
      list()  { return read(KEYS.regs, []); },
      get(id) { return this.list().find(r => r.id === id); },
      byEvent(eventId) { return this.list().filter(r => r.eventId === eventId); },
      exists(email, eventId) {
        return this.list().some(r => r.eventId === eventId && r.email.toLowerCase() === email.toLowerCase() && r.status !== "Cancelled");
      },
      save(reg) {
        const all = this.list();
        const i = all.findIndex(r => r.id === reg.id);
        if (i >= 0) all[i] = reg; else all.unshift(reg);
        write(KEYS.regs, all);
      },
      remove(id) { write(KEYS.regs, this.list().filter(r => r.id !== id)); },
      nextId() {
        const n = (+localStorage.getItem(KEYS.seq) || 0) + 1;
        localStorage.setItem(KEYS.seq, String(n));
        return "REG" + String(n).padStart(4, "0");
      },
    },
    session: {
      login()  { sessionStorage.setItem(KEYS.session, JSON.stringify({ user: "kavin_2008", at: Date.now() })); },
      logout() { sessionStorage.removeItem(KEYS.session); },
      isAuthed() { return !!sessionStorage.getItem(KEYS.session); },
      requireAuth(redirect = "./index.html") {
        if (!this.isAuthed()) { window.location.replace(redirect); return false; }
        return true;
      },
    },
    // helpers
    fmtDate(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    fmtDateShort(iso) {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },
    fmtTime(t) {
      if (!t) return "";
      const [h, m] = t.split(":").map(Number);
      const p = h >= 12 ? "PM" : "AM";
      const hh = ((h + 11) % 12) + 1;
      return `${hh}:${String(m).padStart(2,"0")} ${p}`;
    },
    timeAgo(ts) {
      const s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return "just now";
      if (s < 3600) return Math.floor(s/60) + "m ago";
      if (s < 86400) return Math.floor(s/3600) + "h ago";
      return Math.floor(s/86400) + "d ago";
    },
    escapeHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
    },
    toast(msg, type = "success") {
      const t = document.getElementById("toast");
      if (!t) return;
      t.className = "toast show " + type;
      t.innerHTML = `<span class="dot"></span><span>${this.escapeHtml(msg)}</span>`;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => t.className = "toast", 2600);
    },
    confirm(message) {
      return new Promise((resolve) => {
        const wrap = document.createElement("div");
        wrap.className = "modal-backdrop open";
        wrap.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true" style="max-width: 400px;">
            <h2 style="font-size:18px; margin-bottom:8px;">Are you sure?</h2>
            <p class="confirm-body">${this.escapeHtml(message)}</p>
            <div class="modal-actions">
              <button class="btn" data-a="no">Cancel</button>
              <button class="btn btn-danger" data-a="yes">Confirm</button>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        wrap.addEventListener("click", (e) => {
          if (e.target === wrap || e.target.dataset.a === "no") { wrap.remove(); resolve(false); }
          if (e.target.dataset.a === "yes") { wrap.remove(); resolve(true); }
        });
      });
    },
  };

  window.EV = API;
  seed();
})();

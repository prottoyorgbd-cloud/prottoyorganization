/* =====================================================================
   Prottoy Website – script.js
   - Data store: localStorage (demo only)
   - Pages: index, donors, blood-request, committee, performance, admin
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const LS_KEYS = {
    seeded: "prottoy_seeded_v1",
    notices: "prottoy_notices",
    donors: "prottoy_donors",
    requests: "prottoy_requests",
    committeeMembers: "prottoy_committee_members",
    perfSettings: "prottoy_perf_settings",
    perfMembers: "prottoy_perf_members",
    adminLoggedIn: "prottoy_admin_logged_in",
  };

  const ADMIN_PHONE = "01700000000";      // আপনার ইচ্ছামতো বদলান
  const ADMIN_PASSWORD = "prottoy2020";   // আপনার ইচ্ছামতো বদলান

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const loadArray = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const val = JSON.parse(raw);
      return Array.isArray(val) ? val : [];
    } catch {
      return [];
    }
  };

  const saveArray = (key, arr) =>
    localStorage.setItem(key, JSON.stringify(arr || []));

  const loadObject = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const val = JSON.parse(raw);
      return typeof val === "object" && val !== null ? val : null;
    } catch {
      return null;
    }
  };

  const saveObject = (key, obj) =>
    localStorage.setItem(key, JSON.stringify(obj || {}));

  const formatDate = (iso) => {
    if (!iso) return "অজানা";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ---------- Seed default data (once) ---------- */
  const DEFAULT_NOTICES = [
    {
      id: uid(),
      title: "চলমান কমিটির মাসিক সভা",
      category: "সভা",
      date: new Date().toISOString().slice(0, 10),
      content:
        "প্রত্যয়ের চলমান কমিটির মাসিক সভা আগামী শুক্রবার মাগরিবের পর কেন্দ্রীয় অফিসে অনুষ্ঠিত হবে।",
      important: true,
    },
  ];

  const DEFAULT_DONORS = [
    {
      id: uid(),
      name: "মাহমুদুল হাসান",
      bloodGroup: "A+",
      phone: "01711111111",
      district: "কুমিল্লা",
      upazila: "নাঙ্গলকোট",
      area: "গোত্রশাল",
      lastDonation: "",
      available: true,
      confirmed: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "নাজমুল করিম",
      bloodGroup: "O+",
      phone: "01822222222",
      district: "কুমিল্লা",
      upazila: "নাঙ্গলকোট",
      area: "মুরাদনগর রোড",
      lastDonation: "",
      available: true,
      confirmed: true,
      createdAt: new Date().toISOString(),
    },
  ];

  function seedInitialData() {
    if (localStorage.getItem(LS_KEYS.seeded)) return;
    saveArray(LS_KEYS.notices, DEFAULT_NOTICES);
    saveArray(LS_KEYS.donors, DEFAULT_DONORS);
    saveArray(LS_KEYS.requests, []);
    saveArray(LS_KEYS.committeeMembers, []);
    saveObject(LS_KEYS.perfSettings, {
      committeeName: "চলমান কমিটি",
      totalMonths: 12,
      totalPrograms: 6,
    });
    saveArray(LS_KEYS.perfMembers, []);
    localStorage.setItem(LS_KEYS.seeded, "1");
  }

  /* ---------- Data accessors ---------- */
  const getNotices = () => loadArray(LS_KEYS.notices);
  const setNotices = (data) => saveArray(LS_KEYS.notices, data);

  const getDonors = () => loadArray(LS_KEYS.donors);
  const setDonors = (data) => saveArray(LS_KEYS.donors, data);

  const getRequests = () => loadArray(LS_KEYS.requests);
  const setRequests = (data) => saveArray(LS_KEYS.requests, data);

  const getCommitteeMembers = () => loadArray(LS_KEYS.committeeMembers);
  const setCommitteeMembers = (data) => saveArray(LS_KEYS.committeeMembers, data);

  const getPerfSettings = () =>
    loadObject(LS_KEYS.perfSettings) || {
      committeeName: "চলমান কমিটি",
      totalMonths: 12,
      totalPrograms: 6,
    };
  const setPerfSettings = (obj) => saveObject(LS_KEYS.perfSettings, obj);

  const getPerfMembers = () => loadArray(LS_KEYS.perfMembers);
  const setPerfMembers = (data) => saveArray(LS_KEYS.perfMembers, data);

  /* ---------- Generic UI initializers ---------- */

  function initCurrentYear() {
    const el = $("#currentYear");
    if (el) el.textContent = new Date().getFullYear();
  }

  function initMobileNav() {
    const toggle = $("#menuToggle");
    const nav = $("#mainNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
    });

    $$(".main-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        if (window.innerWidth <= 920) {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("open");
        }
      })
    );
  }

  function initBackToTop() {
    const btn = $("#backToTop");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      if (window.scrollY > 400) btn.classList.add("show");
      else btn.classList.remove("show");
    });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Stats ---------- */
  function initQuickStats() {
    const donorCountEl = $("#donorCount");
    const noticeCountEl = $("#noticeCount");
    if (!donorCountEl && !noticeCountEl) return;

    const donors = getDonors().filter((d) => d.confirmed);
    const notices = getNotices();

    if (donorCountEl) donorCountEl.textContent = String(donors.length);
    if (noticeCountEl) noticeCountEl.textContent = String(notices.length);
  }

  /* ---------- Notices (public) ---------- */
  function renderNotices() {
    const grid = $("#noticeGrid");
    if (!grid) return;

    const notices = getNotices().sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    grid.innerHTML = "";
    if (!notices.length) {
      grid.innerHTML =
        '<p style="color:#607267">এ মুহূর্তে কোনো নোটিশ নেই।</p>';
      return;
    }

    for (const n of notices) {
      const card = document.createElement("article");
      card.className = "notice-card" + (n.important ? " important" : "");
      card.innerHTML = `
        <div class="notice-meta">
          <span class="notice-category">${n.category || "সাধারণ"}</span>
          <span class="notice-date">${formatDate(n.date)}</span>
        </div>
        <h3>${n.title}</h3>
        <p>${n.content || ""}</p>
        ${n.important ? '<span class="important-tag">গুরুত্বপূর্ণ</span>' : ""}
      `;
      grid.appendChild(card);
    }
  }

  /* ---------- Donor list + filters (public) ---------- */
  function initDonorListAndFilters() {
    const grid = $("#donorGrid");
    if (!grid) return;

    const searchInput = $("#searchInput");
    const bloodFilter = $("#bloodFilter");
    const districtFilter = $("#districtFilter");
    const upazilaFilter = $("#upazilaFilter");
    const availableOnly = $("#availableOnly");
    const resetBtn = $("#resetFilters");
    const resultCountEl = $("#resultCount");
    const activeFilterTextEl = $("#activeFilterText");
    const emptyState = $("#emptyState");

    let donorsAll = getDonors().filter((d) => d.confirmed);

    // Populate district/upazila options
    const districts = [...new Set(donorsAll.map((d) => d.district).filter(Boolean))];
    districtFilter.innerHTML =
      '<option value="">সব জেলা</option>' +
      districts.map((d) => `<option>${d}</option>`).join("");

    function updateUpazilaOptions() {
      const d = districtFilter.value.trim();
      const list = donorsAll.filter(
        (x) => !d || x.district === d
      );
      const upazilas = [...new Set(list.map((x) => x.upazila).filter(Boolean))];
      upazilaFilter.innerHTML =
        '<option value="">সব উপজেলা</option>' +
        upazilas.map((u) => `<option>${u}</option>`).join("");
    }
    updateUpazilaOptions();

    function applyFilters() {
      const q = (searchInput.value || "").trim().toLowerCase();
      const bg = bloodFilter.value;
      const dist = districtFilter.value;
      const upa = upazilaFilter.value;
      const onlyAvail = availableOnly.checked;

      let list = donorsAll.slice();

      if (q) {
        list = list.filter((d) => {
          const hay = (
            (d.name || "") +
            " " +
            (d.area || "") +
            " " +
            (d.district || "") +
            " " +
            (d.upazila || "")
          ).toLowerCase();
          return hay.includes(q);
        });
      }
      if (bg) list = list.filter((d) => d.bloodGroup === bg);
      if (dist) list = list.filter((d) => d.district === dist);
      if (upa) list = list.filter((d) => d.upazila === upa);
      if (onlyAvail) list = list.filter((d) => d.available !== false);

      grid.innerHTML = "";

      if (!list.length) {
        if (emptyState) emptyState.hidden = false;
        if (resultCountEl) resultCountEl.textContent = "০";
        if (activeFilterTextEl) {
          activeFilterTextEl.textContent =
            "নির্বাচিত শর্তে কোনো রক্তদাতা পাওয়া যায়নি";
        }
        return;
      }
      if (emptyState) emptyState.hidden = true;

      list.forEach((d) => {
        const card = document.createElement("article");
        card.className = "donor-card";
        const statusClass = d.available === false ? "unavailable" : "available";
        const statusText =
          d.available === false
            ? "অপাতত রক্তদানে অনুপলব্ধ"
            : "এখন রক্তদানে প্রস্তুত";

        card.innerHTML = `
          <div class="donor-head">
            <div>
              <h3>${d.name}</h3>
              <p class="donor-location">
                ${[d.area, d.upazila, d.district].filter(Boolean).join(", ")}
              </p>
              <span class="status ${statusClass}">${statusText}</span>
            </div>
            <div class="blood-badge">${d.bloodGroup}</div>
          </div>
          <div class="donor-info">
            <div>
              <span>মোবাইল</span>
              <strong>${d.phone || "প্রদত্ত নয়"}</strong>
            </div>
            <div>
              <span>শেষ রক্তদান</span>
              <strong>${d.lastDonation ? formatDate(d.lastDonation) : "অজানা"}</strong>
            </div>
          </div>
          <a class="phone-link ${
            d.phone ? "" : "disabled"
          }" href="${d.phone ? "tel:" + d.phone : "#"}">
            ${d.phone ? "কল করুন" : "ফোন নম্বর পাওয়া যায়নি"}
          </a>
        `;
        grid.appendChild(card);
      });

      if (resultCountEl) {
        const bn = new Intl.NumberFormat("bn-BD");
        resultCountEl.textContent = bn.format(list.length);
      }

      if (activeFilterTextEl) {
        let desc = [];
        if (bg) desc.push(`গ্রুপ: ${bg}`);
        if (dist) desc.push(`জেলা: ${dist}`);
        if (upa) desc.push(`উপজেলা: ${upa}`);
        if (onlyAvail) desc.push("শুধু প্রস্তুত দাতা");
        activeFilterTextEl.textContent =
          desc.length ? desc.join(" • ") : "সকল রক্তদাতা";
      }
    }

    searchInput.addEventListener("input", applyFilters);
    bloodFilter.addEventListener("change", applyFilters);
    districtFilter.addEventListener("change", () => {
      updateUpazilaOptions();
      applyFilters();
    });
    upazilaFilter.addEventListener("change", applyFilters);
    availableOnly.addEventListener("change", applyFilters);
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        bloodFilter.value = "";
        districtFilter.value = "";
        updateUpazilaOptions();
        upazilaFilter.value = "";
        availableOnly.checked = false;
        applyFilters();
      });
    }

    applyFilters();
  }

  /* ---------- Public forms: donor + blood request + contact ---------- */
  function validateRequired(field, message) {
    const wrapper = field.closest(".field");
    if (!wrapper) return true;
    const errorEl = wrapper.querySelector(".field-error");

    if (!field.value || !field.value.toString().trim()) {
      wrapper.classList.add("has-error");
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = message;
      }
      return false;
    }
    wrapper.classList.remove("has-error");
    if (errorEl) errorEl.hidden = true;
    return true;
  }

  function clearFieldErrors(form) {
    $$(".field", form).forEach((f) => {
      f.classList.remove("has-error");
      const e = f.querySelector(".field-error");
      if (e) e.hidden = true;
    });
  }

  function initDonorForm() {
    const form = $("#donorForm");
    const msg = $("#donorSuccess");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(form);

      const name = form.name.value.trim();
      const bloodGroup = form.bloodGroup.value;
      const phone = form.phone.value.trim();
      const district = form.district.value.trim();
      const upazila = form.upazila.value.trim();
      const area = form.area.value.trim();
      const lastDonation = form.lastDonation.value;
      const consent = form.consent.checked;

      let ok = true;
      if (!validateRequired(form.name, "নাম লিখুন")) ok = false;
      if (!validateRequired(form.bloodGroup, "রক্তের গ্রুপ নির্বাচন করুন"))
        ok = false;
      if (!validateRequired(form.phone, "মোবাইল নম্বর লিখুন")) ok = false;
      if (!validateRequired(form.district, "জেলা লিখুন")) ok = false;
      if (!validateRequired(form.upazila, "উপজেলা লিখুন")) ok = false;
      if (!validateRequired(form.area, "এলাকা / গ্রাম লিখুন")) ok = false;

      if (!consent) {
        const wrapper = form.consent.closest(".field");
        const err = wrapper.querySelector(".field-error");
        wrapper.classList.add("has-error");
        if (err) {
          err.hidden = false;
          err.textContent = "তালিকায় তথ্য প্রকাশের সম্মতি দিন।";
        }
        ok = false;
      }

      const phoneRe = /^01[0-9]{9}$/;
      if (phone && !phoneRe.test(phone)) {
        const wrapper = form.phone.closest(".field");
        const err = wrapper.querySelector(".field-error");
        wrapper.classList.add("has-error");
        if (err) {
          err.hidden = false;
          err.textContent = "সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন (১১ ডিজিট)।";
        }
        ok = false;
      }

      if (!ok) return;

      const donors = getDonors();
      donors.push({
        id: uid(),
        name,
        bloodGroup,
        phone,
        district,
        upazila,
        area,
        lastDonation,
        available: true,
        confirmed: false, // admin must confirm
        createdAt: new Date().toISOString(),
      });
      setDonors(donors);

      form.reset();
      if (msg) {
        msg.hidden = false;
        msg.textContent =
          "ধন্যবাদ! আপনার তথ্য সংরক্ষণ করা হয়েছে। এডমিন রিভিউর পর তালিকায় যুক্ত হবে।";
        setTimeout(() => (msg.hidden = true), 8000);
      }
    });
  }

  function initRequestForm() {
    const form = $("#requestForm");
    const msg = $("#requestSuccess");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(form);

      const patientName = form.patientName.value.trim();
      const bloodGroup = form.bloodGroup.value;
      const bags = form.bags.value;
      const neededDate = form.neededDate.value;
      const hospital = form.hospital.value.trim();
      const phone = form.phone.value.trim();
      const details = form.details.value.trim();

      let ok = true;
      if (!validateRequired(form.patientName, "রোগীর নাম লিখুন")) ok = false;
      if (!validateRequired(form.bloodGroup, "রক্তের গ্রুপ নির্বাচন করুন"))
        ok = false;
      if (!validateRequired(form.bags, "ব্যাগ সংখ্যাটি লিখুন")) ok = false;
      if (!validateRequired(form.neededDate, "তারিখ নির্বাচন করুন")) ok = false;
      if (!validateRequired(form.hospital, "হাসপাতাল / স্থান লিখুন")) ok = false;
      if (!validateRequired(form.phone, "যোগাযোগ নম্বর লিখুন")) ok = false;

      const phoneRe = /^01[0-9]{9}$/;
      if (phone && !phoneRe.test(phone)) {
        const wrapper = form.phone.closest(".field");
        const err = wrapper.querySelector(".field-error");
        wrapper.classList.add("has-error");
        if (err) {
          err.hidden = false;
          err.textContent = "সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন (১১ ডিজিট)।";
        }
        ok = false;
      }
      if (!ok) return;

      const requests = getRequests();
      requests.push({
        id: uid(),
        patientName,
        bloodGroup,
        bags: Number(bags) || 1,
        neededDate,
        hospital,
        phone,
        details,
        status: "pending", // admin will update
        createdAt: new Date().toISOString(),
      });
      setRequests(requests);

      form.reset();
      if (msg) {
        msg.hidden = false;
        msg.textContent =
          "আবেদন গ্রহণ করা হয়েছে। আমাদের স্বেচ্ছাসেবকরা দ্রুত সম্ভব যোগাযোগের চেষ্টা করবেন।";
        setTimeout(() => (msg.hidden = true), 8000);
      }
    });
  }

  function initContactForm() {
    const form = $("#contactForm");
    const msg = $("#contactSuccess");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(form);

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      let ok = true;
      if (!validateRequired(form.name, "আপনার নাম লিখুন")) ok = false;
      if (!validateRequired(form.email, "ইমেইল লিখুন")) ok = false;
      if (!validateRequired(form.message, "বার্তা লিখুন")) ok = false;
      if (!ok) return;

      // এখানে চাইলে EmailJS ইন্টেগ্রেট করতে পারবেন।
      form.reset();
      if (msg) {
        msg.hidden = false;
        msg.textContent =
          "ধন্যবাদ! আপনার বার্তা সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই উত্তর দেওয়ার চেষ্টা করা হবে।";
        setTimeout(() => (msg.hidden = true), 8000);
      }
    });
  }

  /* ---------- Login modal (header) ---------- */
  function initAuthModal() {
    const modal = $("#authModal");
    const loginBtn = $("#loginBtn");
    const closeBtn = $("#authClose");
    const tabLogin = $("#tabLogin");
    const tabRegister = $("#tabRegister");
    const loginForm = $("#loginForm");
    const registerForm = $("#registerForm");
    const loginMsg = $("#loginMsg");
    const registerMsg = $("#registerMsg");

    if (!modal || !loginBtn) return;

    function openModal() {
      modal.hidden = false;
      document.body.classList.add("modal-open");
    }
    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    }

    loginBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    function activateTab(which) {
      if (which === "login") {
        tabLogin.classList.add("active");
        tabLogin.setAttribute("aria-selected", "true");
        tabRegister.classList.remove("active");
        tabRegister.setAttribute("aria-selected", "false");
        loginForm.hidden = false;
        registerForm.hidden = true;
      } else {
        tabRegister.classList.add("active");
        tabRegister.setAttribute("aria-selected", "true");
        tabLogin.classList.remove("active");
        tabLogin.setAttribute("aria-selected", "false");
        loginForm.hidden = true;
        registerForm.hidden = false;
      }
    }

    tabLogin.addEventListener("click", () => activateTab("login"));
    tabRegister.addEventListener("click", () => activateTab("register"));

    // Login = admin shortcut
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(loginForm);
      const phone = loginForm.phone.value.trim();
      const pass = loginForm.password.value;

      let ok = true;
      if (!validateRequired(loginForm.phone, "মোবাইল নম্বর লিখুন")) ok = false;
      if (!validateRequired(loginForm.password, "পাসওয়ার্ড লিখুন")) ok = false;
      if (!ok) return;

      if (phone === ADMIN_PHONE && pass === ADMIN_PASSWORD) {
        localStorage.setItem(LS_KEYS.adminLoggedIn, "1");
        if (loginMsg) {
          loginMsg.hidden = false;
          loginMsg.textContent =
            "সফলভাবে লগইন হয়েছে, আপনাকে এডমিন প্যানেলে পাঠানো হচ্ছে...";
        }
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 800);
      } else {
        const wrapper = loginForm.password.closest(".field");
        const err = wrapper.querySelector(".field-error");
        wrapper.classList.add("has-error");
        if (err) {
          err.hidden = false;
          err.textContent = "মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।";
        }
      }
    });

    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(registerForm);
      if (registerMsg) {
        registerMsg.hidden = false;
        registerMsg.textContent =
          "এই ডেমো ভার্সনে অনলাইন নিবন্ধন সিস্টেম চালু নেই। সদস্য হতে চাইলে নির্ধারিত ফর্ম ও এডমিনের মাধ্যমে যোগাযোগ করুন।";
        setTimeout(() => (registerMsg.hidden = true), 8000);
      }
    });
  }

  /* ---------- Committee page (public) ---------- */
  function initCommitteePage() {
    const grid = $("#committeeGrid");
    if (!grid) return;

    const members = getCommitteeMembers();
    if (!members.length) {
      grid.innerHTML =
        '<p style="color:#607267">এখনও কোনো কমিটির সদস্য যুক্ত করা হয়নি।</p>';
      return;
    }

    grid.innerHTML = "";
    members.forEach((m) => {
      const card = document.createElement("article");
      card.className = "committee-card";
      const initials = (m.name || "")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      card.innerHTML = `
        <div class="committee-avatar">
          ${
            m.photoUrl
              ? `<img src="${m.photoUrl}" alt="${m.name}">`
              : `<span>${initials}</span>`
          }
        </div>
        <h3>${m.name}</h3>
        <p class="committee-position">${m.position || ""}</p>
        ${
          m.since
            ? `<p class="committee-since">দায়িত্ব: ${formatDate(m.since)} থেকে</p>`
            : ""
        }
      `;
      grid.appendChild(card);
    });
  }

   // === Home page: show committee members on home ===
function initHomeCommitteeSection() {
  const listEl = document.getElementById("homeCommitteeList");
  const emptyEl = document.getElementById("homeCommitteeEmpty");
  if (!listEl) return; // যদি এই সেকশন না থাকে, কিছুই করব না

  const members = getCommitteeMembers(); // আগের মতই localStorage থেকে
  listEl.innerHTML = "";

  if (!members || !members.length) {
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  // সব সদস্যের বদলে প্রথম ৪ জন দেখাই (চাইলে limit বদলাতে পারো)
  members.slice(0, 4).forEach((m) => {
    const card = document.createElement("article");
    card.className = "committee-home-card";

    const name = m.name || "নাম পাওয়া যায়নি";
    const pos = m.position || "";
    const since = m.since || "";

    let photoInner = "";
    if (m.photoUrl) {
      photoInner = `<img src="${m.photoUrl}" alt="${name}">`;
    } else {
      const initial = name.trim().charAt(0) || "";
      photoInner = `<span>${initial}</span>`;
    }

    card.innerHTML = `
      <div class="committee-home-photo">
        ${photoInner}
      </div>
      <div class="committee-home-name">${name}</div>
      <div class="committee-home-position">${pos}</div>
      ${since ? `<div class="committee-home-since">দায়িত্ব গ্রহণ: ${since}</div>` : ""}
    `;

    listEl.appendChild(card);
  });
}

  /* ---------- Performance page (public) ---------- */
function initPerformancePage() {
  const tableBody = $("#perfTableBody");
  const summaryEl = $("#perfSummary");
  const settingsEl = $("#perfSettingsText");
  const introEl = $("#perfIntroText");
  const selfForm = $("#perfSelfForm");
  const selfOutput = $("#perfSelfOutput");
  const feeOut = $("#perfFeePercent");
  const progOut = $("#perfProgPercent");
  const overallOut = $("#perfOverallPercent");

  // যদি এই পেইজ না হয়, শুধু return
  if (!tableBody && !selfForm) return;

  const settings = getPerfSettings();
  const members = getPerfMembers();

  // 🔹 উপরের দুইটা স্ট্যাট বক্সে মান বসানো
  const monthsBox = $("#perfTotalMonthsBox");
  const programsBox = $("#perfTotalProgramsBox");
  if (monthsBox) monthsBox.textContent = settings.totalMonths || 0;
  if (programsBox) programsBox.textContent = settings.totalPrograms || 0;

  // উপরের লেখা (এডমিন যেটা সেট করেছে, নাহলে ডিফল্ট)
  if (settingsEl) {
    if (settings.introText) {
      settingsEl.textContent = settings.introText;
    } else {
      settingsEl.textContent =
        `${settings.committeeName} — এ পর্যন্ত অতিবাহিত ${settings.totalMonths} মাস, মোট ${settings.totalPrograms}টি প্রোগ্রাম সম্পন্ন হয়েছে।`;
    }
  }

  // ফর্মের ভিতরের ছোট নির্দেশনা (না থাকলে একই fallback)
  if (introEl) {
    introEl.textContent =
      settings.introText ||
      `এই কমিটির মোট ${settings.totalMonths} মাস এবং ${settings.totalPrograms}টি প্রোগ্রাম বিবেচনায় নিয়ে নিচের ঘরে নিজের তথ্য দিয়ে পারফরম্যান্স হিসাব করতে পারেন।`;
  }

  // === নিজস্ব ক্যালকুলেটর (ফি ৩০%, প্রোগ্রাম ৫০%, নতুন সদস্য ২০%) ===
  if (selfForm) {
    selfForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(selfForm);

      const mField = selfForm.selfMonthsPaid;
      const pField = selfForm.selfPrograms;
      const aField = selfForm.selfMembersAdded;

      let ok = true;
      if (!validateRequired(mField, "কত মাস ফি দিয়েছেন লিখুন")) ok = false;
      if (!validateRequired(pField, "কতটি প্রোগ্রামে উপস্থিত ছিলেন লিখুন")) ok = false;
      if (!validateRequired(aField, "কতজন নতুন সদস্য যুক্ত করেছেন লিখুন")) ok = false;
      if (!ok) return;

      const monthsPaid = Math.max(0, Number(mField.value) || 0);
      const programs = Math.max(0, Number(pField.value) || 0);
      const membersAdded = Math.max(0, Number(aField.value) || 0);

      const totalMonths = settings.totalMonths || 0;
      const totalPrograms = settings.totalPrograms || 0;

      const feeRatio =
        totalMonths > 0 ? Math.min(monthsPaid / totalMonths, 1) : 0;
      const progRatio =
        totalPrograms > 0 ? Math.min(programs / totalPrograms, 1) : 0;

      // সাব-স্কোর (০–১০০%)
      const feePerf = Math.round(feeRatio * 100);
      const progPerf = Math.round(progRatio * 100);

      // নতুন সদস্য অংশ: প্রতি সদস্যে ৪ পয়েন্ট, সর্বোচ্চ ২০ (২০% ওজন)
      const addScore = Math.min(membersAdded * 4, 20); // ০–২০

      // ওভারঅল = ফি ৩০ + প্রোগ্রাম ৫০ + নতুন সদস্য ২০ = ১০০
      const overall = Math.round(feeRatio * 30 + progRatio * 50 + addScore);

      // এখানে শুধু সংখ্যা বসাচ্ছি, % সাইন HTML এ আছে
      if (feeOut) feeOut.textContent = feePerf;
      if (progOut) progOut.textContent = progPerf;
      if (overallOut) overallOut.textContent = overall;
      if (selfOutput) selfOutput.hidden = false;
    });
  }

  // === অফিসিয়াল টেবিল (এডমিন ডাটা থেকে) ===
  if (!tableBody) return;

  tableBody.innerHTML = "";
  if (!members.length) {
    tableBody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;color:#607267">
        এখনো কোনো পারফরম্যান্স তথ্য যোগ করা হয়নি।
      </td></tr>`;
    if (summaryEl) summaryEl.textContent = "";
    return;
  }

  // সদস্যদের মধ্যে সর্বোচ্চ membersAdded বের করি (রিলেটিভ স্কোরের জন্য)
  const maxAdded = Math.max(
    ...members.map((m) => Number(m.membersAdded) || 0),
    1
  );

  members.forEach((m) => {
    const monthsPaid = Number(m.monthsPaid) || 0;
    const programs = Number(m.programs) || 0;
    const added = Number(m.membersAdded) || 0;

    // ফি ৩০ পয়েন্ট, প্রোগ্রাম ৫০ পয়েন্ট
    const feeScore =
      settings.totalMonths > 0
        ? Math.min(monthsPaid / settings.totalMonths, 1) * 30
        : 0;
    const progScore =
      settings.totalPrograms > 0
        ? Math.min(programs / settings.totalPrograms, 1) * 50
        : 0;

    // নতুন সদস্য ২০ পয়েন্ট (সবার মধ্যে রিলেটিভ)
    const addScore = (added / maxAdded) * 20;

    const total = Math.round(feeScore + progScore + addScore); // ০–১০০%

    const dueMonths = Math.max(settings.totalMonths - monthsPaid, 0);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.position || ""}</td>
      <td>${total}%</td>
      <td>${monthsPaid} / ${settings.totalMonths} (বকেয়া ${dueMonths} মাস)</td>
      <td>${programs} / ${settings.totalPrograms}</td>
      <td>${added}</td>
    `;
    tableBody.appendChild(tr);
  });

  const avg =
    members.reduce((sum, m) => {
      const monthsPaid = Number(m.monthsPaid) || 0;
      const programs = Number(m.programs) || 0;
      const added = Number(m.membersAdded) || 0;

      const feeScore =
        settings.totalMonths > 0
          ? Math.min(monthsPaid / settings.totalMonths, 1) * 30
          : 0;
      const progScore =
        settings.totalPrograms > 0
          ? Math.min(programs / settings.totalPrograms, 1) * 50
          : 0;
      const addScore = (added / maxAdded) * 20;

      return sum + (feeScore + progScore + addScore); // ০–১০০
    }, 0) / members.length;

  if (summaryEl) {
    summaryEl.textContent = `মোট ${
      members.length
    } জনের গড় ওভারঅল পারফরম্যান্স: ${Math.round(avg)}%`;
  }
}
  /* ---------- Admin panel ---------- */
  function initAdminPage() {
    const loginSection = $("#adminLoginSection");
    const adminPanel = $("#adminPanel");
    if (!loginSection || !adminPanel) return;

    const loginForm = $("#adminLoginForm");
    const loginMsg = $("#adminLoginMsg");

    function showPanel() {
      loginSection.hidden = true;
      adminPanel.hidden = false;
      initAdminTabs();
      renderAdminNotices();
      renderAdminDonors();
      renderAdminRequests();
      renderAdminCommittee();
      initAdminPerfForms();
      renderAdminPerfMembers();
    }

    if (localStorage.getItem(LS_KEYS.adminLoggedIn)) {
      showPanel();
    }

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(loginForm);

      const phone = loginForm.phone.value.trim();
      const pass = loginForm.password.value;

      let ok = true;
      if (!validateRequired(loginForm.phone, "মোবাইল নম্বর লিখুন")) ok = false;
      if (!validateRequired(loginForm.password, "পাসওয়ার্ড লিখুন")) ok = false;
      if (!ok) return;

      if (phone === ADMIN_PHONE && pass === ADMIN_PASSWORD) {
        localStorage.setItem(LS_KEYS.adminLoggedIn, "1");
        if (loginMsg) {
          loginMsg.hidden = false;
          loginMsg.textContent = "সফলভাবে লগইন হয়েছে।";
        }
        setTimeout(showPanel, 400);
      } else {
        const wrapper = loginForm.password.closest(".field");
        const err = wrapper.querySelector(".field-error");
        wrapper.classList.add("has-error");
        if (err) {
          err.hidden = false;
          err.textContent = "অননুমোদিত অ্যাক্সেস। সঠিক তথ্য দিন।";
        }
      }
    });

    // Logout
    const logoutBtn = $("#adminLogout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem(LS_KEYS.adminLoggedIn);
        window.location.reload();
      });
    }
  }

  function initAdminTabs() {
    const tabs = $$(".admin-tab");
    const panels = $$(".admin-panel-section");
    if (!tabs.length) return;

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        tabs.forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");

        panels.forEach((p) => {
          p.hidden = p.id !== target;
        });
      });
    });
  }

  /* --- Admin: Notices --- */
  function renderAdminNotices() {
    const tbody = $("#adminNoticeTbody");
    if (!tbody) return;
    const notices = getNotices().sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
    tbody.innerHTML = "";
    if (!notices.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#607267">কোনো নোটিশ নেই</td></tr>';
      return;
    }
    notices.forEach((n) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${n.title}</td>
        <td>${n.category || "সাধারণ"}</td>
        <td>${formatDate(n.date)}</td>
        <td>
          <button type="button" class="admin-small-btn admin-del-notice" data-id="${
            n.id
          }">মুছুন</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".admin-del-notice");
      if (!btn) return;
      const id = btn.dataset.id;
      if (!confirm("এই নোটিশটি স্থায়ীভাবে মুছে ফেলতে চান?")) return;
      const list = getNotices().filter((n) => n.id !== id);
      setNotices(list);
      renderAdminNotices();
      renderNotices(); // public refresh
      initQuickStats();
    });
  }

  function initAdminNoticeForm() {
    const form = $("#adminNoticeForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(form);

      const title = form.title.value.trim();
      const category = form.category.value.trim() || "সাধারণ";
      const date = form.date.value || new Date().toISOString().slice(0, 10);
      const content = form.content.value.trim();
      const important = form.important.checked;

      let ok = true;
      if (!validateRequired(form.title, "শিরোনাম লিখুন")) ok = false;
      if (!ok) return;

      const notices = getNotices();
      notices.unshift({
        id: uid(),
        title,
        category,
        date,
        content,
        important,
        createdAt: new Date().toISOString(),
      });
      setNotices(notices);
      form.reset();
      renderAdminNotices();
      renderNotices();
      initQuickStats();
    });
  }

  /* --- Admin: Donors --- */
  function renderAdminDonors() {
    const tbody = $("#adminDonorTbody");
    if (!tbody) return;

    const donors = getDonors().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    tbody.innerHTML = "";
    if (!donors.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#607267">কোনো রক্তদাতা নেই</td></tr>';
      return;
    }

    donors.forEach((d) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.bloodGroup}</td>
        <td>${[d.area, d.upazila].filter(Boolean).join(", ")}</td>
        <td>${d.phone || ""}</td>
        <td>
          ${d.confirmed ? "অনুমোদিত" : "অপেক্ষমাণ"} /
          ${d.available === false ? "অনুপলব্ধ" : "প্রস্তুত"}
        </td>
        <td>
          ${
            !d.confirmed
              ? `<button type="button" class="admin-small-btn admin-confirm-donor" data-id="${d.id}">অনুমোদন</button>`
              : ""
          }
          <button type="button" class="admin-small-btn admin-toggle-availability" data-id="${
            d.id
          }">উপলভ্য / স্থগিত</button>
          <button type="button" class="admin-small-btn admin-edit-donor" data-id="${
            d.id
          }">এডিট</button>
          <button type="button" class="admin-small-btn admin-del-donor" data-id="${
            d.id
          }">ডিলিট</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.onclick = (e) => {
      const id =
        e.target && e.target.dataset ? e.target.dataset.id || null : null;
      if (!id) return;

      const donorsNow = getDonors();
      const idx = donorsNow.findIndex((d) => d.id === id);
      if (idx === -1) return;

      if (e.target.classList.contains("admin-confirm-donor")) {
        donorsNow[idx].confirmed = true;
        setDonors(donorsNow);
        renderAdminDonors();
        initQuickStats();
      } else if (e.target.classList.contains("admin-toggle-availability")) {
        donorsNow[idx].available = donorsNow[idx].available === false;
        setDonors(donorsNow);
        renderAdminDonors();
      } else if (e.target.classList.contains("admin-edit-donor")) {
        const d = donorsNow[idx];
        const name = prompt("নাম:", d.name);
        if (name === null) return;
        const bg = prompt("রক্তের গ্রুপ (যেমন O+):", d.bloodGroup);
        if (bg === null) return;
        const phone = prompt("মোবাইল:", d.phone || "");
        if (phone === null) return;
        const district = prompt("জেলা:", d.district || "");
        if (district === null) return;
        const upazila = prompt("উপজেলা:", d.upazila || "");
        if (upazila === null) return;
        const area = prompt("এলাকা / গ্রাম:", d.area || "");
        if (area === null) return;
        const lastDonation = prompt(
          "শেষ রক্তদানের তারিখ (YYYY-MM-DD, ফাঁকা রাখলে অজানা):",
          d.lastDonation || ""
        );
        d.name = name.trim();
        d.bloodGroup = bg.trim();
        d.phone = phone.trim();
        d.district = district.trim();
        d.upazila = upazila.trim();
        d.area = area.trim();
        d.lastDonation = lastDonation.trim();
        setDonors(donorsNow);
        renderAdminDonors();
      } else if (e.target.classList.contains("admin-del-donor")) {
        if (!confirm("এই দাতা তথ্য ডিলিট করতে চান?")) return;
        const filtered = donorsNow.filter((x) => x.id !== id);
        setDonors(filtered);
        renderAdminDonors();
        initQuickStats();
      }
    };
  }

  /* --- Admin: Requests --- */
  function renderAdminRequests() {
    const tbody = $("#adminRequestTbody");
    if (!tbody) return;

    const list = getRequests().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    tbody.innerHTML = "";
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#607267">কোনো আবেদন নেই</td></tr>';
      return;
    }

    list.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.patientName}</td>
        <td>${r.bloodGroup}</td>
        <td>${r.bags}</td>
        <td>${formatDate(r.neededDate)}</td>
        <td>${r.hospital}</td>
        <td>${r.status}</td>
        <td>
          <button type="button" class="admin-small-btn admin-status-req" data-id="${
            r.id
          }">স্ট্যাটাস</button>
          <button type="button" class="admin-small-btn admin-edit-req" data-id="${
            r.id
          }">এডিট</button>
          <button type="button" class="admin-small-btn admin-del-req" data-id="${
            r.id
          }">ডিলিট</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.onclick = (e) => {
      const id =
        e.target && e.target.dataset ? e.target.dataset.id || null : null;
      if (!id) return;
      const listNow = getRequests();
      const idx = listNow.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const r = listNow[idx];

      if (e.target.classList.contains("admin-status-req")) {
        const st = prompt(
          "স্ট্যাটাস লিখুন (pending / fulfilled / cancelled):",
          r.status || "pending"
        );
        if (!st) return;
        r.status = st.trim();
        setRequests(listNow);
        renderAdminRequests();
      } else if (e.target.classList.contains("admin-edit-req")) {
        const patientName = prompt("রোগীর নাম:", r.patientName);
        if (patientName === null) return;
        const bg = prompt("রক্তের গ্রুপ:", r.bloodGroup);
        if (bg === null) return;
        const bags = prompt("ব্যাগ সংখ্যা:", r.bags);
        if (bags === null) return;
        const nd = prompt(
          "কবে প্রয়োজন (YYYY-MM-DD):",
          r.neededDate || ""
        );
        if (nd === null) return;
        const hospital = prompt("হাসপাতাল / স্থান:", r.hospital || "");
        if (hospital === null) return;
        const phone = prompt("ফোন:", r.phone || "");
        if (phone === null) return;
        const details = prompt("অতিরিক্ত তথ্য:", r.details || "");
        if (details === null) return;

        Object.assign(r, {
          patientName: patientName.trim(),
          bloodGroup: bg.trim(),
          bags: Number(bags) || 1,
          neededDate: nd.trim(),
          hospital: hospital.trim(),
          phone: phone.trim(),
          details: details.trim(),
        });
        setRequests(listNow);
        renderAdminRequests();
      } else if (e.target.classList.contains("admin-del-req")) {
        if (!confirm("এই আবেদনটি ডিলিট করতে চান?")) return;
        const filtered = listNow.filter((x) => x.id !== id);
        setRequests(filtered);
        renderAdminRequests();
      }
    };
  }

  /* --- Admin: Committee --- */
  function renderAdminCommittee() {
    const tbody = $("#adminCommitteeTbody");
    if (!tbody) return;
    const list = getCommitteeMembers();
    tbody.innerHTML = "";
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#607267">কোনো সদস্য নেই</td></tr>';
      return;
    }
    list.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.position || ""}</td>
        <td>${m.photoUrl ? "ছবি যুক্ত" : "—"}</td>
        <td>
          <button type="button" class="admin-small-btn admin-del-member" data-id="${
            m.id
          }">ডিলিট</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.onclick = (e) => {
      const btn = e.target.closest(".admin-del-member");
      if (!btn) return;
      const id = btn.dataset.id;
      if (!confirm("এই কমিটি সদস্যকে ডিলিট করতে চান?")) return;
      const listNow = getCommitteeMembers().filter((m) => m.id !== id);
      setCommitteeMembers(listNow);
      renderAdminCommittee();
    };
  }

  function initAdminCommitteeForm() {
    const form = $("#adminCommitteeForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearFieldErrors(form);

      const name = form.name.value.trim();
      const position = form.position.value.trim();
      const photoUrl = form.photoUrl.value.trim();
      const since = form.since.value;

      let ok = true;
      if (!validateRequired(form.name, "নাম লিখুন")) ok = false;
      if (!validateRequired(form.position, "পদবী লিখুন")) ok = false;
      if (!ok) return;

      const list = getCommitteeMembers();
      list.push({
        id: uid(),
        name,
        position,
        photoUrl,
        since,
      });
      setCommitteeMembers(list);
      form.reset();
      renderAdminCommittee();
    });
  }

  /* --- Admin: Performance Settings & Members --- */
  function initAdminPerfForms() {
    const settingsForm = $("#adminPerfSettingsForm");
    const memberForm = $("#adminPerfMemberForm");
    const currentSettings = getPerfSettings();

if (settingsForm) {
  settingsForm.committeeName.value = currentSettings.committeeName || "";
  settingsForm.totalMonths.value = currentSettings.totalMonths || 0;
  settingsForm.totalPrograms.value = currentSettings.totalPrograms || 0;
  settingsForm.introText.value = currentSettings.introText || "";

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFieldErrors(settingsForm);
    const committeeName = settingsForm.committeeName.value.trim();
    const totalMonths = Number(settingsForm.totalMonths.value) || 0;
    const totalPrograms = Number(settingsForm.totalPrograms.value) || 0;
    const introText = settingsForm.introText.value.trim();

    let ok = true;
    if (!validateRequired(settingsForm.committeeName, "কমিটির নাম লিখুন"))
      ok = false;
    if (!ok) return;

    setPerfSettings({ committeeName, totalMonths, totalPrograms, introText });
    alert("পারফরম্যান্স সেটিংস সংরক্ষণ করা হয়েছে।");
  });
}
    if (memberForm) {
      memberForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearFieldErrors(memberForm);
        const name = memberForm.name.value.trim();
        const position = memberForm.position.value.trim();
        const monthsPaid = Number(memberForm.monthsPaid.value) || 0;
        const programs = Number(memberForm.programs.value) || 0;
        const membersAdded = Number(memberForm.membersAdded.value) || 0;

        let ok = true;
        if (!validateRequired(memberForm.name, "নাম লিখুন")) ok = false;
        if (!validateRequired(memberForm.position, "পদবী লিখুন")) ok = false;
        if (!ok) return;

        const list = getPerfMembers();
        list.push({
          id: uid(),
          name,
          position,
          monthsPaid,
          programs,
          membersAdded,
        });
        setPerfMembers(list);
        memberForm.reset();
        renderAdminPerfMembers();
      });
    }

    const tbody = $("#adminPerfTbody");
    if (tbody) {
      tbody.onclick = (e) => {
        const btn = e.target.closest(".admin-del-perf");
        if (!btn) return;
        const id = btn.dataset.id;
        if (!confirm("এই সদস্যের পারফরম্যান্স ডাটা ডিলিট করতে চান?")) return;
        const list = getPerfMembers().filter((m) => m.id !== id);
        setPerfMembers(list);
        renderAdminPerfMembers();
      };
    }
  }

  function renderAdminPerfMembers() {
    const tbody = $("#adminPerfTbody");
    if (!tbody) return;
    const list = getPerfMembers();
    tbody.innerHTML = "";
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#607267">কোনো ডাটা নেই</td></tr>';
      return;
    }
    list.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.position}</td>
        <td>${m.monthsPaid}</td>
        <td>${m.programs}</td>
        <td>${m.membersAdded}
          <button type="button" class="admin-small-btn admin-del-perf" data-id="${
            m.id
          }" style="margin-left:6px">ডিলিট</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ---------- Init on DOM ready ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    seedInitialData();
    initCurrentYear();
    initMobileNav();
    initBackToTop();
    initQuickStats();
    renderNotices();
    initDonorListAndFilters();
    initDonorForm();
    initRequestForm();
    initContactForm();
    initAuthModal();
    initCommitteePage();
    initPerformancePage();
    initAdminNoticeForm();
    initAdminCommitteeForm();
    initAdminPage();
  });
})();

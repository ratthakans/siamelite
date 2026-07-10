/* ===========================================================
   Siam Elite Consulting — interactions
   Language toggle · mobile nav · floating widget ·
   multi-step lead form · scroll reveal
   =========================================================== */
(function () {
  "use strict";

  /* ---------- Analytics (optional) ----------
     Paste your real IDs to switch these on. While they still contain "X",
     nothing loads and no tracking happens. GA4: Admin → Data Streams.
     Meta Pixel: Events Manager → Data Sources. */
  var GA4_ID = "G-XXXXXXXXXX";
  var META_PIXEL_ID = "XXXXXXXXXXXXXXX";
  (function initAnalytics() {
    if (GA4_ID.indexOf("X") === -1) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA4_ID);
    }
    if (META_PIXEL_ID.indexOf("X") === -1) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", META_PIXEL_ID);
      window.fbq("track", "PageView");
    }
  })();
  function trackLead() {
    if (window.gtag) window.gtag("event", "generate_lead");
    if (window.fbq) window.fbq("track", "Lead");
  }

  /* ---------- Lead storage (Supabase) ---------- */
  var SUPABASE_URL = "https://loanbvamjfdlmyhstaby.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_woZnz99Lnciyotx1wl2rUQ_qAYoD9Kl";

  function saveLeadToSupabase(payload) {
    if (SUPABASE_URL.indexOf("YOUR_SUPABASE") === 0) {
      console.log("New Siam Elite lead (Supabase not configured yet) →", payload);
      return;
    }
    fetch(SUPABASE_URL + "/rest/v1/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        service: payload.service,
        budget: payload.budget,
        name: payload.name,
        contact: payload.contact,
        channel: payload.channel,
        source_page: location.pathname
      })
    }).catch(function (err) {
      console.error("Failed to save lead to Supabase", err);
    });
  }

  /* ---------- Language toggle (EN / TH) ---------- */
  var body = document.body;
  var langButtons = document.querySelectorAll("#langSwitch button");
  function setLang(lang) {
    if (lang === "en") { body.classList.add("en"); document.documentElement.lang = "en"; }
    else { body.classList.remove("en"); document.documentElement.lang = "th"; }
    langButtons.forEach(function (b) { b.classList.toggle("active", b.dataset.lang === lang); });
    try { localStorage.setItem("se_lang", lang); } catch (e) {}
  }
  langButtons.forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); });
  });
  var saved = "th";
  try { saved = localStorage.getItem("se_lang") || "th"; } catch (e) {}
  setLang(saved);

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger) {
    burger.addEventListener("click", function () { nav.classList.toggle("open"); });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  /* ---------- Floating contact widget ---------- */
  var fab = document.getElementById("fab");
  var fabToggle = document.getElementById("fabToggle");
  if (fabToggle) {
    fabToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      fab.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!fab.contains(e.target)) fab.classList.remove("open");
    });
  }

  /* ---------- Multi-step lead form ---------- */
  var form = document.getElementById("leadForm");
  if (form) {
    var steps = form.querySelectorAll(".fstep");
    var bars = [document.getElementById("b1"), document.getElementById("b2"), document.getElementById("b3")];
    var current = 1;
    var data = { service: "", budget: "" };

    function showStep(n) {
      current = n;
      steps.forEach(function (s) { s.classList.toggle("active", +s.dataset.step === n); });
      bars.forEach(function (bar, i) { if (bar) bar.classList.toggle("done", i < n); });
    }

    /* option chips (single-select per group) */
    form.querySelectorAll(".opt-grid").forEach(function (grid) {
      var group = grid.dataset.group;
      var preselected = grid.querySelector(".opt.sel");
      if (preselected) data[group] = preselected.dataset.val;
      grid.querySelectorAll(".opt").forEach(function (opt) {
        opt.addEventListener("click", function () {
          grid.querySelectorAll(".opt").forEach(function (o) { o.classList.remove("sel"); });
          opt.classList.add("sel");
          data[group] = opt.dataset.val;
        });
      });
    });

    /* next / back */
    form.querySelectorAll("[data-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (current === 1 && !data.service) { flash(btn); return; }
        if (current === 2 && !data.budget) { flash(btn); return; }
        showStep(current + 1);
      });
    });
    form.querySelectorAll("[data-back]").forEach(function (btn) {
      btn.addEventListener("click", function () { showStep(current - 1); });
    });

    function flash(btn) {
      btn.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
        { duration: 260 }
      );
    }

    /* submit */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);

      /* honeypot: hidden field humans never see — bots that fill it get a
         fake success and nothing is saved */
      if (fd.get("website")) {
        form.style.display = "none";
        var okTrap = document.getElementById("formSuccess");
        if (okTrap) okTrap.classList.add("show");
        return;
      }

      var payload = {
        service: data.service,
        budget: data.budget,
        name: fd.get("name"),
        contact: fd.get("contact"),
        channel: fd.get("channel")
      };
      if (!payload.name || !payload.contact) return;

      var consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        var cw = form.querySelector(".consent");
        if (cw) { cw.classList.add("err"); cw.animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 250 }); }
        return;
      }

      saveLeadToSupabase(payload);
      trackLead();

      form.style.display = "none";
      var ok = document.getElementById("formSuccess");
      if (ok) ok.classList.add("show");
    });
  }

  /* ---------- Shared property label helpers (used by cards + detail page) ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function bi(th, en) {
    return '<span class="lang-th">' + esc(th) + '</span><span class="lang-en">' + esc(en) + '</span>';
  }

  /* ---------- Line-icon set (thin, monochrome — replaces emoji) ---------- */
  var ICON_PATHS = {
    bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 18h20"/><path d="M12 4v6"/>',
    bath: '<path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2"/><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M7 19l-1 2"/><path d="M18 19l1 2"/>',
    area: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    land: '<path d="M12 13v9"/><path d="M12 3 7 11h10z"/><path d="M12 8 8.5 13h7z"/>',
    floor: '<path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18"/><path d="M4 22h16"/><path d="M9 7h1"/><path d="M14 7h1"/><path d="M9 11h1"/><path d="M14 11h1"/><path d="M9 15h1"/><path d="M14 15h1"/>',
    parking: '<path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13"/><path d="M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M7.5 15h.01"/><path d="M16.5 15h.01"/>',
    sofa: '<path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 13a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v5H2z"/><path d="M6 18v2"/><path d="M18 18v2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'
  };
  function svic(name, cls) {
    return '<svg viewBox="0 0 24 24" class="svic' + (cls ? " " + cls : "") + '" aria-hidden="true">' + (ICON_PATHS[name] || "") + '</svg>';
  }
  var LABELS = {
    status: { sale: { th: "ขาย", en: "For Sale" }, rent: { th: "เช่า", en: "For Rent" } },
    type: {
      villa: { th: "วิลล่า", en: "Villa" },
      condo: { th: "คอนโด", en: "Condo" },
      house: { th: "บ้าน", en: "House" }
    },
    furnished: {
      full: { th: "ครบครัน", en: "Fully furnished" },
      partial: { th: "บางส่วน", en: "Partly furnished" },
      unfurnished: { th: "ไม่มีเฟอร์นิเจอร์", en: "Unfurnished" }
    },
    ownership: {
      "freehold": { th: "กรรมสิทธิ์สมบูรณ์", en: "Freehold" },
      "leasehold": { th: "สิทธิการเช่าระยะยาว", en: "Leasehold" },
      "foreign-quota": { th: "โควตาต่างชาติ (ถือครองได้)", en: "Foreign freehold quota" },
      "thai-company": { th: "ถือครองผ่านนิติบุคคล", en: "Thai company structure" },
      "rental": { th: "สำหรับเช่า", en: "Rental only" }
    }
  };
  function labelBi(group, key) {
    var g = LABELS[group] || {};
    return g[key] || { th: key || "-", en: key || "-" };
  }

  /* ---------- Property listings — data-driven from assets/data/properties.json
     (edit that file directly, or via the /admin CMS, to add/change listings) ---------- */
  var propGrid = document.getElementById("propGrid");
  if (propGrid) {
    var scope = propGrid.dataset.scope || "all";

    fetch("assets/data/properties.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var listings = data.listings || [];
        if (scope === "featured") {
          listings = listings.filter(function (item) { return item.featured; });
        }
        listings.forEach(function (item) {
          propGrid.appendChild(renderPropertyCard(item));
        });
        initPropertyFilters();
      })
      .catch(function (err) {
        console.error("Failed to load assets/data/properties.json", err);
      });
  }

  function renderPropertyCard(item) {
    var a = document.createElement("a");
    a.className = "prop-card";
    a.href = "property.html?ref=" + encodeURIComponent(item.code || "");
    a.dataset.status = item.status;
    a.dataset.type = item.type;
    a.dataset.location = item.location;
    a.dataset.beds = item.beds;
    a.dataset.tier = item.tier;

    var st = labelBi("status", item.status);
    var ty = labelBi("type", item.type);
    var areaUnit = item.type === "condo" ? "" : "";

    a.innerHTML =
      '<div class="prop-img">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.title_en) + '" loading="lazy">' +
        '<span class="tag tag-' + esc(item.status) + '">' + bi(st.th, st.en) + '</span>' +
      '</div>' +
      '<div class="prop-body">' +
        '<div class="prop-top">' +
          '<div class="prop-price">' + bi(item.price_th, item.price_en) + '</div>' +
          '<span class="prop-code">' + esc(item.code || "") + '</span>' +
        '</div>' +
        '<h4>' + bi(item.title_th, item.title_en) + '</h4>' +
        '<div class="loc">' +
          '<svg viewBox="0 0 24 24" class="pin"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' +
          bi(item.location_th, item.location_en) + ' · ' + bi(ty.th, ty.en) +
        '</div>' +
        '<div class="prop-specs">' +
          '<span><b>' + esc(item.beds) + '</b> ' + bi("นอน", "bed") + '</span>' +
          '<span><b>' + esc(item.baths) + '</b> ' + bi("น้ำ", "bath") + '</span>' +
          '<span><b>' + esc(item.sqm) + '</b> ' + bi("ตร.ม.", "m²") + '</span>' +
        '</div>' +
        '<div class="prop-view">' + bi("ดูรายละเอียด", "View details") + ' →</div>' +
      '</div>';
    return a;
  }

  function initPropertyFilters() {
    var cards = Array.prototype.slice.call(propGrid.querySelectorAll(".prop-card"));
    var fStatus = document.getElementById("fStatus");
    var fType = document.getElementById("fType");
    var fLocation = document.getElementById("fLocation");
    var fBeds = document.getElementById("fBeds");
    var fTier = document.getElementById("fTier");
    var fKeyword = document.getElementById("fKeyword");
    var fReset = document.getElementById("fReset");
    var propCount = document.getElementById("propCount");
    var propEmpty = document.getElementById("propEmpty");
    if (!fStatus) return;

    function applyFilters() {
      var kw = (fKeyword.value || "").trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var okStatus = fStatus.value === "all" || card.dataset.status === fStatus.value;
        var okType = fType.value === "all" || card.dataset.type === fType.value;
        var okLoc = fLocation.value === "all" || card.dataset.location === fLocation.value;
        var okBeds = fBeds.value === "0" || parseInt(card.dataset.beds, 10) >= parseInt(fBeds.value, 10);
        var okTier = fTier.value === "all" || card.dataset.tier === fTier.value;
        var okKw = !kw || card.textContent.toLowerCase().indexOf(kw) !== -1;
        var show = okStatus && okType && okLoc && okBeds && okTier && okKw;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });
      propCount.innerHTML =
        '<span class="lang-th">แสดง ' + visible + " จาก " + cards.length + ' รายการ</span>' +
        '<span class="lang-en">Showing ' + visible + " of " + cards.length + " listings</span>";
      propEmpty.hidden = visible !== 0;
      propGrid.style.display = visible === 0 ? "none" : "";
    }

    [fStatus, fType, fLocation, fBeds, fTier].forEach(function (sel) {
      sel.addEventListener("change", applyFilters);
    });
    fKeyword.addEventListener("input", applyFilters);
    fReset.addEventListener("click", function () {
      fStatus.value = "all";
      fType.value = "all";
      fLocation.value = "all";
      fBeds.value = "0";
      fTier.value = "all";
      fKeyword.value = "";
      applyFilters();
    });
    applyFilters();
  }

  /* ---------- Property detail page (property.html?ref=CODE) ---------- */
  var propDetail = document.getElementById("propDetail");
  if (propDetail) {
    var ref = new URLSearchParams(location.search).get("ref");
    fetch("assets/data/properties.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var listings = data.listings || [];
        var item = listings.filter(function (p) { return p.code === ref; })[0];
        if (!item) {
          propDetail.innerHTML =
            '<div class="pd-missing">' + bi("ไม่พบทรัพย์ที่คุณเลือก", "Property not found") +
            ' — <a href="properties.html">' + bi("ดูอสังหาฯ ทั้งหมด", "browse all properties") + '</a></div>';
          return;
        }
        renderPropertyDetail(item);
        renderSimilar(item, listings);
        setLang(document.body.classList.contains("en") ? "en" : "th");
      })
      .catch(function (err) { console.error("Failed to load property", err); });
  }

  function renderPropertyDetail(item) {
    document.title = (document.body.classList.contains("en") ? item.title_en : item.title_th) + " — Siam Elite Consulting";
    injectListingSchema(item);
    var st = labelBi("status", item.status);
    var ty = labelBi("type", item.type);
    var fu = labelBi("furnished", item.furnished);
    var ow = labelBi("ownership", item.ownership);
    var gallery = (item.gallery && item.gallery.length ? item.gallery : [item.image]);

    // breadcrumb
    var crumb = document.getElementById("pdCrumb");
    if (crumb) crumb.innerHTML = bi(item.title_th, item.title_en);

    // gallery
    var thumbs = gallery.map(function (src, i) {
      return '<button class="pd-thumb' + (i === 0 ? " on" : "") + '" data-src="' + esc(src) + '" aria-label="photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
    }).join("");

    // spec tiles
    function tile(icon, val, th, en) {
      return '<div class="pd-spec"><span class="pd-spec-ic">' + icon + '</span><b>' + esc(val) + '</b><span class="pd-lbl">' + bi(th, en) + '</span></div>';
    }
    function tileBi(icon, valTh, valEn, th, en) {
      return '<div class="pd-spec"><span class="pd-spec-ic">' + icon + '</span><b class="pd-spec-bi">' + bi(valTh, valEn) + '</b><span class="pd-lbl">' + bi(th, en) + '</span></div>';
    }
    var specs = "";
    specs += tile(svic("bed"), item.beds, "ห้องนอน", "Bedrooms");
    specs += tile(svic("bath"), item.baths, "ห้องน้ำ", "Bathrooms");
    specs += tileBi(svic("area"), item.sqm + " ตร.ม.", item.sqm + " m²", "พื้นที่ใช้สอย", "Interior");
    if (item.land_sqm) specs += tileBi(svic("land"), item.land_sqm + " ตร.ม.", item.land_sqm + " m²", "ที่ดิน", "Land");
    if (item.floor) specs += tile(svic("floor"), item.floor, "ชั้น", "Floor");
    specs += tile(svic("parking"), item.parking, "ที่จอดรถ", "Parking");
    specs += tileBi(svic("sofa"), fu.th, fu.en, "เฟอร์นิเจอร์", "Furnishing");

    var features = (item.features || []).map(function (f) {
      return '<li>' + svic("check", "sm") + '<span>' + bi(f.th, f.en) + '</span></li>';
    }).join("");

    // ownership advisory (consulting differentiator)
    var notes = {
      "foreign-quota": { th: "คอนโดนี้อยู่ในโควตาต่างชาติ ชาวต่างชาติสามารถถือครองกรรมสิทธิ์ได้เต็มรูปแบบตามกฎหมาย — เราช่วยตรวจสอบเอกสารและดำเนินการโอนให้ถูกต้อง", en: "This unit sits within the foreign ownership quota, so foreigners may hold full freehold title. We verify the paperwork and handle the transfer correctly." },
      "leasehold": { th: "ตามกฎหมายไทย ชาวต่างชาติถือครองที่ดินในนามตนเองไม่ได้ ทรัพย์นี้เสนอในรูปแบบสิทธิการเช่าระยะยาว (ปกติ 30 ปี ต่ออายุได้) — เราให้คำปรึกษาโครงสร้างที่ปลอดภัยและถูกกฎหมาย", en: "Under Thai law foreigners cannot own land in their own name. This property is offered on a long leasehold (typically 30 years, renewable). We advise on a safe, fully legal structure." },
      "thai-company": { th: "ทรัพย์นี้ถือครองผ่านโครงสร้างนิติบุคคลไทย — เราช่วยตรวจสอบและวางโครงสร้างให้ถูกต้องตามกฎหมาย พร้อมทนายความประจำ", en: "Held through a Thai company structure. We review and set this up correctly and legally, with our in-house legal partners." },
      "rental": { th: "สอบถามเงื่อนไขการเช่า ระยะสัญญา และเงินประกันได้กับทีมงาน เราช่วยตรวจสัญญาเช่าให้เป็นธรรมก่อนเซ็น", en: "Ask our team about lease terms, contract length and deposits. We review the tenancy agreement to keep it fair before you sign." }
    };
    var note = notes[item.ownership];
    var noteHtml = note ? '<div class="pd-note"><span class="pd-note-ic">' + svic("shield", "lg") + '</span><div><b>' + bi("การถือครองสำหรับชาวต่างชาติ", "Ownership for foreigners") + '</b><p>' + bi(note.th, note.en) + '</p></div></div>' : "";

    // WhatsApp deep link with property context
    var waText = encodeURIComponent("สนใจทรัพย์ " + item.code + " — " + item.title_th + " (" + item.price_th + ")");

    propDetail.innerHTML =
      '<div class="pd-gallery reveal in">' +
        '<div class="pd-main"><img id="pdMain" src="' + esc(gallery[0]) + '" alt="' + esc(item.title_en) + '"></div>' +
        '<div class="pd-thumbs">' + thumbs + '</div>' +
      '</div>' +
      '<div class="pd-layout">' +
        '<div class="pd-info">' +
          '<div class="pd-badges"><span class="tag tag-' + esc(item.status) + '">' + bi(st.th, st.en) + '</span><span class="pd-type">' + bi(ty.th, ty.en) + '</span></div>' +
          '<h1>' + bi(item.title_th, item.title_en) + '</h1>' +
          '<div class="pd-loc"><svg viewBox="0 0 24 24" class="pin"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' + bi(item.location_th, item.location_en) + ' · ' + esc(item.code) + '</div>' +
          '<div class="pd-specs">' + specs + '</div>' +
          '<div class="pd-section"><h3>' + bi("รายละเอียด", "Description") + '</h3><p>' + bi(item.desc_th, item.desc_en) + '</p></div>' +
          (features ? '<div class="pd-section"><h3>' + bi("จุดเด่นของทรัพย์", "Property highlights") + '</h3><ul class="pd-features">' + features + '</ul></div>' : "") +
          noteHtml +
          '<p class="pd-disclaimer">' + bi("* ที่อยู่และพิกัดที่แน่นอนเปิดเผยเฉพาะผู้สนใจจริงหลังติดต่อทีมงาน", "* Exact address and location shared with serious enquiries after you contact our team.") + '</p>' +
        '</div>' +
        '<aside class="pd-enquire">' +
          '<div class="pd-e-price">' + bi(item.price_th, item.price_en) + '</div>' +
          '<div class="pd-e-own">' + bi(ow.th, ow.en) + '</div>' +
          '<p>' + bi("สนใจทรัพย์นี้? ทีมงานพร้อมพาชมและให้คำปรึกษาฟรี ตอบกลับใน 30 นาที", "Interested? Our team arranges viewings and free advice — reply within 30 minutes.") + '</p>' +
          '<a class="btn btn-gold" href="#contact" data-enquire>' + bi("ส่งความสนใจ", "Submit interest") + '</a>' +
          '<a class="btn btn-outline" href="https://wa.me/66947755746?text=' + waText + '" target="_blank" rel="noopener">' + bi("แชท WhatsApp", "Chat on WhatsApp") + '</a>' +
          '<div class="pd-e-meta">' + bi("รหัสทรัพย์", "Ref") + ': ' + esc(item.code) + '</div>' +
        '</aside>' +
      '</div>';

    // gallery thumb swap
    var main = document.getElementById("pdMain");
    propDetail.querySelectorAll(".pd-thumb").forEach(function (t) {
      t.addEventListener("click", function () {
        main.src = t.dataset.src;
        propDetail.querySelectorAll(".pd-thumb").forEach(function (x) { x.classList.remove("on"); });
        t.classList.add("on");
      });
    });

    // preselect Property in the lead form + show the property reference
    var svcGrid = document.querySelector('.opt-grid[data-group="service"]');
    if (svcGrid) {
      svcGrid.querySelectorAll(".opt").forEach(function (o) {
        o.classList.toggle("sel", o.dataset.val === "Property");
      });
    }
    var refSlot = document.getElementById("leadPropRef");
    if (refSlot) {
      refSlot.hidden = false;
      refSlot.innerHTML = bi("สนใจทรัพย์: ", "Enquiring about: ") + "<b>" + esc(item.code) + " · " + (document.body.classList.contains("en") ? esc(item.title_en) : esc(item.title_th)) + "</b>";
    }
  }

  function injectListingSchema(item) {
    var ORIGIN = "https://siamelite.vercel.app/";
    var typeMap = { villa: "House", house: "House", condo: "Apartment" };
    var gallery = (item.gallery && item.gallery.length ? item.gallery : [item.image]);
    var schema = {
      "@context": "https://schema.org",
      "@type": typeMap[item.type] || "Residence",
      "name": item.title_en,
      "description": item.desc_en,
      "image": gallery.map(function (g) { return ORIGIN + g; }),
      "url": ORIGIN + "property.html?ref=" + encodeURIComponent(item.code),
      "numberOfRooms": item.beds,
      "numberOfBathroomsTotal": item.baths,
      "floorSize": { "@type": "QuantitativeValue", "value": item.sqm, "unitCode": "MTK" },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": item.location_en,
        "addressRegion": "Chiang Mai",
        "addressCountry": "TH"
      }
    };
    var el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    // update social + canonical meta for this property (Google executes JS and will pick these up)
    var propUrl = ORIGIN + "property.html?ref=" + encodeURIComponent(item.code);
    var og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute("content", item.title_en + " — Siam Elite Consulting");
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute("content", ORIGIN + gallery[0]);
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", propUrl);
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", propUrl);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", (item.desc_en || "").slice(0, 155));
  }

  function renderSimilar(item, listings) {
    var wrap = document.getElementById("propSimilar");
    if (!wrap) return;
    var sims = listings.filter(function (p) {
      return p.code !== item.code && (p.type === item.type || p.location === item.location);
    });
    // top up to 3 with any other listings
    if (sims.length < 3) {
      listings.forEach(function (p) {
        if (sims.length >= 3) return;
        if (p.code !== item.code && sims.indexOf(p) === -1) sims.push(p);
      });
    }
    sims.slice(0, 3).forEach(function (p) { wrap.appendChild(renderPropertyCard(p)); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (row) {
    var q = row.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", function () {
      var open = row.classList.contains("open");
      row.classList.toggle("open", !open);
    });
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

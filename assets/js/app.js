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

  /* ---------- Language toggle (TH / EN / ZH) ----------
     Each page declares which languages it supports via <body data-langs="th,en,zh">.
     A persisted lang that a page doesn't support falls back safely (so e.g. a
     zh preference never blanks out a TH/EN-only page). */
  var body = document.body;
  var langButtons = document.querySelectorAll("#langSwitch [data-lang]");
  var supportedLangs = (body.dataset.langs || "th,en").split(",");
  /* Where an index.html link should point when the user is browsing in Chinese —
     keeps Chinese visitors inside the Chinese world (zh.html) instead of dropping
     them onto the Thai/English home. */
  function zhHref(h) {
    if (!h) return h;
    if (h === "index.html#visa") return "zh.html#services";
    if (h === "index.html#property") return "properties.html";
    if (h === "index.html#contact") return "zh.html#contact";
    if (h.indexOf("index.html") === 0) return "zh.html";
    return h;
  }
  /* filter/sort <option> labels can't use language spans, so swap their text directly */
  var OPT_ZH = {
    fStatus: { all: "全部", rent: "出租", sale: "出售" },
    fType: { all: "全部类型", villa: "别墅", condo: "公寓", house: "住宅" },
    fLocation: { all: "全部地区", nimman: "宁曼路", sansai: "San Sai / Mae Jo", saraphi: "Saraphi", hangdong: "Hang Dong", sankamphaeng: "San Kamphaeng", mueang: "清迈市区", airport: "机场周边", other: "其他地区" },
    fBeds: { "0": "不限" },
    fTier: { all: "不限预算", a: "< ฿20,000/月", b: "฿20,000–30,000/月", c: "฿30,000+/月" },
    fSort: { "default": "推荐", "price-asc": "价格：低 → 高", "price-desc": "价格：高 → 低" }
  };
  function localizeOptions(lang) {
    Object.keys(OPT_ZH).forEach(function (selId) {
      var sel = document.getElementById(selId);
      if (!sel) return;
      [].forEach.call(sel.options, function (o) {
        if (o.dataset.orig === undefined) o.dataset.orig = o.textContent;
        var zh = OPT_ZH[selId][o.value];
        o.textContent = (lang === "zh" && zh) ? zh : o.dataset.orig;
      });
    });
  }
  function setLang(lang, remember) {
    var requested = lang;
    if (supportedLangs.indexOf(lang) === -1) lang = supportedLangs.indexOf("en") !== -1 ? "en" : supportedLangs[0];
    body.classList.toggle("en", lang === "en");
    body.classList.toggle("zh", lang === "zh");
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
    langButtons.forEach(function (b) { b.classList.toggle("active", b.dataset.lang === lang); });
    localizeOptions(lang);
    document.querySelectorAll('a[href^="index.html"]').forEach(function (a) {
      if (a.dataset.baseHref === undefined) a.dataset.baseHref = a.getAttribute("href");
      a.setAttribute("href", lang === "zh" ? zhHref(a.dataset.baseHref) : a.dataset.baseHref);
    });
    /* persist ONLY an explicit, supported choice — a fallback must never overwrite
       a valid stored preference (e.g. a zh user briefly hitting a TH/EN-only page). */
    if (remember && supportedLangs.indexOf(requested) !== -1) {
      try { localStorage.setItem("se_lang", requested); } catch (e) {}
    }
  }
  langButtons.forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang, true); });
  });

  /* On trilingual pages, auto-build a Chinese span next to every English span
     from the dictionary below. Anything not in the dictionary falls back to the
     English markup, so a zh view can never render blank. Dynamic property content
     already ships its own .lang-zh (via bi()), so those are skipped. */
  var ZH = {
    "Home": "首页", "Property": "房产", "Full Portfolio": "全部房源",
    "Find Your PerfectChiang Mai Home": "寻找您理想的<br>清迈之家",
    "Filter by type, location, bedrooms and budget. Found one you like? Submit your interest — our team replies within 30 minutes.": "按类型、地区、卧室和预算筛选。找到心仪房源？立即提交意向——我们的团队将在30分钟内回复。",
    "Status": "状态", "Property Type": "房产类型", "Location": "地区", "Bedrooms": "卧室", "Budget": "预算",
    "Reset Filters": "重置筛选",
    "No properties match your filters. Try adjusting them.": "没有符合筛选条件的房源，请调整后重试。",
    "Similar Properties": "相似房源",
    "Professional Maid Service — included in your Elite living": "专业家政服务 — 尊享 Elite 生活的一部分",
    "Vetted, trained housekeepers to care for your home throughout your stay. One point of contact for everything.": "经过审核与培训的家政人员，在您入住期间全程照料您的家。一个联系人，搞定所有事务。",
    "Add Maid Service": "增加家政服务",
    "Visa": "签证", "About": "关于我们", "Free Consultation": "免费咨询",
    "Interested in this property?": "对此房源感兴趣？",
    "Submit Interest, Get a Special Offer": "提交意向，获取<span class=\"gold-text\">专属优惠</span>",
    "Answer three quick questions and our team will contact you personally — usually within 30 minutes during office hours.": "回答三个简短问题，我们的团队将亲自与您联系——营业时间内通常30分钟回复。",
    "Real viewings, no obligation": "真实看房，无任何义务",
    "Advice on foreign ownership structures": "外国人产权结构咨询",
    "Reply on your channel: Line · WhatsApp · WeChat": "通过您常用的方式回复：Line · WhatsApp · WeChat",
    "What can we help with?": "我们能帮您什么？", "Select one to get started.": "选择一项开始",
    "Maid Service": "家政服务", "Continue": "继续", "Back": "返回",
    "Your budget / timeframe?": "您的预算 / 时间安排？",
    "This helps us tailor the right options.": "这有助于我们为您匹配合适的选择。",
    "Just exploring for now": "目前只是了解", "Ready within 3 months": "3个月内准备就绪", "As soon as possible": "尽快",
    "Where should we reach you?": "我们该如何联系您？",
    "We'll send your tailored plan & special offer.": "我们将发送您的专属方案与优惠。",
    "Name": "姓名", "Phone / WhatsApp / Line": "电话 / WhatsApp / Line", "Preferred channel": "首选联系方式",
    "I agree that Siam Elite may store and use my details to contact me, per the Privacy Policy.": "我同意 Siam Elite 依据<a href=\"privacy.html\" target=\"_blank\">隐私政策</a>存储并使用我的信息以便联系我。",
    "Get My Free Plan": "获取我的免费方案", "Submit My Interest": "提交我的意向",
    "Thank you!": "谢谢您！",
    "Our team has received your request and will contact you shortly. For an instant reply, tap a button below.": "我们已收到您的请求，将尽快与您联系。如需即时回复，请点击下方按钮。",
    "Services": "服务", "Visa Services": "签证服务", "Maid Services": "家政服务",
    "Company": "公司", "About Us": "关于我们", "Contact": "联系", "Book a Consult": "预约咨询",
    "Get in Touch": "联系我们", "All rights reserved.": "版权所有",
    "Your trusted one-stop partner for elite living, investment and immigration in Chiang Mai, Thailand.": "您在泰国清迈值得信赖的一站式合作伙伴，涵盖高端生活、投资与移民。",
    "Call us": "致电我们", "Call": "致电"
  };
  function localizeZh() {
    if (supportedLangs.indexOf("zh") === -1) return;
    document.querySelectorAll(".lang-en").forEach(function (en) {
      var parent = en.parentNode;
      if (!parent) return;
      var sib = en.nextElementSibling;
      if (sib && sib.classList && sib.classList.contains("lang-zh")) return;
      var zh = document.createElement("span");
      zh.className = en.className.replace("lang-en", "lang-zh");
      var key = en.textContent.trim();
      zh.innerHTML = Object.prototype.hasOwnProperty.call(ZH, key) ? ZH[key] : en.innerHTML;
      parent.insertBefore(zh, en.nextSibling);
    });
  }
  localizeZh();

  var saved = "th";
  try { saved = localStorage.getItem("se_lang") || "th"; } catch (e) {}
  setLang(saved, false);
  function currentLang() { return body.classList.contains("zh") ? "zh" : body.classList.contains("en") ? "en" : "th"; }

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
  function bi(th, en, zh) {
    return '<span class="lang-th">' + esc(th) + '</span>' +
           '<span class="lang-en">' + esc(en) + '</span>' +
           '<span class="lang-zh">' + esc(zh == null ? en : zh) + '</span>';
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
    status: { sale: { th: "ขาย", en: "For Sale", zh: "出售" }, rent: { th: "เช่า", en: "For Rent", zh: "出租" } },
    type: {
      villa: { th: "วิลล่า", en: "Villa", zh: "别墅" },
      condo: { th: "คอนโด", en: "Condo", zh: "公寓" },
      house: { th: "บ้าน", en: "House", zh: "住宅" }
    },
    furnished: {
      full: { th: "ครบครัน", en: "Fully furnished", zh: "家具齐全" },
      partial: { th: "บางส่วน", en: "Partly furnished", zh: "部分家具" },
      unfurnished: { th: "ไม่มีเฟอร์นิเจอร์", en: "Unfurnished", zh: "无家具" }
    },
    ownership: {
      "freehold": { th: "กรรมสิทธิ์สมบูรณ์", en: "Freehold", zh: "永久产权" },
      "leasehold": { th: "สิทธิการเช่าระยะยาว", en: "Leasehold", zh: "长期租赁权" },
      "foreign-quota": { th: "โควตาต่างชาติ (ถือครองได้)", en: "Foreign freehold quota", zh: "外国人产权配额" },
      "thai-company": { th: "ถือครองผ่านนิติบุคคล", en: "Thai company structure", zh: "泰国公司持有" },
      "rental": { th: "สำหรับเช่า", en: "Rental only", zh: "仅供出租" }
    }
  };
  function labelBi(group, key) {
    var g = LABELS[group] || {};
    return g[key] || { th: key || "-", en: key || "-", zh: key || "-" };
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
    a.dataset.price = (String(item.price_en || "").match(/[\d,]+/) || ["0"])[0].replace(/,/g, "");

    var st = labelBi("status", item.status);
    var ty = labelBi("type", item.type);

    a.innerHTML =
      '<div class="prop-img">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.title_en) + '" loading="lazy">' +
        '<span class="tag tag-' + esc(item.status) + '">' + bi(st.th, st.en, st.zh) + '</span>' +
      '</div>' +
      '<div class="prop-body">' +
        '<div class="prop-top">' +
          '<div class="prop-price">' + bi(item.price_th, item.price_en, item.price_en) + '</div>' +
          '<span class="prop-code">' + esc(item.code || "") + '</span>' +
        '</div>' +
        '<h4>' + bi(item.title_th, item.title_en, item.title_zh || item.title_en) + '</h4>' +
        '<div class="loc">' +
          '<svg viewBox="0 0 24 24" class="pin"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' +
          bi(item.location_th, item.location_en, item.location_zh || item.location_en) + ' · ' + bi(ty.th, ty.en, ty.zh) +
        '</div>' +
        '<div class="prop-specs">' +
          '<span><b>' + esc(item.beds) + '</b> ' + bi("นอน", "bed", "室") + '</span>' +
          '<span><b>' + esc(item.baths) + '</b> ' + bi("น้ำ", "bath", "卫") + '</span>' +
          '<span><b>' + esc(item.sqm) + '</b> ' + bi("ตร.ม.", "m²", "㎡") + '</span>' +
        '</div>' +
        '<div class="prop-view">' + bi("ดูรายละเอียด", "View details", "查看详情") + ' →</div>' +
      '</div>';
    return a;
  }

  function initPropertyFilters() {
    var cards = Array.prototype.slice.call(propGrid.querySelectorAll(".prop-card"));
    var originalOrder = cards.slice();
    var fStatus = document.getElementById("fStatus");
    var fType = document.getElementById("fType");
    var fLocation = document.getElementById("fLocation");
    var fBeds = document.getElementById("fBeds");
    var fTier = document.getElementById("fTier");
    var fSort = document.getElementById("fSort");
    var fKeyword = document.getElementById("fKeyword");
    var fReset = document.getElementById("fReset");
    var propCount = document.getElementById("propCount");
    var propEmpty = document.getElementById("propEmpty");
    if (!fStatus) return;

    function applySort() {
      var v = fSort ? fSort.value : "default";
      var order = originalOrder;
      if (v === "price-asc" || v === "price-desc") {
        order = cards.slice().sort(function (a, b) {
          var pa = parseInt(a.dataset.price, 10) || 0, pb = parseInt(b.dataset.price, 10) || 0;
          return v === "price-asc" ? pa - pb : pb - pa;
        });
      }
      order.forEach(function (c) { propGrid.appendChild(c); });
    }

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
        '<span class="lang-en">Showing ' + visible + " of " + cards.length + " listings</span>" +
        '<span class="lang-zh">显示 ' + visible + " / " + cards.length + " 套房源</span>";
      propEmpty.hidden = visible !== 0;
      propGrid.style.display = visible === 0 ? "none" : "";
    }

    [fStatus, fType, fLocation, fBeds, fTier].forEach(function (sel) {
      sel.addEventListener("change", applyFilters);
    });
    if (fSort) fSort.addEventListener("change", function () { applySort(); applyFilters(); });
    fKeyword.addEventListener("input", applyFilters);
    fReset.addEventListener("click", function () {
      fStatus.value = "all";
      fType.value = "all";
      fLocation.value = "all";
      fBeds.value = "0";
      fTier.value = "all";
      if (fSort) fSort.value = "default";
      fKeyword.value = "";
      applySort();
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
            '<div class="pd-missing">' + bi("ไม่พบทรัพย์ที่คุณเลือก", "Property not found", "未找到该房源") +
            ' — <a href="properties.html">' + bi("ดูอสังหาฯ ทั้งหมด", "browse all properties", "查看全部房源") + '</a></div>';
          return;
        }
        renderPropertyDetail(item);
        renderSimilar(item, listings);
        setLang(currentLang());
      })
      .catch(function (err) { console.error("Failed to load property", err); });
  }

  function renderPropertyDetail(item) {
    var cl = currentLang();
    document.title = (cl === "zh" ? (item.title_zh || item.title_en) : cl === "en" ? item.title_en : item.title_th) + " — Siam Elite Consulting";
    injectListingSchema(item);
    var st = labelBi("status", item.status);
    var ty = labelBi("type", item.type);
    var fu = labelBi("furnished", item.furnished);
    var ow = labelBi("ownership", item.ownership);
    var gallery = (item.gallery && item.gallery.length ? item.gallery : [item.image]);

    // breadcrumb
    var crumb = document.getElementById("pdCrumb");
    if (crumb) crumb.innerHTML = bi(item.title_th, item.title_en, item.title_zh || item.title_en);

    // gallery
    var thumbs = gallery.map(function (src, i) {
      return '<button class="pd-thumb' + (i === 0 ? " on" : "") + '" data-src="' + esc(src) + '" aria-label="photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
    }).join("");

    // spec tiles
    function tile(icon, val, th, en, zh) {
      return '<div class="pd-spec"><span class="pd-spec-ic">' + icon + '</span><b>' + esc(val) + '</b><span class="pd-lbl">' + bi(th, en, zh) + '</span></div>';
    }
    function tileBi(icon, valTh, valEn, th, en, zh, valZh) {
      return '<div class="pd-spec"><span class="pd-spec-ic">' + icon + '</span><b class="pd-spec-bi">' + bi(valTh, valEn, valZh == null ? valEn : valZh) + '</b><span class="pd-lbl">' + bi(th, en, zh) + '</span></div>';
    }
    var specs = "";
    specs += tile(svic("bed"), item.beds, "ห้องนอน", "Bedrooms", "卧室");
    specs += tile(svic("bath"), item.baths, "ห้องน้ำ", "Bathrooms", "卫浴");
    specs += tileBi(svic("area"), item.sqm + " ตร.ม.", item.sqm + " m²", "พื้นที่ใช้สอย", "Interior", "使用面积", item.sqm + " ㎡");
    if (item.land_sqm) specs += tileBi(svic("land"), item.land_sqm + " ตร.ม.", item.land_sqm + " m²", "ที่ดิน", "Land", "土地面积", item.land_sqm + " ㎡");
    if (item.floor) specs += tile(svic("floor"), item.floor, "ชั้น", "Floor", "楼层");
    specs += tile(svic("parking"), item.parking, "ที่จอดรถ", "Parking", "停车位");
    specs += tileBi(svic("sofa"), fu.th, fu.en, "เฟอร์นิเจอร์", "Furnishing", "家具", fu.zh);

    var features = (item.features || []).map(function (f) {
      return '<li>' + svic("check", "sm") + '<span>' + bi(f.th, f.en, f.zh || f.en) + '</span></li>';
    }).join("");

    // ownership advisory (consulting differentiator)
    var notes = {
      "foreign-quota": { th: "คอนโดนี้อยู่ในโควตาต่างชาติ ชาวต่างชาติสามารถถือครองกรรมสิทธิ์ได้เต็มรูปแบบตามกฎหมาย — เราช่วยตรวจสอบเอกสารและดำเนินการโอนให้ถูกต้อง", en: "This unit sits within the foreign ownership quota, so foreigners may hold full freehold title. We verify the paperwork and handle the transfer correctly.", zh: "该单位属于外国人产权配额，外国人可依法拥有完整永久产权。我们协助核查文件并办理合法过户手续。" },
      "leasehold": { th: "ตามกฎหมายไทย ชาวต่างชาติถือครองที่ดินในนามตนเองไม่ได้ ทรัพย์นี้เสนอในรูปแบบสิทธิการเช่าระยะยาว (ปกติ 30 ปี ต่ออายุได้) — เราให้คำปรึกษาโครงสร้างที่ปลอดภัยและถูกกฎหมาย", en: "Under Thai law foreigners cannot own land in their own name. This property is offered on a long leasehold (typically 30 years, renewable). We advise on a safe, fully legal structure.", zh: "根据泰国法律，外国人不能以个人名义持有土地。本房产以长期租赁权形式提供（通常30年，可续期）——我们为您提供安全合法的持有方案咨询。" },
      "thai-company": { th: "ทรัพย์นี้ถือครองผ่านโครงสร้างนิติบุคคลไทย — เราช่วยตรวจสอบและวางโครงสร้างให้ถูกต้องตามกฎหมาย พร้อมทนายความประจำ", en: "Held through a Thai company structure. We review and set this up correctly and legally, with our in-house legal partners.", zh: "本房产通过泰国公司架构持有——我们协助核查并合法搭建架构，配备专属律师。" },
      "rental": { th: "สอบถามเงื่อนไขการเช่า ระยะสัญญา และเงินประกันได้กับทีมงาน เราช่วยตรวจสัญญาเช่าให้เป็นธรรมก่อนเซ็น", en: "Ask our team about lease terms, contract length and deposits. We review the tenancy agreement to keep it fair before you sign.", zh: "欢迎向我们咨询租赁条件、合约期限与押金。签约前我们会协助审核租约，确保条款公平。" }
    };
    var note = notes[item.ownership];
    var noteHtml = note ? '<div class="pd-note"><span class="pd-note-ic">' + svic("shield", "lg") + '</span><div><b>' + bi("การถือครองสำหรับชาวต่างชาติ", "Ownership for foreigners", "外国人产权说明") + '</b><p>' + bi(note.th, note.en, note.zh) + '</p></div></div>' : "";

    // WhatsApp deep link with property context
    var waText = encodeURIComponent("สนใจทรัพย์ " + item.code + " — " + item.title_th + " (" + item.price_th + ")");

    propDetail.innerHTML =
      '<div class="pd-gallery reveal in">' +
        '<div class="pd-main"><img id="pdMain" src="' + esc(gallery[0]) + '" alt="' + esc(item.title_en) + '"></div>' +
        '<div class="pd-thumbs">' + thumbs + '</div>' +
      '</div>' +
      '<div class="pd-layout">' +
        '<div class="pd-info">' +
          '<div class="pd-badges"><span class="tag tag-' + esc(item.status) + '">' + bi(st.th, st.en, st.zh) + '</span><span class="pd-type">' + bi(ty.th, ty.en, ty.zh) + '</span></div>' +
          '<h1>' + bi(item.title_th, item.title_en, item.title_zh || item.title_en) + '</h1>' +
          '<div class="pd-loc"><svg viewBox="0 0 24 24" class="pin"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' + bi(item.location_th, item.location_en, item.location_zh || item.location_en) + ' · ' + esc(item.code) + '</div>' +
          '<div class="pd-specs">' + specs + '</div>' +
          '<div class="pd-section"><h3>' + bi("รายละเอียด", "Description", "详情") + '</h3><p>' + bi(item.desc_th, item.desc_en, item.desc_zh || item.desc_en) + '</p></div>' +
          (features ? '<div class="pd-section"><h3>' + bi("จุดเด่นของทรัพย์", "Property highlights", "房产亮点") + '</h3><ul class="pd-features">' + features + '</ul></div>' : "") +
          noteHtml +
          '<p class="pd-disclaimer">' + bi("* ที่อยู่และพิกัดที่แน่นอนเปิดเผยเฉพาะผู้สนใจจริงหลังติดต่อทีมงาน", "* Exact address and location shared with serious enquiries after you contact our team.", "* 确切地址与位置将在您联系团队后向诚意客户提供。") + '</p>' +
        '</div>' +
        '<aside class="pd-enquire">' +
          '<div class="pd-e-price">' + bi(item.price_th, item.price_en, item.price_en) + '</div>' +
          '<div class="pd-e-own">' + bi(ow.th, ow.en, ow.zh) + '</div>' +
          '<p>' + bi("สนใจทรัพย์นี้? ทีมงานพร้อมพาชมและให้คำปรึกษาฟรี ตอบกลับใน 30 นาที", "Interested? Our team arranges viewings and free advice — reply within 30 minutes.", "对此房产感兴趣？我们的团队安排看房并提供免费咨询——30分钟内回复。") + '</p>' +
          '<a class="btn btn-gold" href="#contact" data-enquire>' + bi("ส่งความสนใจ", "Submit interest", "提交意向") + '</a>' +
          '<a class="btn btn-outline" href="https://wa.me/66947755746?text=' + waText + '" target="_blank" rel="noopener">' + bi("แชท WhatsApp", "Chat on WhatsApp", "WhatsApp 咨询") + '</a>' +
          '<div class="pd-e-meta">' + bi("รหัสทรัพย์", "Ref", "房源编号") + ': ' + esc(item.code) + '</div>' +
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
      var titleForLang = cl === "zh" ? (item.title_zh || item.title_en) : cl === "en" ? item.title_en : item.title_th;
      refSlot.innerHTML = bi("สนใจทรัพย์: ", "Enquiring about: ", "咨询房源：") + "<b>" + esc(item.code) + " · " + esc(titleForLang) + "</b>";
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

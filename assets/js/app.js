/* ===========================================================
   Siam Elite Consulting — interactions
   Language toggle · mobile nav · floating widget ·
   multi-step lead form · scroll reveal
   =========================================================== */
(function () {
  "use strict";

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
      var payload = {
        service: data.service,
        budget: data.budget,
        name: fd.get("name"),
        contact: fd.get("contact"),
        channel: fd.get("channel")
      };
      if (!payload.name || !payload.contact) return;

      /* TODO: wire to your backend / n8n webhook / ClickUp.
         Example:
         fetch("https://YOUR-N8N-WEBHOOK", {
           method:"POST",
           headers:{"Content-Type":"application/json"},
           body: JSON.stringify(payload)
         });
      */
      console.log("New Siam Elite lead →", payload);

      form.style.display = "none";
      var ok = document.getElementById("formSuccess");
      if (ok) ok.classList.add("show");
    });
  }

  /* ---------- Property listings — data-driven from assets/data/properties.json
     (edit that file directly, or via the /admin CMS, to add/change listings) ---------- */
  var propGrid = document.getElementById("propGrid");
  if (propGrid) {
    var scope = propGrid.dataset.scope || "all";
    var ctaTh = propGrid.dataset.ctaTh || "ดูรายละเอียด";
    var ctaEn = propGrid.dataset.ctaEn || "View details";

    fetch("assets/data/properties.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var listings = data.listings || [];
        if (scope === "featured") {
          listings = listings.filter(function (item) { return item.featured; });
        }
        listings.forEach(function (item) {
          propGrid.appendChild(renderPropertyCard(item, ctaTh, ctaEn));
        });
        initPropertyFilters();
      })
      .catch(function (err) {
        console.error("Failed to load assets/data/properties.json", err);
      });
  }

  function renderPropertyCard(item, ctaTh, ctaEn) {
    var article = document.createElement("article");
    article.className = "prop-card";
    article.dataset.status = item.status;
    article.dataset.type = item.type;
    article.dataset.location = item.location;
    article.dataset.beds = item.beds;
    article.dataset.tier = item.tier;

    var statusThaiLabel = item.status === "sale" ? "ขาย" : "เช่า";
    var statusEnLabel = item.status === "sale" ? "For Sale" : "For Rent";

    article.innerHTML =
      '<div class="prop-img">' +
        '<img src="' + item.image + '" alt="' + item.title_en + '" loading="lazy">' +
        '<span class="tag"><span class="lang-th">' + statusThaiLabel + '</span><span class="lang-en">' + statusEnLabel + '</span></span>' +
        '<span class="price"><span class="lang-th">' + item.price_th + '</span><span class="lang-en">' + item.price_en + '</span></span>' +
      '</div>' +
      '<div class="prop-body">' +
        '<h4><span class="lang-th">' + item.title_th + '</span><span class="lang-en">' + item.title_en + '</span></h4>' +
        '<div class="loc">📍 <span class="lang-th">' + item.location_th + '</span><span class="lang-en">' + item.location_en + '</span></div>' +
        '<div class="prop-specs"><span>🛏 ' + item.beds + '</span><span>🛁 ' + item.baths + '</span><span>📐 ' + item.sqm + ' m²</span></div>' +
        '<a href="#contact" class="link-gold prop-cta"><span class="lang-th">' + ctaTh + '</span><span class="lang-en">' + ctaEn + '</span> →</a>' +
      '</div>';
    return article;
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

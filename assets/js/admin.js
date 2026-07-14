/* ============================================================
   Siam Elite — Back-office logic
   Talks to Supabase (auth + database + storage) directly from
   the browser. Security is enforced server-side by Row Level
   Security: the anon key can only read published listings and
   insert leads; everything else requires a logged-in staff user.
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://loanbvamjfdlmyhstaby.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_woZnz99Lnciyotx1wl2rUQ_qAYoD9Kl";
  var IMG_BUCKET = "property-images";
  var DOC_BUCKET = "documents";

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ---------- tiny helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) +
      " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtSize(b) {
    if (b == null) return "";
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(0) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (isErr ? " err" : "");
    show(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { hide(t); }, 3200);
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true; }
    else { btn.innerHTML = btn.dataset.label || label || "บันทึก"; btn.disabled = false; }
  }

  // ---------- auth ----------
  var loginView = $("loginView"), appView = $("appView");
  var currentUserId = null;

  function renderSession(session) {
    if (session && session.user) {
      currentUserId = session.user.id;
      hide(loginView); show(appView);
      $("userEmail").textContent = session.user.email || "";
      loadAll();
    } else {
      hide(appView); show(loginView);
    }
  }

  sb.auth.getSession().then(function (res) { renderSession(res.data.session); });
  sb.auth.onAuthStateChange(function (_e, session) { renderSession(session); });

  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("loginBtn"); hide($("loginError"));
    busy(btn, true);
    sb.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value
    }).then(function (res) {
      busy(btn, false, "เข้าสู่ระบบ");
      if (res.error) {
        var msg = res.error.message || "เข้าสู่ระบบไม่สำเร็จ";
        if (/invalid login/i.test(msg)) msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        $("loginError").textContent = msg; show($("loginError"));
      }
    });
  });

  $("logoutBtn").addEventListener("click", function () { sb.auth.signOut(); });

  // ---------- tabs ----------
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("is-active"); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
      tab.classList.add("is-active");
      $("tab-" + tab.dataset.tab).classList.add("is-active");
    });
  });

  // ---------- modal helpers ----------
  function openModal(id) { show($(id)); }
  function closeModal(id) { hide($(id)); }
  document.querySelectorAll("[data-close-modal]").forEach(function (b) {
    b.addEventListener("click", function () { closeModal(b.dataset.closeModal); });
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) hide(m); });
  });

  function loadAll() { loadProperties(); loadLeads(); loadDocuments(); }

  /* ============================================================
     PROPERTIES
     ============================================================ */
  var propsCache = [];

  function loadProperties() {
    sb.from("properties").select("*").order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) { toast("โหลดสินทรัพย์ไม่สำเร็จ: " + res.error.message, true); return; }
        propsCache = res.data || [];
        $("propCount").textContent = propsCache.length;
        renderProps();
        fillDocPropertySelect();
      });
  }

  function renderProps() {
    var q = ($("propSearch").value || "").toLowerCase();
    var rows = propsCache.filter(function (p) {
      if (!q) return true;
      return [p.code, p.title_th, p.title_en, p.location_th, p.location_en]
        .join(" ").toLowerCase().indexOf(q) !== -1;
    });
    var body = $("propBody"); body.innerHTML = "";
    $("propEmpty").hidden = rows.length !== 0;
    rows.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><img class="thumb" src="' + esc(p.image || "") + '" alt="" onerror="this.style.visibility=\'hidden\'"></td>' +
        '<td class="mono">' + esc(p.code) + '</td>' +
        '<td>' + esc(p.title_th || p.title_en || "—") + '</td>' +
        '<td>' + esc(p.location_th || p.location || "—") + '</td>' +
        '<td>' + esc(p.type || "") + '</td>' +
        '<td>' + esc(p.price_th || p.price_en || "—") + '</td>' +
        '<td>' + statusChips(p) + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn btn-ghost btn-sm" data-edit="' + esc(p.id) + '">แก้ไข</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + esc(p.id) + '">ลบ</button>' +
        '</td>';
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openPropEditor(b.dataset.edit); });
    });
    body.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { deleteProp(b.dataset.del); });
    });
  }
  function statusChips(p) {
    var s = p.status === "sale"
      ? '<span class="chip chip-sale">ขาย</span>'
      : '<span class="chip chip-rent">เช่า</span>';
    if (!p.published) s += ' <span class="chip chip-off">ซ่อน</span>';
    return s;
  }

  $("propSearch").addEventListener("input", renderProps);

  // ---- property editor ----
  var galleryState = []; // array of image URLs (order = display order)

  function openPropEditor(id) {
    var p = id ? propsCache.filter(function (x) { return x.id === id; })[0] : null;
    $("propModalTitle").textContent = p ? "แก้ไขสินทรัพย์" : "เพิ่มสินทรัพย์";
    hide($("propFormError"));
    $("pf_id").value = p ? p.id : "";
    var f = {
      pf_code: "code", pf_sort_order: "sort_order", pf_status: "status", pf_type: "type",
      pf_tier: "tier", pf_location: "location", pf_title_th: "title_th", pf_title_en: "title_en",
      pf_title_zh: "title_zh", pf_location_th: "location_th", pf_location_en: "location_en",
      pf_location_zh: "location_zh", pf_desc_th: "desc_th", pf_desc_en: "desc_en", pf_desc_zh: "desc_zh",
      pf_beds: "beds", pf_baths: "baths", pf_sqm: "sqm", pf_land_sqm: "land_sqm",
      pf_parking: "parking", pf_floor: "floor", pf_furnished: "furnished", pf_ownership: "ownership",
      pf_price_th: "price_th", pf_price_en: "price_en"
    };
    Object.keys(f).forEach(function (el) {
      var v = p ? p[f[el]] : "";
      $(el).value = (v == null ? "" : v);
    });
    $("pf_sort_order").value = p ? p.sort_order : (propsCache.length);
    $("pf_featured").checked = p ? !!p.featured : false;
    $("pf_published").checked = p ? !!p.published : true;
    // features -> "th | en | zh" lines
    var feats = (p && p.features) || [];
    $("pf_features").value = feats.map(function (x) {
      return [x.th || "", x.en || "", x.zh || ""].join(" | ");
    }).join("\n");
    // gallery
    galleryState = (p && p.gallery && p.gallery.length) ? p.gallery.slice() : (p && p.image ? [p.image] : []);
    renderGallery();
    openModal("propModal");
  }

  $("addPropBtn").addEventListener("click", function () { openPropEditor(null); });

  function renderGallery() {
    var box = $("pf_gallery"); box.innerHTML = "";
    galleryState.forEach(function (url, i) {
      var d = document.createElement("div");
      d.className = "gallery-item" + (i === 0 ? " cover" : "");
      d.draggable = true;
      d.dataset.i = i;
      d.innerHTML = '<img src="' + esc(url) + '" alt="">' +
        '<button type="button" class="del" title="ลบ">&times;</button>';
      d.querySelector(".del").addEventListener("click", function (e) {
        e.stopPropagation();
        galleryState.splice(i, 1); renderGallery();
      });
      addDragHandlers(d);
      box.appendChild(d);
    });
  }
  var dragFrom = null;
  function addDragHandlers(el) {
    el.addEventListener("dragstart", function () { dragFrom = +el.dataset.i; el.classList.add("dragging"); });
    el.addEventListener("dragend", function () { el.classList.remove("dragging"); });
    el.addEventListener("dragover", function (e) { e.preventDefault(); });
    el.addEventListener("drop", function (e) {
      e.preventDefault();
      var to = +el.dataset.i;
      if (dragFrom === null || dragFrom === to) return;
      var moved = galleryState.splice(dragFrom, 1)[0];
      galleryState.splice(to, 0, moved);
      dragFrom = null; renderGallery();
    });
  }

  $("pf_imageUpload").addEventListener("change", function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    if (!files.length) return;
    var code = ($("pf_code").value || "prop").trim().replace(/[^a-zA-Z0-9_-]/g, "") || "prop";
    toast("กำลังอัปโหลด " + files.length + " รูป…");
    var uploads = files.map(function (file) {
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      var path = code + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      return sb.storage.from(IMG_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false })
        .then(function (r) {
          if (r.error) throw r.error;
          return sb.storage.from(IMG_BUCKET).getPublicUrl(path).data.publicUrl;
        });
    });
    Promise.all(uploads).then(function (urls) {
      galleryState = galleryState.concat(urls);
      renderGallery();
      toast("อัปโหลดรูปสำเร็จ");
    }).catch(function (err) {
      toast("อัปโหลดรูปไม่สำเร็จ: " + (err.message || err), true);
    });
    e.target.value = "";
  });

  function parseFeatures(text) {
    return (text || "").split("\n").map(function (line) {
      var parts = line.split("|").map(function (s) { return s.trim(); });
      if (!parts[0] && !parts[1] && !parts[2]) return null;
      return { th: parts[0] || "", en: parts[1] || "", zh: parts[2] || "" };
    }).filter(Boolean);
  }
  function numOrNull(id) {
    var v = $(id).value.trim();
    return v === "" ? null : Number(v);
  }

  $("propForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("savePropBtn"); hide($("propFormError"));
    var code = $("pf_code").value.trim();
    if (!code) { $("propFormError").textContent = "ต้องมี Code"; show($("propFormError")); return; }
    var payload = {
      code: code,
      published: $("pf_published").checked,
      featured: $("pf_featured").checked,
      status: $("pf_status").value,
      type: $("pf_type").value,
      tier: $("pf_tier").value,
      location: $("pf_location").value.trim(),
      location_th: $("pf_location_th").value.trim(),
      location_en: $("pf_location_en").value.trim(),
      location_zh: $("pf_location_zh").value.trim(),
      title_th: $("pf_title_th").value.trim(),
      title_en: $("pf_title_en").value.trim(),
      title_zh: $("pf_title_zh").value.trim(),
      desc_th: $("pf_desc_th").value.trim(),
      desc_en: $("pf_desc_en").value.trim(),
      desc_zh: $("pf_desc_zh").value.trim(),
      beds: numOrNull("pf_beds"), baths: numOrNull("pf_baths"), sqm: numOrNull("pf_sqm"),
      land_sqm: numOrNull("pf_land_sqm"), parking: numOrNull("pf_parking"), floor: numOrNull("pf_floor"),
      furnished: $("pf_furnished").value, ownership: $("pf_ownership").value.trim(),
      price_th: $("pf_price_th").value.trim(), price_en: $("pf_price_en").value.trim(),
      sort_order: numOrNull("pf_sort_order") || 0,
      image: galleryState[0] || null,
      gallery: galleryState,
      features: parseFeatures($("pf_features").value)
    };
    busy(btn, true);
    var id = $("pf_id").value;
    var op = id
      ? sb.from("properties").update(payload).eq("id", id)
      : sb.from("properties").insert(payload);
    op.then(function (res) {
      busy(btn, false, "บันทึก");
      if (res.error) {
        var m = res.error.message || "บันทึกไม่สำเร็จ";
        if (/duplicate key/i.test(m)) m = "Code นี้มีอยู่แล้ว ใช้ code อื่น";
        $("propFormError").textContent = m; show($("propFormError")); return;
      }
      closeModal("propModal");
      toast(id ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสินทรัพย์แล้ว");
      loadProperties();
    });
  });

  function deleteProp(id) {
    var p = propsCache.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (!window.confirm('ลบ "' + (p.title_th || p.code) + '" ?\nการลบนี้ย้อนกลับไม่ได้')) return;
    sb.from("properties").delete().eq("id", id).then(function (res) {
      if (res.error) { toast("ลบไม่สำเร็จ: " + res.error.message, true); return; }
      toast("ลบสินทรัพย์แล้ว"); loadProperties();
    });
  }

  /* ============================================================
     LEADS
     ============================================================ */
  var leadsCache = [];

  function loadLeads() {
    sb.from("leads").select("*").order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) { toast("โหลด leads ไม่สำเร็จ: " + res.error.message, true); return; }
        leadsCache = res.data || [];
        $("leadCount").textContent = leadsCache.length;
        renderLeads();
      });
  }
  function renderLeads() {
    var filter = $("leadFilter").value;
    var rows = leadsCache.filter(function (l) { return !filter || (l.status || "new") === filter; });
    var body = $("leadBody"); body.innerHTML = "";
    $("leadEmpty").hidden = rows.length !== 0;
    rows.forEach(function (l) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' + esc(fmtDate(l.created_at)) + '</td>' +
        '<td>' + esc(l.name || "") + '</td>' +
        '<td>' + esc(l.contact || "") + '</td>' +
        '<td>' + esc(l.service || "") + '</td>' +
        '<td>' + esc(l.budget || "") + '</td>' +
        '<td>' + esc(l.channel || "") + '</td>' +
        '<td>' + esc(l.source_page || "") + '</td>' +
        '<td>' + leadStatusSelect(l) + '</td>' +
        '<td>' + leadNoteInput(l) + '</td>';
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-lead-status]").forEach(function (sel) {
      sel.addEventListener("change", function () { updateLead(sel.dataset.leadStatus, { status: sel.value }); });
    });
    body.querySelectorAll("[data-lead-note]").forEach(function (inp) {
      inp.addEventListener("change", function () { updateLead(inp.dataset.leadNote, { staff_note: inp.value }); });
    });
  }
  function leadStatusSelect(l) {
    var cur = l.status || "new";
    var opts = [["new", "ใหม่"], ["contacted", "ติดต่อแล้ว"], ["won", "ปิดการขาย"], ["lost", "ไม่สำเร็จ"]];
    return '<select class="lead-status" data-lead-status="' + esc(l.id) + '">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === cur ? " selected" : "") + '>' + o[1] + '</option>';
      }).join("") + '</select>';
  }
  function leadNoteInput(l) {
    return '<input class="lead-note" data-lead-note="' + esc(l.id) + '" value="' + esc(l.staff_note || "") + '" placeholder="เพิ่มโน้ต…">';
  }
  function updateLead(id, patch) {
    sb.from("leads").update(patch).eq("id", id).then(function (res) {
      if (res.error) { toast("อัปเดตไม่สำเร็จ: " + res.error.message, true); return; }
      toast("อัปเดตแล้ว");
      var l = leadsCache.filter(function (x) { return x.id === id; })[0];
      if (l) Object.assign(l, patch);
    });
  }
  $("leadFilter").addEventListener("change", renderLeads);

  /* ============================================================
     DOCUMENTS
     ============================================================ */
  var docsCache = [];

  function loadDocuments() {
    sb.from("documents").select("*").order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) { toast("โหลดเอกสารไม่สำเร็จ: " + res.error.message, true); return; }
        docsCache = res.data || [];
        $("docCount").textContent = docsCache.length;
        renderDocs();
      });
  }
  function renderDocs() {
    var body = $("docBody"); body.innerHTML = "";
    $("docEmpty").hidden = docsCache.length !== 0;
    var catLabel = { contract: "สัญญา", brochure: "โบรชัวร์", visa: "วีซ่า", id: "บัตร/พาสปอร์ต", other: "อื่นๆ" };
    docsCache.forEach(function (d) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' + esc(fmtDate(d.created_at)) + '</td>' +
        '<td>' + esc(d.title) + '</td>' +
        '<td>' + esc(catLabel[d.category] || d.category || "") + '</td>' +
        '<td class="mono">' + esc(d.property_code || "—") + '</td>' +
        '<td>' + esc(fmtSize(d.file_size)) + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn btn-ghost btn-sm" data-dl="' + esc(d.id) + '">ดาวน์โหลด</button>' +
          '<button class="btn btn-danger btn-sm" data-deldoc="' + esc(d.id) + '">ลบ</button>' +
        '</td>';
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-dl]").forEach(function (b) {
      b.addEventListener("click", function () { downloadDoc(b.dataset.dl); });
    });
    body.querySelectorAll("[data-deldoc]").forEach(function (b) {
      b.addEventListener("click", function () { deleteDoc(b.dataset.deldoc); });
    });
  }
  function fillDocPropertySelect() {
    var sel = $("df_property");
    var cur = sel.value;
    sel.innerHTML = '<option value="">— ไม่ผูก —</option>' +
      propsCache.map(function (p) {
        return '<option value="' + esc(p.code) + '">' + esc(p.code + " · " + (p.title_th || p.title_en || "")) + '</option>';
      }).join("");
    sel.value = cur;
  }

  $("addDocBtn").addEventListener("click", function () {
    $("docForm").reset(); hide($("docFormError")); openModal("docModal");
  });

  $("docForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("saveDocBtn"); hide($("docFormError"));
    var file = $("df_file").files[0];
    if (!file) { $("docFormError").textContent = "เลือกไฟล์ก่อน"; show($("docFormError")); return; }
    busy(btn, true);
    var safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    var path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + safe;
    sb.storage.from(DOC_BUCKET).upload(path, file, { upsert: false })
      .then(function (r) {
        if (r.error) throw r.error;
        return sb.from("documents").insert({
          title: $("df_title").value.trim(),
          category: $("df_category").value,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          property_code: $("df_property").value || null,
          note: $("df_note").value.trim() || null,
          uploaded_by: currentUserId
        });
      })
      .then(function (res) {
        busy(btn, false, "อัปโหลด");
        if (res.error) throw res.error;
        closeModal("docModal"); toast("อัปโหลดเอกสารแล้ว"); loadDocuments();
      })
      .catch(function (err) {
        busy(btn, false, "อัปโหลด");
        $("docFormError").textContent = "อัปโหลดไม่สำเร็จ: " + (err.message || err); show($("docFormError"));
      });
  });

  function downloadDoc(id) {
    var d = docsCache.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    // private bucket → create a short-lived signed URL
    sb.storage.from(DOC_BUCKET).createSignedUrl(d.file_path, 120)
      .then(function (r) {
        if (r.error) { toast("เปิดไฟล์ไม่สำเร็จ: " + r.error.message, true); return; }
        window.open(r.data.signedUrl, "_blank");
      });
  }
  function deleteDoc(id) {
    var d = docsCache.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    if (!window.confirm('ลบเอกสาร "' + d.title + '" ?')) return;
    sb.storage.from(DOC_BUCKET).remove([d.file_path]).then(function () {
      return sb.from("documents").delete().eq("id", id);
    }).then(function (res) {
      if (res.error) { toast("ลบไม่สำเร็จ: " + res.error.message, true); return; }
      toast("ลบเอกสารแล้ว"); loadDocuments();
    });
  }

})();

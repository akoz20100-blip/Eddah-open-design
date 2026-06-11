/* PSMMC — Pharmacy Stock & Reorder Analytics
   Client-side only. Medicines only = NUPCO code starts with "5". Bilingual AR/EN.
   Visual identity matched to the reference card set (soft cards, tinted tiles,
   capsule dock, glossy pink orb). All chart series come from the real files. */
(function () {
  "use strict";

  // ---------- constants ----------
  var DAYS_PER_MONTH = 30.44;
  var STATUS_OK = { DISPATCHED: 1, APPROVED: 1 };
  var REORDER_MONTHS = 6, WATCH_MONTHS = 7, ORDER_COVER_MONTHS = 9;
  var SNAP_KEY = "psmmc_snapshots_v1", LANG_KEY = "psmmc_lang", BASE_KEY = "psmmc_baseline_v1", MAP_KEY = "psmmc_idmap_v1";

  // ---------- i18n ----------
  var T = {
    en: {
      app_title: "Pharmacy Stock & Reorder Analytics",
      app_sub: "Prince Sultan Military Medical City · Medical Services",
      tab_planning: "Planning Department", tab_management: "Management & Budget",
      file_wd: "Withdrawals file", file_wd_hint: "NUPCO outbound · .xlsx",
      file_st: "Stock-on-hand file", file_st_hint: "NUPCO stock · .xls",
      file_mp: "Names & identifiers file", file_mp_hint: "optional · hospital & MSD codes + trade name",
      err_mp: "Could not read the identifiers file (needs a NUPCO column plus trade-name / hospital / MSD columns)",
      mp_linked: "items linked",
      c_trade: "Trade Name", c_hosp: "Hospital Code", c_msd: "MSD Code",
      btn_sample: "Load sample data",
      upl_hint: "Drop both files to compute coverage &amp; reorder. You can select several withdrawals files at once (multiple warehouses); the latest consumption baseline is saved on this device, so later a new stock file alone is enough. Only medicines (NUPCO code starting with <b>5</b>) are included.",
      empty_title: "No data loaded yet",
      empty_text: "Upload the withdrawals and stock-on-hand files, or click Load sample data to preview the dashboard with real numbers.",
      empty_btn: "Load sample data",
      foot: "Built for the PSMMC planning department · every calculation runs locally in your browser — no data leaves this page.",
      search_ph: "Search by code or name — separate items with commas…",
      period: "Period", stock_as_of: "Stock as of", mo: "mo", sorted_by: "Sorted by",
      showing: "Showing", of: "of", items: "items", no_rows: "No rows match this filter.",
      f_all: "All", f_order_now: "Order now", f_no_movement: "No movement", f_not_in_stock: "Not in stock",
      f_all_instock: "All in stock", f_available: "Available", f_outstock: "Out of stock",
      k_order: "Order now",
      k_watch: "Watch", k_nomove: "No movement", k_notstock: "Not in stock",
      k_instock: "Medicines in stock", k_units: "Total available units",
      k_out: "Out of stock", k_reorder: "Need reorder",
      k_value: "Stock value (SAR)", k_value_sub: "add a price list to enable",
      k_withdrawn: "Total withdrawn", monthly_word: "per month",
      k_monthly_title: "Monthly consumption", lg_total: "Total",
      k_median: "Median coverage", of_analysed: "of analysed",
      w_value: "6–7 months", w_sub: "coverage left",
      ns_value: "Zero balance", ns_sub: "withdrawn in period",
      nm_value: "No withdrawals", nm_sub: "during the period",
      out_sub: "listed in stock file",
      re_value: "Coverage ≤ 6", re_sub: "months left",
      mg_avg_item: "avg units per item", meds_word: "medicines",
      chart_nodates: "No valid dates in the file",
      c_code: "Code", c_desc: "Description", c_uom: "UOM", c_total: "Total Withdrawn",
      c_avg: "Monthly Avg", c_trend: "Trend Δ%", c_stock: "Current Stock", c_cov: "Coverage (mo)",
      c_status: "Status", c_qty9: "Qty (9 mo)", c_sug: "Suggested Order",
      c_avail: "Available Stock", c_use: "Monthly Use", c_value: "Stock Value",
      s_order_now: "Order now", s_warning: "Watch", s_ok: "OK", s_no_movement: "No movement", s_not_in_stock: "Not in stock",
      trend_new: "New", prev_avg: "prev avg", per_mo: "/mo",
      sample_wd: "Sample · NUPCO outbound", sample_st: "Sample · NUPCO stock",
      err_wd: "Could not read withdrawals file", err_st: "Could not read stock file", no_sample: "Sample data not available",
      two_files: "2 files", files_word: "files",
      baseline_meta: "saved baseline", baseline_to: "to",
      langName: "English"
    },
    ar: {
      app_title: "تحليلات مخزون الصيدلية وإعادة الطلب",
      app_sub: "مدينة الأمير سلطان الطبية العسكرية · الخدمات الطبية",
      tab_planning: "قسم التخطيط", tab_management: "الإدارة والميزانية",
      file_wd: "ملف السحوبات", file_wd_hint: "صادر نبكو · ‎.xlsx",
      file_st: "ملف المخزون المتاح", file_st_hint: "مخزون نبكو · ‎.xls",
      file_mp: "ملف الأسماء والمعرفات", file_mp_hint: "اختياري · أكواد المستشفى وMSD والاسم التجاري",
      err_mp: "تعذّر قراءة ملف المعرفات (يلزم عمود كود نبكو + أعمدة الاسم التجاري / كود المستشفى / MSD)",
      mp_linked: "صنف مرتبط",
      c_trade: "الاسم التجاري", c_hosp: "كود المستشفى", c_msd: "كود MSD",
      btn_sample: "تحميل بيانات تجريبية",
      upl_hint: "أرفق الملفين لحساب التغطية وإعادة الطلب. يمكن اختيار أكثر من ملف سحوبات معًا (عدة مستودعات)، ويُحفظ آخر متوسط استهلاك على هذا الجهاز ليكفي لاحقًا رفع ملف مخزون جديد وحده. تُحتسب الأدوية فقط (كود نبكو يبدأ بـ <b>5</b>).",
      empty_title: "لا توجد بيانات محمّلة بعد",
      empty_text: "ارفع ملف السحوبات وملف المخزون، أو اضغط «تحميل بيانات تجريبية» لمعاينة اللوحة بأرقام حقيقية.",
      empty_btn: "تحميل بيانات تجريبية",
      foot: "أُعدّت لقسم التخطيط بمدينة الأمير سلطان الطبية العسكرية · جميع الحسابات تتم محليًا في متصفحك — لا تغادر البيانات هذه الصفحة.",
      search_ph: "ابحث بالكود أو الاسم — افصل بين عدة بنود بفاصلة…",
      period: "الفترة", stock_as_of: "المخزون بتاريخ", mo: "شهر", sorted_by: "مرتّب حسب",
      showing: "عرض", of: "من", items: "صنف", no_rows: "لا توجد صفوف مطابقة لهذا الفلتر.",
      f_all: "الكل", f_order_now: "اطلب الآن", f_no_movement: "بدون حركة", f_not_in_stock: "غير متوفر بالمخزون",
      f_all_instock: "كل المخزون", f_available: "متوفر", f_outstock: "نفد",
      k_order: "اطلب الآن",
      k_watch: "للمتابعة", k_nomove: "بدون حركة", k_notstock: "غير متوفر",
      k_instock: "أدوية بالمخزون", k_units: "إجمالي الوحدات المتاحة",
      k_out: "نفد من المخزون", k_reorder: "يحتاج إعادة طلب",
      k_value: "قيمة المخزون (ر.س)", k_value_sub: "أضف قائمة أسعار للتفعيل",
      k_withdrawn: "إجمالي المسحوب", monthly_word: "شهريًا",
      k_monthly_title: "الاستهلاك الشهري", lg_total: "الإجمالي",
      k_median: "وسيط التغطية", of_analysed: "من المحلل",
      w_value: "٦–٧ أشهر", w_sub: "تغطية متبقية",
      ns_value: "رصيد صفر", ns_sub: "مسحوب خلال الفترة",
      nm_value: "بلا سحوبات", nm_sub: "خلال فترة التحليل",
      out_sub: "مدرج في ملف المخزون",
      re_value: "تغطية ≤ ٦", re_sub: "أشهر متبقية",
      mg_avg_item: "متوسط الوحدات للصنف", meds_word: "دواء",
      chart_nodates: "لا توجد تواريخ صالحة في الملف",
      c_code: "الكود", c_desc: "الوصف", c_uom: "الوحدة", c_total: "إجمالي المسحوب",
      c_avg: "المتوسط الشهري", c_trend: "الاتجاه Δ٪", c_stock: "المخزون الحالي", c_cov: "التغطية (شهر)",
      c_status: "الحالة", c_qty9: "كمية ٩ أشهر", c_sug: "الطلب المقترح",
      c_avail: "المخزون المتاح", c_use: "الاستهلاك الشهري", c_value: "قيمة المخزون",
      s_order_now: "اطلب الآن", s_warning: "للمتابعة", s_ok: "جيد", s_no_movement: "بدون حركة", s_not_in_stock: "غير متوفر",
      trend_new: "جديد", prev_avg: "المتوسط السابق", per_mo: "/شهر",
      sample_wd: "تجريبي · صادر نبكو", sample_st: "تجريبي · مخزون نبكو",
      err_wd: "تعذّر قراءة ملف السحوبات", err_st: "تعذّر قراءة ملف المخزون", no_sample: "البيانات التجريبية غير متوفرة",
      two_files: "ملفان", files_word: "ملفات",
      baseline_meta: "متوسط محفوظ", baseline_to: "حتى",
      langName: "عربي"
    }
  };
  var LANG = (function () { try { return localStorage.getItem(LANG_KEY) || "ar"; } catch (e) { return "ar"; } })();
  function t(k) { return (T[LANG] && T[LANG][k]) || T.en[k] || k; }

  // ---------- state ----------
  var STATE = {
    view: "planning", rows: [], monthly: null,
    meta: { period_start: null, period_end: null, actual_months: null, stock_as_of: null, source: null },
    filter: "all", search: "", sort: { key: "cov", dir: "asc" },
    raw: { withdrawals: null, stock: null },
    wdName: null, stName: null // null=hint, "sample", or filename
  };

  // ---------- helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  function normCode(v) { if (v == null || v === "") return null; if (typeof v === "number") return String(Math.round(v)); var s = String(v).trim(); if (/^\d+\.0+$/.test(s)) s = s.split(".")[0]; return s; }
  function isDrug(c) { return c && c.charAt(0) === "5"; }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmt1(n) { return (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function fmtM(n) {
    n = Math.round(n); var a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (a >= 1e4) return Math.round(n / 1e3) + "K";
    if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function median(arr) { if (!arr.length) return null; var s = arr.slice().sort(function (a, b) { return a - b; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function toast(msg) { var el = $("toast"); el.textContent = msg; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, 2800); }
  function norm(s) { return String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " "); }
  function findCol(header, cands) { var hn = header.map(norm); for (var i = 0; i < cands.length; i++) { var idx = hn.indexOf(norm(cands[i])); if (idx !== -1) return idx; } for (var j = 0; j < cands.length; j++) { var cc = norm(cands[j]); for (var k = 0; k < hn.length; k++) if (hn[k].indexOf(cc) !== -1) return k; } return -1; }
  function parseDate(v) { if (v instanceof Date && !isNaN(v)) return v; if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 86400 * 1000)); if (typeof v === "string") { var s = v.trim(), m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]); m = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})/); if (m) return new Date(+m[3], +m[2] - 1, +m[1]); var d = new Date(s); if (!isNaN(d)) return d; } return null; }
  function dateFromFilename(name) { var m = String(name || "").match(/(\d{2})(\d{2})(\d{4})/); if (m) { var d = new Date(+m[3], +m[2] - 1, +m[1]); if (!isNaN(d)) return d; } return null; }
  function isoDate(d) { return d ? d.toISOString().slice(0, 10) : null; }
  function prettyDate(s) { if (!s) return "—"; var d = s instanceof Date ? s : new Date(s); if (isNaN(d)) return String(s); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- workbook ----------
  function readWorkbook(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) { try { var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true }); var ws = wb.Sheets[wb.SheetNames[0]]; cb(null, XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" }), wb); } catch (err) { cb(err); } };
    reader.onerror = function () { cb(reader.error); };
    reader.readAsArrayBuffer(file);
  }

  // ---------- parsers ----------
  function parseWithdrawals(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "Generic Item Number", "Material"]),
      qi = findCol(H, ["Order Qty", "Quantity", "Qty"]),
      di = findCol(H, ["Delivery Date", "Ordered Date", "Date"]),
      si = findCol(H, ["Status"]), ui = findCol(H, ["UOM", "Unit"]),
      de = findCol(H, ["Description", "Item Description", "Generic Item description"]);
    if (ci < 0 || qi < 0) throw new Error("cols");
    var byCode = {}, monthlyByCode = {}, minD = null, maxD = null;
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      if (si >= 0) { var st = String(row[si] || "").trim().toUpperCase(); if (!STATUS_OK[st]) continue; }
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var q = num(row[qi]);
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null, uom: null });
      rec.qty += q;
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
      if (!rec.uom && ui >= 0 && row[ui]) rec.uom = String(row[ui]).trim();
      if (di >= 0) {
        var d = parseDate(row[di]);
        if (d) {
          if (!minD || d < minD) minD = d;
          if (!maxD || d > maxD) maxD = d;
          var ym = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2);
          var mc = monthlyByCode[code] || (monthlyByCode[code] = {});
          mc[ym] = (mc[ym] || 0) + q;
        }
      }
    }
    var months = (minD && maxD) ? Math.max((maxD - minD) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
    return { byCode: byCode, monthlyByCode: monthlyByCode, period_start: isoDate(minD), period_end: isoDate(maxD), actual_months: months };
  }
  /* Merge several parsed withdrawals files (e.g. one per warehouse) into one
     aggregate: quantities and monthly buckets sum per code, the analysis
     period spans the earliest..latest delivery date across all files. */
  function combineWithdrawals(parts) {
    var byCode = {}, monthlyByCode = {}, minS = null, maxE = null;
    parts.forEach(function (p) {
      Object.keys(p.byCode).forEach(function (c) {
        var src = p.byCode[c], dst = byCode[c] || (byCode[c] = { qty: 0, desc: null, uom: null });
        dst.qty += src.qty;
        if (!dst.desc) dst.desc = src.desc;
        if (!dst.uom) dst.uom = src.uom;
      });
      Object.keys(p.monthlyByCode).forEach(function (c) {
        var src = p.monthlyByCode[c], dst = monthlyByCode[c] || (monthlyByCode[c] = {});
        Object.keys(src).forEach(function (ym) { dst[ym] = (dst[ym] || 0) + src[ym]; });
      });
      if (p.period_start && (!minS || p.period_start < minS)) minS = p.period_start;
      if (p.period_end && (!maxE || p.period_end > maxE)) maxE = p.period_end;
    });
    var months = (minS && maxE) ? Math.max((new Date(maxE) - new Date(minS)) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
    return { byCode: byCode, monthlyByCode: monthlyByCode, period_start: minS, period_end: maxE, actual_months: months, files: parts.map(function (p) { return p.name; }) };
  }

  /* The latest uploaded consumption aggregate is kept on this device so a
     future session can upload only a fresh stock file and still get coverage
     against the saved monthly averages. */
  function saveBaseline(wd) {
    try {
      localStorage.setItem(BASE_KEY, JSON.stringify({
        savedAt: new Date().toISOString(), files: wd.files,
        period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months,
        byCode: wd.byCode, monthlyByCode: wd.monthlyByCode
      }));
    } catch (e) {}
  }
  function loadBaseline() {
    try {
      var b = JSON.parse(localStorage.getItem(BASE_KEY));
      return (b && b.byCode && b.actual_months) ? b : null;
    } catch (e) { return null; }
  }

  /* Optional identifiers file: links each NUPCO code to the hospital code,
     the MOD-wide MSD code, and the trade/scientific names, so planners can
     search and read items by any of them. Tolerant header mapping; persisted
     on this device so it only needs to be uploaded once. */
  var MAP = null;
  function parseMapping(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "NUPCO Code", "NUPCO", "Generic Item Number", "Material"]),
      ti = findCol(H, ["Trade Name", "Brand Name", "Brand", "Commercial Name", "Trade"]),
      gi = findCol(H, ["Scientific Name", "Generic Name", "Scientific"]),
      hi = findCol(H, ["Hospital Code", "Hospital Item Number", "Hospital Number", "Local Code", "Hospital"]),
      mi = findCol(H, ["MSD Code", "MSD Number", "MSD"]);
    if (ci < 0 || (ti < 0 && gi < 0 && hi < 0 && mi < 0)) throw new Error("cols");
    var byCode = {}, n = 0;
    function val(row, idx) { if (idx < 0 || row[idx] == null || row[idx] === "") return null; var v = typeof row[idx] === "number" ? normCode(row[idx]) : String(row[idx]).trim(); return v || null; }
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var rec = { trade: val(row, ti), sci: val(row, gi), hosp: val(row, hi), msd: val(row, mi) };
      if (rec.trade || rec.sci || rec.hosp || rec.msd) { byCode[code] = rec; n++; }
    }
    if (!n) throw new Error("empty-map");
    return { byCode: byCode, count: n };
  }
  function saveMap(map) { try { localStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch (e) {} }
  function loadMap() { try { var m = JSON.parse(localStorage.getItem(MAP_KEY)); return m && m.byCode ? m : null; } catch (e) { return null; } }
  function applyMap(rows) {
    var n = 0;
    rows.forEach(function (r) {
      var m = MAP && MAP.byCode[r.code];
      r.trade = (m && m.trade) || null;
      r.sci = (m && m.sci) || null;
      r.hosp = (m && m.hosp) || null;
      r.msd = (m && m.msd) || null;
      r.alt = m ? [m.trade, m.sci, m.hosp, m.msd].filter(Boolean).join(" ") : "";
      if (m) n++;
    });
    return n;
  }

  function parseStock(aoa, filename, wb) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["Generic Item Number", "NUPCO Material", "Material"]),
      ai = findCol(H, ["Total Available Qty", "Available Qty", "Total Available Quantity"]),
      de = findCol(H, ["Generic Item description", "Description", "Item Description"]);
    if (ci < 0) throw new Error("cols");
    if (ai < 0) ai = findCol(H, ["Total Qty", "Quantity"]);
    var byCode = {};
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null });
      rec.qty += num(row[ai]);
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
    }
    var asOf = dateFromFilename(filename);
    if (!asOf && wb && wb.Props && wb.Props.ModifiedDate) asOf = new Date(wb.Props.ModifiedDate);
    return { byCode: byCode, stock_as_of: isoDate(asOf) };
  }

  // ---------- compute ----------
  function statusOf(cov, avg, inStock) { if (!inStock) return "not_in_stock"; if (avg === 0) return "no_movement"; if (cov <= REORDER_MONTHS) return "order_now"; if (cov <= WATCH_MONTHS) return "warning"; return "ok"; }
  function buildRows(wd, st) {
    var months = wd.actual_months || 1, codes = {}, k;
    for (k in wd.byCode) codes[k] = 1; for (k in st.byCode) codes[k] = 1;
    var rows = [];
    Object.keys(codes).forEach(function (code) {
      var w = wd.byCode[code], s = st.byCode[code];
      var total = w ? w.qty : 0, avg = w ? total / months : 0;
      var inStock = !!s, stock = inStock ? s.qty : 0;
      var cov = avg > 0 ? stock / avg : null;
      rows.push({ code: code, desc: (w && w.desc) || (s && s.desc) || "", alt: "", uom: (w && w.uom) || "", total: total, avg: avg, stock: stock, cov: cov, qty9: avg * ORDER_COVER_MONTHS, sug: Math.max(0, avg * ORDER_COVER_MONTHS - stock), status: statusOf(cov == null ? 0 : cov, avg, inStock), inStock: inStock, moved: avg > 0, trend: null });
    });
    return rows;
  }
  /* Aggregate the per-code monthly withdrawals into one dashboard series,
     split by the medicine's computed status (real data; no synthetic series). */
  function buildMonthly(wd, rows) {
    if (!wd.monthlyByCode) return null;
    var statusByCode = {};
    rows.forEach(function (r) { statusByCode[r.code] = r.status; });
    var agg = {};
    Object.keys(wd.monthlyByCode).forEach(function (code) {
      var mc = wd.monthlyByCode[code], status = statusByCode[code];
      Object.keys(mc).forEach(function (ym) {
        var a = agg[ym] || (agg[ym] = { total: 0, order: 0, watch: 0 });
        a.total += mc[ym];
        if (status === "order_now") a.order += mc[ym];
        else if (status === "warning") a.watch += mc[ym];
      });
    });
    var yms = Object.keys(agg).sort();
    if (yms.length < 2) return null;
    return yms.map(function (ym) { return { ym: ym, total: agg[ym].total, order: agg[ym].order, watch: agg[ym].watch }; });
  }

  // ---------- trend ----------
  function loadSnaps() { try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || []; } catch (e) { return []; } }
  function saveSnaps(s) { try { localStorage.setItem(SNAP_KEY, JSON.stringify(s.slice(-12))); } catch (e) {} }
  function applyTrend(rows, meta) {
    if (meta.source === "sample") return;
    var snaps = loadSnaps(), prev = null;
    for (var i = snaps.length - 1; i >= 0; i--) if (snaps[i].period_end !== meta.period_end) { prev = snaps[i]; break; }
    if (prev) rows.forEach(function (r) { var pa = prev.avgByCode[r.code]; if (pa === undefined) r.trend = { type: "new" }; else if (pa === 0) r.trend = r.avg > 0 ? { type: "new" } : null; else r.trend = { type: "delta", pct: (r.avg - pa) / pa, prev: pa }; });
    var avgByCode = {}; rows.forEach(function (r) { avgByCode[r.code] = r.avg; });
    snaps = snaps.filter(function (x) { return x.period_end !== meta.period_end; });
    snaps.push({ period_start: meta.period_start, period_end: meta.period_end, savedAt: new Date().toISOString(), avgByCode: avgByCode });
    saveSnaps(snaps);
  }

  // ---------- ingest ----------
  function tryCompute() {
    if (!STATE.raw.withdrawals || !STATE.raw.stock) return;
    var wd = STATE.raw.withdrawals, st = STATE.raw.stock;
    var rows = buildRows(wd, st);
    applyMap(rows);
    var meta = { period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months, stock_as_of: st.stock_as_of, source: "upload", baseline: wd.source === "baseline" };
    applyTrend(rows, meta);
    STATE.rows = rows; STATE.meta = meta; STATE.monthly = buildMonthly(wd, rows);
    afterData();
    var msg = LANG === "ar" ? ("تم تحليل " + fmtInt(rows.length) + " دواء · الفترة " + fmt1(meta.actual_months) + " شهر") : (fmtInt(rows.length) + " medicines analysed · period " + fmt1(meta.actual_months) + " months");
    if (wd.source === "baseline") msg += " · " + t("baseline_meta");
    toast(msg);
  }
  function loadSample() {
    var s = window.PSMMC_SAMPLE; if (!s) { toast(t("no_sample")); return; }
    STATE.rows = s.rows.map(function (r) { return { code: r.code, desc: r.desc, alt: "", uom: r.uom, total: r.total, avg: r.avg, stock: r.stock, cov: r.cov, qty9: r.qty9, sug: r.sug, status: r.status, inStock: r.inStock, moved: r.moved, trend: null }; });
    applyMap(STATE.rows);
    STATE.meta = { period_start: s.period_start, period_end: s.period_end, actual_months: s.actual_months, stock_as_of: "2026-06-02", source: "sample" };
    STATE.monthly = s.monthly || null;
    STATE.wdName = "sample"; STATE.stName = "sample";
    $("lblWd").classList.add("is-loaded"); $("lblSt").classList.add("is-loaded");
    afterData();
    toast(LANG === "ar" ? ("تم تحميل بيانات تجريبية · " + fmtInt(STATE.rows.length) + " دواء") : ("Loaded sample data · " + fmtInt(STATE.rows.length) + " medicines"));
  }
  function afterData() {
    $("btnExport").disabled = false;
    STATE.filter = "all"; STATE.search = "";
    STATE.sort = STATE.view === "planning" ? { key: "cov", dir: "asc" } : { key: "stock", dir: "desc" };
    applyStatic(); render();
  }

  // ---------- view data ----------
  function viewBase() { return STATE.view === "management" ? STATE.rows.filter(function (r) { return r.inStock; }) : STATE.rows; }
  function filterCounts(base) { var c = { all: base.length, order_now: 0, no_movement: 0, not_in_stock: 0, warning: 0, instock: 0, outstock: 0 }; base.forEach(function (r) { if (r.status === "order_now") c.order_now++; else if (r.status === "no_movement") c.no_movement++; else if (r.status === "not_in_stock") c.not_in_stock++; else if (r.status === "warning") c.warning++; if (r.stock > 0) c.instock++; else c.outstock++; }); return c; }
  function applyFilter(base) {
    var f = STATE.filter;
    var rows = base.filter(function (r) { if (STATE.view === "planning") { return f === "all" ? true : r.status === f; } if (f === "instock") return r.stock > 0; if (f === "outstock") return r.stock <= 0; return true; });
    if (STATE.search) {
      // Multi-item search: comma/plus/newline-separated terms, a row matches if ANY term hits
      // its code, generic description, or alternate identifiers/trade name.
      var terms = STATE.search.toLowerCase().split(/[,،;؛+\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (terms.length) rows = rows.filter(function (r) {
        var hay = (r.code + " " + r.desc + " " + (r.alt || "")).toLowerCase();
        return terms.some(function (q) { return hay.indexOf(q) !== -1; });
      });
    }
    var k = STATE.sort.key, dir = STATE.sort.dir === "asc" ? 1 : -1;
    rows.sort(function (a, b) { var va = a[k], vb = b[k]; if (k === "cov") { va = va == null ? Infinity : va; vb = vb == null ? Infinity : vb; } if (k === "desc" || k === "code") { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0; } return (va - vb) * dir; });
    return rows;
  }

  // ---------- icons ----------
  var ICON = {
    pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l5 7" transform="rotate(-35 12 12)"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>',
    pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3.5l2.5-6 4 12 2.5-6H21"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6v12M15 6v12"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19V5M4 19h16"/><path d="M8 15v-3M12 15V8M16 15v-5"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4.5 17.5a8.5 8.5 0 1 1 15 0"/><path d="M12 14.5l3.2-3.4"/></svg>',
    ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="3"/><circle cx="12" cy="12" r="2.6"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>'
  };

  // ---------- chart primitives (pure SVG strings, data from the files) ----------
  function rnd(n) { return Math.round(n * 10) / 10; }
  function smoothPath(pts) {
    if (pts.length < 2) return "";
    var d = "M" + rnd(pts[0][0]) + " " + rnd(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i === 0 ? 0 : i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      d += "C" + rnd(p1[0] + (p2[0] - p0[0]) / 6) + " " + rnd(p1[1] + (p2[1] - p0[1]) / 6) + " "
        + rnd(p2[0] - (p3[0] - p1[0]) / 6) + " " + rnd(p2[1] - (p3[1] - p1[1]) / 6) + " "
        + rnd(p2[0]) + " " + rnd(p2[1]);
    }
    return d;
  }
  function areaSVG(vals) {
    if (!vals || vals.length < 2) return '<div class="kchart kchart-empty">—</div>';
    var W = 260, H = 64, p = 6, bottom = H - 3;
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), span = (max - min) || 1;
    var pts = vals.map(function (v, i) { return [p + (W - 2 * p) * i / (vals.length - 1), 10 + (H - 28) * (1 - (v - min) / span)]; });
    var line = smoothPath(pts);
    var area = line + " L" + rnd(pts[pts.length - 1][0]) + " " + bottom + " L" + rnd(pts[0][0]) + " " + bottom + " Z";
    var last = pts[pts.length - 1];
    return '<svg class="kchart" viewBox="0 0 260 64" preserveAspectRatio="none" aria-hidden="true">'
      + '<defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7d9df"/><stop offset="1" stop-color="#d7d9df" stop-opacity="0"/></linearGradient></defs>'
      + '<path d="' + area + '" fill="url(#gArea)"/>'
      + '<path d="' + line + '" fill="none" stroke="#c2c5cc" stroke-width="1.6" vector-effect="non-scaling-stroke"/>'
      + '<circle cx="' + rnd(last[0]) + '" cy="' + rnd(last[1]) + '" r="6.5" fill="#2456f5" opacity=".16"/>'
      + '<circle cx="' + rnd(last[0]) + '" cy="' + rnd(last[1]) + '" r="3.4" fill="#2456f5" stroke="#fff" stroke-width="1.6"/>'
      + '</svg>';
  }
  var ECG_SVG = '<svg class="kchart" viewBox="0 0 240 64" preserveAspectRatio="none" aria-hidden="true">'
    + '<path d="M0 34 H36 L44 34 L50 14 L58 52 L66 24 L72 34 H118 L126 34 L132 12 L140 54 L148 24 L154 34 H204 L212 34 L218 20 L224 34 H240" '
    + 'fill="none" stroke="#2456f5" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  function streamSVG(monthly) {
    var W = 240, H = 96, p = 6, n = monthly.length;
    var maxT = 0; monthly.forEach(function (m) { if (m.total > maxT) maxT = m.total; });
    if (!maxT) maxT = 1;
    var scale = (H - 20) / maxT, cy = H / 2;
    function xs(i) { return p + (W - 2 * p) * i / (n - 1); }
    var series = [
      { key: "order", color: "#9db8ff" },
      { key: "watch", color: "#f2ce93" },
      { key: "rest", color: "#e4e6ea" }
    ];
    var cum = monthly.map(function (m) { return -m.total / 2; });
    var paths = "";
    series.forEach(function (s) {
      var vals = monthly.map(function (m) { return s.key === "rest" ? Math.max(0, m.total - m.order - m.watch) : m[s.key]; });
      var lo = cum.slice();
      var hi = lo.map(function (v, i) { return v + vals[i]; });
      var hiPts = hi.map(function (v, i) { return [xs(i), cy - v * scale]; });
      var loPts = lo.map(function (v, i) { return [xs(i), cy - v * scale]; }).reverse();
      var d = smoothPath(hiPts) + " L" + rnd(loPts[0][0]) + " " + rnd(loPts[0][1])
        + smoothPath(loPts).replace(/^M[-\d.]+ [-\d.]+/, "") + " Z";
      paths += '<path d="' + d + '" fill="' + s.color + '" opacity=".95"/>';
      cum = hi;
    });
    return '<svg class="kchart" viewBox="0 0 240 96" preserveAspectRatio="none" aria-hidden="true">' + paths + '</svg>';
  }
  function ticksSVG(counts, hiIdx) {
    var n = counts.length, W = 130, H = 44;
    var max = Math.max.apply(null, counts) || 1;
    var out = "";
    for (var i = 0; i < n; i++) {
      var h = counts[i] ? (10 + 26 * (counts[i] / max)) : 6;
      var x = 5 + (W - 10) * (n > 1 ? i / (n - 1) : 0);
      var hot = i === hiIdx, w = hot ? 4 : 3;
      out += '<rect x="' + rnd(x - w / 2) + '" y="' + rnd((H - h) / 2) + '" width="' + w + '" height="' + rnd(h) + '" rx="' + (w / 2) + '" fill="' + (hot ? "#2456f5" : "#d3d5db") + '"/>';
    }
    return '<svg viewBox="0 0 130 44" preserveAspectRatio="none" aria-hidden="true">' + out + '</svg>';
  }

  // ---------- card templates (anatomy copied from the reference set) ----------
  function cardArea(label, value, icon, monthly, insetVal, insetUnit) {
    var chart = (monthly && monthly.length > 1) ? areaSVG(monthly.map(function (m) { return m.total; })) : '<div class="kchart kchart-empty">' + esc(t("chart_nodates")) + '</div>';
    return '<div class="kcard"><div class="khead"><span class="tile tile-gray">' + icon + '</span>'
      + '<span class="ktxt"><span class="klabel">' + label + '</span><span class="kvalue num">' + value + '</span></span></div>'
      + '<div class="kbody">' + chart + '<span class="kinset"><b class="num">' + insetVal + '</b><i>' + insetUnit + '</i></span></div></div>';
  }
  function cardHero(label, value, icon, pillVal, pillUnit) {
    return '<div class="kcard"><div class="khead"><span class="tile tile-solid">' + icon + '</span>'
      + '<span class="ktxt"><span class="klabel">' + label + '</span><span class="kvalue num">' + value + '</span></span></div>'
      + '<div class="kbody">' + ECG_SVG + '<span class="kpill"><b class="num">' + pillVal + '</b><i>' + pillUnit + '</i></span></div></div>';
  }
  function cardStream(title, monthly) {
    if (!monthly || monthly.length < 2) {
      return '<div class="kcard"><div class="ktitle">' + title + '</div>'
        + '<div class="kbody stream"><div class="kchart-empty">' + esc(t("chart_nodates")) + '</div></div></div>';
    }
    var maxT = 0, minT = Infinity;
    monthly.forEach(function (m) { if (m.total > maxT) maxT = m.total; if (m.total < minT) minT = m.total; });
    return '<div class="kcard"><div class="ktitle">' + title + '</div>'
      + '<div class="kbody stream"><span class="axis"><i class="num">' + fmtM(maxT) + '</i><span class="axis-line"></span><i class="num">' + fmtM(minT) + '</i></span>'
      + streamSVG(monthly) + '</div>'
      + '<div class="legend"><span><i style="background:#9db8ff"></i>' + t("s_order_now") + '</span>'
      + '<span><i style="background:#f2ce93"></i>' + t("s_warning") + '</span>'
      + '<span><i style="background:#e4e6ea"></i>' + t("lg_total") + '</span></div></div>';
  }
  function cardTicks(label, icon, valueHtml, counts, hiIdx, tickVal, tickUnit, span) {
    return '<div class="kcard ' + (span == null ? "span3" : span) + '"><div class="khead"><span class="tile tile-gray">' + icon + '</span>'
      + '<span class="ktxt"><span class="klabel">' + label + '</span><span class="kvalue num">' + valueHtml + '</span></span></div>'
      + '<div class="inset-ticks">' + ticksSVG(counts, hiIdx) + '<span class="tick-val"><b class="num">' + tickVal + '</b><i>' + tickUnit + '</i></span></div></div>';
  }
  function cardMini(title, badge, tileCls, icon, bold, sub, span) {
    return '<div class="kcard ' + (span == null ? "span3" : span) + '"><div class="ktitle-row"><span class="ktitle">' + title + '</span><span class="kbadge num">' + badge + '</span></div>'
      + '<span class="tile ' + tileCls + '">' + icon + '</span>'
      + '<div class="kfoot"><b>' + bold + '</b><i>' + sub + '</i></div></div>';
  }

  // ---------- table pieces ----------
  var STATUS_COLOR = { order_now: "var(--coral)", warning: "var(--amber)", ok: "var(--blue)", no_movement: "var(--muted-2)", not_in_stock: "var(--indigo)" };
  function covCell(r) { if (r.status === "no_movement") return '<span class="muted">' + t("s_no_movement") + "</span>"; var pct = r.cov == null ? 0 : Math.min(100, (r.cov / 12) * 100); return '<span class="num">' + (r.cov == null ? "∞" : fmt1(r.cov)) + '</span><span class="covbar"><i style="width:' + pct.toFixed(0) + "%;background:" + (STATUS_COLOR[r.status] || "var(--blue)") + '"></i></span>'; }
  function trendCell(r) { if (!r.trend) return '<span class="trend flat">—</span>'; if (r.trend.type === "new") return '<span class="trend new">' + t("trend_new") + "</span>"; var p = r.trend.pct, cls = p > 0.001 ? "up" : p < -0.001 ? "down" : "flat", arr = p > 0.001 ? "▲" : p < -0.001 ? "▼" : "▬"; return '<span class="trend ' + cls + '" title="' + t("prev_avg") + " " + fmt1(r.trend.prev) + t("per_mo") + '">' + arr + " " + (p >= 0 ? "+" : "") + (p * 100).toFixed(0) + "%</span>"; }
  function pill(status) { return '<span class="pill ' + status + '">' + t("s_" + status) + "</span>"; }
  function codeCell(r) {
    var sub = [r.hosp, r.msd].filter(Boolean).join(" · ");
    return '<td class="code">' + r.code + (sub ? '<span class="subcode num">' + esc(sub) + "</span>" : "") + "</td>";
  }
  function descCell(r) {
    var extra = r.trade || (r.sci && r.sci !== r.desc ? r.sci : null);
    return '<td class="desc">' + esc(r.desc) + (extra ? '<i class="tradename">' + esc(extra) + "</i>" : "") + "</td>";
  }
  function th(key, label, right) { var s = STATE.sort, on = s.key === key, arrow = on ? (s.dir === "asc" ? "▲" : "▼") : "↕"; return '<th class="sortable' + (on ? " sorted" : "") + (right ? " right" : "") + '" data-sort="' + key + '">' + label + ' <span class="arrow">' + arrow + "</span></th>"; }
  function fchip(key, label, count, icon) { return '<button class="fchip' + (STATE.filter === key ? " is-active" : "") + '" data-filter="' + key + '">' + (icon ? '<span class="fic">' + icon + '</span>' : "") + label + ' <span class="badge num">' + fmtInt(count || 0) + "</span></button>"; }
  function toolbar(filters) { return '<div class="toolbar"><div class="search">' + ICON.search + '<input id="searchInput" type="search" placeholder="' + esc(t("search_ph")) + '" value="' + esc(STATE.search) + '"/></div>' + filters + "</div>"; }
  var SORT_LABEL = { code: "c_code", desc: "c_desc", total: "c_total", avg: "c_avg", stock: "c_stock", cov: "c_cov", qty9: "c_qty9", sug: "c_sug" };
  function tableCard(head, body, shown, total) {
    var sortKey = SORT_LABEL[STATE.sort.key] ? t(SORT_LABEL[STATE.sort.key]) : STATE.sort.key;
    return '<div class="tablecard"><div class="tablewrap"><table>' + head + "<tbody>" + (body || '<tr><td colspan="12" class="muted" style="padding:34px;text-align:center">' + t("no_rows") + "</td></tr>") + "</tbody></table></div><div class=\"tfoot\"><span>" + t("showing") + ' <b class="num">' + fmtInt(shown) + "</b> " + t("of") + ' <b class="num">' + fmtInt(total) + "</b> " + t("items") + "</span><span>" + t("sorted_by") + " " + sortKey + " " + (STATE.sort.dir === "asc" ? "↑" : "↓") + "</span></div></div>";
  }

  // ---------- views ----------
  function renderPlanning(base, c) {
    var months = STATE.meta.actual_months || 1;
    var totalWd = 0; base.forEach(function (r) { totalWd += r.total; });
    var covs = []; base.forEach(function (r) { if (r.inStock && r.moved && r.cov != null) covs.push(r.cov); });
    var med = median(covs);
    var buckets = []; for (var i = 0; i < 13; i++) buckets.push(0);
    covs.forEach(function (v) { buckets[Math.min(12, Math.floor(v))]++; });
    var hiIdx = med == null ? -1 : Math.min(12, Math.floor(med));
    var pct = base.length ? Math.round(c.order_now / base.length * 100) : 0;
    var cards = '<div class="cards">'
      + cardArea(t("k_withdrawn"), fmtM(totalWd), ICON.chart, STATE.monthly, fmtM(totalWd / months), t("monthly_word"))
      + cardHero(t("k_order"), fmtInt(c.order_now), ICON.pulse, pct + "%", t("of_analysed"))
      + cardStream(t("k_monthly_title"), STATE.monthly)
      + cardTicks(t("k_median"), ICON.gauge, (med == null ? "—" : fmt1(med)) + ' <small>' + t("mo") + '</small>', buckets, hiIdx, med == null ? "—" : fmt1(med), t("mo"))
      + cardMini(t("k_watch"), fmtInt(c.warning), "tile-lav", ICON.clock, t("w_value"), t("w_sub"))
      + cardMini(t("k_notstock"), fmtInt(c.not_in_stock), "tile-coral", ICON.ban, t("ns_value"), t("ns_sub"))
      + cardMini(t("k_nomove"), fmtInt(c.no_movement), "tile-gray", ICON.pause, t("nm_value"), t("nm_sub"))
      + '</div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all"), c.all, ICON.grid) + fchip("order_now", t("f_order_now"), c.order_now, ICON.alert) + fchip("no_movement", t("f_no_movement"), c.no_movement, ICON.pause) + fchip("not_in_stock", t("f_not_in_stock"), c.not_in_stock, ICON.ban) + "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("total", t("c_total"), true) + th("avg", t("c_avg"), true) + "<th>" + t("c_trend") + "</th>" + th("stock", t("c_stock"), true) + th("cov", t("c_cov")) + "<th>" + t("c_status") + "</th>" + th("qty9", t("c_qty9"), true) + th("sug", t("c_sug"), true) + "</tr></thead>";
    var body = rows.map(function (r) { return "<tr>" + codeCell(r) + descCell(r) + "<td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.total) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td>" + trendCell(r) + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + pill(r.status) + "</td><td class=\"right num\">" + fmtInt(r.qty9) + "</td><td class=\"right num sug\">" + fmtInt(r.sug) + "</td></tr>"; }).join("");
    return cards + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }
  function renderManagement(base, c) {
    var totalUnits = base.reduce(function (s, r) { return s + r.stock; }, 0);
    var orderNow = base.filter(function (r) { return r.status === "order_now"; }).length;
    var avgPerItem = base.length ? totalUnits / base.length : 0;
    var buckets = [0, 0, 0, 0, 0, 0, 0, 0];
    base.forEach(function (r) { buckets[r.stock <= 0 ? 0 : Math.min(7, Math.floor(Math.log(r.stock) / Math.LN10) + 1)]++; });
    var hiIdx = 0, hiVal = -1;
    buckets.forEach(function (v, i) { if (v > hiVal) { hiVal = v; hiIdx = i; } });
    var cards = '<div class="cards">'
      + cardHero(t("k_units"), fmtM(totalUnits), ICON.box, fmtInt(base.length), t("items"))
      + cardTicks(t("k_instock"), ICON.box, fmtInt(base.length), buckets, hiIdx, fmtM(avgPerItem), t("mg_avg_item"), "")
      + cardMini(t("k_out"), fmtInt(c.outstock), "tile-coral", ICON.ban, t("ns_value"), t("out_sub"), "")
      + cardMini(t("k_reorder"), fmtInt(orderNow), "tile-amber", ICON.alert, t("re_value"), t("re_sub"), "span6")
      + cardMini(t("k_value"), "—", "tile-gray", ICON.cash, "—", t("k_value_sub"), "span6")
      + '</div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all_instock"), c.instock + c.outstock, ICON.box) + fchip("instock", t("f_available"), c.instock, ICON.check) + fchip("outstock", t("f_outstock"), c.outstock, ICON.ban) + "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("stock", t("c_avail"), true) + th("cov", t("c_cov")) + "<th>" + t("c_status") + "</th>" + th("avg", t("c_use"), true) + '<th class="right">' + t("c_value") + "</th></tr></thead>";
    var body = rows.map(function (r) { return "<tr>" + codeCell(r) + descCell(r) + "<td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + pill(r.status) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td class=\"right muted\">—</td></tr>"; }).join("");
    return cards + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }

  function render() {
    document.querySelectorAll(".tab").forEach(function (tb) {
      var active = tb.dataset.view === STATE.view;
      tb.classList.toggle("is-active", active);
      tb.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (!STATE.rows.length) return;
    var base = viewBase(), c = filterCounts(base);
    $("content").innerHTML = STATE.view === "planning" ? renderPlanning(base, c) : renderManagement(base, c);
    wireDynamic();
  }
  function wireDynamic() {
    var si = $("searchInput");
    if (si) si.oninput = function () { STATE.search = this.value.trim(); var pos = this.selectionStart; render(); var s2 = $("searchInput"); if (s2) { s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (e) {} } };
    document.querySelectorAll(".fchip").forEach(function (b) { b.onclick = function () { STATE.filter = this.dataset.filter; render(); }; });
    document.querySelectorAll("th.sortable").forEach(function (h) { h.onclick = function () { var k = this.dataset.sort; if (STATE.sort.key === k) STATE.sort.dir = STATE.sort.dir === "asc" ? "desc" : "asc"; else STATE.sort = { key: k, dir: (k === "desc" || k === "code") ? "asc" : "desc" }; render(); }; });
  }

  // ---------- static i18n / chrome ----------
  function wdLabel() {
    if (STATE.wdName === "sample") return t("sample_wd");
    var wd = STATE.raw.withdrawals;
    if (wd && wd.source === "upload" && wd.files) {
      if (wd.files.length === 1) return wd.files[0];
      var n = wd.files.length === 2 ? t("two_files") : fmtInt(wd.files.length) + " " + t("files_word");
      return n + ": " + wd.files.join(" + ");
    }
    if (wd && wd.source === "baseline") return t("baseline_meta") + " · " + t("baseline_to") + " " + prettyDate(wd.period_end);
    return t("file_wd_hint");
  }
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (k === "upl_hint") return; // handled below (html)
      el.textContent = t(k);
    });
    $("uplHint").innerHTML = t("upl_hint");
    $("wdName").textContent = wdLabel();
    $("stName").textContent = STATE.stName === "sample" ? t("sample_st") : STATE.stName ? STATE.stName : t("file_st_hint");
    $("mpName").textContent = MAP ? ((MAP.name ? MAP.name + " · " : "") + fmtInt(MAP.count) + " " + t("mp_linked")) : t("file_mp_hint");
    $("langName").textContent = t("langName");
    $("langBtn").classList.toggle("is-en", LANG === "en");
    if (STATE.meta.period_start) {
      $("metaPeriod").textContent = t("period") + ": " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + ")" + (STATE.meta.baseline ? " · " + t("baseline_meta") : "");
      $("metaStock").textContent = t("stock_as_of") + ": " + prettyDate(STATE.meta.stock_as_of);
    } else { $("metaPeriod").textContent = "—"; $("metaStock").textContent = "—"; }
    var mc = $("metaCount");
    if (STATE.rows.length) { mc.hidden = false; mc.textContent = fmtInt(STATE.rows.length) + " " + t("meds_word"); }
    else mc.hidden = true;
  }

  // ---------- export ----------
  function exportExcel() {
    if (!STATE.rows.length) return;
    var rows = applyFilter(viewBase()), aoa, name;
    var mapCols = MAP ? [t("c_trade"), t("c_hosp"), t("c_msd")] : [];
    function mapVals(r) { return MAP ? [r.trade || "", r.hosp || "", r.msd || ""] : []; }
    if (STATE.view === "planning") {
      aoa = [[t("c_code"), t("c_desc")].concat(mapCols, [t("c_uom"), t("c_total"), t("c_avg"), t("c_stock"), t("c_cov"), t("c_status"), t("c_sug")])];
      rows.forEach(function (r) { aoa.push([r.code, r.desc].concat(mapVals(r), [r.uom, Math.round(r.total), Math.round(r.avg * 10) / 10, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), Math.round(r.sug)])); });
      name = "PSMMC_reorder_" + STATE.filter + "_" + (STATE.meta.period_end || "") + ".xlsx";
    } else {
      aoa = [[t("c_code"), t("c_desc")].concat(mapCols, [t("c_uom"), t("c_avail"), t("c_cov"), t("c_status"), t("c_use")])];
      rows.forEach(function (r) { aoa.push([r.code, r.desc].concat(mapVals(r), [r.uom, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), Math.round(r.avg * 10) / 10])); });
      name = "PSMMC_stock_" + STATE.filter + "_" + (STATE.meta.stock_as_of || "") + ".xlsx";
    }
    var ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, STATE.view === "planning" ? "Reorder" : "Stock");
    XLSX.writeFile(wb, name);
    toast((LANG === "ar" ? "تم تصدير " : "Exported ") + fmtInt(rows.length) + (LANG === "ar" ? " صف → " : " rows → ") + name);
  }

  // ---------- init ----------
  function setLang(l) { LANG = l; try { localStorage.setItem(LANG_KEY, l); } catch (e) {} applyStatic(); render(); }
  function init() {
    var saved = loadBaseline();
    if (saved) {
      saved.source = "baseline";
      STATE.raw.withdrawals = saved;
      $("lblWd").classList.add("is-baseline");
    }
    MAP = loadMap();
    if (MAP) $("lblMp").classList.add("is-baseline");
    applyStatic();
    $("langBtn").onclick = function () { setLang(LANG === "ar" ? "en" : "ar"); };
    document.querySelectorAll(".tab").forEach(function (tb) { tb.onclick = function () { STATE.view = this.dataset.view; STATE.filter = "all"; STATE.search = ""; STATE.sort = STATE.view === "planning" ? { key: "cov", dir: "asc" } : { key: "stock", dir: "desc" }; render(); }; });
    $("btnSample").onclick = loadSample;
    $("btnExport").onclick = exportExcel;
    $("fileWithdrawals").onchange = function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      e.target.value = "";
      if (!files.length) return;
      var parts = [], pending = files.length, failed = false;
      files.forEach(function (f) {
        readWorkbook(f, function (err, aoa) {
          if (failed) return;
          if (err) { failed = true; toast(t("err_wd")); return; }
          try { var p = parseWithdrawals(aoa); p.name = f.name; parts.push(p); }
          catch (ex) { failed = true; toast(t("err_wd")); return; }
          if (--pending === 0) {
            var wd = combineWithdrawals(parts);
            wd.source = "upload";
            STATE.raw.withdrawals = wd;
            saveBaseline(wd);
            STATE.wdName = null;
            $("lblWd").classList.remove("is-baseline");
            $("lblWd").classList.add("is-loaded");
            applyStatic();
            tryCompute();
          }
        });
      });
    };
    $("fileStock").onchange = function (e) { var f = e.target.files[0]; e.target.value = ""; if (!f) return; STATE.stName = f.name; $("lblSt").classList.add("is-loaded"); applyStatic(); readWorkbook(f, function (err, aoa, wb) { if (err) { toast(t("err_st")); return; } try { STATE.raw.stock = parseStock(aoa, f.name, wb); tryCompute(); } catch (ex) { toast(t("err_st")); } }); };
    $("fileMap").onchange = function (e) {
      var f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      readWorkbook(f, function (err, aoa) {
        if (err) { toast(t("err_mp")); return; }
        try {
          var parsed = parseMapping(aoa);
          MAP = { byCode: parsed.byCode, count: parsed.count, name: f.name, savedAt: new Date().toISOString() };
          saveMap(MAP);
          $("lblMp").classList.remove("is-baseline");
          $("lblMp").classList.add("is-loaded");
          var linked = STATE.rows.length ? applyMap(STATE.rows) : parsed.count;
          applyStatic();
          render();
          toast(fmtInt(linked) + " " + t("mp_linked"));
        } catch (ex) { toast(t("err_mp")); }
      });
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

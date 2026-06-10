/* PSMMC — Pharmacy Stock & Reorder Analytics
   Client-side only. Medicines only = NUPCO code starts with "5". Bilingual AR/EN. */
(function () {
  "use strict";

  // ---------- constants ----------
  var DAYS_PER_MONTH = 30.44;
  var STATUS_OK = { DISPATCHED: 1, APPROVED: 1 };
  var REORDER_MONTHS = 6, WATCH_MONTHS = 7, ORDER_COVER_MONTHS = 9;
  var SNAP_KEY = "psmmc_snapshots_v1", LANG_KEY = "psmmc_lang";

  // ---------- i18n ----------
  var T = {
    en: {
      tab_planning: "Planning Department", tab_management: "Management & Budget",
      file_wd: "Withdrawals file", file_wd_hint: "NUPCO outbound · .xlsx",
      file_st: "Stock-on-hand file", file_st_hint: "NUPCO stock · .xls",
      btn_sample: "Load sample data", btn_export: "⬇ Export Excel",
      upl_hint: "Drop both files to compute coverage &amp; reorder. Only medicines (NUPCO code starting with <b>5</b>) are included; medical supplies are excluded.",
      empty_title: "No data loaded yet",
      empty_text: "Upload the withdrawals and stock-on-hand files, or click Load sample data to preview the dashboard with real numbers.",
      empty_btn: "Load sample data",
      foot: "Built for the PSMMC planning department · every calculation runs locally in your browser — no data leaves this page.",
      search_ph: "Search by code or drug name…",
      period: "Period", stock_as_of: "Stock as of", mo: "mo", sorted_by: "Sorted by",
      showing: "Showing", of: "of", items: "items", no_rows: "No rows match this filter.",
      f_all: "All", f_order_now: "Order now", f_no_movement: "No movement", f_not_in_stock: "Not in stock",
      f_all_instock: "All in stock", f_available: "Available", f_outstock: "Out of stock",
      k_analysed: "Medicines analysed", k_analysed_sub: "code starts with 5",
      k_order: "Order now", k_order_sub: "coverage ≤ 6 months",
      k_watch: "Watch", k_watch_sub: "6–7 months left",
      k_nomove: "No movement", k_nomove_sub: "no withdrawals in period",
      k_notstock: "Not in stock", k_notstock_sub: "withdrawn but absent",
      k_instock: "Medicines in stock", k_instock_sub: "items in stock file",
      k_units: "Total available units", k_units_sub: "sum of available qty",
      k_out: "Out of stock", k_out_sub: "available qty = 0",
      k_reorder: "Need reorder", k_reorder_sub: "coverage ≤ 6 mo",
      k_value: "Stock value (SAR)", k_value_sub: "add a price list to enable",
      c_code: "Code", c_desc: "Description", c_uom: "UOM", c_total: "Total Withdrawn",
      c_avg: "Monthly Avg", c_trend: "Trend Δ%", c_stock: "Current Stock", c_cov: "Coverage (mo)",
      c_status: "Status", c_qty9: "Qty (9 mo)", c_sug: "Suggested Order",
      c_avail: "Available Stock", c_use: "Monthly Use", c_value: "Stock Value",
      s_order_now: "Order now", s_warning: "Watch", s_ok: "OK", s_no_movement: "No movement", s_not_in_stock: "Not in stock",
      trend_new: "New", prev_avg: "prev avg", per_mo: "/mo",
      sample_wd: "Sample · NUPCO outbound", sample_st: "Sample · NUPCO stock",
      err_wd: "Could not read withdrawals file", err_st: "Could not read stock file", no_sample: "Sample data not available",
      langBtn: "العربية"
    },
    ar: {
      tab_planning: "قسم التخطيط", tab_management: "الإدارة والميزانية",
      file_wd: "ملف السحوبات", file_wd_hint: "صادر نبكو · ‎.xlsx",
      file_st: "ملف المخزون المتاح", file_st_hint: "مخزون نبكو · ‎.xls",
      btn_sample: "تحميل بيانات تجريبية", btn_export: "⬇ تصدير Excel",
      upl_hint: "أرفق الملفين لحساب التغطية وإعادة الطلب. تُحتسب الأدوية فقط (كود نبكو يبدأ بـ <b>5</b>)؛ وتُستبعد المستلزمات الطبية.",
      empty_title: "لا توجد بيانات محمّلة بعد",
      empty_text: "ارفع ملف السحوبات وملف المخزون، أو اضغط «تحميل بيانات تجريبية» لمعاينة اللوحة بأرقام حقيقية.",
      empty_btn: "تحميل بيانات تجريبية",
      foot: "أُعدّت لقسم التخطيط بمدينة الأمير سلطان الطبية العسكرية · جميع الحسابات تتم محليًا في متصفحك — لا تغادر البيانات هذه الصفحة.",
      search_ph: "ابحث بالكود أو اسم الدواء…",
      period: "الفترة", stock_as_of: "المخزون بتاريخ", mo: "شهر", sorted_by: "مرتّب حسب",
      showing: "عرض", of: "من", items: "صنف", no_rows: "لا توجد صفوف مطابقة لهذا الفلتر.",
      f_all: "الكل", f_order_now: "اطلب الآن", f_no_movement: "بدون حركة", f_not_in_stock: "غير متوفر بالمخزون",
      f_all_instock: "كل المخزون", f_available: "متوفر", f_outstock: "نفد",
      k_analysed: "أدوية تم تحليلها", k_analysed_sub: "الكود يبدأ بـ 5",
      k_order: "اطلب الآن", k_order_sub: "التغطية ≤ ٦ أشهر",
      k_watch: "للمتابعة", k_watch_sub: "يتبقى ٦–٧ أشهر",
      k_nomove: "بدون حركة", k_nomove_sub: "لا سحوبات في الفترة",
      k_notstock: "غير متوفر", k_notstock_sub: "مسحوب وغير موجود بالمخزون",
      k_instock: "أدوية بالمخزون", k_instock_sub: "أصناف في ملف المخزون",
      k_units: "إجمالي الوحدات المتاحة", k_units_sub: "مجموع الكمية المتاحة",
      k_out: "نفد من المخزون", k_out_sub: "الكمية المتاحة = ٠",
      k_reorder: "يحتاج إعادة طلب", k_reorder_sub: "التغطية ≤ ٦ أشهر",
      k_value: "قيمة المخزون (ر.س)", k_value_sub: "أضف قائمة أسعار للتفعيل",
      c_code: "الكود", c_desc: "الوصف", c_uom: "الوحدة", c_total: "إجمالي المسحوب",
      c_avg: "المتوسط الشهري", c_trend: "الاتجاه Δ٪", c_stock: "المخزون الحالي", c_cov: "التغطية (شهر)",
      c_status: "الحالة", c_qty9: "كمية ٩ أشهر", c_sug: "الطلب المقترح",
      c_avail: "المخزون المتاح", c_use: "الاستهلاك الشهري", c_value: "قيمة المخزون",
      s_order_now: "اطلب الآن", s_warning: "للمتابعة", s_ok: "جيد", s_no_movement: "بدون حركة", s_not_in_stock: "غير متوفر",
      trend_new: "جديد", prev_avg: "المتوسط السابق", per_mo: "/شهر",
      sample_wd: "تجريبي · صادر نبكو", sample_st: "تجريبي · مخزون نبكو",
      err_wd: "تعذّر قراءة ملف السحوبات", err_st: "تعذّر قراءة ملف المخزون", no_sample: "البيانات التجريبية غير متوفرة",
      langBtn: "EN"
    }
  };
  var LANG = (function () { try { return localStorage.getItem(LANG_KEY) || "ar"; } catch (e) { return "ar"; } })();
  function t(k) { return (T[LANG] && T[LANG][k]) || T.en[k] || k; }

  // ---------- state ----------
  var STATE = {
    view: "planning", rows: [],
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
    var byCode = {}, minD = null, maxD = null;
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      if (si >= 0) { var st = String(row[si] || "").trim().toUpperCase(); if (!STATUS_OK[st]) continue; }
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null, uom: null });
      rec.qty += num(row[qi]);
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
      if (!rec.uom && ui >= 0 && row[ui]) rec.uom = String(row[ui]).trim();
      if (di >= 0) { var d = parseDate(row[di]); if (d) { if (!minD || d < minD) minD = d; if (!maxD || d > maxD) maxD = d; } }
    }
    var months = (minD && maxD) ? Math.max((maxD - minD) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
    return { byCode: byCode, period_start: isoDate(minD), period_end: isoDate(maxD), actual_months: months };
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
      rows.push({ code: code, desc: (w && w.desc) || (s && s.desc) || "", uom: (w && w.uom) || "", total: total, avg: avg, stock: stock, cov: cov, qty9: avg * ORDER_COVER_MONTHS, sug: Math.max(0, avg * ORDER_COVER_MONTHS - stock), status: statusOf(cov == null ? 0 : cov, avg, inStock), inStock: inStock, moved: avg > 0, trend: null });
    });
    return rows;
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
    var meta = { period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months, stock_as_of: st.stock_as_of, source: "upload" };
    applyTrend(rows, meta);
    STATE.rows = rows; STATE.meta = meta; afterData();
    toast(LANG === "ar" ? ("تم تحليل " + fmtInt(rows.length) + " دواء · الفترة " + fmt1(meta.actual_months) + " شهر") : (fmtInt(rows.length) + " medicines analysed · period " + fmt1(meta.actual_months) + " months"));
  }
  function loadSample() {
    var s = window.PSMMC_SAMPLE; if (!s) { toast(t("no_sample")); return; }
    STATE.rows = s.rows.map(function (r) { return { code: r.code, desc: r.desc, uom: r.uom, total: r.total, avg: r.avg, stock: r.stock, cov: r.cov, qty9: r.qty9, sug: r.sug, status: r.status, inStock: r.inStock, moved: r.moved, trend: null }; });
    STATE.meta = { period_start: s.period_start, period_end: s.period_end, actual_months: s.actual_months, stock_as_of: "2026-06-02", source: "sample" };
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
    if (STATE.search) { var q = STATE.search.toLowerCase(); rows = rows.filter(function (r) { return r.code.indexOf(q) !== -1 || r.desc.toLowerCase().indexOf(q) !== -1; }); }
    var k = STATE.sort.key, dir = STATE.sort.dir === "asc" ? 1 : -1;
    rows.sort(function (a, b) { var va = a[k], vb = b[k]; if (k === "cov") { va = va == null ? Infinity : va; vb = vb == null ? Infinity : vb; } if (k === "desc" || k === "code") { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0; } return (va - vb) * dir; });
    return rows;
  }

  // ---------- rendering ----------
  function kpi(label, value, sub, cls, ico) { return '<div class="kpi ' + (cls || "") + '"><span class="kpi-ico">' + (ico || "") + '</span><span class="kpi-label">' + label + '</span><span class="kpi-value num">' + value + '</span><span class="kpi-sub">' + (sub || "") + "</span></div>"; }
  var STATUS_COLOR = { order_now: "var(--red)", warning: "var(--amber)", ok: "var(--green)", no_movement: "var(--muted-2)", not_in_stock: "var(--purple)" };
  function covCell(r) { if (r.status === "no_movement") return '<span class="muted">' + t("s_no_movement") + "</span>"; var pct = r.cov == null ? 0 : Math.min(100, (r.cov / 12) * 100); return '<span class="num">' + (r.cov == null ? "∞" : fmt1(r.cov)) + '</span><span class="covbar"><i style="width:' + pct.toFixed(0) + "%;background:" + (STATUS_COLOR[r.status] || "var(--green)") + '"></i></span>'; }
  function trendCell(r) { if (!r.trend) return '<span class="trend flat">—</span>'; if (r.trend.type === "new") return '<span class="trend new">' + t("trend_new") + "</span>"; var p = r.trend.pct, cls = p > 0.001 ? "up" : p < -0.001 ? "down" : "flat", arr = p > 0.001 ? "▲" : p < -0.001 ? "▼" : "▬"; return '<span class="trend ' + cls + '" title="' + t("prev_avg") + " " + fmt1(r.trend.prev) + t("per_mo") + '">' + arr + " " + (p >= 0 ? "+" : "") + (p * 100).toFixed(0) + "%</span>"; }
  function pill(status) { return '<span class="pill ' + status + '">' + t("s_" + status) + "</span>"; }
  function th(key, label, right) { var s = STATE.sort, on = s.key === key, arrow = on ? (s.dir === "asc" ? "▲" : "▼") : "↕"; return '<th class="sortable' + (on ? " sorted" : "") + (right ? " right" : "") + '" data-sort="' + key + '">' + label + ' <span class="arrow">' + arrow + "</span></th>"; }
  function fchip(key, label, count) { return '<button class="fchip' + (STATE.filter === key ? " is-active" : "") + '" data-filter="' + key + '">' + label + ' <span class="badge num">' + fmtInt(count || 0) + "</span></button>"; }
  function toolbar(filters) { return '<div class="toolbar"><div class="search">🔍<input id="searchInput" type="search" placeholder="' + esc(t("search_ph")) + '" value="' + esc(STATE.search) + '"/></div>' + filters + "</div>"; }
  function tableCard(head, body, shown, total) { return '<div class="tablecard card"><div class="tablewrap"><table>' + head + "<tbody>" + (body || '<tr><td colspan="12" class="muted" style="padding:34px;text-align:center">' + t("no_rows") + "</td></tr>") + "</tbody></table></div><div class=\"tfoot\"><span>" + t("showing") + ' <b class="num">' + fmtInt(shown) + "</b> " + t("of") + ' <b class="num">' + fmtInt(total) + "</b> " + t("items") + "</span><span>" + t("sorted_by") + " " + STATE.sort.key + " (" + STATE.sort.dir + ")</span></div></div>"; }

  function renderPlanning(base, c) {
    var kpis = '<div class="kpis">' +
      kpi(t("k_analysed"), fmtInt(base.length), t("k_analysed_sub"), "", "💊") +
      kpi(t("k_order"), fmtInt(c.order_now), t("k_order_sub"), c.order_now ? "alert" : "good", "🔴") +
      kpi(t("k_watch"), fmtInt(c.warning), t("k_watch_sub"), "", "🟡") +
      kpi(t("k_nomove"), fmtInt(c.no_movement), t("k_nomove_sub"), "idle", "⏸") +
      kpi(t("k_notstock"), fmtInt(c.not_in_stock), t("k_notstock_sub"), c.not_in_stock ? "alert" : "idle", "⚠") + "</div>";
    var filters = '<div class="filters">' + fchip("all", t("f_all"), c.all) + fchip("order_now", t("f_order_now"), c.order_now) + fchip("no_movement", t("f_no_movement"), c.no_movement) + fchip("not_in_stock", t("f_not_in_stock"), c.not_in_stock) + "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("total", t("c_total"), true) + th("avg", t("c_avg"), true) + "<th>" + t("c_trend") + "</th>" + th("stock", t("c_stock"), true) + th("cov", t("c_cov")) + "<th>" + t("c_status") + "</th>" + th("qty9", t("c_qty9"), true) + th("sug", t("c_sug"), true) + "</tr></thead>";
    var body = rows.map(function (r) { return "<tr><td class=\"code\">" + r.code + "</td><td class=\"desc\">" + esc(r.desc) + "</td><td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.total) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td>" + trendCell(r) + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + pill(r.status) + "</td><td class=\"right num\">" + fmtInt(r.qty9) + "</td><td class=\"right num sug\">" + fmtInt(r.sug) + "</td></tr>"; }).join("");
    return kpis + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }
  function renderManagement(base, c) {
    var totalUnits = base.reduce(function (s, r) { return s + r.stock; }, 0);
    var orderNow = base.filter(function (r) { return r.status === "order_now"; }).length;
    var kpis = '<div class="kpis">' +
      kpi(t("k_instock"), fmtInt(base.length), t("k_instock_sub"), "", "📦") +
      kpi(t("k_units"), fmtInt(totalUnits), t("k_units_sub"), "good", "Σ") +
      kpi(t("k_out"), fmtInt(c.outstock), t("k_out_sub"), c.outstock ? "alert" : "good", "🚫") +
      kpi(t("k_reorder"), fmtInt(orderNow), t("k_reorder_sub"), orderNow ? "alert" : "good", "🔴") +
      kpi(t("k_value"), "—", t("k_value_sub"), "idle", "💰") + "</div>";
    var filters = '<div class="filters">' + fchip("all", t("f_all_instock"), c.instock + c.outstock) + fchip("instock", t("f_available"), c.instock) + fchip("outstock", t("f_outstock"), c.outstock) + "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("stock", t("c_avail"), true) + th("cov", t("c_cov")) + "<th>" + t("c_status") + "</th>" + th("avg", t("c_use"), true) + '<th class="right">' + t("c_value") + "</th></tr></thead>";
    var body = rows.map(function (r) { return "<tr><td class=\"code\">" + r.code + "</td><td class=\"desc\">" + esc(r.desc) + "</td><td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + pill(r.status) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td class=\"right muted\">—</td></tr>"; }).join("");
    return kpis + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }

  function render() {
    document.querySelectorAll(".tab").forEach(function (tb) { tb.classList.toggle("is-active", tb.dataset.view === STATE.view); });
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
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (k === "upl_hint") return; // handled below (html)
      el.textContent = t(k);
    });
    $("uplHint").innerHTML = t("upl_hint");
    $("wdName").textContent = STATE.wdName === "sample" ? t("sample_wd") : STATE.wdName ? STATE.wdName : t("file_wd_hint");
    $("stName").textContent = STATE.stName === "sample" ? t("sample_st") : STATE.stName ? STATE.stName : t("file_st_hint");
    $("langBtn").textContent = t("langBtn");
    if (STATE.meta.period_start) {
      $("metaPeriod").textContent = t("period") + ": " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + ")";
      $("metaStock").textContent = t("stock_as_of") + ": " + prettyDate(STATE.meta.stock_as_of);
    } else { $("metaPeriod").textContent = "—"; $("metaStock").textContent = "—"; }
  }

  // ---------- export ----------
  function exportExcel() {
    if (!STATE.rows.length) return;
    var rows = applyFilter(viewBase()), aoa, name;
    if (STATE.view === "planning") {
      aoa = [[t("c_code"), t("c_desc"), t("c_uom"), t("c_total"), t("c_avg"), t("c_stock"), t("c_cov"), t("c_status"), t("c_sug")]];
      rows.forEach(function (r) { aoa.push([r.code, r.desc, r.uom, Math.round(r.total), Math.round(r.avg * 10) / 10, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), Math.round(r.sug)]); });
      name = "PSMMC_reorder_" + STATE.filter + "_" + (STATE.meta.period_end || "") + ".xlsx";
    } else {
      aoa = [[t("c_code"), t("c_desc"), t("c_uom"), t("c_avail"), t("c_cov"), t("c_status"), t("c_use")]];
      rows.forEach(function (r) { aoa.push([r.code, r.desc, r.uom, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), Math.round(r.avg * 10) / 10]); });
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
    applyStatic();
    $("langBtn").onclick = function () { setLang(LANG === "ar" ? "en" : "ar"); };
    document.querySelectorAll(".tab").forEach(function (tb) { tb.onclick = function () { STATE.view = this.dataset.view; STATE.filter = "all"; STATE.search = ""; STATE.sort = STATE.view === "planning" ? { key: "cov", dir: "asc" } : { key: "stock", dir: "desc" }; render(); }; });
    $("btnSample").onclick = loadSample;
    $("btnExport").onclick = exportExcel;
    $("fileWithdrawals").onchange = function (e) { var f = e.target.files[0]; if (!f) return; STATE.wdName = f.name; $("lblWd").classList.add("is-loaded"); applyStatic(); readWorkbook(f, function (err, aoa) { if (err) { toast(t("err_wd")); return; } try { STATE.raw.withdrawals = parseWithdrawals(aoa); tryCompute(); } catch (ex) { toast(t("err_wd")); } }); };
    $("fileStock").onchange = function (e) { var f = e.target.files[0]; if (!f) return; STATE.stName = f.name; $("lblSt").classList.add("is-loaded"); applyStatic(); readWorkbook(f, function (err, aoa, wb) { if (err) { toast(t("err_st")); return; } try { STATE.raw.stock = parseStock(aoa, f.name, wb); tryCompute(); } catch (ex) { toast(t("err_st")); } }); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

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
  var HIST_KEY = "psmmc_history_v1", HIST_MAX_MONTHS = 24;

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
      c_trade: "Trade Name", c_hosp: "Hospital Code", c_msd: "MSD Code", c_agent: "Agent / Vendor", c_class: "Classification",
      dt_agent: "agent / vendor",
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
      tab_averages: "Averages",
      pc_title: "Confirm withdrawals period", pc_sub: "Period detected from the delivery dates inside the file. Each item's monthly average = quantity ÷ months, so make sure the months are right.",
      pc_detected: "detected automatically from the file", pc_use_detected: "Use detected", pc_months_3: "3 mo", pc_months_6: "6 mo", pc_custom_ph: "Custom…", pc_confirm: "Use", manual_mark: "manual",
      hist_quota: "Device storage is full — history trimmed to the last 12 months",
      k_need_order: "Needs ordering now", k_need_order_sub: "Total suggested qty <b class=\"num\">{u}</b> units · <b>{n}</b> withdrawn but not in stock",
      k_critical: "Critical — out of stock", k_critical_sub: "Actively withdrawn items at zero balance — top priority",
      k_total_units: "Total available stock", k_overall_cov: "Covers <b class=\"num\">{m}</b> months at the current rate",
      k_monthly_use: "Monthly consumption", vs_prev_month: "{a} vs {b}", units_word: "units", items_word: "items",
      os_title: "Order sheet — most urgent", os_view_all: "View all in table", os_export: "Export order sheet", os_email: "Email report", os_wa: "WhatsApp", os_print: "Print", os_cov_left: "mo cover", os_suggested: "suggested",
      dt_highest: "Highest month", dt_lowest: "Lowest month", dt_total_hist: "total withdrawn", dt_no_history: "No monthly history yet — it builds up from your uploads", dt_partial_note: "⚠ The last month is partial — shown faded and excluded from the trend comparison.", dt_avg: "monthly avg (units)", dt_vs_prev: "vs previous average", dt_stock: "current stock", dt_cov: "coverage (mo)", dt_sug: "suggested order (9 mo)", dt_class: "MODHS classification", dt_priority: "priority level",
      f_watch: "Watch", f_rising: "Rising +10%", f_falling: "Falling −10%", f_new: "New", c_spark: "Recent months", c_delta: "Trend Δ%",
      av_hist: "Saved history", av_moving: "Moving items", av_rising: "Rising", av_falling: "Falling", av_tap: "Tap any item to open its monthly report",
      em_subject: "PSMMC stock report", em_summary: "Summary", em_below1: "Items below 1 month of coverage:", em_more: "more items", em_full_sheet: "Full sheet: use the Export button in the dashboard.", em_order: "Need ordering", em_critical: "Critical", em_stocku: "Stock units", em_monthly: "Monthly use",
      pr_pack_price: "pack price", pr_units_per_pack: "units/pack", pr_unit_price: "unit price (system)", pr_eff_price: "effective after bonus qty", pr_stock_value: "item stock value", pr_total_value: "Total stock value (SAR)", pr_frozen: "Frozen capital", pr_frozen_sub: "no movement or >12 mo coverage", pr_priced: "priced items",
      pr_hint: "Prices not loaded yet — add pack price, units per pack, awarded qty and free qty columns to the identifiers file to activate this section.",
      cp_copied: "Copied", cp_copy_all: "Copy all codes", cp_none: "No codes to copy",
      prn_title: "Order sheet", prn_date: "Date", prn_period: "Analysis period", prn_sign: "Approved by — name & signature",
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
      c_trade: "الاسم التجاري", c_hosp: "كود المستشفى", c_msd: "كود MSD", c_agent: "الوكيل / المورد", c_class: "التصنيف",
      dt_agent: "الوكيل / المورد",
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
      tab_averages: "المتوسطات",
      pc_title: "تأكيد فترة ملف السحوبات", pc_sub: "قرأنا الفترة من تواريخ التسليم داخل الملف. المتوسط الشهري لكل صنف = الكمية ÷ عدد الأشهر، لذا تأكد أن عدد الأشهر صحيح.",
      pc_detected: "مقروءة تلقائيًا من الملف", pc_use_detected: "اعتمد المقروءة", pc_months_3: "3 أشهر", pc_months_6: "6 أشهر", pc_custom_ph: "مخصص…", pc_confirm: "اعتمد", manual_mark: "يدوي",
      hist_quota: "مساحة الجهاز ممتلئة — قُلّص السجل لآخر 12 شهرًا",
      k_need_order: "يحتاج طلبًا الآن", k_need_order_sub: "إجمالي الكمية المقترحة <b class=\"num\">{u}</b> وحدة · منها <b>{n}</b> صنفًا مسحوبًا وغير متوفر",
      k_critical: "حرج — نفد أو غير متوفر", k_critical_sub: "أصناف مسحوبة فعليًا ورصيدها صفر — أولوية قصوى",
      k_total_units: "إجمالي المخزون المتاح", k_overall_cov: "يغطي <b class=\"num\">{m}</b> شهرًا بمعدل الاستهلاك الحالي",
      k_monthly_use: "الاستهلاك الشهري", vs_prev_month: "{a} مقابل {b}", units_word: "وحدة", items_word: "صنفًا",
      os_title: "ورقة الطلب — الأكثر إلحاحًا", os_view_all: "عرض الكل في الجدول", os_export: "تصدير ورقة الطلب", os_email: "تقرير بالإيميل", os_wa: "واتساب", os_print: "طباعة", os_cov_left: "شهر تغطية", os_suggested: "كمية مقترحة",
      dt_highest: "أعلى شهر", dt_lowest: "أدنى شهر", dt_total_hist: "إجمالي المسحوب", dt_no_history: "لا يوجد سجل شهري بعد — يتراكم تلقائيًا مع كل رفع", dt_partial_note: "⚠ الشهر الأخير جزئي — يظهر باهتًا ولا يدخل في مقارنة الاتجاه.", dt_avg: "متوسط شهري (وحدة)", dt_vs_prev: "مقابل المتوسط السابق", dt_stock: "المخزون الحالي", dt_cov: "تغطية (شهر)", dt_sug: "الطلب المقترح (٩ أشهر)", dt_class: "تصنيف الخدمات الصحية", dt_priority: "مستوى الأولوية",
      f_watch: "للمتابعة", f_rising: "صاعد +10٪", f_falling: "هابط −10٪", f_new: "جديد", c_spark: "الأشهر الأخيرة", c_delta: "الاتجاه Δ٪",
      av_hist: "سجل محفوظ", av_moving: "أصناف متحركة", av_rising: "صاعد", av_falling: "هابط", av_tap: "اضغط أي صنف لفتح تقريره الشهري",
      em_subject: "تقرير مخزون صيدلية PSMMC", em_summary: "الملخص", em_below1: "أصناف تحت شهر تغطية:", em_more: "صنفًا آخر", em_full_sheet: "الورقة الكاملة: زر التصدير داخل اللوحة.", em_order: "يحتاج طلبًا", em_critical: "حرج", em_stocku: "وحدات المخزون", em_monthly: "الاستهلاك الشهري",
      pr_pack_price: "سعر العلبة", pr_units_per_pack: "وحدة/علبة", pr_unit_price: "سعر الوحدة (السيستم)", pr_eff_price: "السعر الفعلي بعد المجانية", pr_stock_value: "قيمة مخزون الصنف", pr_total_value: "قيمة المخزون الكلية (ر.س)", pr_frozen: "رأس المال المجمّد", pr_frozen_sub: "بدون حركة أو تغطية تفوق 12 شهرًا", pr_priced: "صنف مسعّر",
      pr_hint: "الأسعار غير مرفوعة بعد — أضف أعمدة سعر العلبة وعدد الحبات وكمية الترسية والكمية المجانية في ملف المعرفات لتفعيل هذه الخانة.",
      cp_copied: "نُسخ", cp_copy_all: "نسخ كل الأكواد", cp_none: "لا توجد أكواد للنسخ",
      prn_title: "ورقة الطلب", prn_date: "التاريخ", prn_period: "فترة التحليل", prn_sign: "الاعتماد — الاسم والتوقيع",
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
    wdName: null, stName: null, // null=hint, "sample", or filename
    detail: null // NUPCO code currently open in the item drill-down sheet
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
  /* i18n strings with {placeholders}. */
  function tFmt(key, vars) { var s = t(key); Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); }); return s; }
  /* Copy to clipboard with a fallback for file:// pages and older webviews. */
  function copyText(s) {
    function done() { toast(t("cp_copied") + ": " + s); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s).then(done, function () { legacyCopy(s); done(); });
    } else { legacyCopy(s); done(); }
  }
  function legacyCopy(s) {
    var ta = document.createElement("textarea");
    ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ---------- modal (single overlay container, backdrop + ESC close) ----------
  function openModal(html, cls, onClose) {
    var bd = $("modal"), card = $("modalCard");
    card.className = "modal-card" + (cls ? " " + cls : "");
    card.innerHTML = html;
    bd.hidden = false;
    document.body.style.overflow = "hidden";
    bd._onClose = onClose || null;
    bd.onclick = function (ev) { if (ev.target === bd) closeModal(); };
    document.addEventListener("keydown", modalEsc);
  }
  function modalEsc(ev) { if (ev.key === "Escape") closeModal(); }
  function closeModal() {
    var bd = $("modal");
    if (bd.hidden) return;
    var cb = bd._onClose; bd._onClose = null;
    bd.hidden = true;
    $("modalCard").innerHTML = "";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", modalEsc);
    STATE.detail = null;
    if (cb) cb();
  }
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

  /* ---------- accumulating per-item monthly history ----------
     Unlike the baseline (which the latest upload REPLACES), the history merges
     every upload into one per-code per-month ledger so seasonality stays
     visible across sessions. Merge rule: the newest upload is authoritative
     for its whole covered month range — those buckets are first cleared for
     ALL codes (a file with no rows for an item means that item moved zero),
     then the new values are written. */
  var HIST = null;
  function loadHistory() { try { var h = JSON.parse(localStorage.getItem(HIST_KEY)); return h && h.items ? h : null; } catch (e) { return null; } }
  function saveHistory(h) {
    try { localStorage.setItem(HIST_KEY, JSON.stringify(h)); }
    catch (e) {
      pruneHistory(h, 12);
      try { localStorage.setItem(HIST_KEY, JSON.stringify(h)); toast(t("hist_quota")); } catch (e2) {}
    }
  }
  function ymOf(iso) { return iso ? iso.slice(0, 7) : null; }
  function ymRange(startIso, endIso) {
    var out = [], s = ymOf(startIso), e = ymOf(endIso);
    if (!s || !e) return out;
    var y = +s.slice(0, 4), m = +s.slice(5, 7);
    for (var i = 0; i < 480; i++) {
      var ym = y + "-" + ("0" + m).slice(-2);
      out.push(ym);
      if (ym === e) break;
      if (++m > 12) { m = 1; y++; }
    }
    return out;
  }
  function pruneHistory(h, maxMonths) {
    var all = {};
    Object.keys(h.items).forEach(function (c) { Object.keys(h.items[c].ym).forEach(function (ym) { all[ym] = 1; }); });
    var keep = {};
    Object.keys(all).sort().slice(-maxMonths).forEach(function (ym) { keep[ym] = 1; });
    Object.keys(h.items).forEach(function (c) {
      var it = h.items[c];
      Object.keys(it.ym).forEach(function (ym) { if (!keep[ym]) delete it.ym[ym]; });
      if (!Object.keys(it.ym).length) delete h.items[c];
    });
  }
  function mergeHistory(wd) {
    if (!wd || !wd.monthlyByCode) return;
    var h = HIST || loadHistory() || { v: 1, items: {}, uploads: [] };
    var covered = ymRange(wd.period_start, wd.period_end);
    Object.keys(h.items).forEach(function (c) {
      covered.forEach(function (ym) { delete h.items[c].ym[ym]; });
    });
    Object.keys(wd.monthlyByCode).forEach(function (c) {
      var src = wd.monthlyByCode[c], info = wd.byCode[c] || {};
      var it = h.items[c] || (h.items[c] = { desc: null, uom: null, ym: {} });
      if (info.desc) it.desc = info.desc;
      if (info.uom) it.uom = info.uom;
      Object.keys(src).forEach(function (ym) { it.ym[ym] = src[ym]; });
    });
    Object.keys(h.items).forEach(function (c) { if (!Object.keys(h.items[c].ym).length) delete h.items[c]; });
    pruneHistory(h, HIST_MAX_MONTHS);
    h.updatedAt = new Date().toISOString();
    h.uploads = (h.uploads || []).slice(-9);
    h.uploads.push({ savedAt: h.updatedAt, files: wd.files || [], period_start: wd.period_start, period_end: wd.period_end, months: wd.actual_months });
    HIST = h;
    saveHistory(h);
  }
  /* One-time seed: an existing v1 baseline already carries monthlyByCode. */
  function migrateHistory() {
    if (HIST || loadHistory()) { HIST = HIST || loadHistory(); return; }
    var b = loadBaseline();
    if (b && b.monthlyByCode) mergeHistory(b);
  }
  function histMonths() {
    if (!HIST) return 0;
    var all = {};
    Object.keys(HIST.items).forEach(function (c) { Object.keys(HIST.items[c].ym).forEach(function (ym) { all[ym] = 1; }); });
    return Object.keys(all).length;
  }
  /* Monthly series for one item: saved history first, then the live upload,
     then the embedded sample. Returns { yms, vals } or null. */
  function monthlySeriesFor(code) {
    var src = null;
    if (HIST && HIST.items[code]) src = HIST.items[code].ym;
    else if (STATE.raw.withdrawals && STATE.raw.withdrawals.monthlyByCode && STATE.raw.withdrawals.monthlyByCode[code]) src = STATE.raw.withdrawals.monthlyByCode[code];
    else if (STATE.meta.source === "sample" && window.PSMMC_SAMPLE && window.PSMMC_SAMPLE.monthlyByCode && window.PSMMC_SAMPLE.monthlyByCode[code]) src = window.PSMMC_SAMPLE.monthlyByCode[code];
    if (!src) return null;
    var yms = Object.keys(src).sort();
    if (!yms.length) return null;
    return { yms: yms, vals: yms.map(function (k) { return src[k]; }) };
  }

  /* ---------- period confirmation ----------
     Shown after parsing a withdrawals upload, BEFORE anything is computed or
     saved: the detected month span drives every monthly average, so the user
     confirms it or overrides with 3/6/custom months. Closing the dialog
     without a choice falls back to the detected value (never strands the
     upload). */
  function showPeriodConfirm(wd, onDone) {
    var detected = Math.round(wd.actual_months * 10) / 10;
    var settled = false;
    function finish(months, src) {
      if (settled) return; settled = true;
      closeModal();
      onDone(months, src);
    }
    var html = '<h3 class="modal-title">' + t("pc_title") + '</h3>'
      + '<p class="modal-sub">' + t("pc_sub") + '</p>'
      + '<div class="pc-period"><span class="tile tile-lav">' + ICON.cal + '</span><span><b class="num">' + prettyDate(wd.period_start) + " → " + prettyDate(wd.period_end) + '</b><i>= <b class="num">' + fmt1(detected) + '</b> ' + t("mo") + " · " + t("pc_detected") + '</i></span></div>'
      + '<div class="seg">'
      + '<button type="button" data-months="3">' + t("pc_months_3") + '</button>'
      + '<button type="button" data-months="6">' + t("pc_months_6") + '</button>'
      + '<input id="pcCustom" type="number" min="0.5" max="36" step="0.5" inputmode="decimal" class="num" placeholder="' + esc(t("pc_custom_ph")) + '"/>'
      + '</div>'
      + '<div class="modal-actions"><button type="button" class="btn-soft" id="pcConfirm">' + t("pc_confirm") + '</button>'
      + '<button type="button" class="btn-primary" id="pcUseDetected">' + t("pc_use_detected") + " (" + fmt1(detected) + " " + t("mo") + ")</button></div>";
    openModal(html, null, function () { finish(detected, "detected"); });
    $("pcUseDetected").onclick = function () { finish(detected, "detected"); };
    document.querySelectorAll("#modalCard .seg button").forEach(function (b) {
      b.onclick = function () { finish(parseFloat(this.getAttribute("data-months")), "manual"); };
    });
    $("pcConfirm").onclick = function () {
      var v = parseFloat($("pcCustom").value);
      if (isFinite(v) && v >= 0.5 && v <= 36) finish(v, v === detected ? "detected" : "manual");
      else finish(detected, "detected");
    };
  }

  /* Optional identifiers file: links each NUPCO code to the hospital code,
     the MOD-wide MODHS/MSD code, and the trade/scientific names, so planners
     can search and read items by any of them. Also understands the MODHS
     unified medication catalog (NUPCO CODE / MODHS-CODE / CLASSIFICATION /
     PRIORTY LEVEL) and optional price columns (pack price, units per pack,
     awarded qty, free/bonus qty) — same input, tolerant header mapping,
     persisted on this device so it only needs to be uploaded once. */
  var MAP = null;
  function parseMapping(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "NUPCO Code", "NUPCO", "Generic Item Number", "Material"]),
      ti = findCol(H, ["Trade Name", "Brand Name", "Brand", "Commercial Name", "Trade"]),
      gi = findCol(H, ["Scientific Name", "Generic Name", "Scientific"]),
      hi = findCol(H, ["Hospital Code", "Hospital Item Number", "Hospital Number", "Local Code", "Hospital"]),
      mi = findCol(H, ["MODHS-CODE", "MODHS CODE", "MSD Code", "MSD Number", "MSD"]),
      cl = findCol(H, ["Classification", "التصنيف"]),
      pl = findCol(H, ["Priorty Level", "Priority Level", "الأولوية"]),
      pp = findCol(H, ["Pack Price", "Unit Pack Price", "سعر العلبة", "سعر العبوة", "Price"]),
      up = findCol(H, ["Units per Pack", "Pack Size", "Units/Pack", "عدد الحبات", "عدد الوحدات"]),
      aq = findCol(H, ["Awarded Qty", "Award Quantity", "Tender Qty", "كمية الترسية"]),
      fq = findCol(H, ["Free Qty", "Free Quantity", "Bonus Qty", "Bonus", "الكمية المجانية"]);
    if (ci < 0 || (ti < 0 && gi < 0 && hi < 0 && mi < 0 && cl < 0 && pp < 0)) throw new Error("cols");
    var byCode = {}, n = 0, priced = 0;
    function val(row, idx) { if (idx < 0 || row[idx] == null || row[idx] === "") return null; var v = typeof row[idx] === "number" ? normCode(row[idx]) : String(row[idx]).trim(); return v || null; }
    function numVal(row, idx) { if (idx < 0) return null; var v = parseFloat(row[idx]); return isFinite(v) && v > 0 ? v : null; }
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var rec = {
        trade: val(row, ti), sci: val(row, gi), hosp: val(row, hi), msd: val(row, mi),
        cls: val(row, cl), prio: val(row, pl),
        packPrice: numVal(row, pp), unitsPerPack: numVal(row, up), awardQty: numVal(row, aq), freeQty: fq < 0 ? null : (parseFloat(row[fq]) >= 0 ? parseFloat(row[fq]) : null)
      };
      if (rec.trade || rec.sci || rec.hosp || rec.msd || rec.cls || rec.packPrice) {
        byCode[code] = rec; n++;
        if (rec.packPrice) priced++;
      }
    }
    if (!n) throw new Error("empty-map");
    return { byCode: byCode, count: n, priced: priced };
  }
  function saveMap(map) { try { localStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch (e) {} }
  function loadMap() { try { var m = JSON.parse(localStorage.getItem(MAP_KEY)); return m && m.byCode ? m : null; } catch (e) { return null; } }
  function applyMap(rows) {
    // Identifiers from the mapping file win, but values already read from the
    // stock file itself (trade name, agent, scientific, MSD) are kept as the
    // fallback so search works even without an identifiers upload.
    var n = 0;
    rows.forEach(function (r) {
      var m = MAP && MAP.byCode[r.code];
      r.trade = (m && m.trade) || r.trade || null;
      r.sci = (m && m.sci) || r.sci || null;
      r.hosp = (m && m.hosp) || r.hosp || null;
      r.msd = (m && m.msd) || r.msd || null;
      r.cls = (m && m.cls) || null;
      r.prio = (m && m.prio) || null;
      r.packPrice = (m && m.packPrice) || null;
      r.unitsPerPack = (m && m.unitsPerPack) || null;
      // Government pricing is per smallest unit (pack price ÷ units per pack);
      // the dashboard mirrors the hospital system's unit price exactly.
      r.unitPrice = r.packPrice ? (r.unitsPerPack ? r.packPrice / r.unitsPerPack : r.packPrice) : null;
      r.effUnitPrice = (r.unitPrice && m.awardQty && m.freeQty != null) ? r.unitPrice * m.awardQty / (m.awardQty + m.freeQty) : null;
      // NUPCO quantities are counted in the dispensing UOM (TAB = tablets,
      // BT = bottles), i.e. the same smallest unit the unit price refers to.
      r.stockValue = r.unitPrice ? r.stock * r.unitPrice : null;
      // Search haystack: trade + scientific + hospital/MSD codes + MODHS
      // classification + agent, from whichever source provided them.
      r.alt = [r.trade, r.sci, r.hosp, r.msd, r.cls, r.agent].filter(Boolean).join(" ");
      if (m) n++;
    });
    return n;
  }
  function hasPrices() { return !!(MAP && MAP.priced); }

  /* The NUPCO stock report also carries the trade name, the agent/vendor and
     sometimes scientific/MSD identifiers per row — read them so planners can
     search by any of those without needing a separate identifiers file. */
  function parseStock(aoa, filename, wb) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["Generic Item Number", "NUPCO Material", "Material"]),
      ai = findCol(H, ["Total Available Qty", "Available Qty", "Total Available Quantity"]),
      de = findCol(H, ["Generic Item description", "Description", "Item Description"]),
      ti = findCol(H, ["Trade Item description", "Trade Item Description", "Trade Description", "Trade Name", "Brand Name", "Brand"]),
      vi = findCol(H, ["Vendor Name", "Agent Name", "Supplier Name", "اسم الوكيل", "الوكيل", "Vendor", "Agent", "Supplier", "Manufacturer"]),
      gi = findCol(H, ["Scientific Name", "Scientific"]),
      mi = findCol(H, ["MSD Code", "MSD"]);
    if (ci < 0) throw new Error("cols");
    if (ai < 0) ai = findCol(H, ["Total Qty", "Quantity"]);
    var byCode = {};
    function txt(row, idx) { if (idx < 0 || row[idx] == null || row[idx] === "") return null; var v = typeof row[idx] === "number" ? normCode(row[idx]) : String(row[idx]).trim(); return v || null; }
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null, trade: null, agent: null, sci: null, msd: null });
      rec.qty += num(row[ai]);
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
      if (!rec.trade) rec.trade = txt(row, ti);
      if (!rec.agent) rec.agent = txt(row, vi);
      if (!rec.sci) rec.sci = txt(row, gi);
      if (!rec.msd) rec.msd = txt(row, mi);
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
      rows.push({ code: code, desc: (w && w.desc) || (s && s.desc) || "", alt: "", uom: (w && w.uom) || "", total: total, avg: avg, stock: stock, cov: cov, qty9: avg * ORDER_COVER_MONTHS, sug: Math.max(0, avg * ORDER_COVER_MONTHS - stock), status: statusOf(cov == null ? 0 : cov, avg, inStock), inStock: inStock, moved: avg > 0, trend: null, trendPct: null, trade: (s && s.trade) || null, agent: (s && s.agent) || null, sci: (s && s.sci) || null, msd: (s && s.msd) || null });
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
    if (prev) rows.forEach(function (r) { var pa = prev.avgByCode[r.code]; if (pa === undefined) r.trend = { type: "new" }; else if (pa === 0) r.trend = r.avg > 0 ? { type: "new" } : null; else { r.trend = { type: "delta", pct: (r.avg - pa) / pa, prev: pa }; r.trendPct = r.trend.pct; } });
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
    var meta = { period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months, months_source: wd.months_source || "detected", stock_as_of: st.stock_as_of, source: "upload", baseline: wd.source === "baseline" };
    applyTrend(rows, meta);
    STATE.rows = rows; STATE.meta = meta; STATE.monthly = buildMonthly(wd, rows);
    afterData();
    var msg = LANG === "ar" ? ("تم تحليل " + fmtInt(rows.length) + " دواء · الفترة " + fmt1(meta.actual_months) + " شهر") : (fmtInt(rows.length) + " medicines analysed · period " + fmt1(meta.actual_months) + " months");
    if (wd.source === "baseline") msg += " · " + t("baseline_meta");
    toast(msg);
  }
  function loadSample() {
    var s = window.PSMMC_SAMPLE; if (!s) { toast(t("no_sample")); return; }
    STATE.rows = s.rows.map(function (r) { return { code: r.code, desc: r.desc, alt: "", uom: r.uom, total: r.total, avg: r.avg, stock: r.stock, cov: r.cov, qty9: r.qty9, sug: r.sug, status: r.status, inStock: r.inStock, moved: r.moved, trend: null, trendPct: null, trade: r.trade || null, hosp: r.hosp || null, msd: r.msd || null, agent: r.agent || null }; });
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
    STATE.sort = defaultSort();
    applyStatic(); render();
  }

  // ---------- view data ----------
  function viewBase() {
    if (STATE.view === "management") return STATE.rows.filter(function (r) { return r.inStock; });
    if (STATE.view === "averages") return STATE.rows.filter(function (r) { return r.moved || monthlySeriesFor(r.code); });
    return STATE.rows;
  }
  function filterCounts(base) { var c = { all: base.length, order_now: 0, no_movement: 0, not_in_stock: 0, warning: 0, ok: 0, instock: 0, outstock: 0, newitem: 0 }; base.forEach(function (r) { if (r.status === "order_now") c.order_now++; else if (r.status === "no_movement") c.no_movement++; else if (r.status === "not_in_stock") c.not_in_stock++; else if (r.status === "warning") c.warning++; else if (r.status === "ok") c.ok++; if (r.stock > 0) c.instock++; else c.outstock++; if (r.trend && r.trend.type === "new") c.newitem++; }); return c; }
  function applyFilter(base) {
    var f = STATE.filter;
    var rows = base.filter(function (r) {
      if (STATE.view === "planning") { return f === "all" ? true : r.status === f; }
      if (STATE.view === "averages") {
        if (f === "rising") return r.trendPct != null && r.trendPct > 0.10;
        if (f === "falling") return r.trendPct != null && r.trendPct < -0.10;
        if (f === "newitem") return !!(r.trend && r.trend.type === "new");
        return true;
      }
      if (f === "instock") return r.stock > 0;
      if (f === "outstock") return r.stock <= 0;
      return true;
    });
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
    rows.sort(function (a, b) { var va = a[k], vb = b[k]; if (k === "cov") { va = va == null ? Infinity : va; vb = vb == null ? Infinity : vb; } if (k === "trendPct" || k === "unitPrice" || k === "stockValue") { var nullDir = dir === 1 ? Infinity : -Infinity; va = va == null ? nullDir : va; vb = vb == null ? nullDir : vb; } if (k === "desc" || k === "code") { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0; } return (va - vb) * dir; });
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
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 3v4M16 3v4"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z"/><path d="M8.8 9.2c.3 2.6 3.4 5.6 6 6l1.4-1.4-2-1.3-1 .6c-.8-.4-1.9-1.5-2.3-2.3l.6-1-1.3-2-1.4 1.4z"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 8V4h10v4"/><rect x="4" y="8" width="16" height="8" rx="2"/><rect x="7" y="14" width="10" height="6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
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
  /* Monthly bar chart for the item drill-down. Highest month coral, lowest
     non-zero month blue, trailing partial month faded. Lives inside an LTR
     container so months always read chronologically left-to-right. */
  function barSVG(yms, vals, partialLast) {
    var n = vals.length, bw = 26, W = bw * n + 12, H = 162;
    var max = Math.max.apply(null, vals), maxI = vals.indexOf(max);
    var nz = vals.filter(function (v) { return v > 0; });
    var minNz = nz.length ? Math.min.apply(null, nz) : 0, minI = vals.indexOf(minNz);
    var out = "";
    for (var i = 0; i < n; i++) {
      var h = Math.max(4, 102 * (vals[i] / (max || 1)));
      var x = 6 + i * bw, y = 128 - h;
      var fill = i === maxI ? "#ee5138" : i === minI ? "#2456f5" : "#d3d5db";
      var op = partialLast && i === n - 1 ? ' opacity=".45"' : "";
      out += '<rect x="' + (x + 3) + '" y="' + rnd(y) + '" width="' + (bw - 8) + '" height="' + rnd(h) + '" rx="6" fill="' + fill + '"' + op + '/>';
      out += '<text x="' + (x + bw / 2 - 1) + '" y="146" text-anchor="middle" font-size="10" font-weight="700" fill="#959aa4">' + esc(ymLabel(yms[i])) + '</text>';
      out += '<text x="' + (x + bw / 2 - 1) + '" y="' + rnd(y - 7) + '" text-anchor="middle" font-size="9" font-weight="800" fill="#3b3e44">' + fmtM(vals[i]) + '</text>';
    }
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;max-width:' + (W * 2) + 'px" aria-hidden="true">' + out + '</svg>';
  }
  function ymLabel(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    try { return new Date(y, m - 1, 1).toLocaleDateString(LANG === "ar" ? "ar" : "en-GB", { month: "short" }); }
    catch (e) { return ym; }
  }
  function ymLabelLong(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    try { return new Date(y, m - 1, 1).toLocaleDateString(LANG === "ar" ? "ar" : "en-GB", { month: "long", year: "numeric" }); }
    catch (e) { return ym; }
  }
  /* Tiny inline trend line for the averages table. */
  function sparkSVG(vals) {
    if (!vals || vals.length < 2) return '<span class="muted">—</span>';
    var W = 96, H = 28, p = 3;
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), span = (max - min) || 1;
    var pts = vals.map(function (v, i) { return [p + (W - 2 * p) * i / (vals.length - 1), 4 + (H - 8) * (1 - (v - min) / span)]; });
    var last = pts[pts.length - 1];
    return '<svg viewBox="0 0 96 28" aria-hidden="true"><path d="' + smoothPath(pts) + '" fill="none" stroke="#c2c5cc" stroke-width="1.6"/><circle cx="' + rnd(last[0]) + '" cy="' + rnd(last[1]) + '" r="2.6" fill="#2456f5"/></svg>';
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
  /* Decision card: one large figure + a one-line supporting fact. */
  function cardDecision(label, valueHtml, icon, tileCls, subHtml, bodyHtml) {
    return '<div class="kcard span3"><div class="khead"><span class="tile ' + tileCls + '">' + icon + '</span>'
      + '<span class="ktxt"><span class="klabel">' + label + '</span><span class="kvalue num">' + valueHtml + '</span></span></div>'
      + (bodyHtml || (subHtml ? '<div class="ksub">' + subHtml + '</div>' : '')) + '</div>';
  }

  /* The four figures the planner reads before anything else, shared by the
     planning cards, the email/WhatsApp report, and the print sheet. */
  function decisionStats(base) {
    var s = { orderCount: 0, notStockCount: 0, orderUnits: 0, critical: 0, totalUnits: 0, sumAvg: 0, overallCov: null, momPct: null, momA: null, momB: null };
    base.forEach(function (r) {
      if (r.status === "order_now") { s.orderCount++; s.orderUnits += r.sug; }
      else if (r.status === "not_in_stock") { s.notStockCount++; s.orderUnits += r.sug; }
      if (r.moved && r.stock <= 0) s.critical++;
      s.totalUnits += r.stock;
      s.sumAvg += r.avg;
    });
    if (s.sumAvg > 0) s.overallCov = s.totalUnits / s.sumAvg;
    // Month-over-month delta of the last two COMPLETE months: the trailing
    // bucket is dropped when the analysis period ends before that month does.
    var mon = STATE.monthly;
    if (mon && mon.length >= 2) {
      var full = mon;
      var endIso = STATE.meta.period_end;
      if (endIso) {
        var last = mon[mon.length - 1];
        var endD = new Date(endIso);
        var lastDay = new Date(endD.getFullYear(), endD.getMonth() + 1, 0).getDate();
        if (ymOf(endIso) === last.ym && endD.getDate() < lastDay) full = mon.slice(0, -1);
      }
      if (full.length >= 2) {
        var a = full[full.length - 1], b = full[full.length - 2];
        if (b.total > 0) { s.momPct = (a.total - b.total) / b.total; s.momA = a.ym; s.momB = b.ym; }
      }
    }
    return s;
  }
  /* Order candidates ranked by urgency: moving items by ascending coverage
     (not-in-stock counts as zero), high consumers first inside a tie. */
  function orderCandidates(base) {
    return base.filter(function (r) { return r.moved && r.sug > 0; })
      .map(function (r) { var c = !r.inStock ? 0 : (r.cov == null ? Infinity : r.cov); return { r: r, covEff: c }; })
      .sort(function (a, b) { return a.covEff - b.covEff || b.r.avg - a.r.avg; });
  }
  function codeChip(value) {
    return '<span class="code-chip" data-copy="' + esc(value) + '">' + ICON.copy + '<span class="num">' + esc(value) + '</span></span>';
  }
  function cardOrderSheet(base) {
    var cand = orderCandidates(base), top = cand.slice(0, 7);
    var rows = top.map(function (x, i) {
      var r = x.r;
      return '<div class="os-row" data-code="' + esc(r.code) + '"><span class="os-rank num">' + (i + 1) + '</span>'
        + '<span class="os-main"><b>' + esc(r.desc) + '</b>' + codeChip(r.code) + '</span>'
        + '<span class="os-cov"><b class="num" style="color:' + (x.covEff < 1 ? "var(--coral)" : "var(--ink)") + '">' + fmt1(x.covEff === Infinity ? 0 : x.covEff) + '</b><i>' + t("os_cov_left") + '</i></span>'
        + '<span class="os-sug"><b class="num">' + fmtM(r.sug) + '</b><i>' + t("os_suggested") + '</i></span></div>';
    }).join("");
    return '<div class="kcard span12 ordersheet"><div class="ktitle-row"><span class="ktitle">' + t("os_title") + '</span><span class="kbadge num">' + top.length + " / " + fmtInt(cand.length) + '</span></div>'
      + rows
      + '<div class="os-actions">'
      + '<button type="button" class="btn-soft accent" id="osViewAll">' + ICON.list + t("os_view_all") + '</button>'
      + '<button type="button" class="btn-soft" id="osExport">' + ICON.download + t("os_export") + '</button>'
      + '<button type="button" class="btn-soft" id="osEmail">' + ICON.mail + t("os_email") + '</button>'
      + '<button type="button" class="btn-soft" id="osWa">' + ICON.wa + t("os_wa") + '</button>'
      + '<button type="button" class="btn-soft" id="osPrint">' + ICON.print + t("os_print") + '</button>'
      + '</div></div>';
  }

  // ---------- table pieces ----------
  var STATUS_COLOR = { order_now: "var(--coral)", warning: "var(--amber)", ok: "var(--blue)", no_movement: "var(--muted-2)", not_in_stock: "var(--indigo)" };
  function covCell(r) { if (r.status === "no_movement") return '<span class="muted">' + t("s_no_movement") + "</span>"; var pct = r.cov == null ? 0 : Math.min(100, (r.cov / 12) * 100); return '<span class="num">' + (r.cov == null ? "∞" : fmt1(r.cov)) + '</span><span class="covbar"><i style="width:' + pct.toFixed(0) + "%;background:" + (STATUS_COLOR[r.status] || "var(--blue)") + '"></i></span>'; }
  function trendCell(r) { if (!r.trend) return '<span class="trend flat">—</span>'; if (r.trend.type === "new") return '<span class="trend new">' + t("trend_new") + "</span>"; var p = r.trend.pct, cls = p > 0.001 ? "up" : p < -0.001 ? "down" : "flat", arr = p > 0.001 ? "▲" : p < -0.001 ? "▼" : "▬"; return '<span class="trend ' + cls + '" title="' + t("prev_avg") + " " + fmt1(r.trend.prev) + t("per_mo") + '">' + arr + " " + (p >= 0 ? "+" : "") + (p * 100).toFixed(0) + "%</span>"; }
  function pill(status) { return '<span class="pill ' + status + '">' + t("s_" + status) + "</span>"; }
  function codeCell(r) {
    var sub = [r.hosp, r.msd].filter(Boolean).join(" · ");
    return '<td class="code copyable" data-copy="' + esc(r.code) + '" title="' + t("cp_copied") + '">' + r.code + ' <span class="copyic">' + ICON.copy + '</span>' + (sub ? '<span class="subcode num">' + esc(sub) + "</span>" : "") + "</td>";
  }
  function descCell(r) {
    // Table rows stay lean: description + trade name only. The classification,
    // priority and agent live in the item card (openDetail) — and the search
    // haystack still matches them.
    var extra = r.trade || (r.sci && r.sci !== r.desc ? r.sci : null);
    return '<td class="desc">' + esc(r.desc) + (extra ? '<i class="tradename">' + esc(extra) + "</i>" : "") + "</td>";
  }
  function th(key, label, right) { var s = STATE.sort, on = s.key === key, arrow = on ? (s.dir === "asc" ? "▲" : "▼") : "↕"; return '<th class="sortable' + (on ? " sorted" : "") + (right ? " right" : "") + '" data-sort="' + key + '">' + label + ' <span class="arrow">' + arrow + "</span></th>"; }
  function fchip(key, label, count, icon) { return '<button class="fchip' + (STATE.filter === key ? " is-active" : "") + '" data-filter="' + key + '">' + (icon ? '<span class="fic">' + icon + '</span>' : "") + label + ' <span class="badge num">' + fmtInt(count || 0) + "</span></button>"; }
  function toolbar(filters) { return '<div class="toolbar"><div class="search">' + ICON.search + '<input id="searchInput" type="search" placeholder="' + esc(t("search_ph")) + '" value="' + esc(STATE.search) + '"/></div>' + filters + "</div>"; }
  var SORT_LABEL = { code: "c_code", desc: "c_desc", total: "c_total", avg: "c_avg", stock: "c_stock", cov: "c_cov", qty9: "c_qty9", sug: "c_sug", trendPct: "c_delta", unitPrice: "pr_unit_price", stockValue: "c_value" };
  function defaultSort() {
    if (STATE.view === "planning") return { key: "cov", dir: "asc" };
    if (STATE.view === "averages") return { key: "avg", dir: "desc" };
    return { key: "stock", dir: "desc" };
  }
  function tableCard(head, body, shown, total) {
    var sortKey = SORT_LABEL[STATE.sort.key] ? t(SORT_LABEL[STATE.sort.key]) : STATE.sort.key;
    return '<div class="tablecard"><div class="tablewrap"><table>' + head + "<tbody>" + (body || '<tr><td colspan="12" class="muted" style="padding:34px;text-align:center">' + t("no_rows") + "</td></tr>") + "</tbody></table></div><div class=\"tfoot\"><span>" + t("showing") + ' <b class="num">' + fmtInt(shown) + "</b> " + t("of") + ' <b class="num">' + fmtInt(total) + "</b> " + t("items") + "</span><span>" + t("sorted_by") + " " + sortKey + " " + (STATE.sort.dir === "asc" ? "↑" : "↓") + "</span></div></div>";
  }

  // ---------- views ----------
  function renderPlanning(base, c) {
    var s = decisionStats(base);
    var deltaBadge = s.momPct == null ? "" : '<span class="kdelta ' + (s.momPct >= 0 ? "up" : "down") + ' num">' + (s.momPct >= 0 ? "▲ +" : "▼ ") + (s.momPct * 100).toFixed(0) + "%</span>";
    var consumptionBody = STATE.monthly && STATE.monthly.length > 1
      ? '<div class="kbody">' + areaSVG(STATE.monthly.map(function (m) { return m.total; })) + '<span class="kinset"><b>' + (deltaBadge || '<span class="num">—</span>') + '</b><i>' + (s.momPct == null ? "" : esc(tFmt("vs_prev_month", { a: ymLabel(s.momA + "-01") || s.momA, b: ymLabel(s.momB + "-01") || s.momB }))) + '</i></span></div>'
      : '<div class="ksub">' + t("chart_nodates") + '</div>';
    var cards = '<div class="cards">'
      + cardDecision(t("k_need_order"), fmtInt(s.orderCount) + ' <small>' + t("items_word") + '</small>', ICON.alert, "tile-coral", tFmt("k_need_order_sub", { u: fmtM(s.orderUnits), n: fmtInt(s.notStockCount) }))
      + cardDecision(t("k_critical"), fmtInt(s.critical) + ' <small>' + t("items_word") + '</small>', ICON.ban, "tile-coral", t("k_critical_sub"))
      + cardDecision(t("k_total_units"), fmtM(s.totalUnits) + ' <small>' + t("units_word") + '</small>', ICON.box, "tile-lav", s.overallCov == null ? "—" : tFmt("k_overall_cov", { m: fmt1(s.overallCov) }))
      + cardDecision(t("k_monthly_use"), fmtM(s.sumAvg) + '<small>' + t("per_mo") + '</small>', ICON.pulse, "tile-gray", null, consumptionBody)
      + cardOrderSheet(base)
      + cardStream(t("k_monthly_title"), STATE.monthly)
      + '</div>';
    var secline = '<div class="secline"><span class="secbadge">' + t("k_watch") + ' <b class="num">' + fmtInt(c.warning) + '</b></span><span class="secbadge">' + t("k_nomove") + ' <b class="num">' + fmtInt(c.no_movement) + '</b></span><span class="secbadge">' + t("s_ok") + ' <b class="num">' + fmtInt(c.ok) + '</b></span></div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all"), c.all, ICON.grid) + fchip("order_now", t("f_order_now"), c.order_now, ICON.alert) + fchip("warning", t("f_watch"), c.warning, ICON.clock) + fchip("no_movement", t("f_no_movement"), c.no_movement, ICON.pause) + fchip("not_in_stock", t("f_not_in_stock"), c.not_in_stock, ICON.ban) + copyAllChip() + "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("total", t("c_total"), true) + th("avg", t("c_avg"), true) + "<th>" + t("c_trend") + "</th>" + th("stock", t("c_stock"), true) + th("cov", t("c_cov")) + "<th>" + t("c_status") + "</th>" + th("qty9", t("c_qty9"), true) + th("sug", t("c_sug"), true) + "</tr></thead>";
    var body = rows.map(function (r) { return '<tr data-code="' + esc(r.code) + '">' + codeCell(r) + descCell(r) + "<td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.total) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td>" + trendCell(r) + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + pill(r.status) + "</td><td class=\"right num\">" + fmtInt(r.qty9) + "</td><td class=\"right num sug\">" + fmtInt(r.sug) + "</td></tr>"; }).join("");
    return cards + secline + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }
  function copyAllChip() {
    return '<button type="button" class="fchip" id="copyAllCodes"><span class="fic">' + ICON.copy + '</span>' + t("cp_copy_all") + '</button>';
  }
  function renderManagement(base, c) {
    var totalUnits = base.reduce(function (s, r) { return s + r.stock; }, 0);
    var orderNow = base.filter(function (r) { return r.status === "order_now"; }).length;
    var avgPerItem = base.length ? totalUnits / base.length : 0;
    var buckets = [0, 0, 0, 0, 0, 0, 0, 0];
    base.forEach(function (r) { buckets[r.stock <= 0 ? 0 : Math.min(7, Math.floor(Math.log(r.stock) / Math.LN10) + 1)]++; });
    var hiIdx = 0, hiVal = -1;
    buckets.forEach(function (v, i) { if (v > hiVal) { hiVal = v; hiIdx = i; } });
    var valueCard;
    if (hasPrices()) {
      var totalVal = 0, frozenVal = 0, priced = 0;
      base.forEach(function (r) {
        if (r.stockValue == null) return;
        priced++;
        totalVal += r.stockValue;
        if (r.status === "no_movement" || (r.cov != null && r.cov > 12)) frozenVal += r.stockValue;
      });
      valueCard = cardMini(t("pr_total_value"), fmtInt(priced) + " " + t("pr_priced"), "tile-amber", ICON.cash, fmtM(totalVal) + " · " + t("pr_frozen") + " " + fmtM(frozenVal), t("pr_frozen_sub"), "span6");
    } else {
      valueCard = cardMini(t("k_value"), "—", "tile-gray", ICON.cash, "—", t("k_value_sub"), "span6");
    }
    var cards = '<div class="cards">'
      + cardHero(t("k_units"), fmtM(totalUnits), ICON.box, fmtInt(base.length), t("items"))
      + cardTicks(t("k_instock"), ICON.box, fmtInt(base.length), buckets, hiIdx, fmtM(avgPerItem), t("mg_avg_item"), "")
      + cardMini(t("k_out"), fmtInt(c.outstock), "tile-coral", ICON.ban, t("ns_value"), t("out_sub"), "")
      + cardTicks(t("k_median"), ICON.gauge, medianCovHtml(base), medianBuckets(base).counts, medianBuckets(base).hiIdx, medianCovVal(base), t("mo"), "")
      + cardMini(t("k_reorder"), fmtInt(orderNow), "tile-amber", ICON.alert, t("re_value"), t("re_sub"), "span6")
      + valueCard
      + '</div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all_instock"), c.instock + c.outstock, ICON.box) + fchip("instock", t("f_available"), c.instock, ICON.check) + fchip("outstock", t("f_outstock"), c.outstock, ICON.ban) + copyAllChip() + "</div>";
    var rows = applyFilter(base);
    var priceTh = hasPrices() ? th("unitPrice", t("pr_unit_price"), true) : "";
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("stock", t("c_avail"), true) + th("cov", t("c_cov")) + "<th>" + t("c_status") + "</th>" + th("avg", t("c_use"), true) + priceTh + th("stockValue", t("c_value"), true) + "</tr></thead>";
    var body = rows.map(function (r) {
      var priceTd = hasPrices() ? '<td class="right num">' + (r.unitPrice == null ? "—" : fmt2(r.unitPrice)) + "</td>" : "";
      var valTd = '<td class="right ' + (r.stockValue == null ? "muted" : "num") + '">' + (r.stockValue == null ? "—" : fmtInt(r.stockValue)) + "</td>";
      return '<tr data-code="' + esc(r.code) + '">' + codeCell(r) + descCell(r) + "<td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + pill(r.status) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td>" + priceTd + valTd + "</tr>";
    }).join("");
    return cards + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }
  function medianBuckets(base) {
    var covs = []; base.forEach(function (r) { if (r.inStock && r.moved && r.cov != null) covs.push(r.cov); });
    var med = median(covs);
    var counts = []; for (var i = 0; i < 13; i++) counts.push(0);
    covs.forEach(function (v) { counts[Math.min(12, Math.floor(v))]++; });
    return { counts: counts, hiIdx: med == null ? -1 : Math.min(12, Math.floor(med)), med: med };
  }
  function medianCovHtml(base) { var m = medianBuckets(base).med; return (m == null ? "—" : fmt1(m)) + ' <small>' + t("mo") + '</small>'; }
  function medianCovVal(base) { var m = medianBuckets(base).med; return m == null ? "—" : fmt1(m); }

  /* Averages view: every moving item with its saved-history sparkline,
     monthly average and Δ% vs the previous upload. */
  function renderAverages(base, c) {
    var rising = 0, falling = 0;
    base.forEach(function (r) { if (r.trendPct != null) { if (r.trendPct > 0.10) rising++; else if (r.trendPct < -0.10) falling++; } });
    var hm = histMonths();
    var secline = '<div class="secline">'
      + (hm ? '<span class="secbadge">' + t("av_hist") + ' <b class="num">' + fmtInt(hm) + " " + t("mo") + '</b></span>' : "")
      + '<span class="secbadge">' + t("av_moving") + ' <b class="num">' + fmtInt(base.length) + '</b></span>'
      + '<span class="secbadge" style="color:var(--coral)">▲ ' + t("av_rising") + ' <b class="num">' + fmtInt(rising) + '</b></span>'
      + '<span class="secbadge" style="color:var(--blue)">▼ ' + t("av_falling") + ' <b class="num">' + fmtInt(falling) + '</b></span></div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all"), c.all, ICON.grid) + fchip("rising", "▲ " + t("f_rising"), rising) + fchip("falling", "▼ " + t("f_falling"), falling) + fchip("newitem", t("f_new"), c.newitem) + copyAllChip() + "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_spark") + "</th>" + th("avg", t("c_avg"), true) + th("trendPct", t("c_delta")) + th("stock", t("c_stock"), true) + "<th>" + t("c_status") + "</th></tr></thead>";
    var body = rows.map(function (r) {
      var ser = monthlySeriesFor(r.code);
      return '<tr data-code="' + esc(r.code) + '">' + codeCell(r) + descCell(r) + '<td class="sparkcell">' + sparkSVG(ser && ser.vals) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td>" + trendCell(r) + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + pill(r.status) + "</td></tr>";
    }).join("");
    return secline + toolbar(filters) + tableCard(head, body, rows.length, base.length) + '<p class="dt-note" style="margin:10px 4px">' + t("av_tap") + '</p>';
  }

  /* Item drill-down: full monthly bar history (seasonality), stats, prices
     and the MODHS classification, opened from any table or order-sheet row. */
  function renderDetail(code) {
    var r = null;
    STATE.rows.forEach(function (x) { if (x.code === code) r = x; });
    if (!r) return "";
    var ser = monthlySeriesFor(code);
    var partial = false;
    if (ser && STATE.meta.period_end) {
      var endIso = STATE.meta.period_end, endD = new Date(endIso);
      var lastDay = new Date(endD.getFullYear(), endD.getMonth() + 1, 0).getDate();
      partial = ser.yms[ser.yms.length - 1] === ymOf(endIso) && endD.getDate() < lastDay;
    }
    var chips = codeChip(r.code) + (r.hosp ? codeChip(r.hosp) : "") + (r.msd ? codeChip(r.msd) : "") + pill(r.status);
    var clsRow = (r.cls || r.prio || r.agent)
      ? '<div class="dt-codes">' + (r.cls ? '<span class="callout lo">' + esc(r.cls) + '<i>' + t("dt_class") + '</i></span>' : "") + (r.prio ? '<span class="callout ' + (/LIFE/i.test(r.prio) ? "hi" : "lo") + '">' + esc(r.prio) + '<i>' + t("dt_priority") + '</i></span>' : "") + (r.agent ? '<span class="callout lo">' + esc(r.agent) + '<i>' + t("dt_agent") + '</i></span>' : "") + '</div>'
      : "";
    var stats = '<div class="statgrid">'
      + '<span class="stat"><b class="num">' + fmt1(r.avg) + '</b><i>' + t("dt_avg") + '</i></span>'
      + '<span class="stat"><b>' + trendCell(r) + '</b><i>' + t("dt_vs_prev") + '</i></span>'
      + '<span class="stat"><b class="num">' + fmtInt(r.stock) + '</b><i>' + t("dt_stock") + '</i></span>'
      + '<span class="stat"><b class="num">' + (r.inStock ? (r.cov == null ? "∞" : fmt1(r.cov)) : "0.0") + '</b><i>' + t("dt_cov") + '</i></span>'
      + '<span class="stat"><b class="num" style="color:var(--blue)">' + fmtInt(r.sug) + '</b><i>' + t("dt_sug") + '</i></span>'
      + '<span class="stat"><b class="num">' + fmtInt(r.total) + '</b><i>' + t("dt_total_hist") + '</i></span>'
      + '</div>';
    /* The price slot is always present in the card: real figures when a
       prices file is loaded, an explicit "add prices to activate" hint
       otherwise — so planners know where the rial numbers will appear. */
    var priceBlock;
    if (r.packPrice) {
      priceBlock = '<div class="priceblock">'
        + '<span class="pb-item"><b class="num">' + fmt2(r.packPrice) + '</b><i>' + t("pr_pack_price") + '</i></span>'
        + (r.unitsPerPack ? '<span class="pb-item"><b class="num">' + fmtInt(r.unitsPerPack) + '</b><i>' + t("pr_units_per_pack") + '</i></span>' : "")
        + '<span class="pb-item"><b class="num">' + fmt2(r.unitPrice) + '</b><i>' + t("pr_unit_price") + '</i></span>'
        + (r.effUnitPrice ? '<span class="pb-item"><b class="num" style="color:var(--blue)">' + fmt2(r.effUnitPrice) + '</b><i>' + t("pr_eff_price") + '</i></span>' : "")
        + (r.stockValue != null ? '<span class="pb-item"><b class="num">' + fmtM(r.stockValue) + '</b><i>' + t("pr_stock_value") + '</i></span>' : "")
        + '</div>';
    } else {
      priceBlock = '<div class="priceblock is-empty">'
        + '<span class="pb-item"><b>—</b><i>' + t("pr_pack_price") + '</i></span>'
        + '<span class="pb-item"><b>—</b><i>' + t("pr_units_per_pack") + '</i></span>'
        + '<span class="pb-item"><b>—</b><i>' + t("pr_unit_price") + '</i></span>'
        + '<span class="pb-item"><b>—</b><i>' + t("pr_stock_value") + '</i></span>'
        + '<span class="pb-hint">' + t("pr_hint") + '</span>'
        + '</div>';
    }
    var chart, callouts = "", note = "";
    if (ser && ser.vals.length >= 2) {
      var max = Math.max.apply(null, ser.vals), maxYm = ser.yms[ser.vals.indexOf(max)];
      var nz = ser.vals.filter(function (v) { return v > 0; });
      var minNz = nz.length ? Math.min.apply(null, nz) : 0, minYm = ser.yms[ser.vals.indexOf(minNz)];
      chart = '<div class="barchart">' + barSVG(ser.yms, ser.vals, partial) + '</div>';
      callouts = '<div class="callouts">'
        + '<span class="callout hi">▲ ' + t("dt_highest") + ": " + ymLabelLong(maxYm) + ' <i class="num">(' + fmtM(max) + ')</i></span>'
        + '<span class="callout lo">▼ ' + t("dt_lowest") + ": " + ymLabelLong(minYm) + ' <i class="num">(' + fmtM(minNz) + ')</i></span></div>';
      if (partial) note = '<p class="dt-note">' + t("dt_partial_note") + '</p>';
    } else {
      chart = '<div class="barchart" style="padding:22px;text-align:center;color:var(--muted);font-size:12.5px;font-weight:700">' + t("dt_no_history") + '</div>';
    }
    return '<div class="dt-head"><span class="tile tile-lav tile-lg">' + ICON.pulse + '</span>'
      + '<span class="ktxt"><div class="dt-title">' + esc(r.desc) + (r.trade ? ' <i class="tradename">' + esc(r.trade) + (r.sci && r.sci !== r.desc ? " · " + esc(r.sci) : "") + '</i>' : (r.sci && r.sci !== r.desc ? ' <i class="tradename">' + esc(r.sci) + '</i>' : '')) + '</div>'
      + '<div class="dt-codes">' + chips + '</div>' + clsRow + '</span>'
      + '<button type="button" class="dt-close" id="dtClose">✕</button></div>'
      + stats + priceBlock + chart + callouts + note;
  }
  function openDetail(code) {
    if (!STATE.rows.length) return;
    STATE.detail = code;
    openModal(renderDetail(code), "modal-sheet");
    var x = $("dtClose");
    if (x) x.onclick = closeModal;
    wireCopyChips($("modalCard"));
  }
  function fmt2(n) { return (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render() {
    document.querySelectorAll(".tab").forEach(function (tb) {
      var active = tb.dataset.view === STATE.view;
      tb.classList.toggle("is-active", active);
      tb.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (!STATE.rows.length) return;
    var base = viewBase(), c = filterCounts(base);
    $("content").innerHTML = STATE.view === "planning" ? renderPlanning(base, c) : STATE.view === "averages" ? renderAverages(base, c) : renderManagement(base, c);
    wireDynamic();
  }
  function wireCopyChips(root) {
    (root || document).querySelectorAll("[data-copy]").forEach(function (el) {
      el.onclick = function (ev) { ev.stopPropagation(); copyText(this.getAttribute("data-copy")); };
    });
  }
  function wireDynamic() {
    var si = $("searchInput");
    if (si) si.oninput = function () { STATE.search = this.value.trim(); var pos = this.selectionStart; render(); var s2 = $("searchInput"); if (s2) { s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (e) {} } };
    document.querySelectorAll(".fchip[data-filter]").forEach(function (b) { b.onclick = function () { STATE.filter = this.dataset.filter; render(); }; });
    document.querySelectorAll("th.sortable").forEach(function (h) { h.onclick = function () { var k = this.dataset.sort; if (STATE.sort.key === k) STATE.sort.dir = STATE.sort.dir === "asc" ? "desc" : "asc"; else STATE.sort = { key: k, dir: (k === "desc" || k === "code") ? "asc" : "desc" }; render(); }; });
    wireCopyChips($("content"));
    document.querySelectorAll("#content [data-code]").forEach(function (el) {
      el.onclick = function (ev) {
        // A click on a copy target inside the row is handled above.
        if (ev.target.closest && ev.target.closest("[data-copy]")) return;
        openDetail(this.getAttribute("data-code"));
      };
    });
    var va = $("osViewAll"); if (va) va.onclick = function () { STATE.filter = "order_now"; render(); var tb = document.querySelector(".toolbar"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); };
    var oe = $("osExport"); if (oe) oe.onclick = exportOrderSheet;
    var om = $("osEmail"); if (om) om.onclick = emailReport;
    var ow = $("osWa"); if (ow) ow.onclick = waReport;
    var op = $("osPrint"); if (op) op.onclick = printOrderSheet;
    var ca = $("copyAllCodes"); if (ca) ca.onclick = copyAllCodes;
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
      $("metaPeriod").textContent = t("period") + ": " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + (STATE.meta.months_source === "manual" ? " · " + t("manual_mark") : "") + ")" + (STATE.meta.baseline ? " · " + t("baseline_meta") : "");
      $("metaStock").textContent = t("stock_as_of") + ": " + prettyDate(STATE.meta.stock_as_of);
    } else { $("metaPeriod").textContent = "—"; $("metaStock").textContent = "—"; }
    var mc = $("metaCount");
    if (STATE.rows.length) { mc.hidden = false; mc.textContent = fmtInt(STATE.rows.length) + " " + t("meds_word"); }
    else mc.hidden = true;
  }

  // ---------- export ----------
  function exportExcel() {
    if (!STATE.rows.length) return;
    var rows = applyFilter(viewBase()), aoa, name, sheet;
    var anyTrade = STATE.rows.some(function (r) { return r.trade; }), anyAgent = STATE.rows.some(function (r) { return r.agent; }), anyCls = STATE.rows.some(function (r) { return r.cls; });
    var mapCols = (MAP || anyTrade ? [t("c_trade")] : []).concat(MAP ? [t("c_hosp"), t("c_msd")] : []).concat(anyAgent ? [t("c_agent")] : []).concat(anyCls ? [t("c_class")] : []);
    function mapVals(r) { return (MAP || anyTrade ? [r.trade || ""] : []).concat(MAP ? [r.hosp || "", r.msd || ""] : []).concat(anyAgent ? [r.agent || ""] : []).concat(anyCls ? [r.cls || ""] : []); }
    var priceCols = hasPrices() ? [t("pr_unit_price"), t("c_value")] : [];
    function priceVals(r) { return hasPrices() ? [r.unitPrice == null ? "" : Math.round(r.unitPrice * 100) / 100, r.stockValue == null ? "" : Math.round(r.stockValue)] : []; }
    if (STATE.view === "planning") {
      aoa = [[t("c_code"), t("c_desc")].concat(mapCols, [t("c_uom"), t("c_total"), t("c_avg"), t("c_stock"), t("c_cov"), t("c_status"), t("c_sug")], priceCols)];
      rows.forEach(function (r) { aoa.push([r.code, r.desc].concat(mapVals(r), [r.uom, Math.round(r.total), Math.round(r.avg * 10) / 10, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), Math.round(r.sug)], priceVals(r))); });
      name = "PSMMC_reorder_" + STATE.filter + "_" + (STATE.meta.period_end || "") + ".xlsx"; sheet = "Reorder";
    } else if (STATE.view === "averages") {
      aoa = [[t("c_code"), t("c_desc")].concat(mapCols, [t("c_avg"), t("c_delta"), t("c_stock"), t("c_status")])];
      rows.forEach(function (r) { aoa.push([r.code, r.desc].concat(mapVals(r), [Math.round(r.avg * 10) / 10, r.trendPct == null ? "" : Math.round(r.trendPct * 1000) / 10 + "%", Math.round(r.stock), t("s_" + r.status)])); });
      name = "PSMMC_averages_" + (STATE.meta.period_end || "") + ".xlsx"; sheet = "Averages";
    } else {
      aoa = [[t("c_code"), t("c_desc")].concat(mapCols, [t("c_uom"), t("c_avail"), t("c_cov"), t("c_status"), t("c_use")], priceCols)];
      rows.forEach(function (r) { aoa.push([r.code, r.desc].concat(mapVals(r), [r.uom, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), Math.round(r.avg * 10) / 10], priceVals(r))); });
      name = "PSMMC_stock_" + STATE.filter + "_" + (STATE.meta.stock_as_of || "") + ".xlsx"; sheet = "Stock";
    }
    var ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, name);
    toast((LANG === "ar" ? "تم تصدير " : "Exported ") + fmtInt(rows.length) + (LANG === "ar" ? " صف → " : " rows → ") + name);
  }
  /* Order-sheet export: every order candidate (order_now + moving items that
     are not in stock), urgency-sorted, with prices when available. */
  function exportOrderSheet() {
    if (!STATE.rows.length) return;
    var cand = orderCandidates(STATE.rows);
    var priceCols = hasPrices() ? [t("pr_unit_price")] : [];
    var aoa = [[t("c_code"), t("c_desc"), t("c_trade"), t("c_uom"), t("c_avg"), t("c_stock"), t("c_cov"), t("c_sug")].concat(priceCols)];
    cand.forEach(function (x) {
      var r = x.r;
      aoa.push([r.code, r.desc, r.trade || "", r.uom, Math.round(r.avg * 10) / 10, Math.round(r.stock), Math.round((x.covEff === Infinity ? 0 : x.covEff) * 10) / 10, Math.round(r.sug)].concat(hasPrices() ? [r.unitPrice == null ? "" : Math.round(r.unitPrice * 100) / 100] : []));
    });
    var ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OrderSheet");
    var name = "PSMMC_order_sheet_" + (STATE.meta.period_end || "") + ".xlsx";
    XLSX.writeFile(wb, name);
    toast((LANG === "ar" ? "تم تصدير " : "Exported ") + fmtInt(cand.length) + (LANG === "ar" ? " صف → " : " rows → ") + name);
  }

  /* ---------- share: email / WhatsApp / print ----------
     The report body is the four decision figures plus the items below one
     month of coverage. URL length is the binding constraint (mailto bodies
     truncate around 2 KB encoded on iOS), so lines are added while the
     ENCODED length stays inside the budget and the rest is summarised. */
  function reportText(budget) {
    var base = STATE.rows, s = decisionStats(base);
    var nl = "\n";
    var head = t("em_summary") + " · " + prettyDate(STATE.meta.period_end) + nl
      + "• " + t("em_order") + ": " + fmtInt(s.orderCount) + nl
      + "• " + t("em_critical") + ": " + fmtInt(s.critical) + nl
      + "• " + t("em_stocku") + ": " + fmtM(s.totalUnits) + nl
      + "• " + t("em_monthly") + ": " + fmtM(s.sumAvg) + t("per_mo") + nl + nl
      + t("em_below1") + nl;
    var urgent = orderCandidates(base).filter(function (x) { return x.covEff < 1; });
    var body = head, shown = 0;
    for (var i = 0; i < urgent.length; i++) {
      var r = urgent[i].r;
      var line = "• " + r.code + " — " + r.desc.slice(0, 28) + " — " + fmt1(urgent[i].covEff) + " " + t("mo") + " — " + t("c_sug") + " " + fmtInt(r.sug) + nl;
      if (encodeURIComponent(body + line).length > budget) break;
      body += line; shown++;
    }
    if (shown < urgent.length) body += "+" + fmtInt(urgent.length - shown) + " " + t("em_more") + nl;
    body += nl + t("em_full_sheet");
    return body;
  }
  function emailReport() {
    if (!STATE.rows.length) return;
    var subj = t("em_subject") + " · " + prettyDate(STATE.meta.period_end);
    location.href = "mailto:?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(reportText(1800));
  }
  function waReport() {
    if (!STATE.rows.length) return;
    var txt = t("em_subject") + " · " + prettyDate(STATE.meta.period_end) + "\n\n" + reportText(1500);
    window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
  }
  /* Print: render the order sheet into a print-only section and invoke the
     browser's print dialog (PDF on iOS via the share sheet). */
  function printOrderSheet() {
    if (!STATE.rows.length) return;
    var cand = orderCandidates(STATE.rows);
    var s = decisionStats(STATE.rows);
    var old = document.getElementById("printSheet");
    if (old) old.parentNode.removeChild(old);
    var div = document.createElement("div");
    div.id = "printSheet";
    div.className = "print-sheet";
    div.dir = LANG === "ar" ? "rtl" : "ltr";
    var rowsHtml = cand.map(function (x, i) {
      var r = x.r;
      return "<tr><td>" + (i + 1) + "</td><td class=\"num\">" + r.code + "</td><td>" + esc(r.desc) + (r.trade ? " — " + esc(r.trade) : "") + "</td><td>" + esc(r.uom || "") + "</td><td class=\"num\">" + fmt1(r.avg) + "</td><td class=\"num\">" + fmtInt(r.stock) + "</td><td class=\"num\">" + fmt1(x.covEff === Infinity ? 0 : x.covEff) + "</td><td class=\"num\"><b>" + fmtInt(r.sug) + "</b></td>" + (hasPrices() ? "<td class=\"num\">" + (r.unitPrice == null ? "—" : fmt2(r.unitPrice)) + "</td>" : "") + "</tr>";
    }).join("");
    div.innerHTML = "<h1>" + t("app_sub") + "</h1><h2>" + t("prn_title") + " — " + t("em_order") + " " + fmtInt(s.orderCount + s.notStockCount) + "</h2>"
      + "<p>" + t("prn_date") + ": " + prettyDate(isoDate(new Date())) + " · " + t("prn_period") + ": " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + ")</p>"
      + "<table><thead><tr><th>#</th><th>" + t("c_code") + "</th><th>" + t("c_desc") + "</th><th>" + t("c_uom") + "</th><th>" + t("c_avg") + "</th><th>" + t("c_stock") + "</th><th>" + t("c_cov") + "</th><th>" + t("c_sug") + "</th>" + (hasPrices() ? "<th>" + t("pr_unit_price") + "</th>" : "") + "</tr></thead><tbody>" + rowsHtml + "</tbody></table>"
      + "<p class=\"sign\">" + t("prn_sign") + ": ______________________________</p>";
    document.body.appendChild(div);
    window.print();
  }
  function copyAllCodes() {
    var rows = applyFilter(viewBase());
    if (!rows.length) { toast(t("cp_none")); return; }
    var codes = rows.map(function (r) { return r.code; }).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codes).then(function () { toast(t("cp_copied") + ": " + fmtInt(rows.length)); }, function () { legacyCopy(codes); toast(t("cp_copied") + ": " + fmtInt(rows.length)); });
    } else { legacyCopy(codes); toast(t("cp_copied") + ": " + fmtInt(rows.length)); }
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
    migrateHistory();
    MAP = loadMap();
    if (MAP) $("lblMp").classList.add("is-baseline");
    applyStatic();
    $("langBtn").onclick = function () { setLang(LANG === "ar" ? "en" : "ar"); };
    document.querySelectorAll(".tab").forEach(function (tb) { tb.onclick = function () { STATE.view = this.dataset.view; STATE.filter = "all"; STATE.search = ""; STATE.sort = defaultSort(); render(); }; });
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
            // The chosen month count drives every monthly average, so the
            // user confirms (or overrides) it before anything is computed
            // or persisted.
            showPeriodConfirm(wd, function (months, src) {
              wd.actual_months = months;
              wd.months_source = src;
              STATE.raw.withdrawals = wd;
              saveBaseline(wd);
              mergeHistory(wd);
              STATE.wdName = null;
              $("lblWd").classList.remove("is-baseline");
              $("lblWd").classList.add("is-loaded");
              applyStatic();
              tryCompute();
            });
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
          // Merge into the saved mapping (per code, per field) so the MODHS
          // catalog can be uploaded once and a prices file added later
          // without rebuilding one combined file.
          var byCode = (MAP && MAP.byCode) || {};
          Object.keys(parsed.byCode).forEach(function (c) {
            var src = parsed.byCode[c], dst = byCode[c] || (byCode[c] = {});
            Object.keys(src).forEach(function (k) { if (src[k] != null) dst[k] = src[k]; });
          });
          var count = Object.keys(byCode).length, priced = 0;
          Object.keys(byCode).forEach(function (c) { if (byCode[c].packPrice) priced++; });
          MAP = { byCode: byCode, count: count, priced: priced, name: f.name, savedAt: new Date().toISOString() };
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

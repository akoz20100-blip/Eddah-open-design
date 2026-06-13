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
  /* Effective-stock rules (owner spec v3): hand-dispensed forms stop being
     dispensable GRACE_MONTHS before expiry (hospital policy: nothing with
     ≤ 3 months shelf life is handed to a patient); parenteral forms (vials,
     ampules, injections, syringes, IV bags) are consumed in-hospital until
     expiry. Effective coverage above EXCESS_MONTHS classifies as overstock. */
  var GRACE_MONTHS = 3, EXCESS_MONTHS = 13;
  /* UOM tokens marking parenteral forms across the real exports' spellings:
     planner file (VIAL/AMPULE/INJECTION/SYRINGE/BAG), withdrawals file
     (VIA/AMP/INJ/PFS/BAG), stock file (VL/AP/IJ/PS/BG). Unknown UOM → no
     grace (the conservative raw behavior). */
  var INJECTABLE_UOMS = { VIAL: 1, VAIL: 1, VIA: 1, VL: 1, AMP: 1, AMPULE: 1, AMPOULE: 1, AP: 1, INJ: 1, IJ: 1, INJECTION: 1, SYRINGE: 1, PFS: 1, PS: 1, BAG: 1, BG: 1, INFUSION: 1, IV: 1 };
  var SNAP_KEY = "psmmc_snapshots_v1", LANG_KEY = "psmmc_lang", BASE_KEY = "psmmc_baseline_v1", MAP_KEY = "psmmc_idmap_v1";
  var HIST_KEY = "psmmc_history_v1", HIST_MAX_MONTHS = 24;
  var BUDGET_KEY = "psmmc_budget_v1", PO_KEY = "psmmc_po_v1", ORD_KEY = "psmmc_orders_v1", TH_KEY = "psmmc_threshold_v1";
  var WATCH_KEY = "psmmc_watch_v1", PLANNER_KEY = "psmmc_planner_v1", LEDGER_KEY = "psmmc_orders_ledger_v1", SHAREK_KEY = "psmmc_sharek_v1";
  var UPL_KEY = "psmmc_upl_collapsed_v1"; // upload-bar collapse state (wave 6 A1; default collapsed)
  // Order-status semantics for the procurement ledger (Arabic NUPCO statuses
  // + English fallbacks): rejected/cancelled rows are dropped on import, an
  // "open order" is anything not rejected and not yet delivered.
  var MONTHS3 = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function isOrderRejected(s) { return /إلغاء|ملغ|رفض|مرفوض|إرجاع|cancel|reject|return/i.test(String(s || "")); }
  function isOrderDelivered(s) { return /تسليم|سلّم|سُلّم|delivered/i.test(String(s || "")); }
  function isOrderOpen(s) { return !isOrderRejected(s) && !isOrderDelivered(s); }

  // ---------- i18n ----------
  var T = {
    en: {
      app_title: "Pharmaceutical Planning Department Dashboard",
      app_sub: "Prince Sultan Military Medical City · Medical Services",
      upl_toggle: "Add or replace data files",
      upl_toggle_open: "Show the file upload panel",
      upl_toggle_close: "Hide the file upload panel",
      tab_planning: "Planning Department", tab_management: "Management & Budget",
      file_wd: "Withdrawals file", file_wd_hint: "NUPCO outbound · .xlsx",
      file_st: "Stock-on-hand file", file_st_hint: "NUPCO stock · .xls",
      file_mp: "Names & identifiers file", file_mp_hint: "optional · hospital & MSD codes + trade name",
      err_mp: "Could not read the identifiers file (needs a NUPCO column plus trade-name / hospital / MSD columns)",
      mp_linked: "items linked",
      mp_no_trade: "No trade-name column was recognized in this file — name search will stay limited",
      c_trade: "Trade Name", c_hosp: "Hospital Code", c_msd: "MSD Code", c_agent: "Agent / Vendor", c_class: "Classification",
      lbl_nupco: "NUPCO", lbl_hosp: "Hospital", lbl_msd: "MSD",
      dt_agent: "agent / vendor",
      btn_sample: "Load sample data",
      upl_hint: "Drop in both files to compute coverage and reorder quantities. You can select several withdrawals files at once (multiple warehouses); the latest consumption baseline is saved on this device, so next time a new stock file alone is enough. Only medicines (NUPCO codes starting with <b>5</b>) are included.",
      empty_title: "No data loaded yet",
      empty_text: "Upload the withdrawals and stock-on-hand files, or click Load sample data to explore the dashboard with sample numbers.",
      empty_btn: "Load sample data",
      foot: "Built for the PSMMC planning department · every calculation runs locally in your browser — no data leaves this page.",
      search_ph: "Search by code or name — separate items with commas…",
      period: "Period", stock_as_of: "Stock as of", mo: "mo", sorted_by: "Sorted by",
      showing: "Showing", of: "of", items: "items", no_rows: "No rows match this filter.",
      f_all: "All", f_order_now: "Order now", f_excess: "Excess stock", f_no_movement: "No movement", f_not_in_stock: "Not in stock",
      f_all_instock: "All in stock", f_available: "Available", f_outstock: "Out of stock",
      k_order: "Order now",
      k_watch: "Watch", k_nomove: "No movement", k_notstock: "Not in stock",
      k_instock: "Medicines in stock", k_units: "Total available units",
      k_out: "Out of stock", k_reorder: "Need reorder",
      k_value: "Stock value (SAR)", k_value_sub: "add a price list to activate",
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
      s_order_now: "Order now", s_warning: "Watch", s_ok: "OK", s_excess: "Excess", s_no_movement: "No movement", s_not_in_stock: "Not in stock",
      k_items: "Items", k_items_sub: "{a} with stock ({p}%) — the rest have zero balance",
      k_zero: "Zero-stock items", k_zero_sub: "{p}% of all items have no available stock at the warehouse",
      ex_open: "How is this computed?",
      ex_need_order_t: "Needs ordering now", ex_need_order_b: "Items whose EFFECTIVE coverage is at or below the reorder line (6 months, or the item's custom threshold). Effective coverage counts only dispensable stock: expired batches, units that would expire before use, and hand-dispensed stock within 3 months of expiry are excluded.",
      ex_critical_t: "Critical — out of stock", ex_critical_b: "Items with consumption in the analysis period but zero available stock right now. Every day without stock is a missed dispense.",
      ex_items_t: "Items", ex_items_b: "Every item in the analysis — the union of the withdrawals file and the stock file. 'With stock' counts items whose available stock > 0; the rest are zero-balance items.",
      ex_zero_t: "Zero-stock items", ex_zero_b: "Items whose available stock is 0 at the warehouse (whether or not they moved in the period). The percentage is out of all analysed items.",
      ex_col_total_t: "Total withdrawn", ex_col_total_b: "Sum of DISPATCHED/APPROVED withdrawal quantities for this item across the whole analysis period.",
      ex_col_avg_t: "Monthly average", ex_col_avg_b: "Total withdrawn ÷ the detected period in months (a month = 30.44 days). The period is read from the file's delivery dates, ignoring outlier-dated rows.",
      ex_col_trend_t: "Trend", ex_col_trend_b: "This period's monthly average vs the previous saved average for the same item. 'New' marks items with no earlier history.",
      ex_col_stock_t: "Current stock", ex_col_stock_b: "Total Available Qty from the stock file (NUPCO already moves expired stock to Hold, so this is physically available units).",
      ex_col_cov_t: "Coverage (months)", ex_col_cov_b: "Dispensable stock ÷ monthly average. Dispensable excludes expired batches, units that would expire before they can be used (first-expiry-first-out), and — for hand-dispensed forms — anything within 3 months of expiry. Injections/vials count until expiry.",
      ex_col_expiry_t: "Earliest expiry", ex_col_expiry_b: "Months from the stock-as-of date to the earliest batch expiry. ⚠ marks items losing a month or more of coverage to expiry; ≈ marks an estimate from the latest dispatch batch.",
      ex_col_proj_t: "Stockout / reorder-by", ex_col_proj_b: "Stockout = stock date + (dispensable stock ÷ daily burn), daily burn = monthly average ÷ 30.44. Reorder-by = the date coverage drops to 6 months. ORDER NOW when that date has already passed.",
      ex_col_status_t: "Status", ex_col_status_b: "From effective coverage: ≤6 months = order now · ≤7 = watch · >13 = excess (overstock) · OK otherwise. No movement = no withdrawals in the period; not in stock = zero balance.",
      ex_col_qty9_t: "Qty (9 months)", ex_col_qty9_b: "Monthly average × 9 — the demand target the suggested order fills toward (seasonal items use prior-year same-month figures instead of the flat average).",
      ex_col_sug_t: "Suggested order", ex_col_sug_b: "9-month demand target − dispensable stock (never below zero). Unusable at-risk stock is replaced, not counted.",
      ev_value_sar: "value (SAR)",
      pr_paid_share: "paid share (units)", pr_free_share: "free share ({p}% free)",
      bw_title: "Monthly order workload", bw_month: "Month", bw_orders: "Orders to raise", bw_value: "Value (SAR)", bw_now: "This month (incl. overdue)",
      bw_open: "Open this month's order list", bw_month_title: "Orders to raise", bw_export_year: "Export to year-end", bw_export_month: "Export this month",
      close: "Close", br_sar: "SAR",
      bo_title: "Budget overview", bo_budget: "Budget set", bo_spent: "Spent (delivered)", bo_remaining: "Remaining", bo_undelivered: "Undelivered orders", bo_delivered: "Delivered orders",
      ex_workload_t: "Monthly order workload", ex_workload_b: "Each item lands in the month its Reorder-By date falls in (reorder-by = the day effective coverage drops to 6 months). Items already past that date count in the current month — they are today's workload. The planner split counts items assigned to each planner from the planner file; SAR value = Σ suggested qty × unit price for priced items.",
      em_urgency: "Expedite order (email)", em_replace: "Request replacement (email)",
      file_shk: "Sharek platform file", file_shk_hint: "optional · NUPCO codes listed on Sharek",
      err_shk: "Could not read Sharek file", shk_loaded: "{n} Sharek codes saved",
      f_sharek: "Zero & on Sharek", c_sharek: "Sharek", shk_yes: "On Sharek",
      k_zero_sharek: "{n} of them available on Sharek",
      shk_hint: "Sharek: upload a Sharek file to flag zero-stock items available on Sharek (adds a column + filter)",
      ex_col_sharek_t: "Sharek availability", ex_col_sharek_b: "Marks ZERO-stock items whose NUPCO code is listed on the Sharek marketplace — the hospital can source them there when the supplier is slow or the budget is short. Joined by NUPCO code from the uploaded Sharek export (saved on this device).",
      ev_export: "Export view",
      rp_total_stock: "Item total stock", rp_excess: "Excess qty (>9 mo)",
      rk_spend: "Top 50 by order spend", rk_inventory: "Top 50 by inventory value",
      ex_rk_spend_t: "Top 50 by order spend", ex_rk_spend_b: "Drugs ranked by the total SAR value of their procurement orders in the ledger (sum of every order's item total value), with how many orders each has. Independent of the price file.",
      ex_rk_inventory_t: "Top 50 by inventory value", ex_rk_inventory_b: "Items ranked by the SAR value of stock sitting in the warehouse (available units × unit price). Needs the price file. Highlights where capital is tied up.",
      trend_new: "New", prev_avg: "prev avg", per_mo: "/mo",
      sample_wd: "Sample · NUPCO outbound", sample_st: "Sample · NUPCO stock",
      err_wd: "Could not read withdrawals file", err_st: "Could not read stock file", no_sample: "Sample data not available",
      two_files: "2 files", files_word: "files",
      baseline_meta: "saved baseline", baseline_to: "to",
      tab_averages: "Averages",
      pc_title: "Confirm withdrawals period", pc_sub: "Period detected from the delivery dates inside the file. Each item's monthly average = quantity ÷ months, so make sure the months are right.",
      pc_detected: "detected automatically from the file", pc_use_detected: "Use detected", pc_months_3: "3 mo", pc_months_6: "6 mo", pc_custom_ph: "Custom…", pc_confirm: "Use", manual_mark: "manual",
      hist_quota: "Device storage is full — history trimmed to the last 12 months",
      dup_skipped: "Duplicate withdrawals file skipped — it was already counted once",
      save_failed: "Device storage is full — could not save on this device for next time",
      k_need_order: "Needs ordering now", k_need_order_sub: "Total suggested qty <b class=\"num\">{u}</b> units · <b>{n}</b> withdrawn but not in stock",
      k_critical: "Critical — out of stock", k_critical_sub: "Actively withdrawn items at zero balance — top priority",
      k_total_units: "Total available stock", k_overall_cov: "Covers <b class=\"num\">{m}</b> months at the current rate",
      k_monthly_use: "Monthly consumption", vs_prev_month: "{a} vs {b}", units_word: "units", items_word: "items",
      os_title: "Order sheet — most urgent", os_view_all: "View all in table", os_export: "Export order sheet", os_email: "Email report", os_wa: "WhatsApp", os_print: "Print", os_cov_left: "mo cover", os_suggested: "suggested",
      dt_highest: "Highest month", dt_lowest: "Lowest month", dt_total_hist: "total withdrawn", dt_no_history: "No monthly history yet — it builds up from your uploads", dt_partial_note: "⚠ The last month is partial — shown faded and excluded from the trend comparison.", dt_avg: "monthly avg (units)", dt_vs_prev: "vs previous average", dt_stock: "current stock", dt_cov: "coverage (mo)", dt_cov_raw: "raw coverage — before expiry trim", dt_usable: "dispensable stock (units)", dt_sug: "suggested order (9 mo)", dt_class: "MODHS classification", dt_priority: "priority level",
      f_watch: "Watch", f_rising: "Rising +10%", f_falling: "Falling −10%", f_new: "New", c_spark: "Recent months", c_delta: "Trend Δ%",
      f_watchlist: "My watchlist",
      pin_add: "Pin to my watchlist",
      pin_remove: "Unpin from my watchlist",
      av_hist: "Saved history", av_moving: "Moving items", av_rising: "Rising", av_falling: "Falling", av_tap: "Tap any item to open its monthly report",
      em_subject: "PSMMC stock report", em_summary: "Summary", em_below1: "Items below 1 month of coverage:", em_more: "more items", em_full_sheet: "Full sheet: use the Export button in the dashboard.", em_order: "Need ordering", em_critical: "Critical", em_stocku: "Stock units", em_monthly: "Monthly use",
      pr_pack_price: "pack price", pr_units_per_pack: "units/pack", pr_unit_price: "unit price (system)", pr_eff_price: "effective after bonus qty", pr_stock_value: "item stock value", pr_total_value: "Total stock value (SAR)", pr_frozen: "Frozen capital", pr_frozen_sub: "no movement or >12 mo coverage", pr_priced: "priced items",
      pr_hint: "Prices not loaded yet — add pack price, units per pack, awarded qty and free qty columns to the identifiers file to activate this section.",
      cp_copied: "Copied", cp_copy_all: "Copy all codes", cp_none: "No codes to copy",
      prn_title: "Order sheet", prn_date: "Date", prn_period: "Analysis period", prn_sign: "Approved by — name & signature", prn_sign_name: "Name", prn_sign_sig: "Signature",
      bad_dates: "{n} rows had unreadable dates",
      cols_hint: "missing columns",
      av_empty_title: "No averages yet",
      av_empty_text: "Monthly averages build up from your withdrawals uploads. Upload a withdrawals file with delivery dates, and history will accumulate here across sessions.",
      av_export: "Export history", av_import: "Import history",
      hist_export_done: "Exported history",
      hist_import_done: "Imported {i} items · {m} months",
      hist_import_bad: "Invalid history file — could not import",
      demo_names: "Demo names are not real — upload the identifiers file once to see the real names",
      cat_note: "in catalog · no movement and no stock in the uploaded files",
      cat_badge: "In catalog",
      syn_note: "Trade-name match:",
      di_title: "Drug information",
      di_note: "General guidance for the planning team — not medical advice.",
      di_none: "No curated description for this medicine yet — use the SFDA link below.",
      di_sfda: "SFDA drug list",
      di_web: "Web search",
      br_title: "Budget runway",
      br_ph: "Remaining budget (SAR)",
      br_save: "Save",
      br_months: "months until the budget runs out",
      br_runout: "projected run-out",
      br_monthly: "monthly consumption value (SAR)",
      br_hint: "Add prices to the identifiers file to activate budget runway.",
      file_po: "Previous orders file",
      file_po_hint: "optional · purchase orders · code + date + qty",
      err_po: "Could not read the orders file (needs NUPCO code, order date and qty columns)",
      po_loaded: "{n} order lines saved",
      po_last: "last order",
      po_intransit: "In transit — ordered, not yet in stock",
      ledger_loaded: "{a} new orders added ({n} in file)",
      po_orders_title: "Procurement orders",
      po_open_badge: "Order placed",
      po_open_tip: "Open order {no} · placed {d}",
      po_delivered: "Delivered", po_mark_delivered: "Mark delivered", po_undeliver: "Mark not delivered",
      f_covered_order: "Ordered (under 6 mo)",
      bw_order_no: "Order no.",
      qr_rejected: "rejected/cancelled order — excluded",
      oo_mark: "Mark as ordered",
      oo_badge: "On order",
      oo_since: "on order since {d} · {q} units",
      oo_clear: "Clear",
      oo_cleared: "{n} on-order item(s) covered by the new stock — flag cleared",
      oo_qty_ph: "qty",
      ss_tag: "seasonal",
      ss_basis: "Seasonal suggestion — weighted by the same {n} upcoming month(s) from last year instead of the flat average",
      dg_title: "What changed since the previous upload",
      dg_danger: "entered danger",
      dg_spike: "consumption spike >30%",
      dg_new: "new items",
      dg_recovered: "recovered",
      dg_dismiss: "Dismiss",
      qc_title: "Data quality — last upload",
      qc_rows: "rows",
      qc_accepted: "accepted",
      qc_rejected: "rejected",
      qc_columns: "Matched columns",
      qc_export: "Export report",
      qr_status: "status not approved/dispatched",
      qr_code: "missing item code",
      qr_nondrug: "non-medicine code (does not start with 5)",
      qr_empty: "no usable identifier fields",
      qr_dup: "duplicate order line",
      qr_baddate: "unreadable date — row counted in totals, excluded from monthly history",
      qr_outlier: "dated far outside the file's period — counted in totals, excluded from period detection and monthly trends",
      qr_badexp: "unreadable expiry — excluded from expiry analysis",
      qr_dupfile: "duplicate file skipped",
      qs_qty: "quantity",
      qs_date: "date",
      qs_batch: "batch",
      qs_sci: "scientific name",
      qs_award: "awarded qty",
      qs_free: "free qty",
      c_expiry: "Expiry (mo)",
      c_planner: "Planner", c_stockout: "Stockout / Reorder",
      planner_unassigned: "Unassigned",
      proj_reorder: "reorder by",
      order_now_flag: "ORDER NOW",
      dt_stockout: "projected stockout", dt_reorder: "reorder by", dt_burn: "daily burn (units)",
      file_pl: "Planner mapping file", file_pl_hint: "optional · NUPCO code + planner name + email",
      err_pl: "Could not read the planner file (needs a NUPCO code or item-family column plus a planner-name column)",
      pl_loaded: "{n} planner links saved",
      exp_risk_tip: "≈ {u} units may expire before they can be used at the current rate · effective coverage {m} mo",
      exp_expired: "expired",
      exp_approx_tip: "approximate — from the latest dispatch batch in the withdrawals file",
      dg_expiry: "coverage outlives expiry",
      dt_batches: "Batches & expiry",
      dt_exp_eff: "effective coverage after expiry (mo)",
      dt_exp_risk: "units at risk of expiry",
      tab_expiry: "Expiry Watch",
      ev_atrisk: "At-risk", ev_expired: "Expired",
      ev_batches: "batches", ev_total_qty: "total units", ev_value_pending: "value — add prices",
      ev_sort_exp: "By expiry", ev_sort_qty: "By quantity",
      ev_tte: "to expiry", ev_overdue: "overdue",
      c_lot: "Lot / Batch", c_expdate: "Expiry date",
      ev_empty: "No at-risk or expired batches in this file.",
      dt_expired_batches: "Expired batches (in quarantine)",
      rp_generated: "Generated",
      th_title: "Custom alert threshold",
      th_ph: "months",
      th_save: "Save",
      th_clear: "Reset to 6",
      th_mark: "custom alert threshold: {m} mo",
      th_hint: "Alert this item when coverage ≤ the chosen months (default 6).",
      langName: "English"
    },
    ar: {
      app_title: "داشبورد قسم التخطيط الصيدلاني",
      app_sub: "مدينة الأمير سلطان الطبية العسكرية · الخدمات الطبية",
      upl_toggle: "إضافة أو استبدال ملفات البيانات",
      upl_toggle_open: "إظهار لوحة رفع الملفات",
      upl_toggle_close: "إخفاء لوحة رفع الملفات",
      tab_planning: "قسم التخطيط", tab_management: "الإدارة والميزانية",
      file_wd: "ملف السحوبات", file_wd_hint: "صادر نبكو · ‎.xlsx",
      file_st: "ملف المخزون المتاح", file_st_hint: "مخزون نبكو · ‎.xls",
      file_mp: "ملف الأسماء والمعرفات", file_mp_hint: "اختياري · أكواد المستشفى وMSD والاسم التجاري",
      err_mp: "تعذّر قراءة ملف المعرفات (يلزم عمود كود نبكو + أعمدة الاسم التجاري / كود المستشفى / MSD)",
      mp_linked: "صنف مرتبط",
      mp_no_trade: "لم يتم التعرف على عمود الاسم التجاري في هذا الملف — البحث بالاسم سيبقى محدودًا",
      c_trade: "الاسم التجاري", c_hosp: "كود المستشفى", c_msd: "كود MSD", c_agent: "الوكيل / المورد", c_class: "التصنيف",
      lbl_nupco: "نبكو", lbl_hosp: "مستشفى", lbl_msd: "MSD",
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
      f_all: "الكل", f_order_now: "اطلب الآن", f_excess: "مخزون زائد", f_no_movement: "بدون حركة", f_not_in_stock: "غير متوفر بالمخزون",
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
      s_order_now: "اطلب الآن", s_warning: "للمتابعة", s_ok: "جيد", s_excess: "زائد", s_no_movement: "بدون حركة", s_not_in_stock: "غير متوفر",
      k_items: "البنود", k_items_sub: "{a} لها مخزون ({p}%) — والباقي رصيده صفر",
      k_zero: "البنود الصفرية", k_zero_sub: "{p}% من كل البنود بلا مخزون متاح في المستودع",
      ex_open: "كيف حُسب هذا الرقم؟",
      ex_need_order_t: "تحتاج طلبًا الآن", ex_need_order_b: "البنود التي تغطيتها الفعلية عند خط إعادة الطلب أو أقل (6 أشهر، أو الحد المخصص للبند). التغطية الفعلية تحسب المخزون القابل للصرف فقط: تُستبعد الدفعات المنتهية، والكميات التي ستنتهي قبل استهلاكها، ومخزون الأدوية اليدوية الذي بقي على صلاحيته 3 أشهر أو أقل.",
      ex_critical_t: "حرج — رصيد صفر", ex_critical_b: "بنود لها استهلاك في فترة التحليل ومخزونها المتاح الآن صفر. كل يوم بلا مخزون صرفٌ ضائع.",
      ex_items_t: "البنود", ex_items_b: "كل بند في التحليل — اتحاد ملف السحوبات وملف المخزون. «لها مخزون» تَعُدّ البنود التي مخزونها المتاح أكبر من صفر؛ والباقي بنود صفرية.",
      ex_zero_t: "البنود الصفرية", ex_zero_b: "البنود التي مخزونها المتاح في المستودع صفر (تحركت في الفترة أو لم تتحرك). النسبة من إجمالي البنود المحلَّلة.",
      ex_col_total_t: "إجمالي المسحوب", ex_col_total_b: "مجموع كميات السحب بحالة DISPATCHED/APPROVED لهذا البند عبر كامل فترة التحليل.",
      ex_col_avg_t: "المتوسط الشهري", ex_col_avg_b: "إجمالي المسحوب ÷ الفترة المكتشفة بالأشهر (الشهر = 30.44 يومًا). الفترة تُقرأ من تواريخ التسليم داخل الملف مع استبعاد الصفوف ذات التواريخ الشاذة.",
      ex_col_trend_t: "الاتجاه", ex_col_trend_b: "المتوسط الشهري لهذه الفترة مقابل آخر متوسط محفوظ لنفس البند. «جديد» تعني بندًا بلا سجل سابق.",
      ex_col_stock_t: "المخزون الحالي", ex_col_stock_b: "عمود Total Available Qty من ملف المخزون (نبكو يحوّل المنتهي إلى Hold، فهذه وحدات متاحة فعليًا).",
      ex_col_cov_t: "التغطية (شهر)", ex_col_cov_b: "المخزون القابل للصرف ÷ المتوسط الشهري. يُستبعد من القابل للصرف: الدفعات المنتهية، والكميات التي ستنتهي قبل استهلاكها (الأقرب انتهاءً يُصرف أولًا)، وللأدوية اليدوية كل ما بقي على صلاحيته 3 أشهر أو أقل. الحقن والفيال تُحسب حتى نهاية صلاحيتها.",
      ex_col_expiry_t: "أقرب انتهاء", ex_col_expiry_b: "الأشهر من تاريخ ملف المخزون حتى أقرب انتهاء دفعة. ⚠ بند يخسر شهرًا أو أكثر من تغطيته بسبب الصلاحية؛ ≈ تقدير من دفعة آخر صرف.",
      ex_col_proj_t: "النفاد / أعد الطلب قبل", ex_col_proj_b: "النفاد = تاريخ المخزون + (القابل للصرف ÷ الاستهلاك اليومي)، والاستهلاك اليومي = المتوسط الشهري ÷ 30.44. أعد الطلب قبل = اليوم الذي تهبط فيه التغطية إلى 6 أشهر. «اطلب الآن» إذا كان ذلك التاريخ قد مضى.",
      ex_col_status_t: "الحالة", ex_col_status_b: "من التغطية الفعلية: ≤6 أشهر = اطلب الآن · ≤7 = للمتابعة · أكثر من 13 = زائد · جيد فيما عدا ذلك. بدون حركة = لا سحوبات في الفترة؛ غير متوفر = رصيد صفر.",
      ex_col_qty9_t: "كمية 9 أشهر", ex_col_qty9_b: "المتوسط الشهري × 9 — هدف الطلب الذي يكمّل الاقتراحُ نحوه (البنود الموسمية تستخدم أشهر السنة الماضية المطابقة بدل المتوسط الثابت).",
      ex_col_sug_t: "الطلب المقترح", ex_col_sug_b: "هدف 9 أشهر − المخزون القابل للصرف (لا ينزل تحت الصفر). الكميات المهددة بالانتهاء تُستبدل ولا تُحسب.",
      ev_value_sar: "القيمة (ريال)",
      pr_paid_share: "الكمية المدفوعة (وحدة)", pr_free_share: "الكمية المجانية ({p}% مجاني)",
      bw_title: "حِمل الطلبات الشهري", bw_month: "الشهر", bw_orders: "طلبات تُرفع", bw_value: "القيمة (ريال)", bw_now: "هذا الشهر (مع المتأخر)",
      bw_open: "افتح قائمة طلبات هذا الشهر", bw_month_title: "طلبات الشهر", bw_export_year: "تصدير حتى نهاية السنة", bw_export_month: "تصدير هذا الشهر",
      close: "إغلاق", br_sar: "ر.س",
      bo_title: "نظرة الميزانية", bo_budget: "الميزانية المحددة", bo_spent: "المصروف (مورَّد)", bo_remaining: "المتبقّي", bo_undelivered: "طلبات غير مورَّدة", bo_delivered: "طلبات مورَّدة",
      ex_workload_t: "حِمل الطلبات الشهري", ex_workload_b: "كل بند يقع في الشهر الذي يحلّ فيه تاريخ «أعد الطلب قبل» (وهو اليوم الذي تهبط فيه التغطية الفعلية إلى 6 أشهر). البنود التي تجاوزت ذلك التاريخ تُحسب في الشهر الحالي — فهي حِمل اليوم. توزيع المخططين يَعُدّ بنود كل مخطط من ملف المخططين؛ والقيمة بالريال = مجموع الكمية المقترحة × سعر الوحدة للبنود المسعّرة.",
      em_urgency: "استعجال الطلب (إيميل)", em_replace: "طلب استبدال (إيميل)",
      file_shk: "ملف منصة شارك", file_shk_hint: "اختياري · أكواد نبكو المتاحة في شارك",
      err_shk: "تعذّرت قراءة ملف شارك", shk_loaded: "تم حفظ {n} كودًا من شارك",
      f_sharek: "صفري ومتاح في شارك", c_sharek: "شارك", shk_yes: "متاح في شارك",
      k_zero_sharek: "منها {n} متاح في منصة شارك",
      shk_hint: "شارك: ارفع ملف منصة شارك لإظهار الأصناف الصفرية المتاحة على شارك (يضيف عمودًا وفلترًا)",
      ex_col_sharek_t: "التوفر في شارك", ex_col_sharek_b: "تعليم البنود الصفرية التي يظهر كود نبكو الخاص بها في منصة شارك — يستطيع المستشفى طلبها من هناك إذا تأخّر المورّد أو ضاقت الميزانية. الربط بكود نبكو من ملف شارك المرفوع (محفوظ على هذا الجهاز).",
      ev_export: "تصدير العرض",
      rp_total_stock: "إجمالي المخزون للبند", rp_excess: "الكمية الزائدة (>٩ أشهر)",
      rk_spend: "أعلى ٥٠ إنفاقًا (طلبات)", rk_inventory: "أعلى ٥٠ قيمة مخزون",
      ex_rk_spend_t: "أعلى ٥٠ إنفاقًا حسب الطلبات", ex_rk_spend_b: "ترتيب الأدوية حسب إجمالي قيمة طلبات الشراء بالريال في السجل (مجموع قيمة كل طلب)، مع عدد الطلبات لكل دواء. مستقل عن ملف الأسعار.",
      ex_rk_inventory_t: "أعلى ٥٠ قيمة مخزون", ex_rk_inventory_b: "ترتيب البنود حسب قيمة المخزون الراكد في المستودع بالريال (الكمية المتاحة × سعر الوحدة). يحتاج ملف الأسعار. يبيّن أين يتجمّد رأس المال.",
      trend_new: "جديد", prev_avg: "المتوسط السابق", per_mo: "/شهر",
      sample_wd: "تجريبي · صادر نبكو", sample_st: "تجريبي · مخزون نبكو",
      err_wd: "تعذّر قراءة ملف السحوبات", err_st: "تعذّر قراءة ملف المخزون", no_sample: "البيانات التجريبية غير متوفرة",
      two_files: "ملفان", files_word: "ملفات",
      baseline_meta: "متوسط محفوظ", baseline_to: "حتى",
      tab_averages: "المتوسطات",
      pc_title: "تأكيد فترة ملف السحوبات", pc_sub: "قرأنا الفترة من تواريخ التسليم داخل الملف. المتوسط الشهري لكل صنف = الكمية ÷ عدد الأشهر، لذا تأكد أن عدد الأشهر صحيح.",
      pc_detected: "مقروءة تلقائيًا من الملف", pc_use_detected: "اعتمد المقروءة", pc_months_3: "3 أشهر", pc_months_6: "6 أشهر", pc_custom_ph: "مخصص…", pc_confirm: "اعتمد", manual_mark: "يدوي",
      hist_quota: "مساحة الجهاز ممتلئة — قُلّص السجل لآخر 12 شهرًا",
      dup_skipped: "تم تجاهل ملف سحوبات مكرر — سبق احتسابه مرة واحدة",
      save_failed: "مساحة الجهاز ممتلئة — تعذّر الحفظ على هذا الجهاز للمرة القادمة",
      k_need_order: "يحتاج طلبًا الآن", k_need_order_sub: "إجمالي الكمية المقترحة <b class=\"num\">{u}</b> وحدة · منها <b>{n}</b> صنفًا مسحوبًا وغير متوفر",
      k_critical: "حرج — نفد أو غير متوفر", k_critical_sub: "أصناف مسحوبة فعليًا ورصيدها صفر — أولوية قصوى",
      k_total_units: "إجمالي المخزون المتاح", k_overall_cov: "يغطي <b class=\"num\">{m}</b> شهرًا بمعدل الاستهلاك الحالي",
      k_monthly_use: "الاستهلاك الشهري", vs_prev_month: "{a} مقابل {b}", units_word: "وحدة", items_word: "صنفًا",
      os_title: "ورقة الطلب — الأكثر إلحاحًا", os_view_all: "عرض الكل في الجدول", os_export: "تصدير ورقة الطلب", os_email: "تقرير بالإيميل", os_wa: "واتساب", os_print: "طباعة", os_cov_left: "شهر تغطية", os_suggested: "كمية مقترحة",
      dt_highest: "أعلى شهر", dt_lowest: "أدنى شهر", dt_total_hist: "إجمالي المسحوب", dt_no_history: "لا يوجد سجل شهري بعد — يتراكم تلقائيًا مع كل رفع", dt_partial_note: "⚠ الشهر الأخير جزئي — يظهر باهتًا ولا يدخل في مقارنة الاتجاه.", dt_avg: "متوسط شهري (وحدة)", dt_vs_prev: "مقابل المتوسط السابق", dt_stock: "المخزون الحالي", dt_cov: "تغطية (شهر)", dt_cov_raw: "التغطية الخام — قبل خصم الصلاحية", dt_usable: "المخزون القابل للصرف (وحدة)", dt_sug: "الطلب المقترح (٩ أشهر)", dt_class: "تصنيف الخدمات الصحية", dt_priority: "مستوى الأولوية",
      f_watch: "للمتابعة", f_rising: "صاعد +10٪", f_falling: "هابط −10٪", f_new: "جديد", c_spark: "الأشهر الأخيرة", c_delta: "الاتجاه Δ٪",
      f_watchlist: "متابعتي",
      pin_add: "تثبيت في قائمة متابعتي",
      pin_remove: "إزالة من قائمة متابعتي",
      av_hist: "سجل محفوظ", av_moving: "أصناف متحركة", av_rising: "صاعد", av_falling: "هابط", av_tap: "اضغط أي صنف لفتح تقريره الشهري",
      em_subject: "تقرير مخزون صيدلية PSMMC", em_summary: "الملخص", em_below1: "أصناف تحت شهر تغطية:", em_more: "صنفًا آخر", em_full_sheet: "الورقة الكاملة: زر التصدير داخل اللوحة.", em_order: "يحتاج طلبًا", em_critical: "حرج", em_stocku: "وحدات المخزون", em_monthly: "الاستهلاك الشهري",
      pr_pack_price: "سعر العلبة", pr_units_per_pack: "وحدة/علبة", pr_unit_price: "سعر الوحدة (السيستم)", pr_eff_price: "السعر الفعلي بعد المجانية", pr_stock_value: "قيمة مخزون الصنف", pr_total_value: "قيمة المخزون الكلية (ر.س)", pr_frozen: "رأس المال المجمّد", pr_frozen_sub: "بدون حركة أو تغطية تفوق 12 شهرًا", pr_priced: "صنف مسعّر",
      pr_hint: "الأسعار غير مرفوعة بعد — أضف أعمدة سعر العلبة وعدد الحبات وكمية الترسية والكمية المجانية في ملف المعرفات لتفعيل هذه الخانة.",
      cp_copied: "نُسخ", cp_copy_all: "نسخ كل الأكواد", cp_none: "لا توجد أكواد للنسخ",
      prn_title: "ورقة الطلب", prn_date: "التاريخ", prn_period: "فترة التحليل", prn_sign: "الاعتماد — الاسم والتوقيع", prn_sign_name: "الاسم", prn_sign_sig: "التوقيع",
      bad_dates: "{n} صفًا تحتوي تواريخ غير مقروءة",
      cols_hint: "أعمدة ناقصة",
      av_empty_title: "لا توجد متوسطات بعد",
      av_empty_text: "تُبنى المتوسطات الشهرية تدريجيًا من رفع ملفات السحوبات. ارفع ملف سحوبات يحتوي تواريخ التسليم، وسيتراكم السجل هنا عبر الجلسات.",
      av_export: "تصدير السجل", av_import: "استيراد السجل",
      hist_export_done: "تم تصدير السجل",
      hist_import_done: "تم استيراد {i} صنف · {m} شهر",
      hist_import_bad: "ملف سجل غير صالح — تعذّر الاستيراد",
      demo_names: "الأسماء التجريبية غير حقيقية — ارفع ملف المعرفات مرة واحدة لرؤية الأسماء الحقيقية",
      cat_note: "موجود في الكتالوج · بلا حركة وبلا رصيد في الملفات المرفوعة",
      cat_badge: "في الكتالوج",
      syn_note: "تطابق الاسم التجاري:",
      di_title: "معلومات الدواء",
      di_note: "معلومات عامة لفريق التخطيط — ليست نصيحة طبية.",
      di_none: "لا يوجد وصف منسق لهذا الدواء بعد — استخدم رابط الهيئة أدناه.",
      di_sfda: "قائمة أدوية الهيئة العامة للغذاء والدواء",
      di_web: "بحث في الإنترنت",
      br_title: "مدى الميزانية",
      br_ph: "الميزانية المتبقية (ر.س)",
      br_save: "حفظ",
      br_months: "شهرًا حتى نفاد الميزانية",
      br_runout: "تاريخ النفاد المتوقع",
      br_monthly: "قيمة الاستهلاك الشهري (ر.س)",
      br_hint: "أضف الأسعار إلى ملف المعرفات لتفعيل مدى الميزانية.",
      file_po: "ملف الطلبات السابقة",
      file_po_hint: "اختياري · أوامر الشراء · الكود والتاريخ والكمية",
      err_po: "تعذّر قراءة ملف الطلبات (يلزم أعمدة كود نبكو وتاريخ الطلب والكمية)",
      po_loaded: "تم حفظ {n} سطر طلب",
      po_last: "آخر طلب",
      po_intransit: "قيد التوريد — مطلوب ولم يظهر في المخزون بعد",
      ledger_loaded: "أُضيف {a} طلبًا جديدًا ({n} في الملف)",
      po_orders_title: "طلبات الشراء",
      po_open_badge: "عليه طلب",
      po_open_tip: "طلب قائم {no} · بتاريخ {d}",
      po_delivered: "تم التوريد", po_mark_delivered: "تعليم: تم التوريد", po_undeliver: "إلغاء: لم يورَّد",
      f_covered_order: "عليها طلب (تحت ٦ أشهر)",
      bw_order_no: "رقم الطلب",
      qr_rejected: "طلب ملغى/مرفوض — مستبعد",
      oo_mark: "وضع علامة: تم الطلب",
      oo_badge: "تم طلبه",
      oo_since: "تم طلبه في {d} · {q} وحدة",
      oo_clear: "إلغاء العلامة",
      oo_cleared: "{n} صنفًا مطلوبًا غطّاه المخزون الجديد — أُزيلت العلامة",
      oo_qty_ph: "الكمية",
      ss_tag: "موسمي",
      ss_basis: "اقتراح موسمي — مرجّح بنفس {n} شهرًا قادمًا من السنة الماضية بدلًا من المتوسط الثابت",
      dg_title: "ماذا تغيّر منذ الرفع السابق",
      dg_danger: "دخلت نطاق الخطر",
      dg_spike: "قفزة استهلاك تتجاوز 30٪",
      dg_new: "أصناف جديدة",
      dg_recovered: "تعافت",
      dg_dismiss: "إغلاق",
      qc_title: "جودة البيانات — آخر رفعة",
      qc_rows: "صف",
      qc_accepted: "مقبول",
      qc_rejected: "مرفوض",
      qc_columns: "الأعمدة المطابقة",
      qc_export: "تصدير التقرير",
      qr_status: "الحالة غير معتمدة (ليست DISPATCHED/APPROVED)",
      qr_code: "كود الصنف مفقود",
      qr_nondrug: "كود غير دوائي (لا يبدأ بـ 5)",
      qr_empty: "صف بلا حقول معرفات مفيدة",
      qr_dup: "سطر طلب مكرر",
      qr_baddate: "تاريخ غير مقروء — يُحتسب في الإجمالي ويُستبعد من السجل الشهري",
      qr_outlier: "تاريخ خارج فترة الملف بفارق كبير — يُحتسب في الإجمالي ويُستبعد من كشف الفترة والاتجاهات الشهرية",
      qr_badexp: "تاريخ صلاحية غير مقروء — مستبعد من تحليل الصلاحية",
      qr_dupfile: "ملف مكرر تم تجاهله",
      qs_qty: "الكمية",
      qs_date: "التاريخ",
      qs_batch: "الدفعة",
      qs_sci: "الاسم العلمي",
      qs_award: "كمية الترسية",
      qs_free: "الكمية المجانية",
      c_expiry: "الصلاحية (شهر)",
      c_planner: "المخطط", c_stockout: "النفاد / إعادة الطلب",
      planner_unassigned: "غير معيّن",
      proj_reorder: "أعد الطلب قبل",
      order_now_flag: "اطلب الآن",
      dt_stockout: "تاريخ النفاد المتوقع", dt_reorder: "أعد الطلب قبل", dt_burn: "الاستهلاك اليومي (وحدة)",
      file_pl: "ملف ربط المخططين", file_pl_hint: "اختياري · كود نبكو + اسم المخطط + الإيميل",
      err_pl: "تعذّر قراءة ملف المخططين (يلزم عمود كود نبكو أو مجموعة الصنف + عمود اسم المخطط)",
      pl_loaded: "تم حفظ {n} ربطًا للمخططين",
      exp_risk_tip: "≈ {u} وحدة قد تنتهي صلاحيتها قبل صرفها بالمعدل الحالي · التغطية الفعلية {m} شهر",
      exp_expired: "منتهية الصلاحية",
      exp_approx_tip: "تقريبي — من آخر دفعة صرف في ملف السحوبات",
      dg_expiry: "التغطية تتجاوز مدة الصلاحية",
      dt_batches: "الدفعات والصلاحية",
      dt_exp_eff: "التغطية الفعلية بعد الصلاحية (شهر)",
      dt_exp_risk: "وحدات مهددة بانتهاء الصلاحية",
      tab_expiry: "مراقبة الصلاحية",
      ev_atrisk: "مهدّد بالانتهاء", ev_expired: "منتهي الصلاحية",
      ev_batches: "دفعة", ev_total_qty: "إجمالي الوحدات", ev_value_pending: "القيمة — أضف الأسعار",
      ev_sort_exp: "حسب الصلاحية", ev_sort_qty: "حسب الكمية",
      ev_tte: "حتى الانتهاء", ev_overdue: "متأخرة",
      c_lot: "رقم الدفعة", c_expdate: "تاريخ الصلاحية",
      ev_empty: "لا توجد دفعات مهددة أو منتهية في هذا الملف.",
      dt_expired_batches: "دفعات منتهية الصلاحية (في الحجر)",
      rp_generated: "أُنشئ في",
      th_title: "حد تنبيه مخصص",
      th_ph: "أشهر",
      th_save: "حفظ",
      th_clear: "إعادة إلى ٦",
      th_mark: "حد تنبيه مخصص: {m} شهر",
      th_hint: "نبّه لهذا الصنف عندما تكون التغطية ≤ الأشهر المحددة (الافتراضي ٦).",
      langName: "عربي"
    }
  };
  var LANG = (function () { try { return localStorage.getItem(LANG_KEY) || "en"; } catch (e) { return "en"; } })();
  function t(k) { return (T[LANG] && T[LANG][k]) || T.en[k] || k; }

  // ---------- state ----------
  var STATE = {
    view: "planning", rows: [], monthly: null,
    meta: { period_start: null, period_end: null, actual_months: null, stock_as_of: null, source: null },
    filter: "all", search: "", sort: { key: "cov", dir: "asc" },
    raw: { withdrawals: null, stock: null },
    wdName: null, stName: null, // null=hint, "sample", or filename
    detail: null, // NUPCO code currently open in the item drill-down sheet
    quality: null, qualityDismissed: false // per-upload data-quality report (step 2)
  };

  // ---------- helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  function normCode(v) { if (v == null || v === "") return null; if (typeof v === "number") return String(Math.round(v)); var s = String(v).trim(); if (/^\d+\.0+$/.test(s)) s = s.split(".")[0]; return s; }
  function isDrug(c) { return c && c.charAt(0) === "5"; }
  /* Hand-dispensed predicate: anything that is not a recognized parenteral
     UOM is treated as dispensed into the patient's hand (tablets, syrups,
     tubes, sachets, pens, …) and gets the 3-month no-dispense grace. */
  function handDispensed(uom) {
    if (uom == null || uom === "") return false;
    var tok = String(uom).trim().toUpperCase().split("/")[0].trim();
    return !!tok && !INJECTABLE_UOMS[tok];
  }
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
  /* Opening a second modal while one is already open must not stack a second
     document keydown listener (which would survive the first close and leak).
     removeEventListener before add makes add/remove strictly symmetric. Focus
     management: the previously focused element is remembered so it can be
     restored on close, and the modal card itself receives focus so keyboard
     and screen-reader users land inside the dialog. */
  function openModal(html, cls, onClose) {
    var bd = $("modal"), card = $("modalCard");
    bd._prevFocus = document.activeElement;
    card.className = "modal-card" + (cls ? " " + cls : "");
    card.innerHTML = html;
    card.setAttribute("tabindex", "-1");
    bd.hidden = false;
    document.body.style.overflow = "hidden";
    bd._onClose = onClose || null;
    bd.onclick = function (ev) { if (ev.target === bd) closeModal(); };
    document.removeEventListener("keydown", modalEsc);
    document.addEventListener("keydown", modalEsc);
    wireSheetSwipe(card);
    try { card.focus(); } catch (e) {}
  }
  function modalEsc(ev) { if (ev.key === "Escape") closeModal(); }
  /* Swipe-down-to-dismiss for the bottom sheet: when the sheet is scrolled to
     its top, dragging downward follows the finger and a pull past the
     threshold closes it. Wired once — the listeners live on the persistent
     #modalCard element across opens. */
  function wireSheetSwipe(card) {
    if (card._swipeWired) return;
    card._swipeWired = true;
    var startY = null, dy = 0, dragging = false;
    card.addEventListener("touchstart", function (ev) {
      if (ev.touches.length !== 1) { startY = null; return; }
      startY = ev.touches[0].clientY; dy = 0; dragging = false;
    }, { passive: true });
    card.addEventListener("touchmove", function (ev) {
      if (startY == null) return;
      dy = ev.touches[0].clientY - startY;
      if (card.scrollTop <= 0 && dy > 0) {
        dragging = true;
        card.style.transform = "translateY(" + dy + "px)";
        if (ev.cancelable) ev.preventDefault();
      } else if (dragging) {
        dragging = false;
        card.style.transform = "";
      }
    }, { passive: false });
    card.addEventListener("touchend", function () {
      if (dragging && dy > 80) {
        card.style.transform = "";
        closeModal();
      } else if (card.style.transform) {
        card.style.transition = "transform .18s cubic-bezier(.23,1,.32,1)";
        card.style.transform = "";
        setTimeout(function () { card.style.transition = ""; }, 200);
      }
      startY = null; dragging = false;
    });
  }
  function closeModal() {
    var bd = $("modal");
    if (bd.hidden) return;
    var cb = bd._onClose; bd._onClose = null;
    var prev = bd._prevFocus; bd._prevFocus = null;
    bd.hidden = true;
    $("modalCard").innerHTML = "";
    $("modalCard").style.transform = "";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", modalEsc);
    STATE.detail = null;
    if (prev && prev.focus) { try { prev.focus(); } catch (e) {} }
    if (cb) cb();
  }
  function norm(s) { return String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " "); }
  /* Column resolution. Exact (normalized) header match wins first. The
     substring fallback is dangerous for short tokens — a bare indexOf would
     bind "Qty" to "Free Qty" — so candidates of length ≤ 4 must match a whole
     header word (split on non-alphanumerics) rather than appear anywhere. */
  function findCol(header, cands) {
    var hn = header.map(norm);
    for (var i = 0; i < cands.length; i++) { var idx = hn.indexOf(norm(cands[i])); if (idx !== -1) return idx; }
    for (var j = 0; j < cands.length; j++) {
      var cc = norm(cands[j]);
      if (cc.length <= 4) {
        for (var k = 0; k < hn.length; k++) {
          var words = hn[k].split(/[^a-z0-9؀-ۿ]+/);
          if (words.indexOf(cc) !== -1) return k;
        }
      } else {
        for (var m = 0; m < hn.length; m++) if (hn[m].indexOf(cc) !== -1) return m;
      }
    }
    return -1;
  }
  /* String dates are ambiguous; resolve them deterministically instead of
     trusting the host's locale. ISO (YYYY-MM-DD) is tried first. The
     DD[-/]MM[-/]YYYY branch assumes day-first (the NUPCO/Saudi convention) but
     when the second field can only be a day (mm>12) and the first can be a
     month (dd<=12), the file was actually MM/DD and the parts are swapped; if
     BOTH exceed 12 the value is rejected. Only strings containing a month name
     (letters) fall through to the native Date parser; bare numeric strings that
     matched nothing return null so the caller can flag the row. */
  function parseDate(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === "number" && v > 20000 && v < 80000) { var u = new Date(Math.round((v - 25569) * 86400 * 1000)); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()); }
    if (typeof v === "string") {
      var s = v.trim(), m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
      if (m) {
        var dd = +m[1], mm = +m[2], yyyy = +m[3];
        if (mm > 12) { if (dd <= 12) { var tmp = dd; dd = mm; mm = tmp; } else return null; }
        if (mm < 1 || dd < 1 || dd > 31) return null;
        return new Date(yyyy, mm - 1, dd);
      }
      if (/[A-Za-z؀-ۿ]/.test(s)) { var d = new Date(s); if (!isNaN(d)) return d; }
    }
    return null;
  }
  /* "Stock as of" from the filename: an 8-digit run is accepted only when it
     forms a real calendar date — DDMMYYYY (the NUPCO export convention) is
     preferred, YYYYMMDD is the fallback; anything else returns null so the
     caller can fall back to the workbook's ModifiedDate. */
  function dateFromFilename(name) {
    var m = String(name || "").match(/(\d{8})/);
    if (!m) return null;
    var s = m[1];
    function mk(y, mo, d) {
      if (y < 2000 || y > 2099 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      var dt = new Date(y, mo - 1, d);
      return (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) ? dt : null;
    }
    return mk(+s.slice(4, 8), +s.slice(2, 4), +s.slice(0, 2)) || mk(+s.slice(0, 4), +s.slice(4, 6), +s.slice(6, 8));
  }
  /* Format from LOCAL date parts: every Date in this app is built at local
     midnight, so serializing through toISOString() (UTC) would shift the
     calendar day in any non-UTC timezone (Riyadh is UTC+3). */
  function isoDate(d) { return d ? d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) : null; }
  /* Parse a YYYY-MM-DD string back into a LOCAL-midnight Date so calendar
     math (month buckets, last-day checks) agrees with isoDate() everywhere. */
  function parseIsoLocal(iso) { if (!iso) return null; var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return null; return new Date(+m[1], +m[2] - 1, +m[3]); }
  function prettyDate(s) { if (!s) return "—"; var d = s instanceof Date ? s : (parseIsoLocal(s) || new Date(s)); if (isNaN(d)) return String(s); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  /* Calendar-date addition that agrees with isoDate/parseIsoLocal everywhere
     (local-midnight parts, no UTC drift). Used for stockout/reorder projection. */
  function addDaysIso(baseIso, n) { var d = parseIsoLocal(baseIso); if (!d || !isFinite(n)) return null; return isoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.round(n))); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* Spreadsheet formula-injection guard (security M1): a cell whose text starts
     with = + - @ (or a leading tab/CR) is interpreted as a formula when the
     exported .xlsx is reopened. File-derived strings (drug names, codes, lots,
     suppliers, planners, filenames) are neutralized with a leading apostrophe
     so they stay literal text. Numbers pass through untouched. */
  function csvSafe(v) { return (typeof v === "string" && /^[=+\-@\t\r]/.test(v)) ? "'" + v : v; }
  function sanitizeAoa(aoa) { return aoa.map(function (row) { return row.map(csvSafe); }); }

  // ---------- workbook ----------
  function readWorkbook(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) { try { var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true }); var ws = wb.Sheets[wb.SheetNames[0]]; cb(null, XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" }), wb); } catch (err) { cb(err); } };
    reader.onerror = function () { cb(reader.error); };
    reader.readAsArrayBuffer(file);
  }

  // ---------- parsers ----------
  /* A parser throws Error("cols:<English headers>") when a REQUIRED column is
     missing; this turns that into a " · missing columns: <headers>" suffix for
     the failure toast so a planner can see exactly which header their file
     lacks. Non-column errors (empty, etc.) yield "". The column names stay in
     English — they are the literal file headers the planner must add. */
  function colsHint(err) {
    var msg = err && err.message ? String(err.message) : "";
    var m = msg.match(/^cols:(.+)$/);
    return m ? " · " + t("cols_hint") + ": " + m[1] : "";
  }
  /* ---------- data-quality capture (ROADMAP step 2) ----------
     Every parser also reports what it did with the file: how many rows it
     accepted, how many it rejected per named reason, soft warnings, and
     which file header each app column was matched to — so nothing is
     excluded silently. Shape: { total, accepted, rejects: [{k,n}],
     warns: [{k,n}], cols: [{k,h}] } where k is an i18n key. */
  function qcols(H, pairs) {
    var out = [];
    pairs.forEach(function (p) {
      if (p[1] >= 0 && H[p[1]] != null && String(H[p[1]]).trim() !== "") out.push({ k: p[0], h: String(H[p[1]]).trim() });
    });
    return out;
  }
  function qreasons(counts) {
    var out = [];
    Object.keys(counts).forEach(function (k) { if (counts[k] > 0) out.push({ k: k, n: counts[k] }); });
    return out;
  }

  function parseWithdrawals(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "Generic Item Number", "Material"]),
      qi = findCol(H, ["Order Qty", "Quantity", "Qty"]),
      di = findCol(H, ["Delivery Date", "Ordered Date", "Date"]),
      si = findCol(H, ["Status"]), ui = findCol(H, ["UOM", "Unit"]),
      de = findCol(H, ["Description", "Item Description", "Generic Item description"]),
      xi = findCol(H, ["Expiry Date", "Expiry"]), bi = findCol(H, ["Batch No", "Batch"]);
    if (ci < 0 || qi < 0) throw new Error("cols:NUPCO Material/Order Qty");
    var byCode = {}, monthlyByCode = {}, badDates = 0;
    var qTotal = 0, qStatus = 0, qCode = 0, qNonDrug = 0;
    var events = []; // dated accepted rows, bucketed AFTER the dense-period pass
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      qTotal++;
      if (si >= 0) { var st = String(row[si] || "").trim().toUpperCase(); if (!STATUS_OK[st]) { qStatus++; continue; } }
      var code = normCode(row[ci]);
      if (code == null) { qCode++; continue; }
      if (!isDrug(code)) { qNonDrug++; continue; }
      var q = num(row[qi]);
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null, uom: null });
      rec.qty += q;
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
      if (!rec.uom && ui >= 0 && row[ui]) rec.uom = String(row[ui]).trim();
      if (di >= 0) {
        var cell = row[di];
        var d = parseDate(cell);
        if (d) {
          var ev = { code: code, q: q, d: d, ym: d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) };
          if (xi >= 0) {
            var xd = parseDate(row[xi]);
            if (xd) { ev.exp = isoDate(xd); if (bi >= 0 && row[bi]) ev.batch = String(row[bi]).trim(); }
          }
          events.push(ev);
        } else if (cell != null && String(cell).trim() !== "") {
          // A non-empty cell we could not read: surfaced to the user so a
          // mistyped/locale-mangled date is not silently dropped from the period.
          badDates++;
        }
      }
    }
    /* Dense-period detection: a single row whose date parses years away (a
       typo or a locale-mangled export) must not stretch the analysis period —
       a 5-month file once reported ~65 months, deflating every monthly
       average ~12x. Edge months holding fewer than max(2, 0.5%) of the dated
       rows are outliers: their rows keep counting toward consumption totals
       (the withdrawal happened; only its date is suspect) but are excluded
       from period detection, monthly buckets, and the expiry-fallback queue. */
    var ymCount = {};
    events.forEach(function (ev) { ymCount[ev.ym] = (ymCount[ev.ym] || 0) + 1; });
    var yms = Object.keys(ymCount).sort();
    var thr = Math.max(2, Math.ceil(events.length * 0.005));
    var lo = 0, hi = yms.length - 1;
    while (lo < hi && ymCount[yms[lo]] < thr) lo++;
    while (hi > lo && ymCount[yms[hi]] < thr) hi--;
    var ymLo = yms[lo] || null, ymHi = yms[hi] || null;
    var minD = null, maxD = null, outlierDates = 0;
    events.forEach(function (ev) {
      if (ymLo && (ev.ym < ymLo || ev.ym > ymHi)) { outlierDates++; return; }
      if (!minD || ev.d < minD) minD = ev.d;
      if (!maxD || ev.d > maxD) maxD = ev.d;
      var mc = monthlyByCode[ev.code] || (monthlyByCode[ev.code] = {});
      mc[ev.ym] = (mc[ev.ym] || 0) + ev.q;
      // Expiry fallback signal: warehouses pick earliest-expiry-first, so
      // the latest dispatch's batch expiry approximates the front of the
      // remaining stock queue when the stock file carries no expiry.
      if (ev.exp) {
        var rec = byCode[ev.code], dIso = isoDate(ev.d);
        if (!rec.lastD || dIso >= rec.lastD) {
          rec.lastD = dIso;
          rec.lastExp = ev.exp;
          if (ev.batch) rec.lastBatch = ev.batch;
        }
      }
    });
    var months = (minD && maxD) ? Math.max((maxD - minD) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
    var quality = {
      total: qTotal, accepted: qTotal - qStatus - qCode - qNonDrug,
      rejects: qreasons({ qr_status: qStatus, qr_code: qCode, qr_nondrug: qNonDrug }),
      warns: qreasons({ qr_baddate: badDates, qr_outlier: outlierDates }),
      cols: qcols(H, [["c_code", ci], ["qs_qty", qi], ["qs_date", di], ["c_status", si], ["c_desc", de], ["c_uom", ui], ["c_expiry", xi], ["qs_batch", bi]])
    };
    return { byCode: byCode, monthlyByCode: monthlyByCode, period_start: isoDate(minD), period_end: isoDate(maxD), actual_months: months, badDates: badDates, outlierDates: outlierDates, quality: quality };
  }
  /* Merge several parsed withdrawals files (e.g. one per warehouse) into one
     aggregate: quantities and monthly buckets sum per code, the analysis
     period spans the earliest..latest delivery date across all files. */
  function combineWithdrawals(parts) {
    var byCode = {}, monthlyByCode = {}, minS = null, maxE = null, badDates = 0;
    parts.forEach(function (p) {
      badDates += p.badDates || 0;
      Object.keys(p.byCode).forEach(function (c) {
        var src = p.byCode[c], dst = byCode[c] || (byCode[c] = { qty: 0, desc: null, uom: null });
        dst.qty += src.qty;
        if (!dst.desc) dst.desc = src.desc;
        if (!dst.uom) dst.uom = src.uom;
        if (src.lastD && (!dst.lastD || src.lastD >= dst.lastD)) {
          dst.lastD = src.lastD; dst.lastExp = src.lastExp; dst.lastBatch = src.lastBatch || null;
        }
      });
      Object.keys(p.monthlyByCode).forEach(function (c) {
        var src = p.monthlyByCode[c], dst = monthlyByCode[c] || (monthlyByCode[c] = {});
        Object.keys(src).forEach(function (ym) { dst[ym] = (dst[ym] || 0) + src[ym]; });
      });
      if (p.period_start && (!minS || p.period_start < minS)) minS = p.period_start;
      if (p.period_end && (!maxE || p.period_end > maxE)) maxE = p.period_end;
    });
    var months = (minS && maxE) ? Math.max((parseIsoLocal(maxE) - parseIsoLocal(minS)) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
    // Quality across the kept parts: totals sum, reasons merge by key, the
    // column mapping comes from the first part (multi-file uploads share an
    // export shape in practice).
    var quality = null;
    parts.forEach(function (p) {
      if (!p.quality) return;
      if (!quality) { quality = { total: 0, accepted: 0, rejects: [], warns: [], cols: p.quality.cols }; }
      quality.total += p.quality.total;
      quality.accepted += p.quality.accepted;
      ["rejects", "warns"].forEach(function (slot) {
        p.quality[slot].forEach(function (x) {
          var hit = null;
          quality[slot].forEach(function (y) { if (y.k === x.k) hit = y; });
          if (hit) hit.n += x.n; else quality[slot].push({ k: x.k, n: x.n });
        });
      });
    });
    var outlierDates = 0;
    parts.forEach(function (p) { outlierDates += p.outlierDates || 0; });
    return { byCode: byCode, monthlyByCode: monthlyByCode, period_start: minS, period_end: maxE, actual_months: months, badDates: badDates, outlierDates: outlierDates, files: parts.map(function (p) { return p.name; }), quality: quality };
  }
  /* Renamed copies of the same export must not double-count: two parsed parts
     with the identical period AND the identical grand-total quantity are the
     same data, so only the first is kept. Legitimate multi-warehouse files
     share the period but differ in totals and pass through untouched. */
  function dedupeParts(parts, alreadyDropped) {
    var sigs = {}, dropped = alreadyDropped || 0;
    var out = parts.filter(function (p) {
      var total = 0;
      Object.keys(p.byCode).forEach(function (c) { total += p.byCode[c].qty; });
      var sig = (p.period_start || "") + "|" + (p.period_end || "") + "|" + total;
      if (sigs[sig]) { dropped++; return false; }
      sigs[sig] = 1; return true;
    });
    if (dropped) toast(t("dup_skipped"));
    return out;
  }

  /* A persistence failure must stay visible: the upload flow toasts its own
     success message right after saving, so the warning waits until that toast
     has had its time on screen instead of being overwritten instantly. */
  function warnSaveFailed() { setTimeout(function () { toast(t("save_failed")); }, 3000); }
  /* Single localStorage writer for every persisted blob (snapshots, baseline,
     map, history). JSON.stringify once, then setItem. On a quota error the
     history blob alone has a recovery path — prune to 12 months and retry,
     toasting hist_quota on success — while every other key fails outright. ANY
     final failure surfaces through the save_failed warning so a silent loss of
     "remembered on this device" state never goes unnoticed.
     opts: { prune: fn(obj) used on quota for history, quotaToast: i18n key }. */
  function persist(key, obj, opts) {
    opts = opts || {};
    var json;
    try { json = JSON.stringify(obj); } catch (e) { warnSaveFailed(); return false; }
    try { localStorage.setItem(key, json); return true; }
    catch (e) {
      if (opts.prune) {
        try {
          opts.prune(obj);
          localStorage.setItem(key, JSON.stringify(obj));
          if (opts.quotaToast) toast(t(opts.quotaToast));
          return true;
        } catch (e2) { warnSaveFailed(); return false; }
      }
      warnSaveFailed();
      return false;
    }
  }
  /* The latest uploaded consumption aggregate is kept on this device so a
     future session can upload only a fresh stock file and still get coverage
     against the saved monthly averages. */
  function saveBaseline(wd) {
    persist(BASE_KEY, {
      savedAt: new Date().toISOString(), files: wd.files,
      period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months,
      byCode: wd.byCode, monthlyByCode: wd.monthlyByCode
    });
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
    persist(HIST_KEY, h, { prune: function (obj) { pruneHistory(obj, 12); }, quotaToast: "hist_quota" });
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
    var ci = findCol(H, ["NUPCO Material", "NUPCO Code", "NUPCO", "Generic Mat Code", "Generic Item Number", "Material", "كود نبكو", "رقم نبكو", "نبكو"]),
      ti = findCol(H, ["Trade Name", "Brand Name", "Brand", "Commercial Name", "Trade", "الاسم التجاري", "الاسم التجارى", "اسم تجاري"]),
      // The MODHS unified catalog carries no "Scientific Name" header; its
      // item descriptions ARE the generic names planners search by (incl.
      // Saudi-common spellings like ADRENALINE for EPINEPHRINE), so they
      // join the scientific-name candidates after the explicit headers.
      gi = findCol(H, ["Scientific Name", "Generic Name", "Scientific", "الاسم العلمي", "اسم علمي", "المادة الفعالة", "MODHS Item Description", "NUPCO Item Description"]),
      hi = findCol(H, ["Hospital Code", "Hospital Item Number", "Hospital Number", "Local Code", "Hospital", "كود المستشفى", "رقم المستشفى"]),
      mi = findCol(H, ["MODHS-CODE", "MODHS CODE", "MSD Code", "MSD Number", "MSD", "الكود الموحد"]),
      cl = findCol(H, ["Classification", "التصنيف"]),
      uo = findCol(H, ["UOM", "Unit", "الوحدة"]),
      pl = findCol(H, ["Priorty Level", "Priority Level", "الأولوية"]),
      pp = findCol(H, ["Pack Price", "Unit Pack Price", "سعر العلبة", "سعر العبوة"]),
      // The owner's price list is per DISPENSING UNIT already ("Net Price/
      // Per unit 1") — it must never be divided by a pack size.
      np = findCol(H, ["Net Price/Per unit 1", "Net Price Per Unit", "Net Unit Price", "Net Price", "Unit Price", "سعر الوحدة", "السعر النهائي"]),
      up = findCol(H, ["Units per Pack", "Pack Size", "Units/Pack", "عدد الحبات", "عدد الوحدات"]),
      aq = findCol(H, ["Awarded Qty", "Award Quantity", "Tender Qty", "كمية الترسية"]),
      fq = findCol(H, ["Free Qty", "Free Quantity", "Bonus Qty", "Bonus", "الكمية المجانية"]);
    // Tolerant matching can bind both price slots to one header (e.g. the
    // substring "Unit Price" inside "Unit Pack Price"); the pack column wins
    // and the per-unit slot stands down rather than double-reading it.
    if (np >= 0 && np === pp) np = -1;
    if (ci < 0 || (ti < 0 && gi < 0 && hi < 0 && mi < 0 && cl < 0 && pp < 0 && np < 0 && aq < 0 && fq < 0)) throw new Error("cols:NUPCO Material");
    var byCode = {}, n = 0, priced = 0;
    var qTotal = 0, qCode = 0, qNonDrug = 0, qEmpty = 0;
    function val(row, idx) { if (idx < 0 || row[idx] == null || row[idx] === "") return null; var v = typeof row[idx] === "number" ? normCode(row[idx]) : String(row[idx]).trim(); return v || null; }
    function numVal(row, idx) { if (idx < 0) return null; var v = parseFloat(row[idx]); return isFinite(v) && v > 0 ? v : null; }
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      qTotal++;
      var code = normCode(row[ci]);
      if (code == null) { qCode++; continue; }
      if (!isDrug(code)) { qNonDrug++; continue; }
      var rec = {
        trade: val(row, ti), sci: val(row, gi), hosp: val(row, hi), msd: val(row, mi),
        cls: val(row, cl), prio: val(row, pl), uom: val(row, uo),
        packPrice: numVal(row, pp), netUnit: numVal(row, np), unitsPerPack: numVal(row, up), awardQty: numVal(row, aq), freeQty: fq < 0 ? null : (parseFloat(row[fq]) >= 0 ? parseFloat(row[fq]) : null)
      };
      if (rec.trade || rec.sci || rec.hosp || rec.msd || rec.cls || rec.packPrice || rec.netUnit || rec.awardQty || rec.freeQty != null) {
        byCode[code] = rec; n++;
        if (rec.packPrice || rec.netUnit) priced++;
      } else { qEmpty++; }
    }
    if (!n) throw new Error("empty-map");
    var quality = {
      total: qTotal, accepted: qTotal - qCode - qNonDrug - qEmpty,
      rejects: qreasons({ qr_code: qCode, qr_nondrug: qNonDrug, qr_empty: qEmpty }),
      warns: [],
      cols: qcols(H, [["c_code", ci], ["c_trade", ti], ["qs_sci", gi], ["c_hosp", hi], ["c_msd", mi], ["c_class", cl], ["dt_priority", pl], ["pr_pack_price", pp], ["pr_unit_price", np], ["pr_units_per_pack", up], ["qs_award", aq], ["qs_free", fq]])
    };
    return { byCode: byCode, count: n, priced: priced, hasTrade: ti >= 0 || gi >= 0, quality: quality };
  }
  function saveMap(map) { persist(MAP_KEY, map); }
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
      r.cls = (m && m.cls) || r.cls || null;
      r.prio = (m && m.prio) || r.prio || null;
      r.packPrice = (m && m.packPrice) || r.packPrice || null;
      r.netUnit = (m && m.netUnit) || r.netUnit || null;
      r.unitsPerPack = (m && m.unitsPerPack) || r.unitsPerPack || null;
      var awardQty = (m && m.awardQty) || r.awardQty || null;
      var freeQty = (m && m.freeQty != null) ? m.freeQty : (r.freeQty != null ? r.freeQty : null);
      r.awardQty = awardQty; r.freeQty = freeQty;
      // The owner's net price is already PER DISPENSING UNIT and wins
      // outright; otherwise government pack pricing divides by units/pack.
      // Both match the unit the hospital counts in.
      r.unitPrice = r.netUnit != null ? r.netUnit : (r.packPrice ? (r.unitsPerPack ? r.packPrice / r.unitsPerPack : r.packPrice) : null);
      r.effUnitPrice = (r.unitPrice && awardQty && freeQty != null) ? r.unitPrice * awardQty / (awardQty + freeQty) : null;
      // NUPCO quantities are counted in the dispensing UOM (TAB = tablets,
      // BT = bottles), i.e. the same smallest unit the unit price refers to.
      r.stockValue = r.unitPrice ? r.stock * r.unitPrice : null;
      // Search haystack: trade + scientific + hospital/MSD codes + MODHS
      // classification + agent, from whichever source provided them.
      r.alt = [r.trade, r.sci, r.hosp, r.msd, r.cls, r.agent].filter(Boolean).join(" ");
      if (m) n++;
    });
    applyPlannerCodes(rows);
    return n;
  }
  function hasPrices() { return !!(MAP && MAP.priced) || STATE.rows.some(function (r) { return r.packPrice || r.netUnit; }); }

  /* ---------- drug information (owner request: SFDA / what is it for) ----------
     Curated bilingual dictionary keyed by generic-name STEMS covering the most
     common generics in the hospital catalog. Matched as an uppercase substring
     of desc+sci+trade. ORDER MATTERS for overlapping stems (ISOTRETINOIN before
     TRETINOIN; generic electrolytes/vitamins LAST so salts like
     "DICLOFENAC SODIUM" hit the specific stem first). Unmapped items fall back
     to the MODHS classification text alone. [en, ar]. */
  var DRUG_INFO = {
    PARACETAMOL: ["Pain reliever and fever reducer", "مسكن للألم وخافض للحرارة"],
    IBUPROFEN: ["Anti-inflammatory pain reliever (NSAID)", "مسكن ومضاد للالتهاب"],
    DICLOFENAC: ["Anti-inflammatory pain reliever (NSAID)", "مسكن ومضاد للالتهاب"],
    CLOPIDOGREL: ["Antiplatelet — helps prevent heart attack and stroke", "مميع للدم يقي من الجلطات القلبية والدماغية"],
    WARFARIN: ["Anticoagulant — prevents and treats blood clots", "مميع للدم يمنع ويعالج الجلطات"],
    RIVAROXABAN: ["Anticoagulant — prevents and treats blood clots", "مميع للدم يمنع ويعالج الجلطات"],
    ENOXAPARIN: ["Injectable anticoagulant — prevents blood clots", "مميع للدم بالحقن يمنع الجلطات"],
    HEPARIN: ["Injectable anticoagulant — prevents and treats clots", "مميع للدم بالحقن يمنع ويعالج الجلطات"],
    TRANEXAMIC: ["Reduces or stops heavy bleeding", "يوقف أو يقلل النزيف الشديد"],
    PHYTOMENADIONE: ["Vitamin K — treats bleeding and protects newborns", "فيتامين ك — يعالج النزيف ويقي حديثي الولادة"],
    ATORVASTATIN: ["Lowers cholesterol — protects heart and arteries", "خافض للكوليسترول يحمي القلب والشرايين"],
    AMLODIPINE: ["Lowers high blood pressure", "خافض لضغط الدم المرتفع"],
    VALSARTAN: ["Lowers blood pressure and supports heart failure", "خافض للضغط وداعم لقصور القلب"],
    IRBESARTAN: ["Lowers blood pressure and protects the kidneys", "خافض للضغط وواقٍ للكلى"],
    PROPRANOLOL: ["Beta-blocker — blood pressure, heart rhythm, migraine", "حاصر بيتا — للضغط ونظم القلب والصداع النصفي"],
    CARVEDILOL: ["Beta-blocker — heart failure and blood pressure", "حاصر بيتا — لقصور القلب والضغط"],
    VERAPAMIL: ["Calcium-channel blocker — blood pressure and heart rhythm", "حاصر قنوات الكالسيوم — للضغط ونظم القلب"],
    DIGOXIN: ["Strengthens the heartbeat — heart failure and atrial fibrillation", "مقوٍ لعضلة القلب — لقصور القلب والرجفان الأذيني"],
    SPIRONOLACTONE: ["Diuretic — heart failure and fluid retention", "مدر للبول — لقصور القلب واحتباس السوائل"],
    FUROSEMIDE: ["Diuretic — removes excess fluid (heart, kidney, liver)", "مدر للبول — يزيل السوائل الزائدة"],
    EPINEPHRINE: ["Emergency drug for severe allergy and cardiac arrest", "دواء طوارئ للحساسية المفرطة وتوقف القلب"],
    PHENYLEPHRINE: ["Raises blood pressure / nasal decongestant", "رافع للضغط ومزيل لاحتقان الأنف"],
    RIOCIGUAT: ["Treats pulmonary hypertension", "يعالج ارتفاع ضغط الشريان الرئوي"],
    SELEXIPAG: ["Treats pulmonary arterial hypertension", "يعالج ارتفاع ضغط الشريان الرئوي"],
    TADALAFIL: ["Erectile dysfunction and pulmonary hypertension", "لضعف الانتصاب وارتفاع الضغط الرئوي"],
    METFORMIN: ["First-line treatment for type 2 diabetes", "العلاج الأول للسكري من النوع الثاني"],
    INSULIN: ["Controls blood sugar in diabetes", "يضبط سكر الدم لمرضى السكري"],
    SEMAGLUTIDE: ["GLP-1 — type 2 diabetes and weight management", "للسكري من النوع الثاني وإنقاص الوزن"],
    TIRZEPATIDE: ["Type 2 diabetes and weight management", "للسكري من النوع الثاني وإنقاص الوزن"],
    LEVOTHYROXINE: ["Thyroid hormone replacement", "تعويض هرمون الغدة الدرقية"],
    SOMATROPIN: ["Growth hormone — growth failure", "هرمون النمو — لقصور النمو"],
    DESMOPRESSIN: ["Diabetes insipidus and bedwetting", "للسكري الكاذب والتبول الليلي"],
    TESTOSTERONE: ["Male hormone replacement", "تعويض هرمون الذكورة"],
    MEDROXYPROGESTERONE: ["Hormone — menstrual disorders and contraception", "هرمون — لاضطرابات الدورة ومنع الحمل"],
    PROGESTERONE: ["Hormone — menstrual and pregnancy support", "هرمون — لدعم الدورة والحمل"],
    DESOGESTREL: ["Hormonal contraceptive", "مانع حمل هرموني"],
    CYPROTERONE: ["Hormonal — prostate cancer and androgen excess", "هرموني — لسرطان البروستاتا وفرط الأندروجين"],
    OXYTOCIN: ["Induces labor and controls bleeding after birth", "محفز للولادة وموقف لنزيف ما بعدها"],
    METHOTREXATE: ["Chemotherapy / rheumatoid arthritis and psoriasis", "علاج كيماوي وللروماتويد والصدفية"],
    TRASTUZUMAB: ["Targeted therapy for HER2 breast cancer", "علاج موجه لسرطان الثدي HER2"],
    PERTUZUMAB: ["Targeted therapy for HER2 breast cancer", "علاج موجه لسرطان الثدي HER2"],
    RITUXIMAB: ["Lymphoma and autoimmune diseases", "للأورام اللمفاوية وأمراض المناعة الذاتية"],
    BEVACIZUMAB: ["Cancer therapy — blocks tumor blood supply", "علاج للسرطان يمنع تروية الورم"],
    PALBOCICLIB: ["Advanced breast cancer", "لسرطان الثدي المتقدم"],
    LENVATINIB: ["Thyroid and liver cancer", "لسرطان الغدة الدرقية والكبد"],
    LENALIDOMIDE: ["Multiple myeloma", "للورم النقوي المتعدد"],
    TEMOZOLOMIDE: ["Brain tumors", "لأورام الدماغ"],
    CAPECITABINE: ["Colorectal and breast cancer", "لسرطان القولون والثدي"],
    CYTARABINE: ["Leukemia chemotherapy", "علاج كيماوي لسرطان الدم"],
    MELPHALAN: ["Chemotherapy — multiple myeloma", "علاج كيماوي للورم النقوي"],
    DEGARELIX: ["Advanced prostate cancer", "لسرطان البروستاتا المتقدم"],
    ISOTRETINOIN: ["Severe acne", "لحب الشباب الشديد"],
    TRETINOIN: ["Topical for acne / leukemia therapy", "موضعي لحب الشباب وعلاج لسرطان الدم"],
    TACROLIMUS: ["Immunosuppressant — prevents transplant rejection", "مثبط مناعة يمنع رفض الأعضاء المزروعة"],
    CICLOSPORIN: ["Immunosuppressant — transplant and autoimmune disease", "مثبط مناعة — للزراعة وأمراض المناعة"],
    MYCOPHENOLATE: ["Immunosuppressant — prevents transplant rejection", "مثبط مناعة يمنع رفض الأعضاء المزروعة"],
    RISANKIZUMAB: ["Biologic for plaque psoriasis and Crohn's disease", "علاج حيوي للصدفية اللويحية وداء كرون"],
    DUPILUMAB: ["Biologic for severe eczema and asthma", "علاج حيوي للإكزيما الشديدة والربو"],
    ETANERCEPT: ["Biologic for rheumatoid arthritis and psoriasis", "علاج حيوي للروماتويد والصدفية"],
    BELIMUMAB: ["Biologic for lupus (SLE)", "علاج حيوي للذئبة الحمراء"],
    INTERFERON: ["Multiple sclerosis and viral diseases", "للتصلب المتعدد وبعض الفيروسات"],
    DENOSUMAB: ["Osteoporosis and bone protection in cancer", "لهشاشة العظام وحماية العظم لمرضى السرطان"],
    ZOLEDRONIC: ["Osteoporosis and high blood calcium", "لهشاشة العظام وارتفاع كالسيوم الدم"],
    ANTIHEMOPHILIC: ["Clotting factor — treats hemophilia bleeding", "عامل تخثر لعلاج نزيف الهيموفيليا"],
    DARBEPOETIN: ["Treats anemia of kidney disease / chemotherapy", "لعلاج فقر الدم الناتج عن الفشل الكلوي أو الكيماوي"],
    EPOETIN: ["Treats anemia of kidney disease / chemotherapy", "لعلاج فقر الدم الناتج عن الفشل الكلوي أو الكيماوي"],
    GCSF: ["Boosts white blood cells after chemotherapy", "محفز لكريات الدم البيضاء بعد الكيماوي"],
    DEFERASIROX: ["Removes excess iron (transfusion overload)", "يزيل الحديد الزائد بعد نقل الدم المتكرر"],
    ALBUMIN: ["Restores blood volume and protein (liver, ICU)", "يعوض حجم الدم والبروتين"],
    PHENYTOIN: ["Epilepsy — prevents seizures", "للصرع — يمنع النوبات"],
    LEVETIRACETAM: ["Epilepsy — prevents seizures", "للصرع — يمنع النوبات"],
    LAMOTRIGINE: ["Epilepsy and bipolar disorder", "للصرع والاضطراب ثنائي القطب"],
    CARBAMAZEPINE: ["Epilepsy and nerve pain", "للصرع وآلام الأعصاب"],
    VALPROATE: ["Epilepsy and bipolar disorder", "للصرع والاضطراب ثنائي القطب"],
    PERAMPANEL: ["Epilepsy — add-on seizure control", "للصرع — علاج مساعد للنوبات"],
    LEVODOPA: ["Parkinson's disease", "لمرض باركنسون"],
    PRAMIPEXOLE: ["Parkinson's disease and restless legs", "لباركنسون ومتلازمة تململ الساقين"],
    RIVASTIGMINE: ["Alzheimer's and Parkinson's dementia", "لخرف الزهايمر وباركنسون"],
    QUETIAPINE: ["Schizophrenia and bipolar disorder", "للفصام والاضطراب ثنائي القطب"],
    ARIPIPRAZOLE: ["Schizophrenia and bipolar disorder", "للفصام والاضطراب ثنائي القطب"],
    OLANZAPINE: ["Schizophrenia and bipolar disorder", "للفصام والاضطراب ثنائي القطب"],
    RISPERIDONE: ["Schizophrenia and behavioral disorders", "للفصام والاضطرابات السلوكية"],
    CLOZAPINE: ["Treatment-resistant schizophrenia", "للفصام المقاوم للعلاج"],
    HALOPERIDOL: ["Acute psychosis and agitation", "للذهان الحاد والهياج"],
    FLUOXETINE: ["Depression and anxiety (SSRI)", "للاكتئاب والقلق"],
    PAROXETINE: ["Depression and anxiety (SSRI)", "للاكتئاب والقلق"],
    AMITRIPTYLINE: ["Depression and nerve pain", "للاكتئاب وآلام الأعصاب"],
    ATOMOXETINE: ["Attention deficit disorder (ADHD)", "لاضطراب فرط الحركة وتشتت الانتباه"],
    FLUTICASONE: ["Inhaled/nasal corticosteroid — asthma and allergy", "كورتيزون استنشاقي/أنفي — للربو والحساسية"],
    FLUTICAZONE: ["Inhaled/nasal corticosteroid — asthma and allergy", "كورتيزون استنشاقي/أنفي — للربو والحساسية"],
    BUDESONIDE: ["Corticosteroid — asthma and bowel inflammation", "كورتيزون — للربو والتهاب الأمعاء"],
    SALBUTAMOL: ["Quick-relief inhaler for asthma", "موسع شعب سريع المفعول للربو"],
    MONTELUKAST: ["Asthma and allergic rhinitis prevention", "وقاية من الربو وحساسية الأنف"],
    BETAMETHASONE: ["Corticosteroid — skin and joint inflammation", "كورتيزون — لالتهابات الجلد والمفاصل"],
    DEXAMETHASONE: ["Corticosteroid — inflammation, brain swelling, chemo support", "كورتيزون — للالتهابات وتورم الدماغ ودعم الكيماوي"],
    METHYLPREDNISOLONE: ["Corticosteroid — severe inflammation and allergy", "كورتيزون — للالتهابات والحساسية الشديدة"],
    PREDNISOLONE: ["Corticosteroid — inflammation and autoimmune disease", "كورتيزون — للالتهابات وأمراض المناعة"],
    HYDROCORTISONE: ["Corticosteroid — adrenal insufficiency and inflammation", "كورتيزون — لقصور الكظر والالتهابات"],
    TRIAMCINOLONE: ["Corticosteroid — skin and joint inflammation", "كورتيزون — لالتهابات الجلد والمفاصل"],
    MOMETASONE: ["Corticosteroid — nasal allergy and skin", "كورتيزون — لحساسية الأنف والجلد"],
    CLOBETASOL: ["Potent topical corticosteroid — skin disease", "كورتيزون موضعي قوي — للأمراض الجلدية"],
    CALCIPOTRIOL: ["Topical for psoriasis", "موضعي لعلاج الصدفية"],
    DIPHENHYDRAMINE: ["Antihistamine — allergy and itching", "مضاد هيستامين — للحساسية والحكة"],
    LIDOCAINE: ["Local anesthetic", "مخدر موضعي"],
    LIGNOCAINE: ["Local anesthetic", "مخدر موضعي"],
    PROPOFOL: ["General anesthetic (operating room / ICU)", "مخدر عام (العمليات والعناية المركزة)"],
    NEOSTIGMINE: ["Myasthenia gravis / reverses muscle relaxants", "للوهن العضلي وعكس مرخيات العضلات"],
    AMOXICILLIN: ["Antibiotic — bacterial infections", "مضاد حيوي للالتهابات البكتيرية"],
    AMPICILLIN: ["Antibiotic — bacterial infections", "مضاد حيوي للالتهابات البكتيرية"],
    PHENOXYMETHYLPENICILLIN: ["Penicillin antibiotic", "مضاد حيوي من البنسلين"],
    CEFUROXIME: ["Antibiotic — respiratory and urinary infections", "مضاد حيوي لالتهابات التنفس والبول"],
    CEFTRIAXONE: ["Broad antibiotic — serious infections", "مضاد حيوي واسع للالتهابات الشديدة"],
    AZITHROMYCIN: ["Antibiotic — respiratory and skin infections", "مضاد حيوي لالتهابات التنفس والجلد"],
    CLARITHROMYCIN: ["Antibiotic — respiratory infections and H. pylori", "مضاد حيوي للتنفس وجرثومة المعدة"],
    CIPROFLOXACIN: ["Antibiotic — urinary and gut infections", "مضاد حيوي لالتهابات البول والأمعاء"],
    MOXIFLOXACIN: ["Antibiotic — respiratory and eye infections", "مضاد حيوي لالتهابات التنفس والعين"],
    CLINDAMYCIN: ["Antibiotic — skin, bone and dental infections", "مضاد حيوي لالتهابات الجلد والعظم والأسنان"],
    LINEZOLID: ["Antibiotic for resistant infections (MRSA)", "مضاد حيوي للعدوى المقاومة"],
    VANCOMYCIN: ["Antibiotic for resistant infections (MRSA)", "مضاد حيوي للعدوى المقاومة"],
    MEROPENEM: ["Broad antibiotic — severe hospital infections", "مضاد حيوي واسع لعدوى المستشفيات الشديدة"],
    GENTAMICIN: ["Antibiotic — serious bacterial infections", "مضاد حيوي للعدوى البكتيرية الشديدة"],
    METRONIDAZOLE: ["Antibiotic — anaerobic and parasitic infections", "مضاد حيوي للجراثيم اللاهوائية والطفيليات"],
    CHLORAMPHENICOL: ["Antibiotic — eye and ear infections", "مضاد حيوي لالتهابات العين والأذن"],
    MUPIROCIN: ["Topical antibiotic — skin infections", "مضاد حيوي موضعي لالتهابات الجلد"],
    FUSIDIC: ["Topical antibiotic — skin and eye infections", "مضاد حيوي موضعي للجلد والعين"],
    RIFAMPICIN: ["Tuberculosis treatment", "لعلاج السل"],
    ISONIAZID: ["Tuberculosis treatment", "لعلاج السل"],
    ETHAMBUTOL: ["Tuberculosis treatment", "لعلاج السل"],
    VORICONAZOLE: ["Antifungal — serious fungal infections", "مضاد فطري للعدوى الفطرية الشديدة"],
    ITRACONAZOLE: ["Antifungal", "مضاد فطري"],
    MICONAZOLE: ["Antifungal — skin and mouth", "مضاد فطري للجلد والفم"],
    ACYCLOVIR: ["Antiviral — herpes and shingles", "مضاد فيروسي للهربس والحزام الناري"],
    GANCICLOVIR: ["Antiviral — CMV infection", "مضاد فيروسي لعدوى الفيروس المضخم للخلايا"],
    ESOMEPRAZOLE: ["Reduces stomach acid — reflux and ulcers", "خافض لحموضة المعدة — للارتجاع والقرحة"],
    PANTOPRAZOLE: ["Reduces stomach acid — reflux and ulcers", "خافض لحموضة المعدة — للارتجاع والقرحة"],
    DOMPERIDONE: ["Nausea and stomach motility", "للغثيان وتحريك المعدة"],
    GRANISETRON: ["Prevents nausea from chemotherapy/surgery", "يمنع الغثيان بعد الكيماوي والعمليات"],
    HYOSCINE: ["Stomach cramps and motion sickness", "للمغص ودوار الحركة"],
    BISACODYL: ["Laxative — constipation", "ملين للإمساك"],
    MESALAZINE: ["Ulcerative colitis and bowel inflammation", "لالتهاب القولون التقرحي"],
    OXYBUTYNIN: ["Overactive bladder", "لفرط نشاط المثانة"],
    ALLOPURINOL: ["Gout — lowers uric acid", "للنقرس — يخفض حمض اليوريك"],
    PILOCARPINE: ["Glaucoma and dry mouth", "للجلوكوما وجفاف الفم"],
    TROPICAMIDE: ["Eye drops — dilates the pupil for examination", "قطرة لتوسيع حدقة العين للفحص"],
    CYCLOPENTOLATE: ["Eye drops — dilates the pupil for examination", "قطرة لتوسيع حدقة العين للفحص"],
    DEXTROSE: ["IV sugar solution — energy and low blood sugar", "محلول سكري وريدي — للطاقة وهبوط السكر"],
    ALFACALCIDOL: ["Active vitamin D — bone and kidney disease", "فيتامين د النشط — للعظام ومرضى الكلى"],
    CHOLECALCIFEROL: ["Vitamin D — bone health", "فيتامين د — لصحة العظام"],
    FOLIC: ["Folic acid — anemia and pregnancy support", "حمض الفوليك — لفقر الدم ودعم الحمل"],
    ARGININE: ["Amino acid — metabolic disorders", "حمض أميني — لاضطرابات الاستقلاب"],
    MULTIVITAMIN: ["Multivitamin supplement", "مكمل فيتامينات متعددة"],
    IRON: ["Treats iron-deficiency anemia", "لعلاج فقر الدم بنقص الحديد"],
    MAGNESIUM: ["Magnesium supplement / electrolyte", "مكمل مغنيسيوم وتعويض الأملاح"],
    POTASSIUM: ["Potassium supplement / electrolyte", "مكمل بوتاسيوم وتعويض الأملاح"],
    CALCIUM: ["Calcium supplement — bones and electrolyte", "مكمل كالسيوم — للعظام وتعويض الأملاح"],
    SODIUM: ["Electrolyte / IV fluid component", "تعويض أملاح ومحاليل وريدية"],
    VITAMIN: ["Vitamin supplement", "مكمل فيتامينات"]
  };
  /* First matching stem wins; insertion order resolves overlaps. */
  function drugInfoFor(r) {
    var hay = ((r.desc || "") + " " + (r.sci || "") + " " + (r.trade || "")).toUpperCase();
    for (var k in DRUG_INFO) { if (hay.indexOf(k) !== -1) return DRUG_INFO[k]; }
    return null;
  }

  /* ---------- trade-name synonyms (owner request: search by commercial name) ----------
     The hospital's files carry GENERIC names: the MODHS catalog has no
     trade-name column at all, and the warehouse often stocks a DIFFERENT
     brand of the same generic (stock says VAROXA while the planner searches
     Xarelto). This curated dictionary maps well-known commercial names —
     including common Saudi-market brands and Arabic spellings — to the
     generic stem the files actually contain, so typing a trade name finds
     the right medicine in sample mode, real uploads and the catalog search.
     Every stem below was validated against the real MODHS catalog
     (real-data/MODDHS_MEDICATION_CATALOG_072025.xlsx). Search assistance
     only: the applied brand = generic mapping is always shown above the
     results so the planner can verify the match. */
  var TRADE_SYNONYMS = {
    // analgesics / anti-inflammatory
    PANADOL: "PARACETAMOL", ADOL: "PARACETAMOL", FEVADOL: "PARACETAMOL", TYLENOL: "PARACETAMOL",
    BRUFEN: "IBUPROFEN", PROFINAL: "IBUPROFEN", ADVIL: "IBUPROFEN",
    VOLTAREN: "DICLOFENAC", CATAFLAM: "DICLOFENAC", OLFEN: "DICLOFENAC", ROFENAC: "DICLOFENAC",
    CELEBREX: "CELECOXIB", DYNASTAT: "PARECOXIB",
    ASPIRIN: ["ACETYLSALICYLIC", "ACETYL SALICYLIC"], JUSPRIN: ["ACETYLSALICYLIC", "ACETYL SALICYLIC"],
    TRAMAL: "TRAMADOL", ULTRAM: "TRAMADOL", DUROGESIC: "FENTANYL", OXYCONTIN: "OXYCODONE",
    IMIGRAN: "SUMATRIPTAN", MAXALT: "RIZATRIPTAN", EMGALITY: "GALCANEZUMAB", UBRELVY: "UBROGEPANT",
    // cardiovascular
    LIPITOR: "ATORVASTATIN", CRESTOR: "ROSUVASTATIN", EZETROL: "EZETIMIBE", ZETIA: "EZETIMIBE",
    REPATHA: "EVOLOCUMAB", LEQVIO: "INCLISIRAN", LIPANTHYL: "FENOFIBRATE",
    PLAVIX: "CLOPIDOGREL", BRILINTA: "TICAGRELOR", BRILIQUE: "TICAGRELOR",
    XARELTO: "RIVAROXABAN", ELIQUIS: "APIXABAN", LIXIANA: "EDOXABAN",
    CLEXANE: "ENOXAPARIN", LOVENOX: "ENOXAPARIN", COUMADIN: "WARFARIN", MAREVAN: "WARFARIN",
    CONCOR: "BISOPROLOL", TENORMIN: "ATENOLOL", INDERAL: "PROPRANOLOL", BETALOC: "METOPROLOL",
    TRANDATE: "LABETALOL", BREVIBLOC: "ESMOLOL",
    NORVASC: "AMLODIPINE", ADALAT: "NIFEDIPINE", ISOPTIN: "VERAPAMIL",
    DIOVAN: "VALSARTAN", CODIOVAN: "VALSARTAN", EXFORGE: ["AMLODIPINE", "VALSARTAN"],
    APROVEL: "IRBESARTAN", AVAPRO: "IRBESARTAN", COVERSYL: "PERINDOPRIL", RENITEC: "ENALAPRIL", CAPOTEN: "CAPTOPRIL",
    LASIX: "FUROSEMIDE", ALDACTONE: "SPIRONOLACTONE", INSPRA: "EPLERENONE", ZAROXOLYN: "METOLAZONE", NATRILIX: "INDAPAMIDE",
    PROCORALAN: "IVABRADINE", RANEXA: "RANOLAZINE", VERQUVO: "VERICIGUAT", CAMZYOS: "MAVACAMTEN",
    LANOXIN: "DIGOXIN", CORDARONE: "AMIODARONE", TAMBOCOR: "FLECAINIDE",
    ADEMPAS: "RIOCIGUAT", UPTRAVI: "SELEXIPAG", TRACLEER: "BOSENTAN", OPSUMIT: "MACITENTAN", VENTAVIS: "ILOPROST",
    CIALIS: "TADALAFIL", ADCIRCA: "TADALAFIL",
    ACTILYSE: "ALTEPLASE", METALYSE: "TENECTEPLASE", ANGIOMAX: "BIVALIRUDIN", AGGRASTAT: "TIROFIBAN",
    NITROLINGUAL: "GLYCERYL TRINITRATE", TRIDIL: "GLYCERYL TRINITRATE",
    // diabetes / endocrine
    OZEMPIC: "SEMAGLUTIDE", WEGOVY: "SEMAGLUTIDE", RYBELSUS: "SEMAGLUTIDE", MOUNJARO: "TIRZEPATIDE",
    VICTOZA: "LIRAGLUTIDE", SAXENDA: "LIRAGLUTIDE",
    GLUCOPHAGE: "METFORMIN", JARDIANCE: "EMPAGLIFLOZIN", TRAJENTA: "LINAGLIPTIN",
    AMARYL: "GLIMEPIRIDE", DIAMICRON: "GLICLAZIDE", ACTOS: "PIOGLITAZONE", KERENDIA: "FINERENONE",
    LANTUS: "INSULIN GLARGINE", TOUJEO: "INSULIN GLARGINE", LEVEMIR: "INSULIN DETEMIR", TRESIBA: "INSULIN DEGLUDEC",
    NOVORAPID: "INSULIN ASPART", NOVOMIX: "INSULIN ASPART", NOVOLOG: "INSULIN ASPART",
    HUMALOG: "INSULIN LISPRO", HUMULIN: "INSULIN HUMAN", MIXTARD: "INSULIN HUMAN", GLUCAGEN: "GLUCAGON",
    EUTHYROX: "LEVOTHYROXINE", ELTROXIN: "LEVOTHYROXINE", NEOMERCAZOLE: "CARBIMAZOLE",
    GENOTROPIN: "SOMATROPIN", NORDITROPIN: "SOMATROPIN", MINIRIN: "DESMOPRESSIN", SYNACTHEN: "TETRACOSACTIDE",
    SANDOSTATIN: "OCTREOTIDE", FORTEO: "TERIPARATIDE",
    PROLIA: "DENOSUMAB", XGEVA: "DENOSUMAB", ACLASTA: "ZOLEDRONIC", ZOMETA: "ZOLEDRONIC",
    FOSAMAX: "ALENDRONATE", AREDIA: "PAMIDRONATE", EVENITY: "ROMOSOZUMAB", MIACALCIC: "CALCITONIN",
    ROCALTROL: "CALCITRIOL", ONEALPHA: "ALFACALCIDOL", ZEMPLAR: "PARICALCITOL",
    NEBIDO: "TESTOSTERONE", SUSTANON: "TESTOSTERONE", DUPHASTON: "DYDROGESTERONE",
    PROVERA: "MEDROXYPROGESTERONE", DEPOPROVERA: "MEDROXYPROGESTERONE", VISANNE: "DIENOGEST",
    CLOMID: "CLOMIFENE", GONALF: "FOLLITROPIN", CETROTIDE: "CETRORELIX",
    PREGNYL: "GONADOTROPHIN", OVITRELLE: "GONADOTROPHIN", DECAPEPTYL: "TRIPTORELIN",
    // gastro / renal-electrolyte
    NEXIUM: "ESOMEPRAZOLE", LOSEC: "OMEPRAZOLE", PRILOSEC: "OMEPRAZOLE", CONTROLOC: "PANTOPRAZOLE", PROTONIX: "PANTOPRAZOLE",
    PEPCID: "FAMOTIDINE", MOTILIUM: "DOMPERIDONE", ZOFRAN: "ONDANSETRON", KYTRIL: "GRANISETRON",
    EMEND: "APREPITANT", AKYNZEO: "NETUPITANT", BUSCOPAN: "HYOSCINE", DUSPATALIN: "MEBEVERINE",
    IMODIUM: "LOPERAMIDE", DUPHALAC: "LACTULOSE", DULCOLAX: "BISACODYL",
    MOVICOL: ["MACROGOL", "POLYETHYLINE"], FORLAX: "MACROGOL", GAVISCON: "ALGINATE",
    PENTASA: "MESALAZINE", ASACOL: "MESALAZINE", SALOFALK: "MESALAZINE", XIFAXAN: "RIFAXIMIN",
    URSOFALK: "URSODEOXYCHOLIC", CREON: "AMYLASE",
    LOKELMA: "ZIRCONIUM", VELTASSA: "PATIROMER", KAYEXALATE: "POLYSTYRENE",
    RENVELA: "SEVELAMER", RENAGEL: "SEVELAMER", VELPHORO: "SUCROFERRIC",
    MIMPARA: "CINACALCET", SENSIPAR: "CINACALCET", PARSABIV: "ETELCALCETIDE",
    // immunology / biologics / transplant
    HUMIRA: "ADALIMUMAB", SKYRIZI: "RISANKIZUMAB", RINVOQ: "UPADACITINIB",
    ENBREL: "ETANERCEPT", REMICADE: "INFLIXIMAB", STELARA: "USTEKINUMAB", COSENTYX: "SECUKINUMAB",
    TREMFYA: "GUSELKUMAB", XELJANZ: "TOFACITINIB", OLUMIANT: "BARICITINIB", ORENCIA: "ABATACEPT",
    CIMZIA: "CERTOLIZUMAB", BENLYSTA: "BELIMUMAB", SAPHNELO: "ANIFROLUMAB", ENTYVIO: "VEDOLIZUMAB",
    ACTEMRA: "TOCILIZUMAB", DUPIXENT: "DUPILUMAB", XOLAIR: "OMALIZUMAB", FASENRA: "BENRALIZUMAB",
    TYSABRI: "NATALIZUMAB", OCREVUS: "OCRELIZUMAB", KESIMPTA: "OFATUMUMAB", MAVENCLAD: "CLADRIBINE",
    GILENYA: "FINGOLIMOD", AUBAGIO: "TERIFLUNOMIDE", TECFIDERA: "DIMETHYL FUMARATE",
    PLAQUENIL: "HYDROXYCHLOROQUINE", ARAVA: "LEFLUNOMIDE", SALAZOPYRIN: "SULFASALAZINE", ZYLORIC: "ALLOPURINOL",
    PROGRAF: "TACROLIMUS", ADVAGRAF: "TACROLIMUS", CELLCEPT: "MYCOPHENOLATE", MYFORTIC: "MYCOPHENOLATE",
    NEORAL: ["CICLOSPORIN", "CYCLOSPORINE"], SANDIMMUN: ["CICLOSPORIN", "CYCLOSPORINE"],
    RAPAMUNE: "SIROLIMUS", CERTICAN: "EVEROLIMUS", IMURAN: "AZATHIOPRINE",
    SIMULECT: "BASILIXIMAB", THYMOGLOBULIN: "THYMOCYTE",
    IVIG: "NORMAL IMMUNOGLOBULIN", OCTAGAM: "NORMAL IMMUNOGLOBULIN", KIOVIG: "NORMAL IMMUNOGLOBULIN",
    // oncology
    KEYTRUDA: "PEMBROLIZUMAB", OPDIVO: "NIVOLUMAB", TECENTRIQ: "ATEZOLIZUMAB", IMFINZI: "DURVALUMAB", BAVENCIO: "AVELUMAB",
    HERCEPTIN: "TRASTUZUMAB", PERJETA: "PERTUZUMAB", KADCYLA: "TRASTUZUMAB EMTANSINE", ENHERTU: "TRASTUZUMAB DERUXTECAN",
    MABTHERA: "RITUXIMAB", RITUXAN: "RITUXIMAB", AVASTIN: "BEVACIZUMAB", ERBITUX: "CETUXIMAB",
    CYRAMZA: "RAMUCIRUMAB", VECTIBIX: "PANITUMUMAB",
    IBRANCE: "PALBOCICLIB", KISQALI: "RIBOCICLIB", VERZENIO: "ABEMACICLIB", LYNPARZA: "OLAPARIB",
    TAGRISSO: "OSIMERTINIB", TARCEVA: "ERLOTINIB", GLIVEC: "IMATINIB", GLEEVEC: "IMATINIB",
    TASIGNA: "NILOTINIB", SPRYCEL: "DASATINIB", ICLUSIG: "PONATINIB", JAKAVI: "RUXOLITINIB", CALQUENCE: "ACALABRUTINIB",
    REVLIMID: "LENALIDOMIDE", VIDAZA: "AZACITIDINE", VELCADE: "BORTEZOMIB", ADCETRIS: "BRENTUXIMAB", BLINCYTO: "BLINATUMOMAB",
    ZYTIGA: "ABIRATERONE", XTANDI: "ENZALUTAMIDE", ERLEADA: "APALUTAMIDE",
    NEXAVAR: "SORAFENIB", LENVIMA: "LENVATINIB", SUTENT: "SUNITINIB", STIVARGA: "REGORAFENIB", AFINITOR: "EVEROLIMUS",
    HALAVEN: "ERIBULIN", ALIMTA: "PEMETREXED", XELODA: "CAPECITABINE",
    ZOLADEX: "GOSERELIN", LUPRON: "LEUPROLIDE", FIRMAGON: "DEGARELIX", FASLODEX: "FULVESTRANT",
    FEMARA: "LETROZOLE", AROMASIN: "EXEMESTANE", NOLVADEX: "TAMOXIFEN", FASTURTEC: "RASBURICASE",
    NEUPOGEN: "FILGRASTIM", NEULASTA: "PEGFILGRASTIM", EPREX: "EPOETIN", ARANESP: "DARBEPOETIN",
    REVOLADE: "ELTROMBOPAG", PROMACTA: "ELTROMBOPAG",
    EXJADE: "DEFERASIROX", FERRIPROX: "DEFERIPRONE", DESFERAL: "DEFEROXAMINE", FERINJECT: "CARBOXYMALTOSE",
    NOVOSEVEN: "EPTACOG", HEMLIBRA: "EMICIZUMAB", ULTOMIRIS: "RAVULIZUMAB", CYKLOKAPRON: "TRANEXAMIC", KONAKION: "PHYTOMENADIONE",
    // antimicrobials
    AUGMENTIN: "AMOXICILLIN", MEGAMOX: "AMOXICILLIN", HIBIOTIC: "AMOXICILLIN", FLOXAPEN: "FLUCLOXACILLIN",
    ZINNAT: "CEFUROXIME", ROCEPHIN: "CEFTRIAXONE", FORTUM: "CEFTAZIDIME", MAXIPIME: "CEFEPIME",
    OMNICEF: "CEFDINIR", KEFLEX: "CEPHALEXINE", TAZOCIN: "PIPERACILLIN",
    MERONEM: "MEROPENEM", TIENAM: "IMIPENEM", INVANZ: "ERTAPENEM",
    ZYVOX: "LINEZOLID", TYGACIL: "TIGECYCLINE", CUBICIN: "DAPTOMYCIN", TARGOCID: "TEICOPLANIN",
    ZITHROMAX: "AZITHROMYCIN", KLACID: "CLARITHROMYCIN",
    CIPROBAY: "CIPROFLOXACIN", CIPRO: "CIPROFLOXACIN", TAVANIC: "LEVOFLOXACIN", AVELOX: "MOXIFLOXACIN",
    VIBRAMYCIN: "DOXYCYCLINE", FLAGYL: "METRONIDAZOLE", DALACIN: "CLINDAMYCIN",
    BACTRIM: "SULFAMETHOXAZOLE", SEPTRIN: "SULFAMETHOXAZOLE", MACROBID: "NITROFURANTOIN", MONUROL: "FOSFOMYCIN",
    DIFLUCAN: "FLUCONAZOLE", VFEND: "VORICONAZOLE", NOXAFIL: "POSACONAZOLE", SPORANOX: "ITRACONAZOLE",
    AMBISOME: "AMPHOTERICIN", LAMISIL: "TERBINAFINE", MYCAMINE: "MICAFUNGIN", ERAXIS: "ANIDULAFUNGIN",
    ZOVIRAX: "ACICLOVIR", VALTREX: "VALACICLOVIR", VALCYTE: "VALGANCICLOVIR", CYMEVENE: "GANCICLOVIR",
    TAMIFLU: "OSELTAMIVIR", BARACLUDE: "ENTECAVIR", BIKTARVY: "BICTEGRAVIR", TRUVADA: "EMTRICITABINE",
    SOVALDI: "SOFOSBUVIR", MAVYRET: "GLECAPREVIR", VEMLIDY: "TENOFOVIR", SYNAGIS: "PALIVIZUMAB",
    MALARONE: "ATOVAQUONE", LARIAM: "MEFLOQUINE", RIAMET: "ARTEMETHER", COARTEM: "ARTEMETHER",
    STROMECTOL: "IVERMECTIN", ZENTEL: "ALBENDAZOLE", VERMOX: "MEBENDAZOLE", BILTRICIDE: "PRAZIQUANTEL", FASIGYN: "TINIDAZOLE",
    KALETRA: "LOPINAVIR", NORVIR: "RITONAVIR", PREZISTA: "DARUNAVIR", TIVICAY: "DOLUTEGRAVIR",
    RETROVIR: "ZIDOVUDINE", EPIVIR: "LAMIVUDINE", ZEFFIX: "LAMIVUDINE",
    // respiratory / allergy
    VENTOLIN: "SALBUTAMOL", SERETIDE: "SALMETEROL", ADVAIR: "SALMETEROL", SYMBICORT: "FORMOTEROL",
    PULMICORT: "BUDESONIDE", FLIXOTIDE: "FLUTICASONE", AVAMYS: "FLUTICASONE", FLONASE: "FLUTICASONE",
    NASONEX: "MOMETASONE", SPIRIVA: "TIOTROPIUM", ATROVENT: "IPRATROPIUM",
    ANORO: "UMECLIDINIUM", TRELEGY: "VILANTEROL", SINGULAIR: "MONTELUKAST",
    AERIUS: "DESLORATADINE", PIRITON: "CHLORPHENIRAMINE", ATARAX: "HYDROXYZINE",
    OTRIVIN: "XYLOMETAZOLINE", PULMOZYME: "DORNASE", MUCOMYST: "ACETYLCYSTEINE",
    // neurology / psychiatry
    LYRICA: "PREGABALIN", NEURONTIN: "GABAPENTIN", TEGRETOL: "CARBAMAZEPINE", TRILEPTAL: "OXCARBAZEPINE",
    KEPPRA: "LEVETIRACETAM", LAMICTAL: "LAMOTRIGINE", DEPAKINE: "VALPROATE", DEPAKOTE: "VALPROATE",
    TOPAMAX: "TOPIRAMATE", VIMPAT: "LACOSAMIDE", FYCOMPA: "PERAMPANEL", SABRIL: "VIGABATRIN",
    RIVOTRIL: "CLONAZEPAM", XANAX: "ALPRAZOLAM", ATIVAN: "LORAZEPAM", VALIUM: "DIAZEPAM",
    DORMICUM: "MIDAZOLAM", STILNOX: "ZOLPIDEM", AMBIEN: "ZOLPIDEM",
    MADOPAR: "LEVODOPA", SINEMET: "CARBIDOPA", SIFROL: "PRAMIPEXOLE", MIRAPEX: "PRAMIPEXOLE",
    EXELON: "RIVASTIGMINE", REMINYL: "GALANTAMINE", EBIXA: "MEMANTINE", NAMENDA: "MEMANTINE",
    RILUTEK: "RILUZOLE", SPINRAZA: "NUSINERSEN", VYNDAQEL: "TAFAMIDIS",
    PROZAC: "FLUOXETINE", CIPRALEX: "ESCITALOPRAM", LEXAPRO: "ESCITALOPRAM", ZOLOFT: "SERTRALINE", LUSTRAL: "SERTRALINE",
    SEROXAT: "PAROXETINE", PAXIL: "PAROXETINE", FAVERIN: "FLUVOXAMINE", CYMBALTA: "DULOXETINE",
    EFFEXOR: "VENLAFAXINE", PRISTIQ: "DESVENLAFAXINE", REMERON: "MIRTAZAPINE",
    TRYPTIZOL: "AMITRIPTYLINE", ANAFRANIL: "CLOMIPRAMINE", TOFRANIL: "IMIPRAMINE", BRINTELLIX: "VORTIOXETINE", TRINTELLIX: "VORTIOXETINE",
    ABILIFY: "ARIPIPRAZOLE", RISPERDAL: "RISPERIDONE", INVEGA: "PALIPERIDONE", ZYPREXA: "OLANZAPINE",
    SEROQUEL: "QUETIAPINE", CLOZARIL: "CLOZAPINE", HALDOL: "HALOPERIDOL", LARGACTIL: "CHLORPROMAZINE", REAGILA: "CARIPRAZINE",
    RITALIN: "METHYLPHENIDATE", CONCERTA: "METHYLPHENIDATE", STRATTERA: "ATOMOXETINE", PROVIGIL: "MODAFINIL",
    BOTOX: "BOTULINUM", LIORESAL: "BACLOFEN", SIRDALUD: "TIZANIDINE", ZANAFLEX: "TIZANIDINE",
    DANTRIUM: "DANTROLENE", MESTINON: "PYRIDOSTIGMINE", ROBINUL: "GLYCOPYRROLATE",
    // anesthesia / ICU / emergency
    DIPRIVAN: "PROPOFOL", ULTIVA: "REMIFENTANIL", PRECEDEX: "DEXMEDETOMIDINE",
    KETALAR: "KETAMINE", SPRAVATO: "ESKETAMINE", SEVORANE: "SEVOFLURANE",
    ESMERON: "ROCURONIUM", NIMBEX: "CISATRACURIUM", BRIDION: "SUGAMMADEX",
    MARCAINE: "BUPIVACAINE", XYLOCAINE: "LIDOCAINE",
    NARCAN: "NALOXONE", ANEXATE: "FLUMAZENIL",
    ADRENALINE: "EPINEPHRINE", EPIPEN: "EPINEPHRINE", NORADRENALINE: "NOREPINEPHRINE", LEVOPHED: "NOREPINEPHRINE",
    DOBUTREX: "DOBUTAMINE", PRIMACOR: "MILRINONE", PITRESSIN: "VASOPRESSIN", GLYPRESSIN: "TERLIPRESSIN",
    CARNITOR: "CARNITINE", NICORETTE: "NICOTINE", CHAMPIX: "VARENICLINE", CHANTIX: "VARENICLINE",
    // eye / skin
    EYLEA: "AFLIBERCEPT", LUCENTIS: "RANIBIZUMAB",
    XALATAN: "LATANOPROST", TRAVATAN: "TRAVOPROST", LUMIGAN: "BIMATOPROST",
    AZOPT: "BRINZOLAMIDE", TRUSOPT: "DORZOLAMIDE", ALPHAGAN: "BRIMONIDINE", TIMOPTIC: "TIMOLOL",
    DIAMOX: "ACETAZOLAMIDE", PATANOL: "OLOPATADINE", RESTASIS: "CYCLOSPORINE", ZADITEN: "KETOTIFEN",
    VIGAMOX: "MOXIFLOXACIN", TOBREX: "TOBRAMYCIN", ZYMAR: "GATIFLOXACIN", MAXIDEX: "DEXAMETHASONE",
    FUCIDIN: "FUSIDIC", BACTROBAN: "MUPIROCIN", DERMOVATE: "CLOBETASOL", ELOCON: "MOMETASONE",
    BETNOVATE: "BETAMETHASONE", DIPROSONE: "BETAMETHASONE", LOCOID: "HYDROCORTISONE",
    SOLUMEDROL: "METHYLPREDNISOLONE", DEPOMEDROL: "METHYLPREDNISOLONE", SOLUCORTEF: "HYDROCORTISONE",
    PROTOPIC: "TACROLIMUS", ELIDEL: "PIMECROLIMUS", DAIVONEX: "CALCIPOTRIOL",
    ROACCUTANE: "ISOTRETINOIN", ACCUTANE: "ISOTRETINOIN", DIFFERIN: "ADAPALENE", RETINA: "TRETINOIN", NEOTIGASON: "ACITRETIN",
    DAKTARIN: "MICONAZOLE", CANESTEN: "CLOTRIMAZOLE", NIZORAL: "KETOCONAZOLE", EURAX: "CROTAMITON",
    // urology
    OMNIC: "TAMSULOSIN", FLOMAX: "TAMSULOSIN", XATRAL: "ALFUZOSIN", VESICARE: "SOLIFENACIN",
    BETMIGA: "MIRABEGRON", MYRBETRIQ: "MIRABEGRON", DITROPAN: "OXYBUTYNIN",
    PROSCAR: "FINASTERIDE", PROPECIA: "FINASTERIDE", AVODART: "DUTASTERIDE",
    // supplements / misc
    NEUROBION: "VITAMIN B", VENOFER: "IRON",
    // common Arabic spellings (alef variants are normalized by synKey)
    "بنادول": "PARACETAMOL", "ادول": "PARACETAMOL", "فيفادول": "PARACETAMOL",
    "بروفين": "IBUPROFEN", "فولتارين": "DICLOFENAC", "اوجمنتين": "AMOXICILLIN",
    "فنتولين": "SALBUTAMOL", "نكسيوم": "ESOMEPRAZOLE", "كونكور": "BISOPROLOL",
    "لازكس": "FUROSEMIDE", "لازيكس": "FUROSEMIDE", "كلكسان": "ENOXAPARIN",
    "زاريلتو": "RIVAROXABAN", "اوزمبك": "SEMAGLUTIDE", "اوزيمبك": "SEMAGLUTIDE",
    "سكايريزي": "RISANKIZUMAB", "رينفوك": "UPADACITINIB", "هيوميرا": "ADALIMUMAB",
    "بلافكس": "CLOPIDOGREL", "ليريكا": "PREGABALIN", "تجريتول": "CARBAMAZEPINE"
  };
  /* Brand keys are looked up on a normalized form: lowercase, alef variants
     unified, separators stripped — so "solu medrol", "Solu-Medrol" and
     "سولوميدرول"-style inputs land on the same key. */
  function synKey(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[أإآ]/g, "ا").replace(/[^a-z0-9؀-ۿ]+/g, "");
  }
  var SYN_INDEX = (function () {
    var idx = {};
    Object.keys(TRADE_SYNONYMS).forEach(function (k) {
      var v = TRADE_SYNONYMS[k];
      idx[synKey(k)] = { brand: k, stems: Array.isArray(v) ? v : [v] };
    });
    return idx;
  })();
  /* Expansions for the typed search terms: an exact brand key wins; a typed
     prefix of at least 4 characters also matches (so "rinv" finds RINVOQ),
     capped to avoid flooding the table from a too-short prefix. */
  function synExpansions(terms) {
    var out = [], seen = {};
    terms.forEach(function (q) {
      var k = synKey(q);
      if (k.length < 3) return;
      var hits = [];
      if (SYN_INDEX[k]) hits.push(k);
      else if (k.length >= 4) {
        for (var key in SYN_INDEX) { if (key.indexOf(k) === 0) { hits.push(key); if (hits.length >= 3) break; } }
      }
      hits.forEach(function (h) { if (!seen[h]) { seen[h] = 1; out.push(SYN_INDEX[h]); } });
    });
    return out;
  }
  function synStems(terms) {
    var stems = [];
    synExpansions(terms).forEach(function (s) { s.stems.forEach(function (g) { stems.push(g.toLowerCase()); }); });
    return stems;
  }
  /* One shared matcher for the loaded-rows search and the catalog fallback:
     a row matches when any typed term OR any expanded generic stem hits the
     code + description + identifiers haystack. */
  function matchesSearch(hay, terms, stems) {
    return terms.some(function (q) { return hay.indexOf(q) !== -1; })
      || stems.some(function (q) { return hay.indexOf(q) !== -1; });
  }

  /* ---------- catalog-wide search ----------
     A name the planner searches for may exist in the saved identifiers MAP yet
     have no movement and no stock in the uploaded files (the "Skyrizi returned
     0 of 1,077" complaint). When a search misses every loaded row, the saved
     catalog is scanned and matches surface as lightweight catalog-only rows. */
  function searchTerms() {
    return STATE.search.toLowerCase().split(/[,،;؛+\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function catalogMatches(terms) {
    if (!MAP || !MAP.byCode || !terms.length) return [];
    var stems = synStems(terms);
    var loaded = {};
    STATE.rows.forEach(function (r) { loaded[r.code] = 1; });
    var out = [];
    Object.keys(MAP.byCode).forEach(function (code) {
      if (loaded[code]) return;
      var m = MAP.byCode[code];
      var hay = (code + " " + [m.trade, m.sci, m.hosp, m.msd, m.cls].filter(Boolean).join(" ")).toLowerCase();
      if (matchesSearch(hay, terms, stems)) out.push(code);
    });
    return out.slice(0, 50);
  }
  /* Synthesize a zero-quantity row for a catalog-only code so the drill-down
     (names, classification, drug info, SFDA links) works for it too. */
  function catalogRow(code) {
    var m = MAP && MAP.byCode[code];
    if (!m) return null;
    return { code: code, desc: m.sci || m.trade || code, alt: "", uom: "", total: 0, avg: 0, stock: 0, cov: null, qty9: 0, sug: 0, status: "no_movement", inStock: false, moved: false, trend: null, trendPct: null, trade: m.trade || null, sci: m.sci || null, hosp: m.hosp || null, msd: m.msd || null, cls: m.cls || null, prio: m.prio || null, packPrice: m.packPrice || null, catalogOnly: true };
  }

  /* ---------- budget runway / PO ledger / on-order flags / thresholds ---------- */
  var BUDGET = null, PO = null, ORDERS = null, THRESH = null, LEDGER = null, SHAREK = null;
  function loadJson(key, check) { try { var v = JSON.parse(localStorage.getItem(key)); return v && check(v) ? v : null; } catch (e) { return null; } }
  /* ---------- watchlist (ROADMAP step 3) ----------
     The planner stars critical items; pins persist on this device like the
     rest of the saved state, sort first in the planning table, and back the
     "My watchlist" filter chip — the morning review is one tap, not a
     repeated search. */
  var WATCH = null;
  function loadWatch() { return loadJson(WATCH_KEY, function (v) { return v.byCode; }); }
  /* ---------- planner-mapping join slot (FEATURE 1/6 infrastructure) ----------
     Built now even though the real planner file is not yet provided: maps each
     product to a responsible planner {name,email} by `Generic Item Number`,
     with `Item Family Group` as a fallback. Until a file is uploaded every
     product reads "Unassigned"; when the owner drops the file into this slot it
     populates with no re-architecting. Persisted on-device like the rest. */
  var PLANNERS = null;
  function loadPlanners() { return loadJson(PLANNER_KEY, function (v) { return v.byCode || v.byFamily; }); }
  function parsePlannerMap(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "NUPCO Code", "NUPCO", "Nupco", "Generic Item Number", "Material", "كود نبكو", "رقم نبكو", "نبكو"]),
      ni = findCol(H, ["Planner Name", "Planner", "Responsible Planner", "Buyer", "Owner", "اسم المخطط", "المخطط", "المسؤول"]),
      ei = findCol(H, ["Planner Email", "Planner E-mail", "Email", "E-mail", "البريد الإلكتروني", "الإيميل", "البريد"]),
      ui = findCol(H, ["UOM", "Unit", "الوحدة"]),
      hi = findCol(H, ["Product Code", "Hospital Code", "Hospital Item Number", "كود المستشفى"]),
      mi = findCol(H, ["MSD Code", "MSD", "الكود الموحد"]),
      fi = findCol(H, ["Item Family Group", "Item Family Short Key", "Family", "المجموعة", "مجموعة الصنف"]);
    if ((ci < 0 && fi < 0) || ni < 0) throw new Error("cols:NUPCO Code/Planner Name");
    var byCode = {}, byFamily = {}, n = 0;
    function txtAt(row, idx) { if (idx < 0 || row[idx] == null || row[idx] === "") return null; var v = typeof row[idx] === "number" ? normCode(row[idx]) : String(row[idx]).trim(); return v || null; }
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      var name = ni >= 0 && row[ni] != null ? String(row[ni]).trim() : ""; if (!name) continue;
      var email = ei >= 0 && row[ei] != null && String(row[ei]).trim() !== "" ? String(row[ei]).trim() : null;
      // UOM rides along: the planner sheet is the owner's authoritative
      // dosage-form source (drives the 3-month hand-dispense grace). The
      // hospital + MSD codes ride along too so the table/card can show them.
      var rec = { name: name, email: email, uom: txtAt(row, ui), hosp: txtAt(row, hi), msd: txtAt(row, mi) };
      var code = ci >= 0 ? normCode(row[ci]) : null;
      if (code && isDrug(code)) { byCode[code] = rec; n++; }
      else if (fi >= 0 && row[fi] != null && String(row[fi]).trim() !== "") { byFamily[String(row[fi]).trim().toUpperCase()] = rec; n++; }
    }
    if (!n) throw new Error("empty-planner");
    return { byCode: byCode, byFamily: byFamily, count: n };
  }
  function plannerFor(r) {
    if (!PLANNERS) return null;
    var p = PLANNERS.byCode && PLANNERS.byCode[r.code];
    if (!p && PLANNERS.byFamily && r.family) p = PLANNERS.byFamily[String(r.family).toUpperCase()];
    return p || null;
  }
  function plannerName(r) { var p = plannerFor(r); return p ? p.name : null; }
  /* The planner sheet also carries each item's hospital + MSD codes; they
     fill any gaps the identifiers/stock files left so the table and card can
     always show the full, copyable code set. */
  function applyPlannerCodes(rows) {
    if (!PLANNERS) return;
    rows.forEach(function (r) {
      var p = plannerFor(r);
      if (!p) return;
      if (!r.hosp && p.hosp) r.hosp = p.hosp;
      if (!r.msd && p.msd) r.msd = p.msd;
      // Searchable, idempotently (re-runs must not duplicate the haystack).
      var extra = [r.hosp, r.msd].filter(function (v) { return v && (r.alt || "").indexOf(v) < 0; });
      if (extra.length) r.alt = [r.alt].concat(extra).filter(Boolean).join(" ");
    });
  }
  /* ORDER NOW (FEATURE 2): the reorder-by date is today or already past. */
  function orderNowFlag(r) { return !!(r.reorderIso && r.reorderIso <= isoDate(new Date())); }
  function isPinned(code) { return !!(WATCH && WATCH.byCode[code]); }
  function togglePin(code) {
    WATCH = WATCH || { byCode: {} };
    if (WATCH.byCode[code]) delete WATCH.byCode[code];
    else WATCH.byCode[code] = 1;
    persist(WATCH_KEY, WATCH);
  }
  function loadBudget() { return loadJson(BUDGET_KEY, function (v) { return typeof v.amount === "number"; }); }
  function loadPO() { return loadJson(PO_KEY, function (v) { return v.byCode; }); }
  function loadOrders() { return loadJson(ORD_KEY, function (v) { return v.byCode; }); }
  function loadThresh() { return loadJson(TH_KEY, function (v) { return v.byCode; }); }
  function thresholdFor(code) { var v = THRESH && THRESH.byCode[code]; return typeof v === "number" && v > 0 ? v : null; }
  function onOrderInfo(code) { return (ORDERS && ORDERS.byCode[code]) || null; }
  function markOrdered(code, qty) {
    ORDERS = ORDERS || { byCode: {} };
    ORDERS.byCode[code] = { d: isoDate(new Date()), q: qty };
    persist(ORD_KEY, ORDERS);
  }
  function clearOrdered(code) {
    if (!ORDERS || !ORDERS.byCode[code]) return;
    delete ORDERS.byCode[code];
    persist(ORD_KEY, ORDERS);
  }
  /* An on-order flag has served its purpose once a LATER stock picture covers
     the item: the order arrived, so it must rejoin normal re-suggestion. */
  function clearCoveredOrders(rows) {
    if (!ORDERS) return;
    var cleared = 0;
    rows.forEach(function (r) {
      var o = ORDERS.byCode[r.code];
      if (!o) return;
      var covered = r.inStock && (r.status === "ok" || r.status === "warning" || r.status === "excess");
      var later = !STATE.meta.stock_as_of || !o.d || STATE.meta.stock_as_of >= o.d;
      if (covered && later) { delete ORDERS.byCode[r.code]; cleared++; }
    });
    if (cleared) {
      persist(ORD_KEY, ORDERS);
      // tryCompute toasts its own summary right after; let that one breathe
      // first, then surface the cleared flags.
      setTimeout(function () { toast(tFmt("oo_cleared", { n: fmtInt(cleared) })); }, 3000);
    }
  }
  /* Order-date parser for the procurement exports: the framework file dates
     read "Wed Dec 31 13:25:14 AST 2025" — V8's Date rejects the AST zone, so
     pull month/day/year out directly (timezone-independent), then fall back
     to the general parseDate for ISO / D-M-Y shapes. */
  function parseOrderDate(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    var s = String(v == null ? "" : v).trim();
    var m = s.match(/[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+[\d:]+\s+(?:[A-Z]{2,4}\s+)?(\d{4})/);
    if (m && MONTHS3[m[1].toLowerCase()] != null) return new Date(+m[3], MONTHS3[m[1].toLowerCase()], +m[2]);
    return parseDate(v);
  }
  /* ---------- procurement orders ledger (owner spec v3 wave 4) ----------
     A persistent, append-only ledger fed by the framework-agreement export
     (and later the tender / direct-purchase exports — same shape, tagged by
     `source`). Identity is Child order + drug code, so re-uploading a report
     adds only genuinely new orders. Rejected/cancelled rows never enter. The
     ledger survives an order completing, so the budget views keep the spend
     history. The NUPCO CODE column is composite (code_tradecode_supplier);
     the drug code is its first underscore-delimited part. */
  function isFrameworkOrders(H) {
    return findCol(H, ["Framework Agreement Number", "Child order", "Eitmad Reference Number"]) >= 0
      && findCol(H, ["NUPCO CODE", "NUPCO Code"]) >= 0;
  }
  function parseOrdersLedger(aoa, source) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var oi = findCol(H, ["Child order", "Store Order ID", "Order Number", "Order No", "رقم الطلب"]),
      ci = findCol(H, ["NUPCO CODE", "NUPCO Code", "NUPCO Material", "NUPCO", "نبكو"]),
      di = findCol(H, ["Order Date", "Ordered Date", "تاريخ الطلب", "التاريخ"]),
      si = findCol(H, ["Status", "الحالة"]),
      qi = findCol(H, ["Quantity", "Order Qty", "Qty", "الكمية"]),
      ai = findCol(H, ["Framework Agreement Number", "Agreement Number", "رقم الاتفاقية"]),
      pi = findCol(H, ["PO Number", "Purchase Order", "رقم أمر الشراء"]),
      vi = findCol(H, ["Supplier name + code", "Supplier name", "Supplier", "Vendor", "المورد"]),
      ipi = findCol(H, ["Item Price", "سعر البند"]),
      tvi = findCol(H, ["Item Total Value", "Total Order Value", "القيمة الإجمالية"]);
    if (oi < 0 || ci < 0) throw new Error("cols:Child order/NUPCO CODE");
    var entries = {}, n = 0, qTotal = 0, qNonDrug = 0, qRejected = 0;
    function txt(idx, row) { return idx >= 0 && row[idx] != null ? String(row[idx]).trim() : ""; }
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      qTotal++;
      var code = normCode(String(row[ci] == null ? "" : row[ci]).split("_")[0]);
      if (!isDrug(code)) { qNonDrug++; continue; }
      var status = txt(si, row);
      if (isOrderRejected(status)) { qRejected++; continue; }
      var orderNo = txt(oi, row) || ("row" + r);
      var d = parseOrderDate(row[di]);
      entries[orderNo + "·" + code] = {
        orderNo: orderNo, code: code, codeRaw: txt(ci, row), date: d ? isoDate(d) : null,
        qty: num(row[qi]), status: status, agreementNo: txt(ai, row), poNumber: txt(pi, row),
        supplier: txt(vi, row), itemPrice: ipi >= 0 ? num(row[ipi]) : null,
        totalValue: tvi >= 0 ? num(row[tvi]) : null, source: source || "framework"
      };
      n++;
    }
    if (!n) throw new Error("empty-orders");
    var quality = {
      total: qTotal, accepted: n,
      rejects: qreasons({ qr_nondrug: qNonDrug, qr_rejected: qRejected }),
      warns: [],
      cols: qcols(H, [["bw_order_no", oi], ["c_code", ci], ["qs_date", di], ["c_status", si], ["qs_qty", qi], ["c_value", tvi]])
    };
    return { entries: entries, count: n, quality: quality };
  }
  /* Cache of ledger entries grouped by code (newest first), rebuilt whenever
     the ledger object identity changes — keeps lookups O(1) without
     persisting a redundant index. */
  var _ledgerIdx = null, _ledgerIdxFor = null;
  function ledgerByCode() {
    if (!LEDGER) return {};
    if (_ledgerIdxFor === LEDGER) return _ledgerIdx;
    var idx = {};
    Object.keys(LEDGER.entries || {}).forEach(function (k) {
      var e = LEDGER.entries[k];
      (idx[e.code] || (idx[e.code] = [])).push(e);
    });
    Object.keys(idx).forEach(function (c) { idx[c].sort(function (a, b) { return (a.date || "") < (b.date || "") ? 1 : (a.date || "") > (b.date || "") ? -1 : 0; }); });
    _ledgerIdx = idx; _ledgerIdxFor = LEDGER;
    return idx;
  }
  function ordersForCode(code) { return ledgerByCode()[code] || null; }
  /* Delivered tracking (wave 6 E2): an order counts as delivered when the file
     status says so OR the planner marked it by hand. Manual marks live in
     LEDGER.delivered keyed by orderNo·code and persist with the ledger. A
     delivered order is no longer "open", so it drops the "order placed" badge
     and the item becomes orderable again. */
  function deliveredKey(o) { return o.orderNo + "·" + o.code; }
  function orderManuallyDelivered(o) { return !!(LEDGER && LEDGER.delivered && LEDGER.delivered[deliveredKey(o)]); }
  function orderDelivered(o) { return isOrderDelivered(o.status) || orderManuallyDelivered(o); }
  function orderIsOpen(o) { return !isOrderRejected(o.status) && !orderDelivered(o); }
  function setOrderDelivered(orderNo, code, val) {
    if (!LEDGER) return;
    if (!LEDGER.delivered) LEDGER.delivered = {};
    var k = orderNo + "·" + code;
    if (val) LEDGER.delivered[k] = true; else delete LEDGER.delivered[k];
    persist(LEDGER_KEY, LEDGER);
  }
  /* The most recent OPEN order for a code (not rejected, not delivered) — the
     signal that an item under pressure is already being procured. */
  function openOrderFor(code) {
    var list = ordersForCode(code);
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (orderIsOpen(list[i])) return list[i];
    return null;
  }
  function loadLedger() { return loadJson(LEDGER_KEY, function (v) { return v.entries; }); }
  /* ---------- Sharek platform mapping (owner spec v3 wave 5) ----------
     The Sharek marketplace lists items other hospitals can supply. The owner
     uploads its export once (NUPCO-code join, persisted); the dashboard then
     marks which ZERO-stock items the hospital could source through Sharek
     when the supplier is slow or the budget is short. */
  function parseSharek(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Code", "NUPCO Material", "NUPCO", "Generic Mat Code", "Generic Item Number", "Material", "Code", "كود نبكو", "رقم نبكو", "نبكو", "الكود"]);
    if (ci < 0) throw new Error("cols:NUPCO Code");
    var byCode = {}, n = 0;
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      var code = normCode(row[ci]);
      if (!code || !isDrug(code) || byCode[code]) continue;
      byCode[code] = 1; n++;
    }
    if (!n) throw new Error("empty-sharek");
    return { byCode: byCode, count: n };
  }
  function loadSharek() { return loadJson(SHAREK_KEY, function (v) { return v.byCode; }); }
  function onSharek(code) { return !!(SHAREK && SHAREK.byCode[code]); }
  /* ---------- previous-orders (PO) file ----------
     Tolerant headers; per code we keep the most recent few orders only —
     enough for "last order" + the in-transit signal without growing storage. */
  function parsePO(aoa) {
    if (!aoa || !aoa.length) throw new Error("empty");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "NUPCO Code", "NUPCO", "Generic Item Number", "Material", "كود نبكو", "رقم نبكو", "نبكو"]),
      di = findCol(H, ["Order Date", "PO Date", "Ordered Date", "Order Creation Date", "Document Date", "Date", "تاريخ الطلب", "التاريخ"]),
      qi = findCol(H, ["Order Qty", "PO Qty", "Ordered Qty", "Quantity", "Qty", "الكمية"]),
      si = findCol(H, ["Status", "PO Status", "Order Status", "الحالة"]);
    if (ci < 0 || di < 0 || qi < 0) throw new Error("cols:NUPCO Material/Order Date/Order Qty");
    var byCode = {}, n = 0;
    var qTotal = 0, qCode = 0, qNonDrug = 0, qBadDate = 0, qDup = 0;
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      qTotal++;
      var code = normCode(row[ci]);
      if (code == null) { qCode++; continue; }
      if (!isDrug(code)) { qNonDrug++; continue; }
      var d = parseDate(row[di]); if (!d) { qBadDate++; continue; }
      var rec = { d: isoDate(d), q: num(row[qi]), s: si >= 0 && row[si] ? String(row[si]).trim().toUpperCase() : null };
      var list = byCode[code] || (byCode[code] = []);
      var dup = list.some(function (x) { return x.d === rec.d && x.q === rec.q; });
      if (!dup) { list.push(rec); n++; } else { qDup++; }
    }
    if (!n) throw new Error("empty-po");
    Object.keys(byCode).forEach(function (c) {
      byCode[c].sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
      byCode[c] = byCode[c].slice(0, 5);
    });
    var quality = {
      total: qTotal, accepted: n,
      rejects: qreasons({ qr_code: qCode, qr_nondrug: qNonDrug, qr_baddate: qBadDate, qr_dup: qDup }),
      warns: [],
      cols: qcols(H, [["c_code", ci], ["qs_date", di], ["qs_qty", qi], ["c_status", si]])
    };
    return { byCode: byCode, count: n, quality: quality };
  }
  var PO_DONE = { DELIVERED: 1, CLOSED: 1, COMPLETED: 1, CANCELLED: 1, CANCELED: 1, REJECTED: 1 };
  /* "In transit" = a recent order the current stock picture cannot reflect yet:
     not finished per its status, placed within the last 90 days, and dated on
     or after the stock-as-of date (or no stock date is known). */
  function poInTransit(o) {
    if (!o || !o.d) return false;
    if (o.s && PO_DONE[o.s]) return false;
    var od = parseIsoLocal(o.d);
    if (!od || (new Date() - od) / 86400000 > 90) return false;
    var asOf = STATE.meta.stock_as_of;
    return !asOf || o.d >= asOf;
  }
  /* ---------- seasonal order suggestion ----------
     With enough saved history, the 9-month order is forecast from the SAME
     upcoming calendar months of the prior year (seasonality) instead of the
     flat average; months without a prior-year value fall back to the average.
     Applied only when at least 3 of the 9 upcoming months have real
     prior-year data, so a thin history cannot masquerade as seasonality. */
  function applySeasonal(rows) {
    if (!HIST || histMonths() < 6 || !STATE.meta.period_end) return;
    var endYm = ymOf(STATE.meta.period_end);
    if (!endYm) return;
    var y = +endYm.slice(0, 4), m = +endYm.slice(5, 7);
    rows.forEach(function (r) {
      if (!r.moved) return;
      var it = HIST.items[r.code];
      if (!it) return;
      var sum = 0, matched = 0;
      for (var i = 1; i <= ORDER_COVER_MONTHS; i++) {
        var mm = m + i, yy = y;
        while (mm > 12) { mm -= 12; yy++; }
        var prior = (yy - 1) + "-" + ("0" + mm).slice(-2);
        if (it.ym[prior] != null) { sum += it.ym[prior]; matched++; }
        else sum += r.avg;
      }
      if (matched >= 3) {
        r.qty9 = sum;
        // The seasonal target replaces only the demand side; what we already
        // hold is still the DISPENSABLE stock (effective rule), not the raw
        // count that includes expiring/at-risk units.
        r.sug = Math.max(0, sum - (r.usable != null ? r.usable : r.stock));
        r.seasonal = matched;
      }
    });
  }

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
      mi = findCol(H, ["MSD Code", "MSD"]),
      xi = findCol(H, ["Expiry Date", "Expiry", "تاريخ الصلاحية"]),
      bi = findCol(H, ["Lot No/Batch", "Batch No", "Lot No", "Batch", "Lot"]),
      fmi = findCol(H, ["Item Family Group", "Item Family Short Key"]);
    if (ci < 0) throw new Error("cols:Generic Item Number");
    if (ai < 0) ai = findCol(H, ["Total Qty", "Quantity"]);
    // Total (physical) qty is a distinct column from available: expired stock
    // is moved to Hold so its Available is 0, but its Total Qty is the unit
    // count the Expired view must surface.
    var tqi = findCol(H, ["Total Qty", "Quantity"]);
    var byCode = {};
    function txt(row, idx) { if (idx < 0 || row[idx] == null || row[idx] === "") return null; var v = typeof row[idx] === "number" ? normCode(row[idx]) : String(row[idx]).trim(); return v || null; }
    var qTotal = 0, qCode = 0, qNonDrug = 0, qBadExp = 0;
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      qTotal++;
      var code = normCode(row[ci]);
      if (code == null) { qCode++; continue; }
      if (!isDrug(code)) { qNonDrug++; continue; }
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null, trade: null, agent: null, sci: null, msd: null, family: null });
      var q = num(row[ai]);
      rec.qty += q;
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
      if (!rec.family && fmi >= 0 && row[fmi]) rec.family = String(row[fmi]).trim();
      if (!rec.trade) rec.trade = txt(row, ti);
      if (!rec.agent) rec.agent = txt(row, vi);
      if (!rec.sci) rec.sci = txt(row, gi);
      if (!rec.msd) rec.msd = txt(row, mi);
      // Batch line: every row with a readable expiry feeds the expiry views,
      // tracking available (live FEFO) and total (expired) qty separately;
      // same-date batches merge per code so the walk stays small.
      if (xi >= 0) {
        var xd = parseDate(row[xi]);
        if (xd) {
          var key = isoDate(xd);
          var bm = rec.expByDate || (rec.expByDate = {});
          var slot = bm[key] || (bm[key] = { av: 0, tot: 0, b: null });
          slot.av += q;
          slot.tot += tqi >= 0 ? num(row[tqi]) : q;
          if (!slot.b && bi >= 0 && row[bi] != null && row[bi] !== "") slot.b = String(row[bi]).trim();
        } else if (q > 0 && row[xi] != null && String(row[xi]).trim() !== "") {
          qBadExp++;
        }
      }
    }
    var asOf = dateFromFilename(filename);
    if (!asOf && wb && wb.Props && wb.Props.ModifiedDate) asOf = new Date(wb.Props.ModifiedDate);
    var asOfIso = isoDate(asOf);
    // Split each code's date-merged batches into LIVE (expiry ≥ as-of, has
    // available units → FEFO/at-risk input) and EXPIRED (expiry < as-of →
    // counted by physical Total Qty). Without an as-of date, all available
    // batches are treated as live (the prior behavior).
    Object.keys(byCode).forEach(function (code) {
      var rec = byCode[code];
      if (!rec.expByDate) return;
      var live = [], expired = [];
      Object.keys(rec.expByDate).sort().forEach(function (e) {
        var s = rec.expByDate[e];
        if (asOfIso && e < asOfIso) { if (s.tot > 0) expired.push({ e: e, q: s.tot, b: s.b }); }
        else if (s.av > 0) live.push({ e: e, q: s.av, b: s.b });
      });
      rec.batches = live.length ? live : null;
      rec.expiredBatches = expired.length ? expired : null;
      delete rec.expByDate;
    });
    var quality = {
      total: qTotal, accepted: qTotal - qCode - qNonDrug,
      rejects: qreasons({ qr_code: qCode, qr_nondrug: qNonDrug }),
      warns: qreasons({ qr_badexp: qBadExp }),
      cols: qcols(H, [["c_code", ci], ["c_avail", ai], ["c_desc", de], ["c_trade", ti], ["dt_agent", vi], ["qs_sci", gi], ["c_msd", mi], ["c_expiry", xi], ["qs_batch", bi]])
    };
    return { byCode: byCode, stock_as_of: asOfIso, quality: quality };
  }

  // ---------- compute ----------
  /* ---------- expiry intelligence (ROADMAP step 1) ----------
     FEFO (first-expiry-first-out) walk over a code's stock batches: batches
     are consumed earliest-expiry-first at the item's monthly average from
     the stock-as-of date; whatever a batch cannot contribute before its own
     expiry is waste ("units at risk"). Effective coverage = usable ÷ avg —
     the "stock covers 10 months but expiry ends it after 4" number. */
  function expiryStats(batches, avg, stock, asOfIso, approx, graceMo) {
    if (!batches || !batches.length) return null;
    var asOf = parseIsoLocal(asOfIso) || new Date();
    var grace = graceMo || 0;
    var consumed = 0, waste = 0, atRisk = [];
    for (var i = 0; i < batches.length; i++) {
      var b = batches[i];
      var d = parseIsoLocal(b.e);
      // Hand-dispensed forms stop being dispensable `grace` months before
      // expiry, so a batch only contributes what fits before that cutoff.
      var tMo = d ? Math.max(0, (d - asOf) / 86400000 / DAYS_PER_MONTH - grace) : 0;
      if (avg > 0) {
        var can = Math.max(0, avg * tMo - consumed);
        var use = Math.min(b.q, can);
        var risk = b.q - use;
        waste += risk;
        consumed += use;
        // Per-batch at-risk remainder (≥ 1 unit) for the At-Risk view.
        if (risk >= 1) atRisk.push({ e: b.e, q: risk, b: b.b });
      }
    }
    var first = parseIsoLocal(batches[0].e);
    return {
      firstExp: batches[0].e,
      expMonths: first ? (first - asOf) / 86400000 / DAYS_PER_MONTH : null,
      expWaste: avg > 0 ? waste : 0,
      expCov: avg > 0 ? (stock - waste) / avg : null,
      expApprox: !!approx,
      grace: grace,
      batches: batches,
      atRiskBatches: atRisk.length ? atRisk : null
    };
  }
  /* The ROADMAP-1 alert predicate: at least one unit would expire unused AND
     that loss shortens the RAW coverage by a month or more (cov itself is
     already the effective figure, so the raw one anchors the comparison). */
  function expiryRisk(r) {
    return !!(r.moved && r.expWaste >= 1 && r.covRaw != null && r.expCov != null && r.covRaw - r.expCov >= 1);
  }
  /* UOM precedence for the dosage form: the planner file is the owner's
     authoritative sheet, then the identifiers/catalog upload, then the
     withdrawals file's own UOM column. */
  function uomFor(code, wdUom) {
    var p = PLANNERS && PLANNERS.byCode && PLANNERS.byCode[code];
    if (p && p.uom) return p.uom;
    var m = MAP && MAP.byCode && MAP.byCode[code];
    if (m && m.uom) return m.uom;
    return wdUom || null;
  }
  /* Effective-stock engine (owner spec v3): every order decision reads the
     stock that can actually be DISPENSED — expired and FEFO-unreachable
     units (incl. the 3-month hand-dispense grace) are excluded from
     coverage, the stockout/reorder projection, the suggested quantity and
     the status. Raw figures stay on the row for display transparency.
     Items without batch data keep raw behavior (degrade gracefully). */
  function applyEffective(r, asOfIso) {
    var grace = handDispensed(uomFor(r.code, r.uom)) ? GRACE_MONTHS : 0;
    var es = null;
    if (r.liveBatches) es = expiryStats(r.liveBatches, r.avg, r.stock, asOfIso, false, grace);
    else if (r.inStock && r.stock > 0 && r.approxExp) es = expiryStats([{ e: r.approxExp, q: r.stock, b: r.approxBatch || null }], r.avg, r.stock, asOfIso, true, grace);
    r.covRaw = r.avg > 0 ? r.stock / r.avg : null;
    r.expFirst = es ? es.firstExp : null;
    r.expMonths = es ? es.expMonths : null;
    r.expWaste = es ? es.expWaste : 0;
    r.expCov = es ? es.expCov : null;
    r.expApprox = es ? es.expApprox : false;
    r.grace = grace;
    r.batches = es ? es.batches : null;
    r.atRiskBatches = es ? es.atRiskBatches : null;
    r.usable = Math.max(0, r.stock - (es ? es.expWaste : 0));
    r.cov = es && r.avg > 0 ? es.expCov : r.covRaw;
    r.qty9 = r.avg * ORDER_COVER_MONTHS;
    r.sug = Math.max(0, r.qty9 - r.usable);
    r.status = statusOf(r.cov == null ? 0 : r.cov, r.avg, r.inStock, r.code);
    r.stockoutIso = (r.avg > 0 && r.usable > 0) ? addDaysIso(asOfIso, r.cov * DAYS_PER_MONTH) : (r.avg > 0 ? asOfIso : null);
    r.reorderIso = r.avg > 0 ? addDaysIso(asOfIso, ((r.cov == null ? 0 : r.cov) - REORDER_MONTHS) * DAYS_PER_MONTH) : null;
  }
  /* Re-grade every row after a dosage-form source changes (planner upload,
     identifiers upload): grace may flip, which moves usable stock, dates,
     suggestions, and statuses. */
  function recomputeEffective() {
    if (!STATE.rows.length || STATE.meta.source !== "upload") return;
    var asOfIso = STATE.meta.stock_as_of;
    STATE.rows.forEach(function (r) {
      if (r.liveBatches || r.approxExp) applyEffective(r, asOfIso);
    });
    // applyEffective resets qty9/sug to the flat rule; seasonal items get
    // their prior-year-weighted suggestion re-applied on top, as in compute.
    applySeasonal(STATE.rows);
  }
  /* Status thresholds: the 6-month rule, unless the planner set a per-item
     override (e.g. alert a critical drug already at 8 months). Watch is always
     one month above the alert line. */
  function statusOf(cov, avg, inStock, code) {
    if (!inStock) return "not_in_stock";
    if (avg === 0) return "no_movement";
    var re = (code && thresholdFor(code)) || REORDER_MONTHS;
    if (cov <= re) return "order_now";
    if (cov <= re + 1) return "warning";
    if (cov > EXCESS_MONTHS) return "excess";
    return "ok";
  }
  function refreshStatuses() {
    STATE.rows.forEach(function (r) { r.status = statusOf(r.cov == null ? 0 : r.cov, r.avg, r.inStock, r.code); });
  }
  function buildRows(wd, st) {
    var months = wd.actual_months || 1, codes = {}, k;
    for (k in wd.byCode) codes[k] = 1; for (k in st.byCode) codes[k] = 1;
    var rows = [];
    Object.keys(codes).forEach(function (code) {
      var w = wd.byCode[code], s = st.byCode[code];
      var total = w ? w.qty : 0, avg = w ? total / months : 0;
      var inStock = !!s, stock = inStock ? s.qty : 0;
      var expiredBatches = (s && s.expiredBatches) || null;
      var expiredQty = 0; if (expiredBatches) expiredBatches.forEach(function (b) { expiredQty += b.q; });
      var r = { code: code, desc: (w && w.desc) || (s && s.desc) || "", alt: "", uom: (w && w.uom) || "", total: total, avg: avg, stock: stock, inStock: inStock, moved: avg > 0, trend: null, trendPct: null, trade: (s && s.trade) || null, agent: (s && s.agent) || null, sci: (s && s.sci) || null, msd: (s && s.msd) || null, family: (s && s.family) || null, expiredBatches: expiredBatches, expiredQty: expiredQty };
      // Expiry inputs: real batches from the stock file win; otherwise the
      // latest dispatch batch from the withdrawals file approximates the
      // queue front (FEFO picking). applyEffective derives every decision
      // figure (coverage, status, projection, suggestion) from USABLE stock.
      r.liveBatches = (s && s.batches) || null;
      r.approxExp = (!r.liveBatches && w && w.lastExp) ? w.lastExp : null;
      r.approxBatch = (w && w.lastBatch) || null;
      applyEffective(r, st.stock_as_of);
      rows.push(r);
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
  function saveSnaps(s) { persist(SNAP_KEY, s.slice(-12)); }
  function applyTrend(rows, meta) {
    if (meta.source === "sample") return;
    var snaps = loadSnaps(), prev = null;
    for (var i = snaps.length - 1; i >= 0; i--) if (snaps[i].period_end !== meta.period_end) { prev = snaps[i]; break; }
    if (prev) rows.forEach(function (r) { var pa = prev.avgByCode[r.code]; if (pa === undefined) r.trend = { type: "new" }; else if (pa === 0) r.trend = r.avg > 0 ? { type: "new" } : null; else { r.trend = { type: "delta", pct: (r.avg - pa) / pa, prev: pa }; r.trendPct = r.trend.pct; } });
    buildDigest(rows, prev);
    var avgByCode = {}, statusByCode = {};
    rows.forEach(function (r) { avgByCode[r.code] = r.avg; statusByCode[r.code] = r.status; });
    snaps = snaps.filter(function (x) { return x.period_end !== meta.period_end; });
    snaps.push({ period_start: meta.period_start, period_end: meta.period_end, savedAt: new Date().toISOString(), avgByCode: avgByCode, statusByCode: statusByCode });
    saveSnaps(snaps);
  }
  /* ---------- "what changed" digest ----------
     Compared against the previous upload's snapshot, surfaced once per upload
     as a dismissible card at the top of the Planning tab. */
  function buildDigest(rows, prev) {
    // Status/trend deltas need a previous snapshot, but the expiry callout is
    // a property of THIS upload alone — it must fire on the very first one.
    var prevStatus = prev ? (prev.statusByCode || null) : null;
    var d = { danger: [], spikes: [], fresh: [], recovered: [], expiry: [] };
    rows.forEach(function (r) {
      var bad = r.status === "order_now" || (r.status === "not_in_stock" && r.moved);
      if (prevStatus && prevStatus[r.code]) {
        var ps = prevStatus[r.code];
        var wasBad = ps === "order_now" || ps === "not_in_stock";
        if (bad && !wasBad) d.danger.push(r);
        if (!bad && wasBad && r.moved) d.recovered.push(r);
      }
      if (r.trend && r.trend.type === "delta" && r.trend.pct > 0.30) d.spikes.push(r);
      if (r.trend && r.trend.type === "new" && r.moved) d.fresh.push(r);
      if (expiryRisk(r)) d.expiry.push(r);
    });
    d.expiry.sort(function (a, b) { return b.expWaste - a.expWaste; });
    STATE.digest = (d.danger.length || d.spikes.length || d.fresh.length || d.recovered.length || d.expiry.length) ? d : null;
  }

  // ---------- ingest ----------
  function tryCompute() {
    if (!STATE.raw.withdrawals || !STATE.raw.stock) return;
    var wd = STATE.raw.withdrawals, st = STATE.raw.stock;
    var rows = buildRows(wd, st);
    applyMap(rows);
    var meta = { period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months, months_source: wd.months_source || "detected", stock_as_of: st.stock_as_of, source: "upload", baseline: wd.source === "baseline" };
    STATE.meta = meta;
    applySeasonal(rows);
    clearCoveredOrders(rows);
    applyTrend(rows, meta);
    STATE.rows = rows; STATE.meta = meta; STATE.monthly = buildMonthly(wd, rows);
    afterData();
    var msg = LANG === "ar" ? ("تم تحليل " + fmtInt(rows.length) + " دواء · الفترة " + fmt1(meta.actual_months) + " شهر") : (fmtInt(rows.length) + " medicines analysed · period " + fmt1(meta.actual_months) + " months");
    if (wd.source === "baseline") msg += " · " + t("baseline_meta");
    toast(msg);
  }
  /* Boundary sanitizers for price-ish fields: uploads already enforce these in
     parseMapping, and the embedded sample must obey the same invariant — a bad
     sample regeneration must never surface negative riyals on the demo. */
  function posOrNull(v) { var n = typeof v === "number" ? v : parseFloat(v); return isFinite(n) && n > 0 ? n : null; }
  function nonNegOrNull(v) { var n = typeof v === "number" ? v : parseFloat(v); return isFinite(n) && n >= 0 ? n : null; }
  function loadSample() {
    var s = window.PSMMC_SAMPLE; if (!s) { toast(t("no_sample")); return; }
    // Sample rows carry raw facts only (total/stock/inStock + identity);
    // every derived figure goes through the SAME formulas as a real upload,
    // so the demo can never drift from production math.
    var sAsOf = "2026-06-02";
    STATE.rows = s.rows.map(function (r) {
      var avg = s.actual_months > 0 ? r.total / s.actual_months : 0;
      var cov = avg > 0 ? r.stock / avg : null;
      var qty9 = avg * ORDER_COVER_MONTHS;
      var stockoutIso = (avg > 0 && r.stock > 0) ? addDaysIso(sAsOf, cov * DAYS_PER_MONTH) : (avg > 0 ? sAsOf : null);
      var reorderIso = avg > 0 ? addDaysIso(sAsOf, ((cov == null ? 0 : cov) - REORDER_MONTHS) * DAYS_PER_MONTH) : null;
      return { code: r.code, desc: r.desc, alt: "", uom: r.uom, total: r.total, avg: avg, stock: r.stock, cov: cov, qty9: qty9, sug: Math.max(0, qty9 - r.stock), status: statusOf(cov == null ? 0 : cov, avg, r.inStock, r.code), inStock: r.inStock, moved: avg > 0, trend: null, trendPct: null, stockoutIso: stockoutIso, reorderIso: reorderIso, trade: r.trade || null, hosp: r.hosp || null, msd: r.msd || null, agent: r.agent || null, cls: r.cls || null, prio: r.prio || null, packPrice: posOrNull(r.packPrice), unitsPerPack: posOrNull(r.unitsPerPack), awardQty: posOrNull(r.awardQty), freeQty: nonNegOrNull(r.freeQty) };
    });
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
  function filterCounts(base) { var c = { all: base.length, order_now: 0, no_movement: 0, not_in_stock: 0, warning: 0, ok: 0, excess: 0, instock: 0, outstock: 0, newitem: 0, watchlist: 0, covered_order: 0, sharek_zero: 0 }; base.forEach(function (r) { if (r.status === "order_now") { c.order_now++; if (openOrderFor(r.code)) c.covered_order++; } else if (r.status === "no_movement") c.no_movement++; else if (r.status === "not_in_stock") c.not_in_stock++; else if (r.status === "warning") c.warning++; else if (r.status === "ok") c.ok++; else if (r.status === "excess") c.excess++; if (r.stock > 0) c.instock++; else { c.outstock++; if (onSharek(r.code)) c.sharek_zero++; } if (r.trend && r.trend.type === "new") c.newitem++; if (isPinned(r.code)) c.watchlist++; }); return c; }
  function applyFilter(base) {
    var f = STATE.filter;
    var rows = base.filter(function (r) {
      if (STATE.view === "planning") {
        if (f === "all") return true;
        if (f === "watchlist") return isPinned(r.code);
        // "Tight but covered": would-be order_now items with a live order.
        if (f === "covered_order") return r.status === "order_now" && !!openOrderFor(r.code);
        // Zero balance here, but listed on the Sharek marketplace.
        if (f === "sharek_zero") return r.stock <= 0 && onSharek(r.code);
        return r.status === f;
      }
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
      // its code, generic description, or alternate identifiers/trade name — or any generic
      // stem the trade-name synonyms layer expanded from a typed brand (Xarelto → rivaroxaban).
      var terms = searchTerms();
      if (terms.length) {
        var stems = synStems(terms);
        rows = rows.filter(function (r) {
          return matchesSearch((r.code + " " + r.desc + " " + (r.alt || "")).toLowerCase(), terms, stems);
        });
      }
    }
    var k = STATE.sort.key, dir = STATE.sort.dir === "asc" ? 1 : -1;
    // Pinned items lead the planning table inside whatever sort is active —
    // the morning review reads top-down.
    var pinnedFirst = STATE.view === "planning";
    rows.sort(function (a, b) { if (pinnedFirst) { var pa = isPinned(a.code) ? 0 : 1, pb = isPinned(b.code) ? 0 : 1; if (pa !== pb) return pa - pb; } var va = a[k], vb = b[k]; if (k === "cov" || k === "expMonths") { va = va == null ? Infinity : va; vb = vb == null ? Infinity : vb; } if (k === "trendPct" || k === "unitPrice" || k === "stockValue") { var nullDir = dir === 1 ? Infinity : -Infinity; va = va == null ? nullDir : va; vb = vb == null ? nullDir : vb; } if (k === "desc" || k === "code") { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0; } return (va - vb) * dir; });
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
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8-5.3-2.8-5.3 2.8 1.1-5.8-4.3-4.1 5.9-.8L12 3.5z"/></svg>'
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
  function cardStream(title, monthly, deltaHtml) {
    if (!monthly || monthly.length < 2) {
      return '<div class="kcard"><div class="ktitle">' + title + '</div>'
        + '<div class="kbody stream"><div class="kchart-empty">' + esc(t("chart_nodates")) + '</div></div></div>';
    }
    var maxT = 0, minT = Infinity;
    monthly.forEach(function (m) { if (m.total > maxT) maxT = m.total; if (m.total < minT) minT = m.total; });
    return '<div class="kcard"><div class="ktitle">' + title + (deltaHtml || "") + '</div>'
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
  function cardDecision(label, valueHtml, icon, tileCls, subHtml, bodyHtml, explainKey) {
    // explainKey makes the whole card a "how is this computed?" affordance
    // (owner spec v3: every figure explains its own formula on tap).
    var explain = explainKey ? ' data-explain="' + explainKey + '" role="button" tabindex="0" aria-label="' + esc(t("ex_open")) + '"' : "";
    return '<div class="kcard span3' + (explainKey ? " explainable" : "") + '"' + explain + '><div class="khead"><span class="tile ' + tileCls + '">' + icon + '</span>'
      + '<span class="ktxt"><span class="klabel">' + label + '</span><span class="kvalue num">' + valueHtml + '</span></span></div>'
      + (bodyHtml || (subHtml ? '<div class="ksub">' + subHtml + '</div>' : '')) + '</div>';
  }
  /* One small modal per metric: title + plain-language formula (en/ar). */
  function openExplainer(key) {
    openModal('<h3 class="modal-title">' + t(key + "_t") + '</h3><p class="modal-sub" style="margin:0;line-height:1.7">' + t(key + "_b") + '</p>', "modal-explain");
  }

  /* The four figures the planner reads before anything else, shared by the
     planning cards, the email/WhatsApp report, and the print sheet. */
  function decisionStats(base) {
    var s = { orderCount: 0, notStockCount: 0, orderUnits: 0, critical: 0, totalUnits: 0, sumAvg: 0, overallCov: null, momPct: null, momA: null, momB: null, itemsTotal: base.length, withStock: 0, zeroStock: 0, zeroSharek: 0 };
    base.forEach(function (r) {
      if (r.status === "order_now") { s.orderCount++; s.orderUnits += r.sug; }
      else if (r.status === "not_in_stock") { s.notStockCount++; s.orderUnits += r.sug; }
      if (r.moved && r.stock <= 0) s.critical++;
      // Item counts (owner spec v3 KPI cards): an item is "with stock" when
      // any available units exist; everything else is a zero-stock item.
      if (r.stock > 0) s.withStock++; else { s.zeroStock++; if (onSharek(r.code)) s.zeroSharek++; }
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
        var endD = parseIsoLocal(endIso);
        if (endD) {
          var lastDay = new Date(endD.getFullYear(), endD.getMonth() + 1, 0).getDate();
          if (ymOf(endIso) === last.ym && endD.getDate() < lastDay) full = mon.slice(0, -1);
        }
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
    // Items already on order — either manually marked or carrying an open
    // procurement order in the ledger — are excluded until that order lands.
    return base.filter(function (r) { return r.moved && r.sug > 0 && !onOrderInfo(r.code) && !openOrderFor(r.code); })
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
      var expTag = r.expMonths == null ? "" : '<i class="exp-tag' + (expiryRisk(r) ? " is-risk" : "") + '" title="' + esc(expiryRisk(r) ? tFmt("exp_risk_tip", { u: fmtM(r.expWaste), m: fmt1(r.expCov) }) : t("c_expiry")) + '">' + (expiryRisk(r) ? "⚠ " : "") + (r.expApprox ? "≈" : "") + fmt1(r.expMonths) + " " + t("mo") + "</i>";
      return '<div class="os-row" data-code="' + esc(r.code) + '"><span class="os-rank num">' + (i + 1) + '</span>'
        + '<span class="os-main"><b>' + esc(r.desc) + '</b>' + codeChip(r.code) + expTag + '</span>'
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
  var STATUS_COLOR = { order_now: "var(--coral)", warning: "var(--amber)", ok: "var(--blue)", excess: "var(--violet)", no_movement: "var(--muted-2)", not_in_stock: "var(--indigo)" };
  function covCell(r) { if (r.status === "no_movement") return '<span class="muted">' + t("s_no_movement") + "</span>"; var pct = r.cov == null ? 0 : Math.min(100, (r.cov / 12) * 100); return '<span class="num">' + (r.cov == null ? "∞" : fmt1(r.cov)) + '</span><span class="covbar"><i style="width:' + pct.toFixed(0) + "%;background:" + (STATUS_COLOR[r.status] || "var(--blue)") + '"></i></span>'; }
  /* Expiry column: earliest batch expiry in months from the stock date.
     Flagged red when coverage outlives expiry (units would expire unused);
     "≈" marks the withdrawals-file fallback estimate. */
  function expCell(r) {
    if (r.expMonths == null) return '<td class="expcell"><span class="muted">—</span></td>';
    var risk = expiryRisk(r);
    var label = (r.expApprox ? "≈" : "") + (r.expMonths < 0 ? t("exp_expired") : fmt1(r.expMonths));
    var tip = risk ? tFmt("exp_risk_tip", { u: fmtM(r.expWaste), m: fmt1(r.expCov) }) : (r.expApprox ? t("exp_approx_tip") : "");
    if (risk || r.expMonths < 0) return '<td class="expcell"><span class="exp-risk num" title="' + esc(tip) + '">⚠ ' + label + "</span></td>";
    return '<td class="expcell"><span class="num"' + (tip ? ' title="' + esc(tip) + '"' : "") + ">" + label + "</span></td>";
  }
  function trendCell(r) { if (!r.trend) return '<span class="trend flat">—</span>'; if (r.trend.type === "new") return '<span class="trend new">' + t("trend_new") + "</span>"; var p = r.trend.pct, cls = p > 0.001 ? "up" : p < -0.001 ? "down" : "flat", arr = p > 0.001 ? "▲" : p < -0.001 ? "▼" : "▬"; return '<span class="trend ' + cls + '" title="' + t("prev_avg") + " " + fmt1(r.trend.prev) + t("per_mo") + '">' + arr + " " + (p >= 0 ? "+" : "") + (p * 100).toFixed(0) + "%</span>"; }
  function pill(status) { return '<span class="pill ' + status + '">' + t("s_" + status) + "</span>"; }
  /* Status pill plus planner marks: custom alert threshold flag + on-order badge. */
  function statusCell(r) {
    var extra = "";
    var th = thresholdFor(r.code);
    if (th) extra += ' <span class="th-flag num" title="' + esc(tFmt("th_mark", { m: fmt1(th) })) + '">⚑' + fmt1(th) + '</span>';
    if (onOrderInfo(r.code)) extra += ' <span class="pill onorder">' + t("oo_badge") + '</span>';
    // An open procurement order on a tight item (owner spec v3): it reads as
    // "under pressure but already being procured" — the planner should not
    // re-order it. The badge carries the order number for traceability.
    var oo = openOrderFor(r.code);
    if (oo) extra += ' <span class="pill onorder" title="' + esc(tFmt("po_open_tip", { no: oo.orderNo, d: prettyDate(oo.date) })) + '">' + t("po_open_badge") + "</span>";
    return pill(r.status) + extra;
  }
  /* Watchlist star: filled when pinned. Lives inside the copyable code cell,
     so its click handler must stop propagation (no copy, no drill-down). */
  function pinBtn(r) {
    var on = isPinned(r.code);
    return '<button type="button" class="pin-btn' + (on ? " is-on" : "") + '" data-pin="' + esc(r.code) + '" aria-pressed="' + (on ? "true" : "false") + '" title="' + esc(t(on ? "pin_remove" : "pin_add")) + '">' + (on ? "★" : "☆") + "</button>";
  }
  /* Hospital + MSD codes render in FULL, each LABELLED by type (owner wave 6
     C1) and copyable individually (owner spec v3); the NUPCO code is the
     headline and copies via the cell itself. Each identifier sits on its own
     line so the codes never overflow the narrow phone code column (wave 6 B1).
     The `.subcode` container + `.copy-sub`/`data-copy` contract is preserved. */
  function subCodeChip(labelKey, v) {
    return v ? '<span class="code-id"><b class="code-lbl">' + t(labelKey) + '</b><u class="copy-sub num" data-copy="' + esc(v) + '">' + esc(v) + "</u></span>" : "";
  }
  function codeCell(r) {
    var sub = [subCodeChip("lbl_hosp", r.hosp), subCodeChip("lbl_msd", r.msd)].filter(Boolean).join("");
    return '<td class="code copyable" data-copy="' + esc(r.code) + '" title="' + t("cp_copied") + '">' + pinBtn(r)
      + '<span class="code-stack">'
      + '<span class="code-id code-id-main"><b class="code-lbl">' + t("lbl_nupco") + '</b><span class="code-val num">' + esc(r.code) + '</span> <span class="copyic">' + ICON.copy + '</span></span>'
      + (sub ? '<span class="subcode">' + sub + "</span>" : "")
      + "</span></td>";
  }
  /* Planner column (FEATURE 1): responsible planner from the join slot, or
     "Unassigned" until a planner-mapping file is provided. */
  function plannerCell(r) {
    var name = plannerName(r);
    return '<td class="plancell">' + (name ? esc(name) : '<span class="muted">' + t("planner_unassigned") + "</span>") + "</td>";
  }
  /* Projection column (FEATURE 1/2): stockout date, reorder-by sub-line, and
     the ORDER NOW flag when the reorder date is today or past. */
  function projCell(r) {
    if (!r.stockoutIso && !r.reorderIso) return '<td class="projcell"><span class="muted">—</span></td>';
    var on = orderNowFlag(r);
    var html = '<span class="num proj-stockout' + (on ? " is-now" : "") + '">' + (r.stockoutIso ? prettyDate(r.stockoutIso) : "—") + "</span>";
    if (r.reorderIso) html += '<span class="subcode num">' + t("proj_reorder") + " " + prettyDate(r.reorderIso) + "</span>";
    if (on) html += ' <span class="ordernow-tag">' + t("order_now_flag") + "</span>";
    return '<td class="projcell">' + html + "</td>";
  }
  function descCell(r) {
    // Table rows stay lean: description + trade name only. The classification,
    // priority and agent live in the item card (openDetail) — and the search
    // haystack still matches them.
    var extra = r.trade || (r.sci && r.sci !== r.desc ? r.sci : null);
    return '<td class="desc">' + esc(r.desc) + (extra ? '<i class="tradename">' + esc(extra) + "</i>" : "") + "</td>";
  }
  /* Small ⓘ affordance inside a header: opens the metric's formula modal.
     Its click handler stops propagation so it never toggles the sort. */
  function thInfo(explainKey) {
    return explainKey ? ' <span class="thinfo" data-explain="' + explainKey + '" role="button" tabindex="0" aria-label="' + esc(t("ex_open")) + '">ⓘ</span>' : "";
  }
  function th(key, label, right, explainKey) { var s = STATE.sort, on = s.key === key, arrow = on ? (s.dir === "asc" ? "▲" : "▼") : "↕"; var ariaSort = on ? ' aria-sort="' + (s.dir === "asc" ? "ascending" : "descending") + '"' : ""; return '<th class="sortable' + (on ? " sorted" : "") + (right ? " right" : "") + '" data-sort="' + key + '"' + ariaSort + '>' + label + thInfo(explainKey) + ' <span class="arrow">' + arrow + "</span></th>"; }
  function thp(label, explainKey) { return "<th>" + label + thInfo(explainKey) + "</th>"; }
  function fchip(key, label, count, icon) { return '<button class="fchip' + (STATE.filter === key ? " is-active" : "") + '" data-filter="' + key + '">' + (icon ? '<span class="fic">' + icon + '</span>' : "") + label + ' <span class="badge num">' + fmtInt(count || 0) + "</span></button>"; }
  function toolbar(filters) { return '<div class="toolbar"><div class="search">' + ICON.search + '<input id="searchInput" type="search" placeholder="' + esc(t("search_ph")) + '" value="' + esc(STATE.search) + '"/></div>' + filters + "</div>"; }
  var SORT_LABEL = { code: "c_code", desc: "c_desc", total: "c_total", avg: "c_avg", stock: "c_stock", cov: "c_cov", expMonths: "c_expiry", qty9: "c_qty9", sug: "c_sug", trendPct: "c_delta", unitPrice: "pr_unit_price", stockValue: "c_value" };
  function defaultSort() {
    if (STATE.view === "planning") return { key: "cov", dir: "asc" };
    if (STATE.view === "averages") return { key: "avg", dir: "desc" };
    return { key: "stock", dir: "desc" };
  }
  function tableCard(head, body, shown, total, topHtml) {
    var sortKey = SORT_LABEL[STATE.sort.key] ? t(SORT_LABEL[STATE.sort.key]) : STATE.sort.key;
    return '<div class="tablecard">' + (topHtml || "") + '<div class="tablewrap"><table class="t-main">' + head + "<tbody>" + (body || '<tr><td colspan="12" class="muted" style="padding:34px;text-align:center">' + t("no_rows") + "</td></tr>") + "</tbody></table></div><div class=\"tfoot\"><span>" + t("showing") + ' <b class="num">' + fmtInt(shown) + "</b> " + t("of") + ' <b class="num">' + fmtInt(total) + "</b> " + t("items") + "</span><span>" + t("sorted_by") + " " + sortKey + " " + (STATE.sort.dir === "asc" ? "↑" : "↓") + "</span></div></div>";
  }
  /* The brand = generic mappings applied to the current search, shown above
     the results so a planner can verify what their typed trade name matched. */
  function synHintHtml() {
    if (!STATE.search) return "";
    var sx = synExpansions(searchTerms());
    if (!sx.length) return "";
    var parts = sx.map(function (s) { return "<b>" + esc(s.brand) + "</b> = " + esc(s.stems.join(" / ")); });
    return '<div class="syn-hint">' + ICON.search + "<span>" + t("syn_note") + " " + parts.join(" · ") + "</span></div>";
  }

  // ---------- views ----------
  /* The table head + body for a view, built from the CURRENT filter/search/sort
     state. Shared by the full view render and renderTableOnly(), so a keystroke
     in the search box can rebuild ONLY the table card with identical markup. */
  function buildTableHTML(view, base) {
    var rows = applyFilter(base), head, body;
    if (view === "management") {
      var priceTh = hasPrices() ? th("unitPrice", t("pr_unit_price"), true) : "";
      head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_uom") + "</th>" + th("stock", t("c_avail"), true, "ex_col_stock") + th("cov", t("c_cov"), false, "ex_col_cov") + thp(t("c_status"), "ex_col_status") + th("avg", t("c_use"), true, "ex_col_avg") + priceTh + th("stockValue", t("c_value"), true) + "</tr></thead>";
      body = rows.map(function (r) {
        var priceTd = hasPrices() ? '<td class="right num">' + (r.unitPrice == null ? "—" : fmt2(r.unitPrice)) + "</td>" : "";
        var valTd = '<td class="right ' + (r.stockValue == null ? "muted" : "num") + '">' + (r.stockValue == null ? "—" : fmtInt(r.stockValue)) + "</td>";
        return '<tr data-code="' + esc(r.code) + '">' + codeCell(r) + descCell(r) + "<td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td><td>" + statusCell(r) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td>" + priceTd + valTd + "</tr>";
      }).join("");
    } else if (view === "averages") {
      head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_spark") + "</th>" + th("avg", t("c_avg"), true) + th("trendPct", t("c_delta")) + th("stock", t("c_stock"), true) + "<th>" + t("c_status") + "</th></tr></thead>";
      body = rows.map(function (r) {
        var ser = monthlySeriesFor(r.code);
        return '<tr data-code="' + esc(r.code) + '">' + codeCell(r) + descCell(r) + '<td class="sparkcell">' + sparkSVG(ser && ser.vals) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td>" + trendCell(r) + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + statusCell(r) + "</td></tr>";
      }).join("");
    } else {
      // The Sharek column (after the suggested order) appears once the
      // platform file is loaded: ✓ marks a ZERO-stock item the hospital can
      // source through Sharek instead of waiting on the supplier.
      var shTh = SHAREK ? thp(t("c_sharek"), "ex_col_sharek") : "";
      head = "<thead><tr>" + th("code", t("c_code")) + th("desc", t("c_desc")) + "<th>" + t("c_planner") + "</th><th>" + t("c_uom") + "</th>" + th("total", t("c_total"), true, "ex_col_total") + th("avg", t("c_avg"), true, "ex_col_avg") + thp(t("c_trend"), "ex_col_trend") + th("stock", t("c_stock"), true, "ex_col_stock") + th("cov", t("c_cov"), false, "ex_col_cov") + th("expMonths", t("c_expiry"), false, "ex_col_expiry") + thp(t("c_stockout"), "ex_col_proj") + thp(t("c_status"), "ex_col_status") + th("qty9", t("c_qty9"), true, "ex_col_qty9") + th("sug", t("c_sug"), true, "ex_col_sug") + shTh + "</tr></thead>";
      body = rows.map(function (r) { var shTd = SHAREK ? '<td class="sharekcell">' + (r.stock <= 0 && onSharek(r.code) ? '<span class="pill ok">' + t("shk_yes") + "</span>" : '<span class="muted">—</span>') + "</td>" : ""; return '<tr data-code="' + esc(r.code) + '">' + codeCell(r) + descCell(r) + plannerCell(r) + "<td>" + esc(r.uom || "—") + "</td><td class=\"right num\">" + fmtInt(r.total) + "</td><td class=\"right num\">" + fmt1(r.avg) + "</td><td>" + trendCell(r) + "</td><td class=\"right num\">" + fmtInt(r.stock) + "</td><td>" + covCell(r) + "</td>" + expCell(r) + projCell(r) + "<td>" + statusCell(r) + "</td><td class=\"right num\">" + fmtInt(r.qty9) + "</td><td class=\"right num sug\">" + fmtInt(r.sug) + (r.seasonal ? ' <i class="seasonal-tag" title="' + esc(tFmt("ss_basis", { n: fmtInt(r.seasonal) })) + '">' + t("ss_tag") + "</i>" : "") + "</td>" + shTd + "</tr>"; }).join("");
    }
    var shown = rows.length;
    // Catalog fallback: a search that misses every loaded row also scans the
    // saved identifiers catalog, so a drug with no movement and no stock in
    // the uploaded files is still findable by name (the "Skyrizi" case).
    if (!rows.length) {
      var terms = searchTerms();
      if (terms.length) {
        var catCodes = catalogMatches(terms);
        if (catCodes.length) {
          body = catCodes.map(function (code) {
            var m = MAP.byCode[code];
            var name = [m.trade, m.sci].filter(Boolean).join(" · ") || code;
            return '<tr class="cat-row" data-code="' + esc(code) + '"><td class="code num">' + esc(code) + '</td><td class="desc">' + esc(name) + '</td><td colspan="' + (SHAREK ? 13 : 12) + '" class="cat-note"><span class="pill no_movement">' + t("cat_badge") + "</span> " + esc(t("cat_note")) + "</td></tr>";
          }).join("");
          shown = catCodes.length;
        }
      }
    }
    return tableCard(head, body, shown, base.length, synHintHtml());
  }
  function renderPlanning(base, c) {
    var s = decisionStats(base);
    // Owner spec v3: the planner reads ITEM COUNTS, not unit totals — the
    // total-units and monthly-consumption cards are replaced by the item
    // census (total / with stock / zero, with percentages). The monthly
    // stream card below keeps the consumption trend visible.
    var pctWith = s.itemsTotal ? Math.round((s.withStock / s.itemsTotal) * 100) : 0;
    var pctZero = s.itemsTotal ? Math.round((s.zeroStock / s.itemsTotal) * 100) : 0;
    // Owner wave 6 (A3/A4): the data-quality and "what changed" digest cards
    // and the Critical KPI card were removed from the Planning view to keep the
    // first glance clean. The quality/digest computation stays in STATE for
    // internal use; only their on-screen cards are gone.
    var cards = '<div class="cards">'
      + cardDecision(t("k_need_order"), fmtInt(s.orderCount) + ' <small>' + t("items_word") + '</small>', ICON.alert, "tile-coral", tFmt("k_need_order_sub", { u: fmtM(s.orderUnits), n: fmtInt(s.notStockCount) }), null, "ex_need_order")
      + cardDecision(t("k_items"), fmtInt(s.itemsTotal) + ' <small>' + t("items_word") + '</small>', ICON.grid, "tile-lav", tFmt("k_items_sub", { a: fmtInt(s.withStock), p: pctWith }), null, "ex_items")
      + cardDecision(t("k_zero"), fmtInt(s.zeroStock) + ' <small>' + t("items_word") + '</small>', ICON.box, "tile-gray", tFmt("k_zero_sub", { p: pctZero }) + (SHAREK ? " · " + tFmt("k_zero_sharek", { n: fmtInt(s.zeroSharek) }) : ""), null, "ex_zero")
      + cardOrderSheet(base)
      // The monthly stream keeps the consumption trend; the MoM badge of the
      // retired consumption card moves into its title so the signal survives.
      + cardStream(t("k_monthly_title"), STATE.monthly,
        s.momPct == null ? "" : ' <span class="kdelta ' + (s.momPct >= 0 ? "up" : "down") + ' num" title="' + esc(tFmt("vs_prev_month", { a: ymLabel(s.momA + "-01") || s.momA, b: ymLabel(s.momB + "-01") || s.momB })) + '">' + (s.momPct >= 0 ? "▲ +" : "▼ ") + (s.momPct * 100).toFixed(0) + "%</span>")
      + '</div>';
    var secline = '<div class="secline"><span class="secbadge">' + t("k_watch") + ' <b class="num">' + fmtInt(c.warning) + '</b></span><span class="secbadge">' + t("k_nomove") + ' <b class="num">' + fmtInt(c.no_movement) + '</b></span><span class="secbadge">' + t("s_ok") + ' <b class="num">' + fmtInt(c.ok) + '</b></span></div>';
    var coveredChip = c.covered_order > 0 ? fchip("covered_order", t("f_covered_order"), c.covered_order, ICON.truck || ICON.box) : "";
    // Sharek (wave 6 D1): with a file the zero-&-Sharek filter chip shows; with
    // NO file the planner sees nothing about Sharek, so render a quiet,
    // explanatory hint chip instead of the void — tapping it opens the upload
    // bar at the Sharek slot. Sample mode stays clean (nothing to upload there).
    var sharekChip = SHAREK
      ? fchip("sharek_zero", t("f_sharek"), c.sharek_zero, ICON.grid)
      : (STATE.meta.source === "upload" ? '<button type="button" class="fchip sharek-hint" id="sharekHintBtn" title="' + esc(t("shk_hint")) + '"><span class="fic">' + ICON.grid + "</span>" + t("shk_hint") + "</button>" : "");
    var filters = '<div class="filters">' + fchip("all", t("f_all"), c.all, ICON.grid) + fchip("watchlist", t("f_watchlist"), c.watchlist, ICON.star) + fchip("order_now", t("f_order_now"), c.order_now, ICON.alert) + coveredChip + fchip("warning", t("f_watch"), c.warning, ICON.clock) + fchip("excess", t("f_excess"), c.excess, ICON.box) + fchip("no_movement", t("f_no_movement"), c.no_movement, ICON.pause) + fchip("not_in_stock", t("f_not_in_stock"), c.not_in_stock, ICON.ban) + sharekChip + copyAllChip() + exportViewChip() + "</div>";
    return cards + secline + toolbar(filters) + buildTableHTML("planning", base);
  }
  function copyAllChip() {
    return '<button type="button" class="fchip" id="copyAllCodes"><span class="fic">' + ICON.copy + '</span>' + t("cp_copy_all") + '</button>';
  }
  /* Per-filter export (owner spec v3 wave 5): one click downloads exactly
     what the active filter + search show — e.g. the "zero & on Sharek" list
     a planner forwards as one batch of orders. */
  function exportViewChip() {
    return '<button type="button" class="fchip" id="exportView"><span class="fic">' + ICON.download + '</span>' + t("ev_export") + '</button>';
  }
  function exportCurrentView() {
    var rows = applyFilter(viewBase());
    if (!rows.length) { toast(t("cp_none")); return; }
    var aoa = [[t("c_code"), t("c_desc"), t("c_planner"), t("c_uom"), t("c_stock"), t("c_cov"), t("c_status"), t("dt_stockout"), t("dt_reorder"), t("c_sug")].concat(SHAREK ? [t("c_sharek")] : [])];
    rows.forEach(function (r) {
      aoa.push([r.code, r.desc, plannerName(r) || t("planner_unassigned"), r.uom || "", Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, t("s_" + r.status), r.stockoutIso ? prettyDate(r.stockoutIso) : "", r.reorderIso ? prettyDate(r.reorderIso) : "", Math.round(r.sug)].concat(SHAREK ? [(r.stock <= 0 && onSharek(r.code)) ? t("shk_yes") : ""] : []));
    });
    var wb = XLSX.utils.book_new();
    var ws = sheetFrom(aoa, [16, 34, 16, 8, 11, 9, 12, 14, 14, 12, 10], { 4: INT_FMT, 5: DEC1_FMT, 9: INT_FMT }, true);
    XLSX.utils.book_append_sheet(wb, ws, "View");
    var name = "PSMMC_view_" + (STATE.filter || "all") + "_" + (isoDate(new Date())) + ".xlsx";
    XLSX.writeFile(wb, name);
    toast((LANG === "ar" ? "تم تصدير العرض → " : "Exported view → ") + name);
  }
  /* Per-upload data-quality card (ROADMAP step 2): nothing is excluded
     silently — every upload reports accepted/rejected rows with named
     reasons, soft warnings, and the file header each app column bound to.
     Native <details> keeps each file's breakdown expandable with no extra
     JS; the card belongs to real uploads only (sample mode hides it). */
  function qualityCard() {
    var Q = STATE.quality;
    if (!Q || STATE.qualityDismissed || STATE.meta.source !== "upload") return "";
    var blocks = "";
    [["wd", "file_wd"], ["st", "file_st"], ["mp", "file_mp"], ["po", "file_po"]].forEach(function (kk) {
      var e = Q[kk[0]];
      if (!e || !e.q) return;
      var q = e.q, rej = 0;
      q.rejects.forEach(function (x) { rej += x.n; });
      var lines = q.rejects.map(function (x) {
        return '<div class="ql-line"><b class="num" style="color:var(--coral)">' + fmtInt(x.n) + '</b><span>' + t(x.k) + "</span></div>";
      }).join("") + q.warns.map(function (x) {
        return '<div class="ql-line is-warn"><b class="num" style="color:var(--amber)">' + fmtInt(x.n) + '</b><span>' + t(x.k) + "</span></div>";
      }).join("");
      var cols = q.cols && q.cols.length
        ? '<div class="ql-cols"><b>' + t("qc_columns") + ":</b> " + q.cols.map(function (c) { return t(c.k) + " ← <b>" + esc(c.h) + "</b>"; }).join(" · ") + "</div>"
        : "";
      blocks += '<details class="ql-file" data-kind="' + kk[0] + '">'
        + "<summary><b>" + t(kk[1]) + "</b><i>" + esc(e.name || "") + "</i>"
        + '<span class="ql-sum num">' + fmtInt(q.total) + " " + t("qc_rows") + ' → <b style="color:var(--blue)">' + fmtInt(q.accepted) + "</b> " + t("qc_accepted")
        + (rej ? ' · <b style="color:var(--coral)">' + fmtInt(rej) + "</b> " + t("qc_rejected") : "") + "</span></summary>"
        + lines + cols + "</details>";
    });
    if (!blocks) return "";
    return '<div class="kcard span12 qualitycard"><div class="ktitle-row"><span class="ktitle">' + t("qc_title") + "</span>"
      + '<span class="ql-actions"><button type="button" class="btn-soft" id="qcExport">' + ICON.download + t("qc_export") + "</button>"
      + '<button type="button" class="btn-soft" id="qcDismiss">' + t("dg_dismiss") + "</button></span></div>"
      + blocks + "</div>";
  }
  /* Excel export of the quality report — an audit trail the planner can file
     next to the monthly order sheet. */
  function exportQuality() {
    var Q = STATE.quality;
    if (!Q) return;
    var aoa = [];
    [["wd", "file_wd"], ["st", "file_st"], ["mp", "file_mp"], ["po", "file_po"]].forEach(function (kk) {
      var e = Q[kk[0]];
      if (!e || !e.q) return;
      var label = t(kk[1]) + (e.name ? " — " + e.name : "");
      aoa.push([label, t("qc_rows"), e.q.total]);
      aoa.push([label, t("qc_accepted"), e.q.accepted]);
      e.q.rejects.forEach(function (x) { aoa.push([label, t("qc_rejected") + " · " + t(x.k), x.n]); });
      e.q.warns.forEach(function (x) { aoa.push([label, t(x.k), x.n]); });
      e.q.cols.forEach(function (c) { aoa.push([label, t("qc_columns") + " · " + t(c.k), c.h]); });
      aoa.push(["", "", ""]);
    });
    if (!aoa.length) return;
    var ws = XLSX.utils.aoa_to_sheet(sanitizeAoa(aoa)), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DataQuality");
    XLSX.writeFile(wb, "PSMMC_data_quality_" + isoDate(new Date()) + ".xlsx");
  }

  /* Dismissible per-upload digest: what moved between this upload and the last. */
  function digestCard() {
    var d = STATE.digest;
    if (!d) return "";
    function dgLine(key, arr, color) {
      if (!arr.length) return "";
      var names = arr.slice(0, 5).map(function (r) { return esc(String(r.desc || r.code).slice(0, 38)); }).join(" · ");
      var more = arr.length > 5 ? " +" + fmtInt(arr.length - 5) : "";
      return '<div class="dg-line"><b class="num" style="color:' + color + '">' + fmtInt(arr.length) + '</b><span><b>' + t(key) + ':</b> ' + names + more + "</span></div>";
    }
    return '<div class="kcard span12 digest"><div class="ktitle-row"><span class="ktitle">' + t("dg_title") + '</span>'
      + '<button type="button" class="btn-soft" id="dgDismiss">' + t("dg_dismiss") + '</button></div>'
      + dgLine("dg_danger", d.danger, "var(--coral)")
      + dgLine("dg_spike", d.spikes, "var(--amber)")
      + dgLine("dg_expiry", d.expiry || [], "var(--coral)")
      + dgLine("dg_new", d.fresh, "var(--blue)")
      + dgLine("dg_recovered", d.recovered, "var(--blue)")
      + "</div>";
  }
  /* Budget runway: remaining budget ÷ monthly consumption value (Σ avg×unit
     price over priced items) → months left + projected run-out date. Activates
     only once real prices are loaded. */
  function budgetCard() {
    if (!hasPrices()) {
      return '<div class="kcard span6 budgetcard"><div class="ktitle-row"><span class="ktitle">' + t("br_title") + '</span></div>'
        + '<div class="kfoot"><b>—</b><i>' + t("br_hint") + "</i></div></div>";
    }
    var monthlyVal = 0;
    STATE.rows.forEach(function (r) { if (r.unitPrice && r.avg > 0) monthlyVal += r.avg * r.unitPrice; });
    var amount = BUDGET && BUDGET.amount > 0 ? BUDGET.amount : null;
    var body;
    if (amount && monthlyVal > 0) {
      var months = amount / monthlyVal;
      var runout = new Date(Date.now() + months * DAYS_PER_MONTH * 86400000);
      body = '<div class="br-stats statgrid">'
        + '<span class="stat"><b class="num" id="brMonths">' + fmt1(months) + '</b><i>' + t("br_months") + "</i></span>"
        + '<span class="stat"><b class="num" id="brRunout">' + prettyDate(isoDate(runout)) + '</b><i>' + t("br_runout") + "</i></span>"
        + '<span class="stat"><b class="num">' + fmtM(monthlyVal) + '</b><i>' + t("br_monthly") + "</i></span></div>";
    } else {
      body = '<div class="kfoot"><b class="num">' + fmtM(monthlyVal) + "</b><i>" + t("br_monthly") + "</i></div>";
    }
    return '<div class="kcard span6 budgetcard"><div class="ktitle-row"><span class="ktitle">' + t("br_title") + '</span></div>'
      + '<div class="br-row"><input id="brInput" type="number" min="0" step="1000" inputmode="decimal" class="num" placeholder="' + esc(t("br_ph")) + '" value="' + (amount != null ? amount : "") + '"/>'
      + '<button type="button" class="btn-soft" id="brSave">' + t("br_save") + "</button></div>"
      + body + "</div>";
  }
  /* Monthly order workload (owner spec v3): for each upcoming month, how
     many items hit their reorder-by date — i.e. how many orders the planner
     will raise — and at which planners. Items already past their reorder
     date collapse into the current month (they are TODAY's workload). SAR
     value = Σ suggested qty × unit price over the bucket's priced items. */
  function monthlyWorkload(rows) {
    var todayIso = isoDate(new Date());
    var nowYm = ymOf(todayIso);
    var buckets = {};
    rows.forEach(function (r) {
      if (!r.reorderIso || r.avg <= 0) return;
      var ym = r.reorderIso <= todayIso ? nowYm : ymOf(r.reorderIso);
      var b = buckets[ym] || (buckets[ym] = { count: 0, val: 0, planners: {}, items: [] });
      b.count++;
      var line = r.unitPrice && r.sug > 0 ? r.sug * r.unitPrice : 0;
      if (line) b.val += line;
      var pn = plannerName(r) || t("planner_unassigned");
      b.planners[pn] = (b.planners[pn] || 0) + 1;
      // Per-month medicine list (wave 6 F2/F3): what will be ordered that month.
      b.items.push({ code: r.code, desc: r.desc, qty: Math.round(r.sug || 0), planner: pn, unitPrice: r.unitPrice || null, value: line });
    });
    return { nowYm: nowYm, buckets: buckets };
  }
  function workloadCard(base) {
    var w = monthlyWorkload(base);
    var yms = Object.keys(w.buckets).sort().slice(0, 12);
    if (!yms.length) return "";
    var priced = hasPrices();
    var rows = yms.map(function (ym) {
      var b = w.buckets[ym];
      var planners = Object.keys(b.planners).sort(function (a, bb) { return b.planners[bb] - b.planners[a]; });
      var chips = planners.slice(0, 4).map(function (pn) { return esc(pn) + ' <b class="num">' + fmtInt(b.planners[pn]) + "</b>"; }).join(" · ")
        + (planners.length > 4 ? " +" + (planners.length - 4) : "");
      return '<tr class="bw-row" data-ym="' + esc(ym) + '" role="button" tabindex="0" title="' + esc(t("bw_open")) + '"><td class="num">' + (ym === w.nowYm ? t("bw_now") : (ymLabel(ym + "-01") || ym)) + "</td>"
        + '<td class="right num">' + fmtInt(b.count) + "</td>"
        + '<td class="bw-planners">' + chips + "</td>"
        + (priced ? '<td class="right num">' + (b.val > 0 ? fmtM(b.val) : "—") + "</td>" : "")
        + '<td class="bw-go" aria-hidden="true">›</td></tr>';
    }).join("");
    return '<div class="kcard span12 workloadcard"><div class="ktitle-row"><span class="ktitle">' + t("bw_title")
      + '</span><span class="ql-actions"><button type="button" class="btn-soft" id="bwExportYear">' + ICON.download + t("bw_export_year") + "</button>"
      + '<span class="thinfo" data-explain="ex_workload" role="button" tabindex="0" aria-label="' + esc(t("ex_open")) + '">ⓘ</span></span></div>'
      + '<div class="tablewrap"><table><thead><tr><th>' + t("bw_month") + '</th><th class="right">' + t("bw_orders") + "</th><th>" + t("c_planner") + "</th>" + (priced ? '<th class="right">' + t("bw_value") + "</th>" : "") + "<th></th></tr></thead>"
      + "<tbody>" + rows + "</tbody></table></div></div>";
  }
  /* Month drill-down (wave 6 F2): clicking a workload month lists exactly the
     medicines to be ordered that month — code, name, planner, suggested qty,
     unit price and line value — with a per-month Excel export (F3). */
  function openMonthDetail(ym) {
    var w = monthlyWorkload(STATE.rows);
    var b = w.buckets[ym];
    if (!b) return;
    var priced = hasPrices();
    var items = b.items.slice().sort(function (a, c) { return c.value - a.value; });
    var label = ym === w.nowYm ? t("bw_now") : (ymLabel(ym + "-01") || ym);
    var rows = items.map(function (it) {
      return '<tr><td class="code num" data-copy="' + esc(it.code) + '" role="button" tabindex="0" title="' + t("cp_copied") + '">' + esc(it.code) + "</td>"
        + '<td class="desc">' + esc(it.desc) + "</td>"
        + '<td>' + esc(it.planner) + "</td>"
        + '<td class="right num">' + fmtInt(it.qty) + "</td>"
        + (priced ? '<td class="right num">' + (it.value > 0 ? fmtM(it.value) : "—") + "</td>" : "") + "</tr>";
    }).join("");
    var html = '<button class="dt-close" id="mdClose" aria-label="' + esc(t("close")) + '">×</button>'
      + '<div class="modal-title">' + t("bw_month_title") + " — " + esc(label) + "</div>"
      + '<div class="md-sub num">' + fmtInt(b.count) + " " + t("items_word") + (priced && b.val > 0 ? " · " + fmtM(b.val) + " " + t("br_sar") : "") + "</div>"
      + '<div class="md-actions"><button type="button" class="btn-soft accent" id="mdExport" data-ym="' + esc(ym) + '">' + ICON.download + t("bw_export_month") + "</button></div>"
      + '<div class="tablewrap"><table class="t-md"><thead><tr><th>' + t("c_code") + "</th><th>" + t("c_desc") + "</th><th>" + t("c_planner") + '</th><th class="right">' + t("c_sug") + "</th>" + (priced ? '<th class="right">' + t("bw_value") + "</th>" : "") + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
    openModal(html, "modal-md");
    var mc = $("modalCard");
    var x = $("mdClose"); if (x) x.onclick = closeModal;
    var ex = $("mdExport"); if (ex) ex.onclick = function () { exportMonthWorkload(this.getAttribute("data-ym")); };
    if (mc) wireCopyChips(mc);
  }
  function monthAoa(ym, b, priced) {
    var aoa = [[t("c_code"), t("c_desc"), t("c_planner"), t("c_sug")].concat(priced ? [t("pr_unit_price"), t("bw_value")] : [])];
    b.items.slice().sort(function (a, c) { return c.value - a.value; }).forEach(function (it) {
      aoa.push([it.code, it.desc, it.planner, it.qty].concat(priced ? [it.unitPrice == null ? "" : Math.round(it.unitPrice * 100) / 100, it.value > 0 ? Math.round(it.value) : ""] : []));
    });
    return aoa;
  }
  /* F3: export one month's order plan. */
  function exportMonthWorkload(ym) {
    var w = monthlyWorkload(STATE.rows);
    var b = w.buckets[ym];
    if (!b) return;
    var priced = hasPrices();
    var widths = [16, 34, 16, 10].concat(priced ? [12, 14] : []);
    var ws = sheetFrom(monthAoa(ym, b, priced), widths, priced ? { 4: DEC1_FMT, 5: INT_FMT } : null, true);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Month");
    XLSX.writeFile(wb, "PSMMC_order_plan_" + ym + ".xlsx");
    toast((LANG === "ar" ? "تم تصدير خطة الشهر → " : "Exported month plan → ") + ym);
  }
  /* F3: export EVERY upcoming month from now to the end of the current year,
     one sheet per month plus an "All" sheet — the planner's whole pipeline. */
  function exportYearEndOrders() {
    var w = monthlyWorkload(STATE.rows);
    var priced = hasPrices();
    var endYm = (new Date().getFullYear()) + "-12";
    var yms = Object.keys(w.buckets).filter(function (ym) { return ym <= endYm; }).sort();
    if (!yms.length) { toast(t("cp_none")); return; }
    var wb = XLSX.utils.book_new();
    var all = [[t("bw_month"), t("c_code"), t("c_desc"), t("c_planner"), t("c_sug")].concat(priced ? [t("bw_value")] : [])];
    yms.forEach(function (ym) {
      var b = w.buckets[ym];
      var label = ym === w.nowYm ? (LANG === "ar" ? "الآن" : "Now") : (ymLabel(ym + "-01") || ym);
      var widths = [16, 34, 16, 10].concat(priced ? [12, 14] : []);
      var ws = sheetFrom(monthAoa(ym, b, priced), widths, priced ? { 4: DEC1_FMT, 5: INT_FMT } : null, true);
      XLSX.utils.book_append_sheet(wb, ws, ym.replace("-", "_"));
      b.items.slice().sort(function (a, c) { return c.value - a.value; }).forEach(function (it) {
        all.push([label, it.code, it.desc, it.planner, it.qty].concat(priced ? [it.value > 0 ? Math.round(it.value) : ""] : []));
      });
    });
    var wsAll = sheetFrom(all, [12, 16, 34, 16, 10].concat(priced ? [14] : []), null, true);
    XLSX.utils.book_append_sheet(wb, wsAll, "All");
    XLSX.writeFile(wb, "PSMMC_orders_to_year_end_" + isoDate(new Date()) + ".xlsx");
    toast(LANG === "ar" ? "تم تصدير كل الطلبات حتى نهاية السنة" : "Exported all orders to year-end");
  }
  /* Budget overview (wave 6 F4): a single-glance money picture — budget set,
     spent (delivered procurement value), remaining, plus the value still in
     transit (open orders) vs already delivered. Ledger values are
     price-independent (they come with the orders file). */
  function ledgerValueSplit() {
    var open = 0, delivered = 0;
    if (LEDGER && LEDGER.entries) {
      Object.keys(LEDGER.entries).forEach(function (k) {
        var e = LEDGER.entries[k], v = e.totalValue || 0;
        if (!v || isOrderRejected(e.status)) return;
        if (orderDelivered(e)) delivered += v; else open += v;
      });
    }
    return { open: open, delivered: delivered };
  }
  function budgetOverviewCard() {
    var split = ledgerValueSplit();
    var amount = BUDGET && BUDGET.amount > 0 ? BUDGET.amount : null;
    var spent = split.delivered;
    var remaining = amount != null ? amount - spent : null;
    var stat = function (val, lblKey, cls) {
      return '<span class="stat ' + (cls || "") + '"><b class="num">' + (val == null ? "—" : fmtM(val)) + '</b><i>' + t(lblKey) + "</i></span>";
    };
    return '<div class="kcard span12 budgetoverview"><div class="ktitle-row"><span class="ktitle">' + t("bo_title") + "</span></div>"
      + '<div class="bo-grid">'
      + stat(amount, "bo_budget")
      + stat(spent, "bo_spent")
      + stat(remaining, "bo_remaining", remaining != null && remaining < 0 ? "is-neg" : "")
      + stat(split.open, "bo_undelivered")
      + stat(split.delivered, "bo_delivered")
      + "</div></div>";
  }
  /* Top-N rankings (owner spec v3): the drugs that consume the most money
     through procurement orders, and the items tying up the most inventory
     value in the warehouse. Spend comes from the ledger (independent of a
     price file); inventory value needs prices. */
  function topSpend(base, n) {
    if (!LEDGER) return [];
    var idx = ledgerByCode(), descBy = {};
    base.forEach(function (r) { descBy[r.code] = r.desc; });
    var out = [];
    Object.keys(idx).forEach(function (code) {
      var sum = 0; idx[code].forEach(function (e) { sum += e.totalValue || 0; });
      if (sum > 0) out.push({ code: code, val: sum, desc: descBy[code] || code, n: idx[code].length });
    });
    return out.sort(function (a, b) { return b.val - a.val; }).slice(0, n || 50);
  }
  function topInventory(base, n) {
    return base.filter(function (r) { return r.stockValue != null && r.stockValue > 0; })
      .map(function (r) { return { code: r.code, val: r.stockValue, desc: r.desc, q: r.stock }; })
      .sort(function (a, b) { return b.val - a.val; }).slice(0, n || 50);
  }
  function rankCard(titleKey, items, explainKey, extraHead, extra) {
    if (!items.length) return "";
    var head = '<tr><th>#</th><th>' + t("c_code") + "</th><th>" + t("c_desc") + "</th>" + (extraHead ? "<th class=\"right\">" + t(extraHead) + "</th>" : "") + '<th class="right">' + t("bw_value") + "</th></tr>";
    var body = items.map(function (x, i) {
      return '<tr data-code="' + esc(x.code) + '"><td class="num">' + (i + 1) + "</td>"
        + '<td class="code num" data-copy="' + esc(x.code) + '" role="button" tabindex="0" title="' + t("cp_copied") + '">' + esc(x.code) + "</td>"
        + '<td class="desc">' + esc(x.desc) + "</td>"
        + (extra ? '<td class="right num">' + extra(x) + "</td>" : "")
        + '<td class="right num">' + fmtM(x.val) + "</td></tr>";
    }).join("");
    return '<div class="kcard span6 rankcard"><div class="ktitle-row"><span class="ktitle">' + t(titleKey)
      + '</span><span class="thinfo" data-explain="' + explainKey + '" role="button" tabindex="0" aria-label="' + esc(t("ex_open")) + '">ⓘ</span></div>'
      + '<div class="rank-scroll"><table><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div></div>";
  }
  function renderManagement(base, c) {
    var totalUnits = base.reduce(function (s, r) { return s + r.stock; }, 0);
    var orderNow = base.filter(function (r) { return r.status === "order_now"; }).length;
    var avgPerItem = base.length ? totalUnits / base.length : 0;
    var buckets = [0, 0, 0, 0, 0, 0, 0, 0];
    // Wave 6 §G (latent fix): for 0 < stock < 1, floor(log10)+1 is ≤ 0, which
    // would drop a fractional-stock item into the zero bucket or a NEGATIVE
    // index (lost from the distribution / NaN). Clamp any positive stock to the
    // lowest non-zero bucket so the eight buckets always sum to the item count.
    base.forEach(function (r) { buckets[r.stock <= 0 ? 0 : Math.max(1, Math.min(7, Math.floor(Math.log(r.stock) / Math.LN10) + 1))]++; });
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
      + budgetCard()
      // Wave 6 F4: single-glance money picture (budget/spent/remaining +
      // delivered vs in-transit order value) — shown once there's a ledger.
      + (LEDGER ? budgetOverviewCard() : "")
      // Workload spans ALL items (the management base hides zero-stock rows,
      // but a zero-stock moving item is exactly an order to raise NOW).
      + workloadCard(STATE.rows)
      + rankCard("rk_spend", topSpend(STATE.rows, 50), "ex_rk_spend", "bw_orders", function (x) { return fmtInt(x.n); })
      + rankCard("rk_inventory", topInventory(base, 50), "ex_rk_inventory", "c_stock", function (x) { return fmtInt(x.q); })
      + '</div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all_instock"), c.instock + c.outstock, ICON.box) + fchip("instock", t("f_available"), c.instock, ICON.check) + fchip("outstock", t("f_outstock"), c.outstock, ICON.ban) + copyAllChip() + "</div>";
    return cards + toolbar(filters) + buildTableHTML("management", base);
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
    // Guided empty state: rows exist (so render() did not early-return) but no
    // moving items and no saved history means there is nothing to average yet.
    // Tell the user history accrues from withdrawals uploads instead of showing
    // a bare empty table.
    if (!base.length && !histMonths()) {
      return '<div class="empty card"><span class="tile tile-lav">' + ICON.chart + '</span>'
        + '<h3>' + t("av_empty_title") + '</h3>'
        + '<p>' + t("av_empty_text") + '</p></div>';
    }
    var rising = 0, falling = 0;
    base.forEach(function (r) { if (r.trendPct != null) { if (r.trendPct > 0.10) rising++; else if (r.trendPct < -0.10) falling++; } });
    var hm = histMonths();
    var secline = '<div class="secline">'
      + (hm ? '<span class="secbadge">' + t("av_hist") + ' <b class="num">' + fmtInt(hm) + " " + t("mo") + '</b></span>' : "")
      + '<span class="secbadge">' + t("av_moving") + ' <b class="num">' + fmtInt(base.length) + '</b></span>'
      + '<span class="secbadge" style="color:var(--coral)">▲ ' + t("av_rising") + ' <b class="num">' + fmtInt(rising) + '</b></span>'
      + '<span class="secbadge" style="color:var(--blue)">▼ ' + t("av_falling") + ' <b class="num">' + fmtInt(falling) + '</b></span>'
      + '<button type="button" class="btn-soft" id="histExport">' + ICON.download + t("av_export") + '</button>'
      + '<button type="button" class="btn-soft" id="histImport">' + ICON.list + t("av_import") + '</button></div>';
    var filters = '<div class="filters">' + fchip("all", t("f_all"), c.all, ICON.grid) + fchip("rising", "▲ " + t("f_rising"), rising) + fchip("falling", "▼ " + t("f_falling"), falling) + fchip("newitem", t("f_new"), c.newitem) + copyAllChip() + "</div>";
    return secline + toolbar(filters) + buildTableHTML("averages", base) + '<p class="dt-note" style="margin:10px 4px">' + t("av_tap") + '</p>';
  }

  /* ---------- Expiry Watch view (FEATURE 3 + 4) ----------
     A cross-cutting BATCH-level list (not product rows): the At-Risk filter
     flattens every product's FEFO at-risk batches; the Expired filter lists
     every batch already past expiry (counted by physical Total Qty). Both are
     sortable by expiry or quantity and subtotaled per planner. The value
     column stays "—" until a price file is loaded. */
  function expiryCounts() {
    var ar = 0, ex = 0;
    STATE.rows.forEach(function (r) { if (r.atRiskBatches) ar += r.atRiskBatches.length; if (r.expiredBatches) ex += r.expiredBatches.length; });
    return { atrisk: ar, expired: ex };
  }
  function expiryBatchRows() {
    var f = STATE.expiryFilter || "atrisk", out = [];
    STATE.rows.forEach(function (r) {
      var list = f === "expired" ? r.expiredBatches : r.atRiskBatches;
      if (!list) return;
      list.forEach(function (b) { out.push({ r: r, e: b.e, q: b.q, lot: b.b || null }); });
    });
    if ((STATE.expirySort || "exp") === "qty") out.sort(function (a, b) { return b.q - a.q; });
    else out.sort(function (a, b) { return a.e < b.e ? -1 : a.e > b.e ? 1 : 0; });
    return out;
  }
  function fchipE(key, label, count, icon) { return '<button class="fchip' + (((STATE.expiryFilter || "atrisk") === key) ? " is-active" : "") + '" data-efilter="' + key + '">' + (icon ? '<span class="fic">' + icon + "</span>" : "") + label + ' <span class="badge num">' + fmtInt(count || 0) + "</span></button>"; }
  function fsortE(key, label) { return '<button class="fchip' + (((STATE.expirySort || "exp") === key) ? " is-active" : "") + '" data-esort="' + key + '">' + label + "</button>"; }
  function renderExpiry() {
    var f = STATE.expiryFilter || "atrisk", counts = expiryCounts(), rows = expiryBatchRows();
    var asOf = parseIsoLocal(STATE.meta.stock_as_of) || new Date();
    // SAR value per batch = qty × the item's unit price; total only counts
    // priced items (unpriced rows keep "—" so the figure stays honest).
    var priced = hasPrices();
    // Planner chips count ITEMS (distinct products), not units — the owner
    // plans workload by how many line items each planner must chase.
    var totalQty = 0, totalVal = 0, byPlanner = {};
    rows.forEach(function (x) {
      totalQty += x.q;
      if (priced && x.r.unitPrice) totalVal += x.q * x.r.unitPrice;
      var pn = plannerName(x.r) || t("planner_unassigned");
      (byPlanner[pn] = byPlanner[pn] || {})[x.r.code] = 1;
    });
    Object.keys(byPlanner).forEach(function (pn) { byPlanner[pn] = Object.keys(byPlanner[pn]).length; });
    var filters = '<div class="filters">'
      + fchipE("atrisk", t("ev_atrisk"), counts.atrisk, ICON.alert)
      + fchipE("expired", t("ev_expired"), counts.expired, ICON.ban)
      + '<span class="fil-sep"></span>'
      + fsortE("exp", t("ev_sort_exp")) + fsortE("qty", t("ev_sort_qty")) + "</div>";
    var plannerChips = Object.keys(byPlanner).sort(function (a, b) { return byPlanner[b] - byPlanner[a]; }).slice(0, 8)
      .map(function (pn) { return '<span class="ev-planner">' + esc(pn) + ' <b class="num">' + fmtInt(byPlanner[pn]) + "</b> " + t("items_word") + "</span>"; }).join("");
    var summary = '<div class="kcard span12 expiry-summary"><div class="ev-tot">'
      + '<span class="stat"><b class="num">' + fmtInt(rows.length) + '</b><i>' + t("ev_batches") + "</i></span>"
      + '<span class="stat"><b class="num ev-total-qty">' + fmtM(totalQty) + '</b><i>' + t("ev_total_qty") + "</i></span>"
      + (priced
        ? '<span class="stat"><b class="num ev-total-val">' + fmtM(totalVal) + '</b><i>' + t("ev_value_sar") + "</i></span>"
        : '<span class="stat"><b class="muted">—</b><i>' + t("ev_value_pending") + "</i></span>")
      + "</div>" + (plannerChips ? '<div class="ev-planners">' + plannerChips + "</div>" : "") + "</div>";
    if (!rows.length) {
      return summary + filters + '<div class="empty card"><span class="tile tile-lav">' + ICON.clock + '</span><h3>' + t("ev_empty") + "</h3></div>";
    }
    var body = rows.map(function (x) {
      var d = parseIsoLocal(x.e), mo = d ? (d - asOf) / 86400000 / DAYS_PER_MONTH : null;
      var tte = f === "expired"
        ? '<span class="exp-risk">' + t("ev_overdue") + (mo != null ? " " + fmt1(-mo) + " " + t("mo") : "") + "</span>"
        : (mo != null ? '<span class="num">' + fmt1(mo) + " " + t("mo") + "</span>" : "—");
      var pn = plannerName(x.r);
      return '<tr class="batch-row" data-code="' + esc(x.r.code) + '"><td class="desc">' + esc(x.r.desc) + '<i class="tradename num">' + esc(x.r.code) + "</i></td>"
        + '<td class="num">' + esc(x.lot || "—") + "</td><td class=\"num\">" + prettyDate(x.e) + "</td><td>" + tte + "</td>"
        + '<td class="right num">' + fmtInt(x.q) + "</td>"
        + '<td class="plancell">' + (pn ? esc(pn) : '<span class="muted">' + t("planner_unassigned") + "</span>") + "</td>"
        + (priced && x.r.unitPrice
          ? '<td class="right ev-value num">' + fmtInt(x.q * x.r.unitPrice) + "</td>"
          : '<td class="right ev-value muted">—</td>') + "</tr>";
    }).join("");
    var head = "<thead><tr><th>" + t("c_desc") + "</th><th>" + t("c_lot") + "</th><th>" + t("c_expdate") + "</th><th>" + t("ev_tte") + '</th><th class="right">' + t("ev_total_qty") + "</th><th>" + t("c_planner") + '</th><th class="right">' + t("c_value") + "</th></tr></thead>";
    return summary + filters + '<div class="tablecard"><div class="tablewrap"><table class="t-exp">' + head + "<tbody>" + body + "</tbody></table></div></div>";
  }

  /* Item drill-down: full monthly bar history (seasonality), stats, prices
     and the MODHS classification, opened from any table or order-sheet row. */
  function renderDetail(code) {
    var r = null;
    STATE.rows.forEach(function (x) { if (x.code === code) r = x; });
    // Catalog-only item (found via catalog-wide search): synthesize a
    // zero-quantity row so names, classification, drug info and SFDA links
    // still render.
    if (!r) r = catalogRow(code);
    if (!r) return "";
    var ser = monthlySeriesFor(code);
    var partial = false;
    if (ser && STATE.meta.period_end) {
      var endIso = STATE.meta.period_end, endD = parseIsoLocal(endIso);
      if (endD) {
        var lastDay = new Date(endD.getFullYear(), endD.getMonth() + 1, 0).getDate();
        partial = ser.yms[ser.yms.length - 1] === ymOf(endIso) && endD.getDate() < lastDay;
      }
    }
    var chips = codeChip(r.code) + (r.hosp ? codeChip(r.hosp) : "") + (r.msd ? codeChip(r.msd) : "") + (r.catalogOnly ? '<span class="pill no_movement">' + t("cat_badge") + "</span>" : statusCell(r));
    var clsRow = (r.cls || r.prio || r.agent)
      ? '<div class="dt-codes">' + (r.cls ? '<span class="callout lo">' + esc(r.cls) + '<i>' + t("dt_class") + '</i></span>' : "") + (r.prio ? '<span class="callout ' + (/LIFE/i.test(r.prio) ? "hi" : "lo") + '">' + esc(r.prio) + '<i>' + t("dt_priority") + '</i></span>' : "") + (r.agent ? '<span class="callout lo">' + esc(r.agent) + '<i>' + t("dt_agent") + '</i></span>' : "") + '</div>'
      : "";
    // Raw-vs-effective transparency: when expiry/grace trimmed the usable
    // stock, the card shows the usable figure and the raw coverage so the
    // planner can audit how the decision number was produced.
    var trimmed = r.covRaw != null && r.cov != null && r.covRaw - r.cov >= 0.05;
    var stats = '<div class="statgrid">'
      + '<span class="stat"><b class="num">' + fmt1(r.avg) + '</b><i>' + t("dt_avg") + '</i></span>'
      + '<span class="stat"><b>' + trendCell(r) + '</b><i>' + t("dt_vs_prev") + '</i></span>'
      + '<span class="stat"><b class="num">' + fmtInt(r.stock) + '</b><i>' + t("dt_stock") + '</i></span>'
      + '<span class="stat"><b class="num">' + (r.inStock ? (r.cov == null ? "∞" : fmt1(r.cov)) : "0.0") + '</b><i>' + t("dt_cov") + '</i></span>'
      + (trimmed
        ? '<span class="stat"><b class="num">' + fmtInt(r.usable) + '</b><i>' + t("dt_usable") + '</i></span>'
          + '<span class="stat"><b class="num muted">' + fmt1(r.covRaw) + '</b><i>' + t("dt_cov_raw") + '</i></span>'
        : "")
      + '<span class="stat"><b class="num" style="color:var(--blue)">' + fmtInt(r.sug) + (r.seasonal ? ' <i class="seasonal-tag">' + t("ss_tag") + "</i>" : "") + '</b><i>' + t("dt_sug") + '</i></span>'
      + '<span class="stat"><b class="num">' + fmtInt(r.total) + '</b><i>' + t("dt_total_hist") + '</i></span>'
      + '</div>';
    // FEATURE 1/2 — projection block: stockout, reorder-by, daily burn, planner.
    var projStats = "";
    if (r.avg > 0) {
      var pl = plannerFor(r), on = orderNowFlag(r);
      projStats = '<div class="statgrid proj-stats">'
        + '<span class="stat"><b class="num' + (on ? " danger" : "") + '">' + prettyDate(r.stockoutIso) + '</b><i>' + t("dt_stockout") + (on ? " · " + t("order_now_flag") : "") + "</i></span>"
        + '<span class="stat"><b class="num">' + prettyDate(r.reorderIso) + '</b><i>' + t("dt_reorder") + "</i></span>"
        + '<span class="stat"><b class="num">' + fmt1(r.avg / DAYS_PER_MONTH) + '</b><i>' + t("dt_burn") + "</i></span>"
        + '<span class="stat"><b>' + (pl ? esc(pl.name) : '<span class="muted">' + t("planner_unassigned") + "</span>") + '</b><i>' + t("c_planner") + "</i></span>"
        + "</div>";
    }
    /* The price slot is always present in the card: real figures when a
       prices file is loaded, an explicit "add prices to activate" hint
       otherwise — so planners know where the rial numbers will appear. */
    // Free-goods split (owner spec v3): with an awarded/free ratio, the
    // suggested order divides into a PAID share and a FREE share whose sum
    // still covers the need (need 1,000 at 50% free → 500 paid + 500 free).
    // Quantities, not prices — it renders even before a price file arrives.
    var freeSplit = "";
    if (r.awardQty && r.freeQty != null && r.freeQty > 0 && r.sug > 0) {
      var freePct = r.freeQty / (r.awardQty + r.freeQty);
      var freeShare = Math.round(r.sug * freePct);
      var paidShare = Math.round(r.sug) - freeShare;
      freeSplit = '<span class="pb-item"><b class="num">' + fmtInt(paidShare) + '</b><i>' + t("pr_paid_share") + '</i></span>'
        + '<span class="pb-item"><b class="num" style="color:var(--blue)">' + fmtInt(freeShare) + '</b><i>' + tFmt("pr_free_share", { p: Math.round(freePct * 100) }) + '</i></span>';
    }
    var priceBlock;
    if (r.unitPrice) {
      priceBlock = '<div class="priceblock">'
        + (r.packPrice ? '<span class="pb-item"><b class="num">' + fmt2(r.packPrice) + '</b><i>' + t("pr_pack_price") + '</i></span>' : "")
        + (r.unitsPerPack ? '<span class="pb-item"><b class="num">' + fmtInt(r.unitsPerPack) + '</b><i>' + t("pr_units_per_pack") + '</i></span>' : "")
        + '<span class="pb-item"><b class="num">' + fmt2(r.unitPrice) + '</b><i>' + t("pr_unit_price") + '</i></span>'
        + (r.effUnitPrice ? '<span class="pb-item"><b class="num" style="color:var(--blue)">' + fmt2(r.effUnitPrice) + '</b><i>' + t("pr_eff_price") + '</i></span>' : "")
        + (r.stockValue != null ? '<span class="pb-item"><b class="num">' + fmtM(r.stockValue) + '</b><i>' + t("pr_stock_value") + '</i></span>' : "")
        + freeSplit
        + '</div>';
    } else if (freeSplit) {
      priceBlock = '<div class="priceblock">' + freeSplit
        + '<span class="pb-hint">' + t("pr_hint") + '</span></div>';
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
    if (r.seasonal) note += '<p class="dt-note">' + esc(tFmt("ss_basis", { n: fmtInt(r.seasonal) })) + '</p>';
    // Batches & expiry: every stock batch with its expiry date and months
    // from the stock-as-of date; when coverage outlives expiry the effective
    // figures (usable coverage + units at risk) are called out.
    var expBlock = "";
    if (r.batches && r.batches.length) {
      var asOfD = parseIsoLocal(STATE.meta.stock_as_of) || new Date();
      var brows = r.batches.slice(0, 6).map(function (b) {
        var bd = parseIsoLocal(b.e);
        var mo = bd ? (bd - asOfD) / 86400000 / DAYS_PER_MONTH : null;
        var expired = mo != null && mo < 0;
        return '<div class="batch-row' + (expired ? " is-expired" : "") + '">'
          + '<b class="num">' + prettyDate(b.e) + '</b>'
          + '<span class="num">' + fmtInt(b.q) + " " + t("units_word") + '</span>'
          + '<i class="num">' + (expired ? t("exp_expired") : mo == null ? "—" : fmt1(mo) + " " + t("mo")) + '</i>'
          + (b.b ? '<u class="num">' + esc(b.b) + '</u>' : "")
          + '</div>';
      }).join("");
      var bMore = r.batches.length > 6 ? '<p class="dt-note">+' + fmtInt(r.batches.length - 6) + '</p>' : "";
      var effLine = expiryRisk(r)
        ? '<div class="statgrid exp-stats">'
          + '<span class="stat"><b class="num" style="color:var(--coral)">' + fmt1(r.expCov) + '</b><i>' + t("dt_exp_eff") + '</i></span>'
          + '<span class="stat"><b class="num">' + fmtInt(r.expWaste) + '</b><i>' + t("dt_exp_risk") + '</i></span></div>'
        : "";
      expBlock = '<div class="exp-block"><div class="di-title">' + t("dt_batches") + (r.expApprox ? ' <i class="muted" title="' + esc(t("exp_approx_tip")) + '">≈</i>' : "") + '</div>' + brows + bMore + effLine + '</div>';
    }
    // FEATURE 3 — expired batches listed separately (physical Total Qty, in
    // quarantine), with lot numbers and how long ago each expired.
    var expiredBlock = "";
    if (r.expiredBatches && r.expiredBatches.length) {
      var asOfE = parseIsoLocal(STATE.meta.stock_as_of) || new Date();
      var erows = r.expiredBatches.slice(0, 6).map(function (b) {
        var bd = parseIsoLocal(b.e), mo = bd ? (bd - asOfE) / 86400000 / DAYS_PER_MONTH : null;
        return '<div class="batch-row is-expired"><b class="num">' + prettyDate(b.e) + '</b><span class="num">' + fmtInt(b.q) + " " + t("units_word") + '</span><i class="num">' + t("exp_expired") + (mo != null ? " " + fmt1(-mo) + " " + t("mo") : "") + "</i>" + (b.b ? '<u class="num">' + esc(b.b) + "</u>" : "") + "</div>";
      }).join("");
      var eMore = r.expiredBatches.length > 6 ? '<p class="dt-note">+' + fmtInt(r.expiredBatches.length - 6) + "</p>" : "";
      expiredBlock = '<div class="expired-block"><div class="di-title">' + t("dt_expired_batches") + ' <b class="num" style="color:var(--coral)">' + fmtInt(r.expiredQty) + "</b></div>" + erows + eMore + "</div>";
    }
    var catNote = r.catalogOnly ? '<p class="dt-note">' + esc(t("cat_note")) + '</p>' : "";
    // Ready-to-send Arabic emails: expedite an open order, and/or request
    // replacement of expired/at-risk batches. Rendered as mailto links so the
    // OS mail client opens with the body pre-filled.
    var emailRow = "";
    var mooe = openOrderFor(r.code);
    var hasExpiry = (r.expiredBatches && r.expiredBatches.length) || (r.atRiskBatches && r.atRiskBatches.length);
    if (mooe || hasExpiry) {
      emailRow = '<div class="email-row">'
        + (mooe ? '<a class="btn-soft accent" id="mailUrgency" href="' + esc(mailtoUrgency(r, mooe)) + '">' + ICON.mail + " " + t("em_urgency") + "</a>" : "")
        + (hasExpiry ? '<a class="btn-soft" id="mailReplace" href="' + esc(mailtoReplacement(r)) + '">' + ICON.mail + " " + t("em_replace") + "</a>" : "")
        + "</div>";
    }
    // Procurement ledger: every order on this item (newest first) with its
    // number, date, qty, status and supplier; open orders are highlighted so
    // the planner sees at a glance that a tight item is already being procured.
    var ledgerBlock = "";
    var ledList = ordersForCode(r.code);
    if (ledList && ledList.length) {
      var ledRows = ledList.slice(0, 6).map(function (o) {
        var autoDel = isOrderDelivered(o.status), manDel = orderManuallyDelivered(o), del = autoDel || manDel;
        var open = orderIsOpen(o);
        var badge = del ? ' <span class="pill ok ledger-delivered">' + t("po_delivered") + "</span>" : "";
        // The file may already say delivered; otherwise the planner can mark it
        // by hand (and undo). Auto-delivered rows need no manual control.
        var btn = autoDel ? "" : '<button type="button" class="led-deliver' + (manDel ? " is-on" : "") + '" data-ono="' + esc(o.orderNo) + '" data-code="' + esc(o.code) + '">' + (manDel ? t("po_undeliver") : t("po_mark_delivered")) + "</button>";
        return '<div class="ledger-row' + (open ? " is-open" : "") + (del ? " is-delivered" : "") + '">'
          + '<b class="num" data-copy="' + esc(o.orderNo) + '" role="button" tabindex="0" title="' + esc(t("cp_copied")) + '">' + esc(o.orderNo) + "</b>"
          + '<span class="num">' + prettyDate(o.date) + "</span>"
          + '<span class="num">' + fmtInt(o.qty) + " " + t("units_word") + "</span>"
          + '<i>' + esc(o.status || "—") + badge + "</i>"
          + (o.supplier ? '<u>' + esc(o.supplier) + "</u>" : "")
          + btn
          + "</div>";
      }).join("");
      ledgerBlock = '<div class="ledger-block"><div class="di-title">' + t("po_orders_title")
        + (openOrderFor(r.code) ? ' <span class="pill onorder">' + t("po_open_badge") + "</span>" : "") + "</div>" + ledRows + "</div>";
    }
    // Previous-orders ledger: last order + in-transit signal.
    var poBlock = "";
    var poList = PO && PO.byCode[r.code];
    if (poList && poList.length) {
      var lastPo = poList[0];
      poBlock = '<div class="dt-codes po-block"><span class="callout lo">' + t("po_last") + ": " + prettyDate(lastPo.d) + ' · <b class="num">' + fmtInt(lastPo.q) + "</b> " + t("units_word") + (lastPo.s ? " · " + esc(lastPo.s) : "") + "</span>"
        + (poInTransit(lastPo) ? '<span class="callout hi po-transit">' + t("po_intransit") + "</span>" : "") + "</div>";
    }
    // Order tracking: mark as ordered (excludes the item from re-suggestion)
    // or show the active flag with a clear action.
    var oo = onOrderInfo(r.code), ooBlock = "";
    if (oo) {
      ooBlock = '<div class="oo-block"><span class="pill onorder">' + t("oo_badge") + '</span><span class="oo-since">' + esc(tFmt("oo_since", { d: prettyDate(oo.d), q: fmtInt(oo.q) })) + '</span><button type="button" class="btn-soft" id="ooClear">' + t("oo_clear") + "</button></div>";
    } else if (r.moved && r.sug > 0 && !r.catalogOnly) {
      ooBlock = '<div class="oo-block"><input id="ooQty" type="number" min="1" step="1" class="num" value="' + Math.round(r.sug) + '" aria-label="' + esc(t("oo_qty_ph")) + '"/><button type="button" class="btn-soft accent" id="ooMark">' + t("oo_mark") + "</button></div>";
    }
    // Drug information + SFDA / web-search links (client-side only).
    var info = drugInfoFor(r);
    var indication = info ? esc(LANG === "ar" ? info[1] : info[0]) : (r.cls ? esc(r.cls) : null);
    var diQ = encodeURIComponent(r.trade || r.sci || r.desc || r.code);
    var diBlock = '<div class="di-block"><div class="di-title">' + t("di_title") + '</div>'
      + '<p class="di-text">' + (indication || t("di_none")) + '</p>'
      + '<div class="di-links">'
      + '<a class="btn-soft" id="diSfda" href="https://www.sfda.gov.sa/en/drugs-list?search=' + diQ + '" target="_blank" rel="noopener">' + t("di_sfda") + '</a>'
      + '<a class="btn-soft" id="diWeb" href="https://www.google.com/search?q=' + diQ + '%20medication" target="_blank" rel="noopener">' + t("di_web") + '</a>'
      + '</div><p class="dt-note">' + t("di_note") + '</p></div>';
    // Per-item alert threshold override (the 6-month rule, customized).
    var thNow = thresholdFor(r.code);
    var thBlock = r.catalogOnly ? "" : '<div class="th-block"><div class="di-title">' + t("th_title") + '</div>'
      + '<div class="oo-block"><input id="thInput" type="number" min="0.5" max="24" step="0.5" class="num" placeholder="' + esc(t("th_ph")) + '" value="' + (thNow != null ? thNow : "") + '"/>'
      + '<button type="button" class="btn-soft" id="thSave">' + t("th_save") + "</button>"
      + (thNow != null ? '<button type="button" class="btn-soft" id="thClear">' + t("th_clear") + "</button>" : "")
      + '</div><p class="dt-note">' + t("th_hint") + "</p></div>";
    return '<div class="dt-head"><span class="tile tile-lav tile-lg">' + ICON.pulse + '</span>'
      + '<span class="ktxt"><div class="dt-title">' + esc(r.desc) + (r.trade ? ' <i class="tradename">' + esc(r.trade) + (r.sci && r.sci !== r.desc ? " · " + esc(r.sci) : "") + '</i>' : (r.sci && r.sci !== r.desc ? ' <i class="tradename">' + esc(r.sci) + '</i>' : '')) + '</div>'
      + '<div class="dt-codes">' + chips + '</div>' + clsRow + '</span>'
      + '<button type="button" class="pin-btn dt-pin' + (isPinned(r.code) ? " is-on" : "") + '" id="dtPin" aria-pressed="' + (isPinned(r.code) ? "true" : "false") + '" title="' + esc(t(isPinned(r.code) ? "pin_remove" : "pin_add")) + '">' + (isPinned(r.code) ? "★" : "☆") + '</button>'
      + '<button type="button" class="dt-close" id="dtClose">✕</button></div>'
      + catNote + stats + projStats + emailRow + ooBlock + ledgerBlock + poBlock + expBlock + expiredBlock + priceBlock + chart + callouts + note + diBlock + thBlock;
  }
  function openDetail(code) {
    if (!STATE.rows.length) return;
    STATE.detail = code;
    openModal(renderDetail(code), "modal-sheet");
    var x = $("dtClose");
    if (x) x.onclick = closeModal;
    var dp = $("dtPin");
    if (dp) dp.onclick = function () {
      togglePin(code);
      render();
      openDetail(code);
    };
    wireCopyChips($("modalCard"));
    var mk = $("ooMark");
    if (mk) mk.onclick = function () {
      var q = Math.max(1, Math.round(num($("ooQty").value)));
      markOrdered(code, q);
      render();
      openDetail(code);
    };
    var oc = $("ooClear");
    if (oc) oc.onclick = function () { clearOrdered(code); render(); openDetail(code); };
    // Manual "mark delivered" toggle on each ledger row (wave 6 E2).
    $("modalCard").querySelectorAll(".led-deliver").forEach(function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        setOrderDelivered(this.getAttribute("data-ono"), this.getAttribute("data-code"), !this.classList.contains("is-on"));
        render();
        openDetail(code);
      };
    });
    var ts = $("thSave");
    if (ts) ts.onclick = function () {
      var v = parseFloat($("thInput").value);
      if (!isFinite(v) || v < 0.5 || v > 24) return;
      THRESH = THRESH || { byCode: {} };
      THRESH.byCode[code] = v;
      persist(TH_KEY, THRESH);
      refreshStatuses(); render(); openDetail(code);
    };
    var tc = $("thClear");
    if (tc) tc.onclick = function () {
      if (THRESH) { delete THRESH.byCode[code]; persist(TH_KEY, THRESH); }
      refreshStatuses(); render(); openDetail(code);
    };
  }
  function fmt2(n) { return (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render() {
    document.querySelectorAll(".tab").forEach(function (tb) {
      var active = tb.dataset.view === STATE.view;
      tb.classList.toggle("is-active", active);
      tb.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (!STATE.rows.length) return;
    if (STATE.view === "expiry") { $("content").innerHTML = renderExpiry(); wireDynamic(); return; }
    var base = viewBase(), c = filterCounts(base);
    $("content").innerHTML = STATE.view === "planning" ? renderPlanning(base, c) : STATE.view === "averages" ? renderAverages(base, c) : renderManagement(base, c);
    wireDynamic();
  }
  function wireCopyChips(root) {
    (root || document).querySelectorAll("[data-copy]").forEach(function (el) {
      // Keyboard-actionable: copy chips and code cells become focusable buttons
      // so a planner can Tab to a code and press Enter/Space to copy it.
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.onclick = function (ev) { ev.stopPropagation(); copyText(this.getAttribute("data-copy")); };
      el.onkeydown = function (ev) {
        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
          ev.preventDefault(); ev.stopPropagation();
          copyText(this.getAttribute("data-copy"));
        }
      };
    });
  }
  /* Handlers that live INSIDE the table card (sort headers, row drill-down,
     copy chips). Re-bound by both the full render and renderTableOnly() so a
     table-only refresh keeps the table interactive without rebuilding the rest
     of the view. Scoped to a root element so renderTableOnly can pass just the
     freshly replaced .tablecard. */
  function wireTable(root) {
    root = root || document;
    root.querySelectorAll("th.sortable").forEach(function (h) { h.onclick = function () { var k = this.dataset.sort; if (STATE.sort.key === k) STATE.sort.dir = STATE.sort.dir === "asc" ? "desc" : "asc"; else STATE.sort = { key: k, dir: (k === "desc" || k === "code") ? "asc" : "desc" }; renderTableOnly(); }; });
    // Watchlist stars: toggle without copying the code or opening the sheet.
    // Full render keeps the chip count in sync with the new pin state.
    root.querySelectorAll("[data-pin]").forEach(function (el) {
      el.onclick = function (ev) {
        ev.stopPropagation();
        togglePin(this.getAttribute("data-pin"));
        render();
      };
    });
    wireCopyChips(root);
    // "How is this computed?" affordances: KPI cards and header ⓘ icons.
    root.querySelectorAll("[data-explain]").forEach(function (el) {
      el.onclick = function (ev) { ev.stopPropagation(); openExplainer(this.getAttribute("data-explain")); };
      el.onkeydown = function (ev) {
        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
          ev.preventDefault(); ev.stopPropagation();
          openExplainer(this.getAttribute("data-explain"));
        }
      };
    });
    root.querySelectorAll("[data-code]").forEach(function (el) {
      el.onclick = function (ev) {
        // A click on a copy target inside the row is handled above.
        if (ev.target.closest && ev.target.closest("[data-copy]")) return;
        openDetail(this.getAttribute("data-code"));
      };
    });
  }
  var _searchT = null;
  function wireDynamic() {
    var si = $("searchInput");
    if (si) si.oninput = function () {
      // Debounce: a fast typist should not trigger a re-render per keystroke.
      // After the pause we re-render ONLY the table card, leaving the search
      // input element itself untouched so the caret stays put with no hack.
      var v = this.value.trim();
      clearTimeout(_searchT);
      _searchT = setTimeout(function () { STATE.search = v; renderTableOnly(); }, 150);
    };
    document.querySelectorAll(".fchip[data-filter]").forEach(function (b) { b.onclick = function () { STATE.filter = this.dataset.filter; render(); }; });
    document.querySelectorAll(".fchip[data-efilter]").forEach(function (b) { b.onclick = function () { STATE.expiryFilter = this.dataset.efilter; render(); }; });
    document.querySelectorAll(".fchip[data-esort]").forEach(function (b) { b.onclick = function () { STATE.expirySort = this.dataset.esort; render(); }; });
    wireTable($("content"));
    var va = $("osViewAll"); if (va) va.onclick = function () { STATE.filter = "order_now"; render(); var tb = document.querySelector(".toolbar"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); };
    var oe = $("osExport"); if (oe) oe.onclick = exportOrderSheet;
    var om = $("osEmail"); if (om) om.onclick = emailReport;
    var ow = $("osWa"); if (ow) ow.onclick = waReport;
    var op = $("osPrint"); if (op) op.onclick = printOrderSheet;
    var ca = $("copyAllCodes"); if (ca) ca.onclick = copyAllCodes;
    var ev = $("exportView"); if (ev) ev.onclick = exportCurrentView;
    // Wave 6 F: clickable workload months + year-end export.
    var bey = $("bwExportYear"); if (bey) bey.onclick = exportYearEndOrders;
    document.querySelectorAll(".bw-row[data-ym]").forEach(function (tr) {
      tr.onclick = function () { openMonthDetail(this.getAttribute("data-ym")); };
      tr.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMonthDetail(this.getAttribute("data-ym")); } };
    });
    var sh = $("sharekHintBtn");
    if (sh) sh.onclick = function () {
      setUploadCollapsed(false);
      try { localStorage.setItem(UPL_KEY, "0"); } catch (e) {}
      var bar = $("uploadbar"); if (bar) bar.scrollIntoView({ behavior: "smooth", block: "start" });
      var slot = $("lblShk"); if (slot) slot.classList.add("is-hilite");
      setTimeout(function () { if (slot) slot.classList.remove("is-hilite"); }, 2400);
    };
    var he = $("histExport"); if (he) he.onclick = exportHistory;
    var hi = $("histImport"); if (hi) hi.onclick = importHistory;
    var dg = $("dgDismiss"); if (dg) dg.onclick = function () { STATE.digest = null; render(); };
    var qe = $("qcExport"); if (qe) qe.onclick = exportQuality;
    var qd = $("qcDismiss"); if (qd) qd.onclick = function () { STATE.qualityDismissed = true; render(); };
    var bs = $("brSave");
    if (bs) {
      var saveBudget = function () {
        var v = parseFloat($("brInput").value);
        if (!isFinite(v) || v < 0) return;
        BUDGET = { amount: v, savedAt: new Date().toISOString() };
        persist(BUDGET_KEY, BUDGET);
        render();
      };
      bs.onclick = saveBudget;
      var bi = $("brInput");
      if (bi) bi.onkeydown = function (ev) { if (ev.key === "Enter") saveBudget(); };
    }
  }
  /* Re-render ONLY the table card in place: search/filter/sort change the rows
     shown but never the card counts (filterCounts reads the unsearched base),
     so the cards, secline, filters and search input are left untouched. The new
     .tablecard replaces the old one's outerHTML and its handlers are rewired. */
  function renderTableOnly() {
    var old = document.querySelector("#content .tablecard");
    if (!old) { render(); return; }
    var base = viewBase();
    var tmp = document.createElement("div");
    tmp.innerHTML = buildTableHTML(STATE.view, base);
    var fresh = tmp.firstChild;
    old.parentNode.replaceChild(fresh, old);
    wireTable(fresh);
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
  // Upload-bar collapse (wave 6 A1): toggle the class + sync the +/\u2212 glyph,
  // aria-expanded and the localized title. Visual state only; persistence and
  // the click handler live in init().
  function setUploadCollapsed(collapsed) {
    var bar = $("uploadbar"), toggle = $("uplToggle"), ic = $("uplToggleIc");
    if (!bar || !toggle) return;
    bar.classList.toggle("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute("title", t(collapsed ? "upl_toggle_open" : "upl_toggle_close"));
    if (ic) ic.textContent = collapsed ? "+" : "\u2212"; // \u2212 minus
  }
  function applyStatic() {
    document.title = "PSMMC \u2014 " + t("app_title");
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
    var pn = $("poName");
    if (pn) pn.textContent = PO ? ((PO.name ? PO.name + " · " : "") + fmtInt(Object.keys(PO.byCode).length) + " " + t("items_word")) : t("file_po_hint");
    var pln = $("plName");
    if (pln) pln.textContent = PLANNERS ? ((PLANNERS.name ? PLANNERS.name + " · " : "") + fmtInt(PLANNERS.count) + " " + t("mp_linked")) : t("file_pl_hint");
    var skn = $("shkName");
    if (skn) skn.textContent = SHAREK ? ((SHAREK.name ? SHAREK.name + " · " : "") + fmtInt(SHAREK.count) + " " + t("mp_linked")) : t("file_shk_hint");
    $("langName").textContent = t("langName");
    $("langBtn").classList.toggle("is-en", LANG === "en");
    // Default collapsed; honor the persisted choice if present.
    var uplCollapsed = true;
    try { if (localStorage.getItem(UPL_KEY) === "0") uplCollapsed = false; } catch (e) {}
    setUploadCollapsed(uplCollapsed);
    if (STATE.meta.period_start) {
      $("metaPeriod").textContent = t("period") + ": " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + (STATE.meta.months_source === "manual" ? " · " + t("manual_mark") : "") + ")" + (STATE.meta.baseline ? " · " + t("baseline_meta") : "");
      $("metaStock").textContent = t("stock_as_of") + ": " + prettyDate(STATE.meta.stock_as_of);
    } else { $("metaPeriod").textContent = "—"; $("metaStock").textContent = "—"; }
    var mc = $("metaCount");
    if (STATE.rows.length) { mc.hidden = false; mc.textContent = fmtInt(STATE.rows.length) + " " + t("meds_word"); }
    else mc.hidden = true;
    // Sample mode carries synthetic trade names; say so until real identifiers load.
    var md = $("metaDemo");
    if (md) { md.textContent = t("demo_names"); md.hidden = STATE.meta.source !== "sample"; }
  }

  // ---------- export ----------
  /* ---------- report workbook (REPORTING section) ----------
     One click on the export FAB builds a single structured workbook: a
     Summary sheet (KPIs + totals) first, then detail sheets (Reorder,
     At-Risk, Expired). Every sheet gets localized headers, column widths, an
     autofilter, and SAR/thousands number formats on the numeric columns; the
     file is values-only so it opens with zero formula errors. Background-color
     conditional formatting / brand fills require a styling-capable writer
     (the vendored community SheetJS cannot emit cell fills) — a deliberate
     dependency decision, deferred. */
  function applyNumFmt(ws, colFmts) {
    if (!ws["!ref"]) return;
    var ref = XLSX.utils.decode_range(ws["!ref"]);
    for (var Rr = ref.s.r + 1; Rr <= ref.e.r; Rr++) {
      Object.keys(colFmts).forEach(function (C) {
        var addr = XLSX.utils.encode_cell({ r: Rr, c: +C });
        if (ws[addr] && typeof ws[addr].v === "number") ws[addr].z = colFmts[C];
      });
    }
  }
  function sheetFrom(aoa, widths, numFmts, autofilter) {
    var ws = XLSX.utils.aoa_to_sheet(sanitizeAoa(aoa));
    if (widths) ws["!cols"] = widths.map(function (w) { return { wch: w }; });
    if (numFmts) applyNumFmt(ws, numFmts);
    if (autofilter && ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };
    return ws;
  }
  var SAR_FMT = "#,##0.00", INT_FMT = "#,##0", DEC1_FMT = "0.0";
  function buildReportWorkbook() {
    var wb = XLSX.utils.book_new();
    var priced = hasPrices();
    var s = decisionStats(STATE.rows);
    var counts = expiryCounts();
    var atRiskUnits = 0, expiredUnits = 0;
    STATE.rows.forEach(function (r) { if (r.atRiskBatches) r.atRiskBatches.forEach(function (b) { atRiskUnits += b.q; }); expiredUnits += r.expiredQty || 0; });
    // --- Summary sheet (KPIs + totals) ---
    var sumAoa = [
      [t("app_sub")],
      [t("rp_generated"), prettyDate(isoDate(new Date()))],
      [t("period"), prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + ")"],
      [t("stock_as_of"), prettyDate(STATE.meta.stock_as_of)],
      [],
      [t("k_instock"), STATE.rows.length],
      [t("k_units"), Math.round(s.totalUnits)],
      [t("k_need_order"), s.orderCount],
      [t("k_critical"), s.critical],
      [t("ev_atrisk") + " · " + t("ev_batches"), counts.atrisk],
      [t("ev_atrisk") + " · " + t("ev_total_qty"), Math.round(atRiskUnits)],
      [t("ev_expired") + " · " + t("ev_batches"), counts.expired],
      [t("ev_expired") + " · " + t("ev_total_qty"), Math.round(expiredUnits)],
      [t("k_monthly_use"), Math.round(s.sumAvg)],
    ];
    if (!priced) sumAoa.push([], [t("pr_hint")]);
    var sumWs = sheetFrom(sumAoa, [34, 30]);
    applyNumFmt(sumWs, { 1: INT_FMT });
    XLSX.utils.book_append_sheet(wb, sumWs, "Summary");
    // --- Reorder sheet (all planning rows, urgency order) ---
    var planRows = STATE.rows.slice().sort(function (a, b) { var ca = a.cov == null ? Infinity : a.cov, cb = b.cov == null ? Infinity : b.cov; return ca - cb; });
    var reHead = [t("c_code"), t("c_desc"), t("c_planner"), t("c_uom"), t("c_avg"), t("c_stock"), t("c_cov"), t("dt_stockout"), t("dt_reorder"), t("c_status"), t("c_sug")];
    if (priced) reHead = reHead.concat([t("pr_unit_price"), t("c_value")]);
    var reAoa = [reHead];
    planRows.forEach(function (r) {
      var row = [r.code, r.desc, plannerName(r) || t("planner_unassigned"), r.uom || "", Math.round(r.avg * 10) / 10, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, r.stockoutIso ? prettyDate(r.stockoutIso) : "", r.reorderIso ? prettyDate(r.reorderIso) : "", (orderNowFlag(r) ? t("order_now_flag") : t("s_" + r.status)), Math.round(r.sug)];
      if (priced) row = row.concat([r.unitPrice == null ? "" : Math.round(r.unitPrice * 100) / 100, r.stockValue == null ? "" : Math.round(r.stockValue)]);
      reAoa.push(row);
    });
    var reFmt = { 4: DEC1_FMT, 5: INT_FMT, 6: DEC1_FMT, 10: INT_FMT };
    if (priced) { reFmt[11] = SAR_FMT; reFmt[12] = SAR_FMT; }
    XLSX.utils.book_append_sheet(wb, sheetFrom(reAoa, [16, 34, 18, 8, 11, 12, 11, 14, 14, 12, 12, 12, 14], reFmt, true), "Reorder");
    // --- At-Risk + Expired batch sheets ---
    function batchSheet(kind) {
      // Richer detail per the owner's spec: alongside each batch, the ITEM's
      // total stock, its effective coverage, and its excess quantity beyond
      // the 9-month target — so one row answers "how much do we hold, how
      // long does it last, how much is simply surplus".
      var head = [t("c_code"), t("c_desc"), t("c_lot"), t("c_expdate"), t("ev_tte"), t("ev_total_qty"), t("rp_total_stock"), t("c_cov"), t("rp_excess"), t("c_planner"), t("c_value")];
      var aoa = [head];
      var asOf = parseIsoLocal(STATE.meta.stock_as_of) || new Date();
      STATE.rows.forEach(function (r) {
        var list = kind === "expired" ? r.expiredBatches : r.atRiskBatches;
        if (!list) return;
        var excess = Math.max(0, Math.round((r.usable || 0) - (r.qty9 || 0)));
        list.forEach(function (b) {
          var d = parseIsoLocal(b.e), mo = d ? Math.round((d - asOf) / 86400000 / DAYS_PER_MONTH * 10) / 10 : "";
          aoa.push([r.code, r.desc, b.b || "", prettyDate(b.e), mo, Math.round(b.q), Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, excess, plannerName(r) || t("planner_unassigned"), r.unitPrice ? Math.round(b.q * r.unitPrice) : ""]);
        });
      });
      return sheetFrom(aoa, [16, 34, 16, 14, 11, 13, 13, 10, 12, 18, 14], { 4: DEC1_FMT, 5: INT_FMT, 6: INT_FMT, 7: DEC1_FMT, 8: INT_FMT, 10: SAR_FMT }, true);
    }
    XLSX.utils.book_append_sheet(wb, batchSheet("atrisk"), "At-Risk");
    XLSX.utils.book_append_sheet(wb, batchSheet("expired"), "Expired");
    return wb;
  }
  function exportExcel() {
    if (!STATE.rows.length) return;
    var wb = buildReportWorkbook();
    var name = "PSMMC_report_" + (STATE.meta.stock_as_of || isoDate(new Date())) + ".xlsx";
    XLSX.writeFile(wb, name);
    toast((LANG === "ar" ? "تم تصدير التقرير → " : "Exported report → ") + name);
  }
  /* Order-sheet export: every order candidate (order_now + moving items that
     are not in stock), urgency-sorted, with prices when available. */
  function exportOrderSheet() {
    if (!STATE.rows.length) return;
    var cand = orderCandidates(STATE.rows);
    var priceCols = hasPrices() ? [t("pr_unit_price")] : [];
    var anyExp = cand.some(function (x) { return x.r.expMonths != null; });
    var expCols = anyExp ? [t("c_expiry"), t("dt_exp_risk")] : [];
    var aoa = [[t("c_code"), t("c_desc"), t("c_trade"), t("c_uom"), t("c_avg"), t("c_stock"), t("c_cov"), t("c_sug")].concat(expCols, priceCols)];
    cand.forEach(function (x) {
      var r = x.r;
      var expVals = anyExp ? [r.expMonths == null ? "" : Math.round(r.expMonths * 10) / 10, r.expWaste >= 1 ? Math.round(r.expWaste) : ""] : [];
      aoa.push([r.code, r.desc, r.trade || "", r.uom, Math.round(r.avg * 10) / 10, Math.round(r.stock), Math.round((x.covEff === Infinity ? 0 : x.covEff) * 10) / 10, Math.round(r.sug)].concat(expVals, hasPrices() ? [r.unitPrice == null ? "" : Math.round(r.unitPrice * 100) / 100] : []));
    });
    var ws = XLSX.utils.aoa_to_sheet(sanitizeAoa(aoa)), wb = XLSX.utils.book_new();
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
  /* ---------- ready-to-send Arabic procurement emails (owner spec v3) ----------
     The hospital corresponds with NUPCO and the local agents in Arabic, so
     these bodies are always Arabic regardless of the UI language. Each builds
     a mailto: URL (no recipient — the planner addresses it) with the exact
     item identifiers a supplier needs to act. */
  function mailtoHref(subject, lines) {
    var body = lines.filter(function (x) { return x != null; }).join("\n");
    return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }
  /* Expedite an OPEN purchase order on a fast-running item. */
  function mailtoUrgency(r, oo) {
    var subject = "استعجال أمر شراء — " + r.desc + " (نبكو " + r.code + ")";
    return mailtoHref(subject, [
      "السلام عليكم ورحمة الله وبركاته،",
      "",
      "نأمل التكرّم باستعجال توريد أمر الشراء التالي نظرًا لقرب نفاد المخزون لدينا:",
      "",
      "الدواء: " + r.desc,
      "كود نبكو: " + r.code,
      r.hosp ? "رقم البند بالمستشفى: " + r.hosp : null,
      oo.poNumber ? "رقم أمر الشراء: " + oo.poNumber : null,
      "رقم الطلب: " + oo.orderNo,
      "الكمية المطلوبة: " + fmtInt(oo.qty),
      oo.supplier ? "المورّد: " + oo.supplier : null,
      (r.cov != null ? "المخزون الحالي يغطّي قرابة " + fmt1(r.cov) + " شهرًا فقط." : null),
      "",
      "ولكم جزيل الشكر،"
    ]);
  }
  /* Request replacement of expired / soon-to-expire batches from the agent. */
  function mailtoReplacement(r) {
    var subject = "طلب استبدال كميات — " + r.desc + " (نبكو " + r.code + ")";
    var lines = [
      "السلام عليكم ورحمة الله وبركاته،",
      "",
      "نأمل التكرّم بالنظر في استبدال الكميات التالية من (" + r.desc + ") لكونها منتهية الصلاحية أو قاربت على الانتهاء قبل إمكانية صرفها:",
      "",
      "كود نبكو: " + r.code,
      r.hosp ? "رقم البند بالمستشفى: " + r.hosp : null,
      r.agent ? "الوكيل: " + r.agent : null,
      "",
      "الدفعات:"
    ];
    var total = 0;
    (r.expiredBatches || []).forEach(function (b) { total += b.q; lines.push("- منتهية · تشغيلة " + (b.b || "—") + " · الكمية " + fmtInt(b.q) + " · انتهت " + prettyDate(b.e)); });
    (r.atRiskBatches || []).forEach(function (b) { total += b.q; lines.push("- قاربت · تشغيلة " + (b.b || "—") + " · الكمية " + fmtInt(b.q) + " · تنتهي " + prettyDate(b.e)); });
    lines.push("", "إجمالي الكمية: " + fmtInt(total), "", "ولكم جزيل الشكر،");
    return mailtoHref(subject, lines);
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
    var anyExp = cand.some(function (x) { return x.r.expMonths != null; });
    var rowsHtml = cand.map(function (x, i) {
      var r = x.r;
      var expTd = anyExp ? "<td class=\"num" + (expiryRisk(r) ? " exp-risk" : "") + "\">" + (r.expMonths == null ? "—" : (expiryRisk(r) ? "⚠ " : "") + (r.expApprox ? "≈" : "") + fmt1(r.expMonths)) + "</td>" : "";
      return "<tr><td>" + (i + 1) + "</td><td class=\"num\">" + esc(r.code) + "</td><td>" + esc(r.desc) + (r.trade ? " — " + esc(r.trade) : "") + "</td><td>" + esc(r.uom || "") + "</td><td class=\"num\">" + fmt1(r.avg) + "</td><td class=\"num\">" + fmtInt(r.stock) + "</td><td class=\"num\">" + fmt1(x.covEff === Infinity ? 0 : x.covEff) + "</td>" + expTd + "<td class=\"num\"><b>" + fmtInt(r.sug) + "</b></td>" + (hasPrices() ? "<td class=\"num\">" + (r.unitPrice == null ? "—" : fmt2(r.unitPrice)) + "</td>" : "") + "</tr>";
    }).join("");
    div.innerHTML = "<h1>" + t("app_sub") + "</h1><h2>" + t("prn_title") + " — " + t("em_order") + " " + fmtInt(s.orderCount + s.notStockCount) + "</h2>"
      + "<p>" + t("prn_date") + ": " + prettyDate(isoDate(new Date())) + " · " + t("prn_period") + ": " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " " + t("mo") + ")</p>"
      + "<table><thead><tr><th>#</th><th>" + t("c_code") + "</th><th>" + t("c_desc") + "</th><th>" + t("c_uom") + "</th><th>" + t("c_avg") + "</th><th>" + t("c_stock") + "</th><th>" + t("c_cov") + "</th>" + (anyExp ? "<th>" + t("c_expiry") + "</th>" : "") + "<th>" + t("c_sug") + "</th>" + (hasPrices() ? "<th>" + t("pr_unit_price") + "</th>" : "") + "</tr></thead><tbody>" + rowsHtml + "</tbody></table>"
      + "<p class=\"sign\"><span class=\"sign-col\"><span class=\"sign-line\"></span>" + t("prn_sign_name") + "</span><span class=\"sign-col\"><span class=\"sign-line\"></span>" + t("prn_sign_sig") + "</span><span class=\"sign-col\"><span class=\"sign-line\"></span>" + t("prn_date") + "</span></p>";
    document.body.appendChild(div);
    window.print();
  }
  /* ---------- history export / import ----------
     The accumulated ledger (history + baseline + map) is the only state that
     makes a returning device useful; a lost or replaced device would otherwise
     start from zero. EXPORT writes a single JSON file (no clipboard) the user
     can keep; IMPORT replaces that state via the persist helper and re-runs the
     same init-time hydration so the dashboard behaves as if the data had been
     uploaded here. */
  function exportHistory() {
    var payload = {
      v: 1,
      history: HIST || loadHistory() || { v: 1, items: {}, uploads: [] },
      baseline: loadBaseline(),
      map: MAP || loadMap(),
      exportedAt: new Date().toISOString()
    };
    var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "psmmc_history_" + isoDate(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast(t("hist_export_done"));
  }
  function importHistory() {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.style.display = "none";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) { cleanup(); return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data || data.v !== 1 || !data.history || typeof data.history.items !== "object" || data.history.items === null) {
            throw new Error("bad");
          }
          // Replace persisted state, then re-run the same hydration init() does.
          persist(HIST_KEY, data.history);
          HIST = data.history;
          if (data.baseline && data.baseline.byCode) {
            persist(BASE_KEY, data.baseline);
            STATE.raw.withdrawals = (function () { var b = loadBaseline(); if (b) b.source = "baseline"; return b; })();
            $("lblWd").classList.add("is-baseline");
          }
          if (data.map && data.map.byCode) {
            persist(MAP_KEY, data.map);
            MAP = loadMap();
            $("lblMp").classList.add("is-baseline");
            if (STATE.rows.length) applyMap(STATE.rows);
          }
          applyStatic();
          if (STATE.rows.length) render();
          var items = Object.keys(data.history.items).length;
          toast(tFmt("hist_import_done", { i: fmtInt(items), m: fmtInt(histMonths()) }));
        } catch (ex) {
          toast(t("hist_import_bad"));
        }
        cleanup();
      };
      reader.onerror = function () { toast(t("hist_import_bad")); cleanup(); };
      reader.readAsText(f);
    };
    function cleanup() { if (inp.parentNode) inp.parentNode.removeChild(inp); }
    document.body.appendChild(inp);
    inp.click();
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
    // The toast is a polite live region so screen readers announce save
    // warnings, copy confirmations and import results (the HTML markup is owned
    // by another surface, so this attribute is set from JS).
    var toastEl = $("toast");
    if (toastEl) { toastEl.setAttribute("aria-live", "polite"); toastEl.setAttribute("role", "status"); }
    var saved = loadBaseline();
    if (saved) {
      saved.source = "baseline";
      STATE.raw.withdrawals = saved;
      $("lblWd").classList.add("is-baseline");
    }
    migrateHistory();
    MAP = loadMap();
    if (MAP) $("lblMp").classList.add("is-baseline");
    BUDGET = loadBudget();
    PO = loadPO();
    ORDERS = loadOrders();
    THRESH = loadThresh();
    WATCH = loadWatch();
    PLANNERS = loadPlanners();
    LEDGER = loadLedger();
    SHAREK = loadSharek();
    if (SHAREK && $("lblShk")) $("lblShk").classList.add("is-baseline");
    if (PLANNERS && $("lblPl")) $("lblPl").classList.add("is-baseline");
    if ((PO || LEDGER) && $("lblPo")) $("lblPo").classList.add("is-baseline");
    // PWA: register the cache-first service worker (https only — file:// and
    // the double-clicked standalone build skip it safely).
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      try { navigator.serviceWorker.register("./sw.js"); } catch (e) {}
    }
    applyStatic();
    $("langBtn").onclick = function () { setLang(LANG === "ar" ? "en" : "ar"); };
    // Upload bar collapse (wave 6 A1): default collapsed for a clean first
    // view; (+) opens it to add/replace files, (−) hides it again; persisted.
    var uplToggle = $("uplToggle");
    if (uplToggle) {
      uplToggle.onclick = function () {
        var bar = $("uploadbar");
        setUploadCollapsed(!bar.classList.contains("is-collapsed"));
        try { localStorage.setItem(UPL_KEY, $("uploadbar").classList.contains("is-collapsed") ? "1" : "0"); } catch (e) {}
      };
    }
    document.querySelectorAll(".tab").forEach(function (tb) { tb.onclick = function () { STATE.view = this.dataset.view; STATE.filter = "all"; STATE.search = ""; STATE.expiryFilter = "atrisk"; STATE.expirySort = "exp"; STATE.sort = defaultSort(); render(); }; });
    $("btnSample").onclick = loadSample;
    $("btnExport").onclick = exportExcel;
    $("fileWithdrawals").onchange = function (e) {
      var picked = Array.prototype.slice.call(e.target.files || []);
      e.target.value = "";
      // Selecting the same file twice would silently double every quantity and
      // monthly average; exact duplicates (same name + same size) are read once.
      var seen = {}, dupFiles = 0;
      var files = picked.filter(function (f) { var k = f.name + " " + f.size; if (seen[k]) { dupFiles++; return false; } seen[k] = 1; return true; });
      if (!files.length) return;
      var parts = [], pending = files.length, failed = false;
      files.forEach(function (f) {
        readWorkbook(f, function (err, aoa) {
          if (failed) return;
          // Abort-all on the first bad file, but NAME it so the user knows
          // which of several selected files to fix. A missing required column
          // appends its English header hint after the generic message.
          if (err) { failed = true; toast(t("err_wd") + ": " + f.name); return; }
          try { var p = parseWithdrawals(aoa); p.name = f.name; parts.push(p); }
          catch (ex) { failed = true; toast(t("err_wd") + ": " + f.name + colsHint(ex)); return; }
          if (--pending === 0) {
            var beforeN = parts.length;
            parts = dedupeParts(parts, dupFiles);
            var droppedFiles = dupFiles + (beforeN - parts.length);
            var wd = combineWithdrawals(parts);
            wd.source = "upload";
            if (wd.quality && droppedFiles) wd.quality.warns.push({ k: "qr_dupfile", n: droppedFiles });
            // The chosen month count drives every monthly average, so the
            // user confirms (or overrides) it before anything is computed
            // or persisted.
            showPeriodConfirm(wd, function (months, src) {
              wd.actual_months = months;
              wd.months_source = src;
              STATE.raw.withdrawals = wd;
              STATE.quality = STATE.quality || {};
              STATE.quality.wd = { name: (wd.files || []).join(" + "), q: wd.quality };
              STATE.qualityDismissed = false;
              saveBaseline(wd);
              mergeHistory(wd);
              STATE.wdName = null;
              $("lblWd").classList.remove("is-baseline");
              $("lblWd").classList.add("is-loaded");
              applyStatic();
              tryCompute();
              // Surface rows whose date cell was non-empty but unreadable, so a
              // locale-mangled column is not silently dropped from the period.
              if (wd.badDates > 0) toast(tFmt("bad_dates", { n: fmtInt(wd.badDates) }));
            });
          }
        });
      });
    };
    $("fileStock").onchange = function (e) { var f = e.target.files[0]; e.target.value = ""; if (!f) return; STATE.stName = f.name; $("lblSt").classList.add("is-loaded"); applyStatic(); readWorkbook(f, function (err, aoa, wb) { if (err) { toast(t("err_st")); return; } try { STATE.raw.stock = parseStock(aoa, f.name, wb); STATE.quality = STATE.quality || {}; STATE.quality.st = { name: f.name, q: STATE.raw.stock.quality }; STATE.qualityDismissed = false; tryCompute(); } catch (ex) { toast(t("err_st") + colsHint(ex)); } }); };
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
          Object.keys(byCode).forEach(function (c) { if (byCode[c].packPrice || byCode[c].netUnit) priced++; });
          MAP = { byCode: byCode, count: count, priced: priced, name: f.name, savedAt: new Date().toISOString() };
          STATE.quality = STATE.quality || {};
          STATE.quality.mp = { name: f.name, q: parsed.quality };
          STATE.qualityDismissed = false;
          saveMap(MAP);
          $("lblMp").classList.remove("is-baseline");
          $("lblMp").classList.add("is-loaded");
          var linked = STATE.rows.length ? applyMap(STATE.rows) : parsed.count;
          // Catalog UOM can change the dosage form → re-grade effective stock.
          recomputeEffective();
          applyStatic();
          render();
          // An identifiers file without a recognized trade/scientific-name
          // column still links codes — but name search would silently stay
          // dead, so say it out loud.
          toast(fmtInt(linked) + " " + t("mp_linked") + (parsed.hasTrade ? "" : " · " + t("mp_no_trade")));
        } catch (ex) { toast(t("err_mp") + colsHint(ex)); }
      });
    };
    var fp = $("filePo");
    if (fp) fp.onchange = function (e) {
      var f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      readWorkbook(f, function (err, aoa) {
        if (err) { toast(t("err_po")); return; }
        // The framework-agreement / tender / direct-purchase exports go to the
        // persistent procurement ledger (dedupe by order number, keep history
        // for the budget views); the legacy previous-orders shape still feeds
        // the in-transit badge. Detect by the framework columns.
        if (aoa && aoa.length && isFrameworkOrders(aoa[0])) {
          try {
            var src = /tender|مناقص/i.test(f.name) ? "tender" : /direct|مباشر/i.test(f.name) ? "direct" : "framework";
            var parsedL = parseOrdersLedger(aoa, src);
            var ent = (LEDGER && LEDGER.entries) || {};
            var added = 0;
            Object.keys(parsedL.entries).forEach(function (k) { if (!ent[k]) { ent[k] = parsedL.entries[k]; added++; } });
            LEDGER = { v: 1, entries: ent, name: f.name, savedAt: new Date().toISOString() };
            persist(LEDGER_KEY, LEDGER);
            _ledgerIdxFor = null; // invalidate the by-code cache
            STATE.quality = STATE.quality || {};
            STATE.quality.po = { name: f.name, q: parsedL.quality };
            STATE.qualityDismissed = false;
            $("lblPo").classList.remove("is-baseline");
            $("lblPo").classList.add("is-loaded");
            applyStatic();
            if (STATE.rows.length) render();
            toast(tFmt("ledger_loaded", { a: fmtInt(added), n: fmtInt(parsedL.count) }));
          } catch (ex) { toast(t("err_po") + colsHint(ex)); }
          return;
        }
        try {
          var parsed = parsePO(aoa);
          // Merge into the saved ledger (per code), newest first, capped — so
          // monthly PO exports can be dropped in repeatedly without growth.
          var byCode = (PO && PO.byCode) || {};
          Object.keys(parsed.byCode).forEach(function (c) {
            var merged = (byCode[c] || []).concat(parsed.byCode[c]);
            var seen = {};
            merged = merged.filter(function (x) { var k = x.d + "|" + x.q; if (seen[k]) return false; seen[k] = 1; return true; });
            merged.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
            byCode[c] = merged.slice(0, 5);
          });
          PO = { byCode: byCode, name: f.name, savedAt: new Date().toISOString() };
          STATE.quality = STATE.quality || {};
          STATE.quality.po = { name: f.name, q: parsed.quality };
          STATE.qualityDismissed = false;
          persist(PO_KEY, PO);
          $("lblPo").classList.remove("is-baseline");
          $("lblPo").classList.add("is-loaded");
          applyStatic();
          if (STATE.rows.length) render();
          toast(tFmt("po_loaded", { n: fmtInt(parsed.count) }));
        } catch (ex) { toast(t("err_po") + colsHint(ex)); }
      });
    };
    var fsk = $("fileSharek");
    if (fsk) fsk.onchange = function (e) {
      var f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      readWorkbook(f, function (err, aoa) {
        if (err) { toast(t("err_shk")); return; }
        try {
          var parsed = parseSharek(aoa);
          // Replace (not merge): each Sharek export is the platform's current
          // catalog snapshot — stale availability must drop out.
          SHAREK = { byCode: parsed.byCode, count: parsed.count, name: f.name, savedAt: new Date().toISOString() };
          persist(SHAREK_KEY, SHAREK);
          $("lblShk").classList.remove("is-baseline");
          $("lblShk").classList.add("is-loaded");
          applyStatic();
          if (STATE.rows.length) render();
          toast(tFmt("shk_loaded", { n: fmtInt(parsed.count) }));
        } catch (ex) { toast(t("err_shk") + colsHint(ex)); }
      });
    };
    var fpl = $("filePlanner");
    if (fpl) fpl.onchange = function (e) {
      var f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      readWorkbook(f, function (err, aoa) {
        if (err) { toast(t("err_pl")); return; }
        try {
          var parsed = parsePlannerMap(aoa);
          // Merge into the saved planner map (per code / per family) so a
          // dropped-in file extends rather than replaces.
          var byCode = (PLANNERS && PLANNERS.byCode) || {}, byFamily = (PLANNERS && PLANNERS.byFamily) || {};
          Object.keys(parsed.byCode).forEach(function (c) { byCode[c] = parsed.byCode[c]; });
          Object.keys(parsed.byFamily).forEach(function (fk) { byFamily[fk] = parsed.byFamily[fk]; });
          PLANNERS = { byCode: byCode, byFamily: byFamily, count: Object.keys(byCode).length + Object.keys(byFamily).length, name: f.name, savedAt: new Date().toISOString() };
          persist(PLANNER_KEY, PLANNERS);
          $("lblPl").classList.remove("is-baseline");
          $("lblPl").classList.add("is-loaded");
          applyStatic();
          // The planner sheet's UOM column is the authoritative dosage form:
          // re-grade every row so the 3-month hand-dispense grace follows it,
          // and surface its hospital/MSD codes on the rows.
          recomputeEffective();
          applyPlannerCodes(STATE.rows);
          if (STATE.rows.length) render();
          toast(tFmt("pl_loaded", { n: fmtInt(parsed.count) }));
        } catch (ex) { toast(t("err_pl") + colsHint(ex)); }
      });
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

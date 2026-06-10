/* PSMMC — Pharmacy Stock & Reorder Analytics
   All computation runs client-side. Medicines only = NUPCO code starts with "5". */
(function () {
  "use strict";

  // ---------- constants ----------
  var DAYS_PER_MONTH = 30.44;
  var STATUS_OK = { DISPATCHED: 1, APPROVED: 1 };
  var REORDER_MONTHS = 6;   // safety: order when coverage <= 6 months
  var WATCH_MONTHS = 7;     // amber band 6-7 months
  var ORDER_COVER_MONTHS = 9; // each order covers 9 months
  var SNAP_KEY = "psmmc_snapshots_v1";

  // ---------- state ----------
  var STATE = {
    view: "planning",
    rows: [],
    meta: { period_start: null, period_end: null, actual_months: null, stock_as_of: null, source: null },
    filter: "all",
    search: "",
    sort: { key: "cov", dir: "asc" },
    raw: { withdrawals: null, stock: null } // parsed maps awaiting the other file
  };

  // ---------- helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  function normCode(v) {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return String(Math.round(v));
    var s = String(v).trim();
    if (/^\d+\.0+$/.test(s)) s = s.split(".")[0];
    return s;
  }
  function isDrug(code) { return code && code.charAt(0) === "5"; }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmt1(n) { return (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(t._t); t._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function norm(s) { return String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " "); }
  function findCol(header, candidates) {
    var hn = header.map(norm);
    for (var i = 0; i < candidates.length; i++) {
      var c = norm(candidates[i]);
      var idx = hn.indexOf(c);
      if (idx !== -1) return idx;
    }
    // loose contains match as a fallback
    for (var j = 0; j < candidates.length; j++) {
      var cc = norm(candidates[j]);
      for (var k = 0; k < hn.length; k++) if (hn[k].indexOf(cc) !== -1) return k;
    }
    return -1;
  }
  function parseDate(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === "number" && v > 20000 && v < 80000) { // excel serial
      return new Date(Math.round((v - 25569) * 86400 * 1000));
    }
    if (typeof v === "string") {
      var s = v.trim();
      var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})/);
      if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      var d = new Date(s); if (!isNaN(d)) return d;
    }
    return null;
  }
  function dateFromFilename(name) {
    var m = String(name || "").match(/(\d{2})(\d{2})(\d{4})/); // DDMMYYYY
    if (m) { var d = new Date(+m[3], +m[2] - 1, +m[1]); if (!isNaN(d)) return d; }
    return null;
  }
  function isoDate(d) { return d ? d.toISOString().slice(0, 10) : null; }
  function prettyDate(s) {
    if (!s) return "—";
    var d = s instanceof Date ? s : new Date(s);
    if (isNaN(d)) return String(s);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  // ---------- workbook reading ----------
  function readWorkbook(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
        cb(null, aoa, wb);
      } catch (err) { cb(err); }
    };
    reader.onerror = function () { cb(reader.error); };
    reader.readAsArrayBuffer(file);
  }

  // ---------- parsers ----------
  function parseWithdrawals(aoa) {
    if (!aoa || !aoa.length) throw new Error("Empty withdrawals file");
    var H = aoa[0];
    var ci = findCol(H, ["NUPCO Material", "Generic Item Number", "Material"]);
    var qi = findCol(H, ["Order Qty", "Quantity", "Qty"]);
    var di = findCol(H, ["Delivery Date", "Ordered Date", "Date"]);
    var si = findCol(H, ["Status"]);
    var ui = findCol(H, ["UOM", "Unit"]);
    var de = findCol(H, ["Description", "Item Description", "Generic Item description"]);
    if (ci < 0 || qi < 0) throw new Error("Withdrawals file: could not find code / quantity columns");
    var byCode = {}, minD = null, maxD = null;
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r]; if (!row) continue;
      if (si >= 0) { var st = String(row[si] || "").trim().toUpperCase(); if (!STATUS_OK[st]) continue; }
      var code = normCode(row[ci]); if (!isDrug(code)) continue;
      var q = num(row[qi]);
      var rec = byCode[code] || (byCode[code] = { qty: 0, desc: null, uom: null });
      rec.qty += q;
      if (!rec.desc && de >= 0 && row[de]) rec.desc = String(row[de]).trim();
      if (!rec.uom && ui >= 0 && row[ui]) rec.uom = String(row[ui]).trim();
      if (di >= 0) { var d = parseDate(row[di]); if (d) { if (!minD || d < minD) minD = d; if (!maxD || d > maxD) maxD = d; } }
    }
    var months = (minD && maxD) ? Math.max((maxD - minD) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
    return { byCode: byCode, period_start: isoDate(minD), period_end: isoDate(maxD), actual_months: months };
  }

  function parseStock(aoa, filename, wb) {
    if (!aoa || !aoa.length) throw new Error("Empty stock file");
    var H = aoa[0];
    var ci = findCol(H, ["Generic Item Number", "NUPCO Material", "Material"]);
    var ai = findCol(H, ["Total Available Qty", "Available Qty", "Total Available Quantity"]);
    var de = findCol(H, ["Generic Item description", "Description", "Item Description"]);
    if (ci < 0) throw new Error("Stock file: could not find item code column");
    if (ai < 0) ai = findCol(H, ["Total Qty", "Quantity"]); // fallback
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
  function statusOf(cov, avg, inStock) {
    if (!inStock) return "not_in_stock";
    if (avg === 0) return "no_movement";
    if (cov <= REORDER_MONTHS) return "order_now";
    if (cov <= WATCH_MONTHS) return "warning";
    return "ok";
  }

  function buildRows(wd, st) {
    var months = wd.actual_months || 1;
    var codes = {}, k;
    for (k in wd.byCode) codes[k] = 1;
    for (k in st.byCode) codes[k] = 1;
    var rows = [];
    Object.keys(codes).forEach(function (code) {
      var w = wd.byCode[code], s = st.byCode[code];
      var total = w ? w.qty : 0;
      var avg = w ? total / months : 0;
      var inStock = !!s;
      var stock = inStock ? s.qty : 0;
      var cov = avg > 0 ? stock / avg : null;
      var qty9 = avg * ORDER_COVER_MONTHS;
      var sug = Math.max(0, qty9 - stock);
      var status = statusOf(cov == null ? 0 : cov, avg, inStock);
      rows.push({
        code: code,
        desc: (w && w.desc) || (s && s.desc) || "",
        uom: (w && w.uom) || "",
        total: total, avg: avg, stock: stock, cov: cov,
        qty9: qty9, sug: sug, status: status, inStock: inStock, moved: avg > 0, trend: null
      });
    });
    return rows;
  }

  // ---------- trend (localStorage snapshots) ----------
  function loadSnaps() { try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || []; } catch (e) { return []; } }
  function saveSnaps(s) { try { localStorage.setItem(SNAP_KEY, JSON.stringify(s.slice(-12))); } catch (e) {} }
  function applyTrend(rows, meta) {
    if (meta.source === "sample") return; // do not pollute history with sample
    var snaps = loadSnaps();
    var prev = null;
    for (var i = snaps.length - 1; i >= 0; i--) { if (snaps[i].period_end !== meta.period_end) { prev = snaps[i]; break; } }
    if (prev) {
      rows.forEach(function (r) {
        var pa = prev.avgByCode[r.code];
        if (pa === undefined) { r.trend = { type: "new" }; }
        else if (pa === 0) { r.trend = r.avg > 0 ? { type: "new" } : null; }
        else { r.trend = { type: "delta", pct: (r.avg - pa) / pa, prev: pa }; }
      });
    }
    // persist current snapshot (replace same-period)
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
    var meta = {
      period_start: wd.period_start, period_end: wd.period_end, actual_months: wd.actual_months,
      stock_as_of: st.stock_as_of, source: "upload"
    };
    applyTrend(rows, meta);
    STATE.rows = rows; STATE.meta = meta;
    afterData();
    toast(rows.length + " medicines analysed · period " + fmt1(meta.actual_months) + " months");
  }

  function loadSample() {
    var s = window.PSMMC_SAMPLE;
    if (!s) { toast("Sample data not available"); return; }
    STATE.rows = s.rows.map(function (r) {
      return {
        code: r.code, desc: r.desc, uom: r.uom, total: r.total, avg: r.avg, stock: r.stock,
        cov: r.cov, qty9: r.qty9, sug: r.sug, status: r.status,
        inStock: r.inStock, moved: r.moved, trend: null
      };
    });
    STATE.meta = { period_start: s.period_start, period_end: s.period_end, actual_months: s.actual_months, stock_as_of: "2026-06-02", source: "sample" };
    $("wdName").textContent = "Sample · NUPCO outbound";
    $("stName").textContent = "Sample · NUPCO stock";
    $("lblWd").classList.add("is-loaded"); $("lblSt").classList.add("is-loaded");
    afterData();
    toast("Loaded sample data · " + STATE.rows.length + " medicines");
  }

  function afterData() {
    $("btnExport").disabled = false;
    $("metaPeriod").textContent = "Period: " + prettyDate(STATE.meta.period_start) + " → " + prettyDate(STATE.meta.period_end) + " (" + fmt1(STATE.meta.actual_months) + " mo)";
    $("metaStock").textContent = "Stock as of: " + prettyDate(STATE.meta.stock_as_of);
    STATE.filter = "all"; STATE.search = "";
    STATE.sort = STATE.view === "planning" ? { key: "cov", dir: "asc" } : { key: "stock", dir: "desc" };
    render();
  }

  // ---------- view data ----------
  function viewBase() {
    if (STATE.view === "management") return STATE.rows.filter(function (r) { return r.inStock; });
    return STATE.rows;
  }
  function filterCounts(base) {
    var c = { all: base.length, order_now: 0, no_movement: 0, not_in_stock: 0, warning: 0, instock: 0, outstock: 0 };
    base.forEach(function (r) {
      if (r.status === "order_now") c.order_now++;
      else if (r.status === "no_movement") c.no_movement++;
      else if (r.status === "not_in_stock") c.not_in_stock++;
      else if (r.status === "warning") c.warning++;
      if (r.stock > 0) c.instock++; else c.outstock++;
    });
    return c;
  }
  function applyFilter(base) {
    var f = STATE.filter;
    var rows = base.filter(function (r) {
      if (STATE.view === "planning") {
        if (f === "all") return true;
        return r.status === f;
      } else {
        if (f === "instock") return r.stock > 0;
        if (f === "outstock") return r.stock <= 0;
        return true;
      }
    });
    if (STATE.search) {
      var q = STATE.search.toLowerCase();
      rows = rows.filter(function (r) { return r.code.indexOf(q) !== -1 || r.desc.toLowerCase().indexOf(q) !== -1; });
    }
    var k = STATE.sort.key, dir = STATE.sort.dir === "asc" ? 1 : -1;
    rows.sort(function (a, b) {
      var va = a[k], vb = b[k];
      if (k === "cov") { va = va == null ? Infinity : va; vb = vb == null ? Infinity : vb; }
      if (k === "desc" || k === "code") { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0; }
      return (va - vb) * dir;
    });
    return rows;
  }

  // ---------- rendering ----------
  function kpi(label, value, sub, cls, ico) {
    return '<div class="kpi ' + (cls || "") + '">' +
      '<span class="kpi-ico">' + (ico || "") + '</span>' +
      '<span class="kpi-label">' + label + '</span>' +
      '<span class="kpi-value num">' + value + '</span>' +
      '<span class="kpi-sub">' + (sub || "") + '</span></div>';
  }
  var STATUS_LABEL = { order_now: "Order now", warning: "Watch", ok: "OK", no_movement: "No movement", not_in_stock: "Not in stock" };
  var STATUS_COLOR = { order_now: "var(--red)", warning: "var(--amber)", ok: "var(--green)", no_movement: "var(--muted-2)", not_in_stock: "var(--purple)" };
  function covCell(r) {
    if (r.status === "no_movement") return '<span class="muted">No movement</span>';
    var pct = r.cov == null ? 0 : Math.min(100, (r.cov / 12) * 100);
    var col = STATUS_COLOR[r.status] || "var(--green)";
    return '<span class="num">' + (r.cov == null ? "∞" : fmt1(r.cov)) + '</span>' +
      '<span class="covbar"><i style="width:' + pct.toFixed(0) + '%;background:' + col + '"></i></span>';
  }
  function trendCell(r) {
    if (!r.trend) return '<span class="trend flat">—</span>';
    if (r.trend.type === "new") return '<span class="trend new">New</span>';
    var p = r.trend.pct, cls = p > 0.001 ? "up" : p < -0.001 ? "down" : "flat";
    var arr = p > 0.001 ? "▲" : p < -0.001 ? "▼" : "▬";
    var title = "prev avg " + fmt1(r.trend.prev) + "/mo";
    return '<span class="trend ' + cls + '" title="' + title + '">' + arr + " " + (p >= 0 ? "+" : "") + (p * 100).toFixed(0) + "%</span>";
  }
  function pill(status) { return '<span class="pill ' + status + '">' + STATUS_LABEL[status] + "</span>"; }

  function th(key, label, right) {
    var s = STATE.sort, on = s.key === key;
    var arrow = on ? (s.dir === "asc" ? "▲" : "▼") : "↕";
    return '<th class="sortable' + (on ? " sorted" : "") + (right ? " right" : "") + '" data-sort="' + key + '">' + label + ' <span class="arrow">' + arrow + "</span></th>";
  }

  function renderPlanning(base, c) {
    var kpis = '<div class="kpis">' +
      kpi("Medicines analysed", fmtInt(base.length), "code starts with 5", "", "💊") +
      kpi("Order now", fmtInt(c.order_now), "coverage ≤ " + REORDER_MONTHS + " months", c.order_now ? "alert" : "good", "🔴") +
      kpi("Watch", fmtInt(c.warning), "6–7 months left", "", "🟡") +
      kpi("No movement", fmtInt(c.no_movement), "no withdrawals in period", "idle", "⏸") +
      kpi("Not in stock", fmtInt(c.not_in_stock), "withdrawn but absent", c.not_in_stock ? "alert" : "idle", "⚠") +
      "</div>";

    var filters = '<div class="filters">' +
      fchip("all", "All", c.all) + fchip("order_now", "Order now", c.order_now) +
      fchip("no_movement", "No movement", c.no_movement) + fchip("not_in_stock", "Not in stock", c.not_in_stock) +
      "</div>";

    var rows = applyFilter(base);
    var head = "<thead><tr>" +
      th("code", "Code") + th("desc", "Description") + "<th>UOM</th>" +
      th("total", "Total Withdrawn", true) + th("avg", "Monthly Avg", true) + "<th>Trend Δ%</th>" +
      th("stock", "Current Stock", true) + th("cov", "Coverage (mo)") + "<th>Status</th>" +
      th("qty9", "Qty (9 mo)", true) + th("sug", "Suggested Order", true) +
      "</tr></thead>";
    var body = rows.map(function (r) {
      return "<tr>" +
        '<td class="code">' + r.code + "</td>" +
        '<td class="desc">' + esc(r.desc) + "</td>" +
        "<td>" + esc(r.uom || "—") + "</td>" +
        '<td class="right num">' + fmtInt(r.total) + "</td>" +
        '<td class="right num">' + fmt1(r.avg) + "</td>" +
        "<td>" + trendCell(r) + "</td>" +
        '<td class="right num">' + fmtInt(r.stock) + "</td>" +
        "<td>" + covCell(r) + "</td>" +
        "<td>" + pill(r.status) + "</td>" +
        '<td class="right num">' + fmtInt(r.qty9) + "</td>" +
        '<td class="right num sug">' + fmtInt(r.sug) + "</td>" +
        "</tr>";
    }).join("");
    return kpis + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }

  function renderManagement(base, c) {
    var totalUnits = base.reduce(function (s, r) { return s + r.stock; }, 0);
    var orderNow = base.filter(function (r) { return r.status === "order_now"; }).length;
    var kpis = '<div class="kpis">' +
      kpi("Medicines in stock", fmtInt(base.length), "items in stock file", "", "📦") +
      kpi("Total available units", fmtInt(totalUnits), "sum of available qty", "good", "Σ") +
      kpi("Out of stock", fmtInt(c.outstock), "available qty = 0", c.outstock ? "alert" : "good", "🚫") +
      kpi("Need reorder", fmtInt(orderNow), "coverage ≤ " + REORDER_MONTHS + " mo", orderNow ? "alert" : "good", "🔴") +
      kpi("Stock value (SAR)", "—", "add a price list to enable", "idle", "💰") +
      "</div>";
    var filters = '<div class="filters">' +
      fchip("all", "All in stock", c.instock + c.outstock) + fchip("instock", "Available", c.instock) + fchip("outstock", "Out of stock", c.outstock) +
      "</div>";
    var rows = applyFilter(base);
    var head = "<thead><tr>" +
      th("code", "Code") + th("desc", "Description") + "<th>UOM</th>" +
      th("stock", "Available Stock", true) + th("cov", "Coverage (mo)") + "<th>Status</th>" +
      th("avg", "Monthly Use", true) + "<th class=\"right\">Stock Value</th>" +
      "</tr></thead>";
    var body = rows.map(function (r) {
      return "<tr>" +
        '<td class="code">' + r.code + "</td>" +
        '<td class="desc">' + esc(r.desc) + "</td>" +
        "<td>" + esc(r.uom || "—") + "</td>" +
        '<td class="right num">' + fmtInt(r.stock) + "</td>" +
        "<td>" + covCell(r) + "</td>" +
        "<td>" + pill(r.status) + "</td>" +
        '<td class="right num">' + fmt1(r.avg) + "</td>" +
        '<td class="right muted">—</td>' +
        "</tr>";
    }).join("");
    return kpis + toolbar(filters) + tableCard(head, body, rows.length, base.length);
  }

  function toolbar(filters) {
    return '<div class="toolbar">' +
      '<div class="search">🔍<input id="searchInput" type="search" placeholder="Search by code or drug name…" value="' + esc(STATE.search) + '"/></div>' +
      filters + "</div>";
  }
  function tableCard(head, body, shown, total) {
    return '<div class="tablecard card"><div class="tablewrap"><table>' + head + "<tbody>" + (body || '<tr><td colspan="12" class="muted" style="padding:34px;text-align:center">No rows match this filter.</td></tr>') + "</tbody></table></div>" +
      '<div class="tfoot"><span>Showing <b class="num">' + fmtInt(shown) + "</b> of <b class=\"num\">" + fmtInt(total) + "</b> items</span><span>Sorted by " + STATE.sort.key + " (" + STATE.sort.dir + ")</span></div></div>";
  }
  function fchip(key, label, count) {
    return '<button class="fchip' + (STATE.filter === key ? " is-active" : "") + '" data-filter="' + key + '">' + label + ' <span class="badge num">' + fmtInt(count || 0) + "</span></button>";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("is-active", t.dataset.view === STATE.view); });
    if (!STATE.rows.length) { return; }
    var base = viewBase();
    var c = filterCounts(base);
    $("content").innerHTML = STATE.view === "planning" ? renderPlanning(base, c) : renderManagement(base, c);
    wireDynamic();
  }

  function wireDynamic() {
    var si = $("searchInput");
    if (si) si.oninput = function () { STATE.search = this.value.trim(); var pos = this.selectionStart; rerenderKeepFocus(pos); };
    document.querySelectorAll(".fchip").forEach(function (b) {
      b.onclick = function () { STATE.filter = this.dataset.filter; render(); };
    });
    document.querySelectorAll("th.sortable").forEach(function (h) {
      h.onclick = function () {
        var k = this.dataset.sort;
        if (STATE.sort.key === k) STATE.sort.dir = STATE.sort.dir === "asc" ? "desc" : "asc";
        else STATE.sort = { key: k, dir: (k === "desc" || k === "code") ? "asc" : "desc" };
        render();
      };
    });
  }
  function rerenderKeepFocus(pos) {
    render();
    var si = $("searchInput"); if (si) { si.focus(); try { si.setSelectionRange(pos, pos); } catch (e) {} }
  }

  // ---------- export ----------
  function exportExcel() {
    if (!STATE.rows.length) return;
    var base = viewBase(); var rows = applyFilter(base);
    var aoa, name;
    if (STATE.view === "planning") {
      aoa = [["Code", "Description", "UOM", "Total Withdrawals", "Monthly Avg", "Current Stock", "Coverage (months)", "Status", "Suggested Order Qty"]];
      rows.forEach(function (r) {
        aoa.push([r.code, r.desc, r.uom, Math.round(r.total), Math.round(r.avg * 10) / 10,
          Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, STATUS_LABEL[r.status], Math.round(r.sug)]);
      });
      name = "PSMMC_reorder_" + STATE.filter + "_" + (STATE.meta.period_end || "") + ".xlsx";
    } else {
      aoa = [["Code", "Description", "UOM", "Available Stock", "Coverage (months)", "Status", "Monthly Use"]];
      rows.forEach(function (r) {
        aoa.push([r.code, r.desc, r.uom, Math.round(r.stock), r.cov == null ? "" : Math.round(r.cov * 10) / 10, STATUS_LABEL[r.status], Math.round(r.avg * 10) / 10]);
      });
      name = "PSMMC_stock_" + STATE.filter + "_" + (STATE.meta.stock_as_of || "") + ".xlsx";
    }
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, STATE.view === "planning" ? "Reorder" : "Stock");
    XLSX.writeFile(wb, name);
    toast("Exported " + (rows.length) + " rows → " + name);
  }

  // ---------- wiring ----------
  function init() {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.onclick = function () {
        STATE.view = this.dataset.view;
        STATE.filter = "all"; STATE.search = "";
        STATE.sort = STATE.view === "planning" ? { key: "cov", dir: "asc" } : { key: "stock", dir: "desc" };
        render();
      };
    });
    $("btnSample").onclick = loadSample;
    $("btnExport").onclick = exportExcel;
    $("fileWithdrawals").onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      $("wdName").textContent = f.name; $("lblWd").classList.add("is-loaded");
      readWorkbook(f, function (err, aoa) {
        if (err) { toast("Could not read withdrawals file"); return; }
        try { STATE.raw.withdrawals = parseWithdrawals(aoa); tryCompute(); }
        catch (ex) { toast(ex.message); }
      });
    };
    $("fileStock").onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      $("stName").textContent = f.name; $("lblSt").classList.add("is-loaded");
      readWorkbook(f, function (err, aoa, wb) {
        if (err) { toast("Could not read stock file"); return; }
        try { STATE.raw.stock = parseStock(aoa, f.name, wb); tryCompute(); }
        catch (ex) { toast(ex.message); }
      });
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

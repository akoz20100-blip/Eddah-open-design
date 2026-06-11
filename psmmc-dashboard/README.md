# PSMMC — Pharmacy Stock & Reorder Analytics

A simple, self-contained planning tool for the PSMMC pharmacy. Drop two NUPCO
Excel files in the browser and instantly see, per medicine: consumption rate,
stock coverage, reorder status, and a suggested order quantity — no manual math,
no server, no data leaving the page.

Three tabs in one page:

- **📋 Planning Department** — decision cards (needs-ordering count, critical
  zero-balance count, total available + overall coverage, monthly consumption
  with month-on-month badge); order sheet with one-click Excel export, email,
  WhatsApp, and print; item-level filters by status.
- **🏛️ Management & Budget** — actual available stock per medicine with
  out-of-stock and reorder counts, unit prices, and stock value (SAR). A
  frozen-capital card activates when prices are loaded (items with no movement
  or >12 months coverage).
- **📊 Averages** — per-item monthly average consumption, Δ% vs the previous
  upload, saved-history sparklines for up to 24 months, rising / falling / new
  filters, and history export / import buttons.

> **Scope:** only **medicines** are included — NUPCO codes **starting with `5`**.
> Medical supplies (other prefixes) are excluded automatically.

## Inputs

| Slot | File | Join key | Read |
|------|------|----------|------|
| Withdrawals | NUPCO outbound (`.xlsx`) | `NUPCO Material` | `Order Qty`, `Delivery Date`, rows with `Status` ∈ {DISPATCHED, APPROVED}; multiple files accepted (multiple warehouses) |
| Stock on hand | NUPCO stock (`.xls`) | `Generic Item Number` | `Total Available Qty`, aggregated across all batches/lots per item |
| Identifiers / MODHS catalog (optional) | Hospital/MODHS catalog (`.xlsx`, `.xls`, `.csv`) | NUPCO code | NUPCO code ↔ hospital code / MODHS code, trade name, scientific name, classification, priority; optional price columns: pack price, units per pack, awarded qty, free qty — unit price = pack ÷ units; effective price discounts bonus qty; rows are merged per code across uploads |

Header matching is tolerant (trim / case-insensitive / extra columns ignored).

**Period confirmation dialog** — after every withdrawals upload the app detects
the covered months from delivery dates and presents a 3-month / 6-month /
custom override dialog, with a manual flag, so analysts can correct edge cases
before calculations run.

**On-device history** — up to 24 months of per-item monthly averages are stored
in the browser's `localStorage`; the newest upload is authoritative for the
months it covers. History survives browser restarts and can be exported /
imported as JSON from the Averages tab. Duplicate file uploads are
de-duplicated automatically.

**Bilingual** — full Arabic / English UI with RTL support; switch with the
toggle in the header.

## Calculations (per medicine)

```
actual_months   = (max(Delivery Date) − min(Delivery Date)) / 30.44   (min 1.0)
monthly_avg     = total withdrawn / actual_months
coverage_months = current stock / monthly_avg
status          = Order now  (coverage ≤ 6)      ← safety stock = 6 months
                  Watch      (6 < coverage ≤ 7)
                  OK         (coverage > 7)
                  No movement (no withdrawals in period)
                  Not in stock (withdrawn but absent from stock file)
qty_9_months    = monthly_avg × 9                ← each order covers 9 months
suggested_order = max(0, qty_9_months − current stock)
```

**Trend** — each real upload stores a snapshot (period + per-item average) in
the browser's `localStorage`; the next upload shows ▲/▼ Δ% vs the previous
period.

## Files

```
index.html        page shell (multi-file dev version)
styles.css        light soft-card theme, PSMMC green
app.js            parsing, calculations, rendering, export, trend
sample-data.js    embedded real anonymised sample (drugs only) for the live demo
vendor/xlsx…js    SheetJS (Excel read/write, in-browser)
assets/…crest.svg on-brand emblem (replace assets/psmmc-logo.png with the official logo)
build.py          inlines everything → standalone.html + docs/index.html
standalone.html   single-file build — open locally or drag onto any static host
tests/            headless Chromium test suite (see tests/README.md)
```

To rebuild the single-file outputs after editing the source:

```bash
python3 psmmc-dashboard/build.py
```

## Tests

```bash
node psmmc-dashboard/tests/run.mjs
```

Runs a headless Chromium smoke suite. See `psmmc-dashboard/tests/README.md` for
details on what is covered and how to add cases.

## Deploy / share

`docs/index.html` is the single-file build, published by classic GitHub Pages
(*Settings → Pages → Deploy from a branch → `/docs`*). Live URL:

```
https://akoz20100-blip.github.io/eddah-open-design/
```

`standalone.html` is the same build with no external files — open it by
double-click, email it, or drag it onto Netlify Drop for an instant link.

To use the official hospital logo, drop the PNG at
`psmmc-dashboard/assets/psmmc-logo.png` and rebuild; the header picks it up
automatically (falling back to the bundled SVG emblem if absent).

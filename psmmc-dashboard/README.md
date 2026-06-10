# PSMMC — Pharmacy Stock & Reorder Analytics

A simple, self-contained planning tool for the PSMMC pharmacy. Drop two NUPCO
Excel files in the browser and instantly see, per medicine: consumption rate,
stock coverage, reorder status, and a suggested order quantity — no manual math,
no server, no data leaving the page.

Two dashboards in one page:

- **📋 Planning Department** — coverage, reorder flags, 9-month order quantities,
  trend vs the previous upload, and one-click Excel export of the purchase list.
- **🏛️ Management & Budget** — the actual available stock of every medicine, with
  out-of-stock and reorder counts. A stock-value (SAR) slot is reserved for when
  a price list is provided.

> **Scope:** only **medicines** are included — NUPCO codes **starting with `5`**.
> Medical supplies (other prefixes) are excluded automatically.

## Inputs

| Slot | File | Join key | Read |
|------|------|----------|------|
| Withdrawals | NUPCO outbound (`.xlsx`) | `NUPCO Material` | `Order Qty`, `Delivery Date`, rows with `Status` ∈ {DISPATCHED, APPROVED} |
| Stock on hand | NUPCO stock (`.xls`) | `Generic Item Number` | `Total Available Qty`, aggregated across all batches/lots per item |

Header matching is tolerant (trim / case-insensitive / extra columns ignored).

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

**Trend** — each real upload stores a snapshot (period + per-item average) in the
browser's `localStorage`; the next upload shows ▲/▼ Δ% vs the previous period.

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
```

To rebuild the single-file outputs after editing the source:

```bash
python3 psmmc-dashboard/build.py
```

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

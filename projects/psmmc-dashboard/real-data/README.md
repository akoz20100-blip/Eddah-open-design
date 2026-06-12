# Real hospital data — development & validation set

Real NUPCO/MODHS exports supplied by the owner (2026-06-12) so development
rounds validate against production-shaped data instead of synthetic fixtures.
These are the authoritative inputs for real-file regression checks; synthetic
fixtures in `../tests/fixtures/` remain the unit-level harness.

| File | Slot in the app | Rows | Notes |
|------|-----------------|------|-------|
| `NUPCO_outbound_Jan2026to10_Jun2026.sanitized.xlsx` | Withdrawals | 10,130 | Jan 2026 → 10 Jun 2026. **Sanitized**: `Customer Ref.`, `Created By`, `Header Text` blanked (staff names + phone numbers) via `sanitize-outbound.mjs`; all analytical columns verbatim |
| `NUPCO_Stock_On_Hand_C100_MODPSMMC_04022026.xls` | Stock on hand | 20,984 | As of 2026-02-04; original JasperReports `.xls` byte-stream kept on purpose — it exercises the real `.xls` parse path. Includes non-drug items (filtered by the 5-prefix rule) |
| `MODDHS_MEDICATION_CATALOG_072025.xlsx` | Identifiers / MODHS catalog | 1,462 (+205 INACTIVE) | Jul 2025 unified pharma catalog: MODHS↔NUPCO codes, descriptions, priority, classification. This is the real identifiers file the round-3 audit flagged as missing |
| `NUPCO_net_unit_prices_12062026.xlsx` | Prices | 2,863 | Owner-supplied 2026-06-12. `Generic Mat Code` + `Net Price/Per unit 1` — the price is already **per dispensing unit**, no pack-size division needed. No free-goods (bonus) columns yet |
| `PSMMC_planner_assignment_12062026.xlsx` | Planners | 1,173 | Owner-supplied 2026-06-12. Hospital `Product Code`, `Nupco`, `MSD Code`, description, **UOM** (TABLET/VIAL/TUBE/…, source for the 3-month hand-dispensed rule), `Cat`, `Planner` (first names — operational data the dashboard renders, kept on purpose). No email column |
| `NUPCO_framework_orders_asof_12062026.sanitized.xlsx` | Orders (framework agreement) | 1,162 | Orders Dec 2025 → May 2026, received 2026-06-12. **Sanitized**: `Order Placed By` (staff names) + `Customer Comment` (free text) blanked via `sanitize-orders.mjs`; all analytical columns verbatim. Arabic statuses; only 19 rows are drug codes (prefix 5) — the rest are medical supplies filtered out by the app |

Smoke-verified 2026-06-12 in headless Chromium: all three upload cleanly,
1,005 drug rows render, MODHS names resolve, zero page errors.

## Rules

- **Never commit a raw outbound export.** Run it through
  `node sanitize-outbound.mjs <raw.xlsx> <out.sanitized.xlsx>` first and
  spot-check the blanked columns are empty. The raw file stays outside git.
- **Never commit a raw framework-orders export.** Run it through
  `node sanitize-orders.mjs <raw.xlsx> <out.sanitized.xlsx>` (blanks
  `Order Placed By` + `Customer Comment`) and spot-check before committing.
- New real files from the owner replace or sit beside these with the same
  naming pattern (`<source>_<content>_<date>`); update this table.
- Specs that need real-data assertions should read from this directory
  directly rather than copying files into `tests/fixtures/`.

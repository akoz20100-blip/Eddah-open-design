# عدة / EDDAH landing — Handoff

Premium Arabic-RTL landing page for **عدة / EDDAH**, a local-first home-maintenance
service in **حي لبن، الرياض**. WhatsApp-first conversion. Stack: **Next.js 14 +
Tailwind + framer-motion**. Branch: `claude/test-coverage-analysis-V9g4A`.

## Scope (strict)
Only three services: **السباكة · الكهرباء · التكييف**. Never add others
(no tanks/painting/carpentry/cleaning/pest/appliances/general).

## Identity — "Ivory & Amber" (light, warm, premium)
Palette derived from `public/brand/laban-map.png`: ivory `#FCF8F1` canvas, sand/clay
surfaces, amber accent `#F2820C → #F6A700` (logo + map pin), warm-ink `#1A1714` text.
No dark/cinematic look. Tokens in `tailwind.config.ts`; utilities in `src/app/globals.css`.

## Brand assets (`public/brand/`, real creatives)
| file | role |
|---|---|
| `hero-technician.png` | Hero main visual |
| `service-plumbing.png` | السباكة (+ "ثقة لا تتسرّب" showcase) |
| `service-electrical.png` | الكهرباء |
| `service-ac.png` | التكييف |
| `tools-showcase.png` | tools/readiness band + CTA backdrop |
| `precision-workshop.png` | "دقّة لا تغلط" showcase |
| `laban-map.png` | **map section main visual + palette/locality anchor** (orange pin, حي لبن, غرب الرياض, logo, beige) |
| `logo-eddah.png` | footer brand tile + favicon/OG |

Original random-hash uploads are kept alongside (unreferenced). Old dark assets
(brand-loop.mp4, craftsman, master, precision, products, silent-work, toolbag,
tools-float, trust-water) were removed.

## Important files
- `src/app/page.tsx` — section order
- `src/app/layout.tsx` — metadata, fonts, favicon/OG
- `src/lib/brandImages.ts` — image manifest (single source of truth for `/brand/*`)
- `src/components/sections/*` — Hero, Services, MapSection, Showcase, ValueProps (why),
  Trust, Testimonials, HowItWorks, LocalFocus, CTASection, Nav, Footer, StatsBand
- `src/components/ui/*` — BrandImage (graceful fallback), Reveal, MagneticButton, Logo
- `src/lib/motion.ts` — one easing language (`expoOut [0.16,1,0.3,1]`), fadeUp/stagger/word reveal

## What was changed (this work)
- Rewired image manifest to the real uploads; placed each service photo.
- Copy aligned to brief (hero headline/CTAs, final CTA, trust messages, nav).
- Removed the dark `brand-loop.mp4` video band (deleted `BrandBand.tsx`).
- **Services → layered editorial bento** (featured السباكة + stacked الكهرباء/التكييف,
  frosted overlapping panels, floating icon badges, parallax images, map-line accent).
- **Map → main visual section** using the real `laban-map.png` (parallax + floating
  glass badges) + frosted info panel.
- Logo wired into footer + favicon/OG.

## Still needs improvement (next polish pass — proposed, not yet done)
- Hero composition: add explicit trust badges; richer first-screen depth.
- Service card crops/hover sheen + spacing refinement to Orbai-level.
- Trust/Why-EDDAH: move beyond icon cards to a more visual "service system".
- Tools/precision: stronger editorial split composition.
- Mobile: ensure cards aren't tall boring boxes; sticky WhatsApp affordance.

## Build / run
```bash
cd eddah-landing
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks + lints)
```
`WHATSAPP_NUMBER` in `src/lib/brand.ts` is empty → CTAs point to `#` until set.

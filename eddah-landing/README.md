# عدة — Landing Page

صفحة هبوط عربية متميّزة لعلامة **عدة** للصيانة المنزلية في **حي لبن** بالرياض.
A premium, Arabic-first (RTL) landing page for a Saudi home-maintenance brand:
plumbing, electrical, and AC/cooling — focused exclusively on حي لبن, Riyadh.

> Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.
> Bright "warm clay + brand-orange" identity, photo-led editorial layout, refined
> motion, and a hand-drawn service-zone map. Real brand creatives drop into
> `public/brand/` (see that folder's README); elegant placeholders show until then.

---

## التشغيل / Getting started

Requires **Node 18.18+** (Node 20/22 recommended) and npm.

```bash
cd eddah-landing
npm install        # install dependencies
npm run dev        # start dev server → http://localhost:3000
```

### Production

```bash
npm run build      # type-checks + builds
npm run start      # serves the production build
```

---

## بنية المشروع / Project structure

```
eddah-landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # RTL <html dir="rtl" lang="ar">, Arabic font, metadata
│   │   ├── page.tsx          # assembles all sections in order
│   │   └── globals.css       # tokens, base, grain texture, copper glow utilities
│   ├── components/
│   │   ├── sections/         # one file per page section (Hero, Services, MapSection…)
│   │   ├── ui/               # reusable primitives (Reveal, MagneticButton, Logo…)
│   │   ├── icons/            # custom SVG iconography (no stock icons)
│   │   └── map/RiyadhMap.tsx # hand-drawn stylized map of west Riyadh
│   └── lib/
│       ├── brand.ts          # WhatsApp number + brand constants  ← edit before launch
│       ├── motion.ts         # the shared easing/variants system
│       └── cn.ts             # tiny classnames helper
├── tailwind.config.ts        # Midnight & Copper color system + keyframes
└── DESIGN_STRATEGY.md        # the design / motion / map rationale
```

### الأقسام / Sections (in order)

1. **Hero** — cinematic dark hero, word-by-word headline, 3D "dispatch" card, parallax.
2. **Why عدة** — six value props (speed, organized scheduling, local focus, trust…).
3. **Services** — the three services only: السباكة · الكهرباء · التكييف والتبريد.
4. **Local focus (حي لبن)** — the specialization story + animated service-zone radar.
5. **How it works** — three steps (اختر · أرسل · ننسّق ونخدمك).
6. **Map** — designed card with a hand-drawn map highlighting حي لبن.
7. **Trust** — keyword marquee + four guarantees.
8. **CTA** — WhatsApp + call, local confidence messaging.
9. **Footer** — minimal, premium.

---

## قبل الإطلاق / Before you launch

**1. WhatsApp number** — edit `src/lib/brand.ts`:

```ts
export const WHATSAPP_NUMBER = ""; // ← put the real number (no +, no spaces). Empty = buttons stay inert.
```

Every WhatsApp button and the click-to-call link read from this single constant.
Each service card also passes a pre-filled Arabic WhatsApp message.

**2. Brand images** — drop the real عدة creatives into `public/brand/` using the
filenames listed in `public/brand/README.md` (`master.jpg`, `precision.jpg`,
`trust-water.jpg`, `products.jpg`, `tools-float.jpg`). They replace the labelled
placeholders automatically. Dark originals are auto-brightened to match the
bright identity; tune per-image in `src/lib/brandImages.ts`.

---

## ملاحظات / Notes

- **RTL-first**: layout, scroll-progress origin, marquee direction, and arrows all flow right-to-left.
- **Motion respects accessibility**: `prefers-reduced-motion` disables animations globally (see `globals.css`).
- **Font**: IBM Plex Sans Arabic via `next/font` (self-hosted at build, no runtime request).
- **No external map/API key**: the map is pure SVG — restyle district polygons and labels in `RiyadhMap.tsx`.

# عدة — Design Strategy

A short note on *why* the page looks and moves the way it does. The brief's
failure mode was "AI-generic": templated layouts, weak motion, no brand
conviction. Every decision below is aimed at the opposite.

---

## 1. Design strategy

**Positioning.** عدة is not "a startup that does everything." It is the *local*
maintenance brand for one neighborhood — حي لبن. Focus is the product. The whole
page repeats that one idea instead of diluting it, which is also what makes it
feel real rather than generic.

**Identity — "Ivory & Amber" (light, bright, premium).** Palette derived from
the حي لبن map creative (`public/brand/laban-map.png`): warm paper + an amber pin.
- Canvas: ivory / warm off-white (`clay-50 #FCF8F1`) with sand surfaces
  (`clay-100/200`) — light and airy, never dark or moody.
- Type: warm near-black ink (`#1A1714`) — softer than pure black, highly readable.
- Accent: amber/orange from the logo + map pin (`#F2820C → #F6A700`), used
  *strategically* for CTAs, highlights, icons and brand emphasis — not everywhere.
- A near-invisible paper grain (opacity ~0.035) adds tactility without darkening.

**Typography.** One family — IBM Plex Sans Arabic — across weights 300–700.
Large, tightly-tracked Arabic display headings; relaxed body line-height for
readability. Arabic numerals (٠١، ٢، ٣) used deliberately for authenticity.

**Discipline.** A single 1180px container, one easing curve, one radius language,
one accent. Restraint is what separates premium from busy.

## 2. Page structure

Hero → Why عدة → Services → حي لبن focus → How it works → Map → Trust → CTA → Footer.

The narrative arc: *grab attention (hero) → earn trust (why) → show competence
(services) → prove locality (focus + map) → remove friction (how) → reassure
(trust) → convert (CTA).* Locality is intentionally hit three times (hero badge,
dedicated section, map) because it is the single most important differentiator.

## 3. Motion strategy

One motion language, applied consistently:

- **Signature easing**: expo-out `[0.16, 1, 0.3, 1]` — decisive, never bouncy.
  Enters ~0.7s, exits faster. Defined once in `lib/motion.ts`.
- **Hero**: word-by-word headline reveal, layered parallax (`useScroll` →
  glow/content move at different rates), floating orbs, and a cursor-driven
  **3D-tilt** dispatch card with real `translateZ` depth.
- **Scroll reveals**: every section uses one `Reveal` primitive — fade + rise +
  subtle blur-in, staggered for children. Consistency reads as intentional.
- **Micro-interactions**: magnetic CTAs (label pulled toward cursor), card
  lift/tilt on hover, sheen sweeps, an animated scroll-progress bar.
- **The map animates as a scene**: roads draw in via `pathLength`, the zone
  outline traces itself, the pin drops with spring physics, pulse rings breathe.
- **Restraint**: nothing loops aggressively, nothing distracts from reading.
  `prefers-reduced-motion` turns it all off cleanly.

## 4. Map strategy

A plain Google embed would have broken the premium feel and undermined the whole
"designed brand" claim — so the map is **hand-drawn SVG** (`map/RiyadhMap.tsx`):

- حي لبن sits center-frame as a glowing copper **service zone** with a dropped
  pin and a labeled chip — unmistakably the hero of the frame.
- Real neighbouring districts are labelled around it (ظهرة لبن، طويق، العريجاء،
  نمار، الحزم) and the Western Ring Road runs down the east edge, giving the
  schematic real geographic credibility without pretending to be a survey map.
- Faint city blocks + a grid suggest urban fabric; a compass and Arabic labels
  complete the "designed cartography" feel.
- A side panel + legend states the message in words: **"خدمتنا اليوم مركّزة على
  حي لبن"** — and invites out-of-area users to register for the expansion list.

The result answers the brief's test instantly: *عدة currently serves حي لبن in
Riyadh.*

---

## Quality-control checklist (self-review)

- ✅ Reads like a real premium brand, not a template — custom icons, map, identity.
- ✅ Clearly communicates home maintenance (3 focused services, concrete copy).
- ✅ Locality hit three times; map highlights حي لبن unmistakably.
- ✅ Motion is one refined system, not noisy decoration.
- ✅ Arabic typography is large, tracked, and professional; numerals localized.
- ✅ Mobile-first and verified on 390px and 1440px.
- ✅ Copy is confident and local — no cheesy startup language, no fake metrics.

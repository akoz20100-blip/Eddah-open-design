# نظام تصميم عدّة — EDDAH Design System

> **نظام تصميم مشروع «عدّة»** — أحد مشاريع [`designs/`](../README.md). تقرأه مهارة
> **impeccable** عند تفعيل المشروع عبر `IMPECCABLE_CONTEXT_DIR=designs/eddah`.
> الأساس العام (RTL/إتاحة/حركة/خط البيت) في [`designs/README.md`](../README.md)،
> وهذا الملف يضيف هوية عدّة فوقه.
>
> الهوية والخطوط والأصول الكاملة في هذا المجلد `designs/eddah/`.
> التفاصيل الأعمق: [`design/DESIGN-SYSTEM.md`](design/DESIGN-SYSTEM.md) ·
> [`design/THEMES.md`](design/THEMES.md) ·
> [`design/NEBULA.md`](design/NEBULA.md) ·
> [`design/BRAND.md`](design/BRAND.md).

الهوية: **"Ivory & Amber"** نهارًا، و**"Black & Amber"** (بلمسة بنفسجية) مساءً —
فاتحة دافئة فاخرة محلية سعودية، مشتقّة من `assets/laban-map.png`
(ورق بيج دافئ + دبوس كهرماني). RTL كامل (`dir="rtl"`)، عربية أولًا.

---

## 1) الألوان

كل الألوان متغيّرات CSS بصيغة `R G B`، يستهلكها Tailwind عبر
`rgb(var(--token) / <alpha-value>)` — فالوضع نهاري/مسائي يتبدّل وقت التشغيل بلا
إعادة بناء. القيم الكاملة في [`code-snippets/globals.css`](code-snippets/globals.css).

### الوضع النهاري (Day · افتراضي · `:root`)

| الرمز | Hex | الاستخدام |
|---|---|---|
| `clay-50` | `#FCF8F1` | الكانفس/الخلفية الرئيسية |
| `clay-100` | `#F5EEE0` | أسطح بديلة، أقسام |
| `clay-200` | `#ECE0CD` | حدود/فواصل خفيفة |
| `clay-300` | `#DBCBB2` | حدود أثقل |
| `clay-400` | `#C6B398` | رملي/حجري |
| `white` | `#FFFFFF` | بطاقات، زجاج |
| `ink` / `ink-900` | `#1A1714` | النص الأساسي |
| `ink-700` | `#3A332C` | نص قوي |
| `ink-600` | `#5A5046` | نص ثانوي |
| `ink-500` | `#756B5E` | نص خافت |
| `ink-400` | `#9A9082` | نص خافت جدًا |
| `ink-300` | `#B6AC9D` | تلميحات |
| `orange-500` | `#F2820C` | **الأكسنت الرئيسي** (CTA، أيقونات، دبوس) |
| `orange-600` | `#DD6A06` | نص أكسنت / hover |
| `orange-400/300/200/100/50` | `#F59A24` · `#F7B450` · `#FACF8C` · `#FDE7C0` · `#FFF5E1` | تدرّجات/خلفيات أيقونات |
| `gold` / `gold-light` | `#F6A700` · `#FFC74D` | تدرّج العلامة |

### الوضع المسائي (Night · `[data-theme="night"]`)

| الرمز | Hex | الاستخدام |
|---|---|---|
| `clay-50` | `#030305` | الخلفية (أسود) |
| `clay-100` | `#08080C` | أسطح/أقسام |
| `clay-200` | `#15131C` | حدود |
| `clay-300/400` | `#221F2B` · `#322E3C` | حدود أثقل |
| `white` | `#0C0B11` | بطاقات/زجاج داكنة |
| `ink` / `ink-900` | `#F5F2FF` | النص الأساسي (فاتح) |
| `ink-600/500/400` | `#B8AFDD` · `#9A90C2` · `#7E76A6` | نص ثانوي/خافت |
| `orange-500` | `#F2820C` | الأكسنت والكلمات المميّزة (يبقى برتقالي) |
| `orange-600/700` | `#FBA63A` · `#FFC062` | نص أكسنت أفتح (مقروء على الأسود) |
| `orange-50/100/200` | `#140E22` · `#1C1430` · `#281C44` | تينت بنفسجي داكن لخلفيات الأيقونات (مو ذهبي) |
| لمسة بنفسجي الخلفية | `#7C4DFF` | في خلفية «سديم» والـ wash فقط — خافتة جدًا |

**قواعد اللون:** خلفية هادئة؛ البرتقالي بتركيز (CTA، أيقونات، الكلمات المميّزة) لا
في كل مكان؛ نص مقروء بتباين كافٍ (body ≥ 4.5:1). في المسائي: الأساس **أسود**،
البنفسجي «همسة» في الخلفية فقط، والكلمات برتقالية. لا توهّج ذهبي مبالغ ليلًا.

**تدرّج الكلمات المميّزة** `.text-orange-gradient` (في الوضعين):
`linear-gradient(135deg, #FFC74D 0%, #F6A700 35%, #F2820C 65%, #DD6A06 100%)`.

---

## 2) الخطوط — خط ثمانية (Thmanyah)

الخطوط الفعلية في [`fonts/`](fonts/) — `woff2` للويب و`otf` للتصميم +
[ملف الترخيص](fonts/) (راجعه قبل أي استخدام تجاري موسّع).

- **Thmanyah Sans** → النصوص والواجهة والأزرار · متغيّر `--font-arabic` · أوزان `300/400/500/700/900`.
- **Thmanyah Serif Display** → العناوين الكبيرة (H1, H2) · متغيّر `--font-display` · إحساس تحريري فاخر.
- القاعدة: `h1, h2 { font-family: var(--font-display), var(--font-arabic), Georgia, serif }` — البقية (h3، النصوص) Sans.
- **العناوين:** `letter-spacing: -0.01em` كحدّ أقصى — **لا تتبّع سالب قوي على العربية** (الحروف متّصلة).
- **المقياس:** H1 `clamp(2.6rem, 7vw, 4.7rem)` · H2 `clamp(1.875rem, 3.8vw, 44px)`.
- أرقام عربية (٠ ١ ٢ ٣) عمدًا للأصالة · `font-feature-settings: "ss01","liga","kern"`.
- التحميل في Next.js عبر `next/font/local` — انظر [`code-snippets/layout.tsx`](code-snippets/layout.tsx).

تفعيل `@font-face` لأي مشروع (المسارات نسبية لمجلد الخطوط):

```css
@font-face{font-family:"Thmanyah Sans";src:url("fonts/thmanyah/thmanyahsans-Regular.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"Thmanyah Sans";src:url("fonts/thmanyah/thmanyahsans-Bold.woff2") format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:"Thmanyah Serif Display";src:url("fonts/thmanyah/thmanyahserifdisplay-Bold.woff2") format("woff2");font-weight:700;font-display:swap}
/* بقية الأوزان (Light 300 · Medium 500 · Black 900) بنفس النمط لكل عائلة */
```

---

## 3) المسافات والإيقاع

- حاوية واحدة: `max-width: 1180px` · padding أفقي `24px` (موبايل) / `40px` (md).
- أقسام: `py-20 md:py-28` (وأحيانًا `py-32` للبطل) — فراغ سخيّ = فخامة.
- زوايا كبيرة موحّدة: `rounded-[1.5rem | 2rem | 2.25rem | 2.75rem]` (`rounded-4xl=2rem` · `rounded-5xl=2.75rem`).
- شبكة الخدمات **غير متناظرة** (bento split-panels) لا بطاقات متساوية.
- تقليل «كروت AI»: الأقسام التحريرية تستخدم قوائم بحدود شعرية (hairline) بدل صناديق مكرّرة.

---

## 4) الظلال (theme-aware عبر `--shadow`)

من [`code-snippets/tailwind.config.ts`](code-snippets/tailwind.config.ts):

| Class | الاستخدام |
|---|---|
| `shadow-soft` | عناصر خفيفة |
| `shadow-card` | بطاقات |
| `shadow-airy` / `shadow-airy-lg` | بطاقات/مناطق ناعمة |
| `shadow-lift` | رفع قوي عند hover |
| `shadow-orange-glow` | أزرار/شارات الأكسنت (عبر `--glow`) |

في المسائي يصير لون الظل أسود (`--shadow: 0 0 0`).

---

## 5) الحركة (motion)

من [`code-snippets/motion.ts`](code-snippets/motion.ts) — لغة easing واحدة لكل الموقع:

| المتغيّر | القيمة/الاستخدام |
|---|---|
| `EASE_OUT` | `cubic-bezier(0.16, 1, 0.3, 1)` (expoOut) — التوقيع: حاسم، فاخر، بلا ارتداد |
| `fadeUp` / `fadeUpSmall` | ظهور مع/بدون blur |
| `wordReveal` | كشف العناوين كلمة بكلمة |
| `scaleIn` · `staggerContainer` · `inViewProps` | بقية الحركات |

قواعد: بدون مكتبات حركة ثقيلة (لا Lenis/GSAP) · كل شيء يحترم
`@media (prefers-reduced-motion: reduce)` · parallax خفيف للصور عبر `useScroll + useTransform`.

---

## 6) خلفية «سديم» (Nebula)

نيبولا على **Canvas 2D محلي** (بلا مكتبات): كهرمانية نهارًا (`source-over`, شفافية ~0.72)،
بنفسجية خافتة ليلًا (`lighter`, شفافية ~0.42)، تُنعّم بـ `blur(62px)`، تحترم تقليل الحركة،
وتتبدّل فورًا مع الوضع (`themechange`). الموضع `fixed inset-0 -z-10 pointer-events-none`.
الكود: [`code-snippets/NebulaBackground.tsx`](code-snippets/NebulaBackground.tsx) ·
نسخة شيدر مستقلة تفاعلية: [`code-snippets/sadim-shader-standalone.html`](code-snippets/sadim-shader-standalone.html) ·
الشرح: [`design/NEBULA.md`](design/NEBULA.md).

---

## 7) الوضع النهاري/المسائي

متغيّرات CSS على `:root` (نهاري) و`[data-theme="night"]` (مسائي) + زر
[`ThemeToggle`](code-snippets/ThemeToggle.tsx) يضيف/يزيل `data-theme="night"`،
يحفظ في `localStorage` (`eddah-theme`)، ويُطلق حدث `themechange`. سكربت سطري في
`layout.tsx` يمنع وميض الإقلاع. التفاصيل: [`design/THEMES.md`](design/THEMES.md).

---

## 8) المكوّنات الرئيسية

- **Hero:** عنوان serif بكشف كلمة-بكلمة + صورة فني بـ parallax + بطاقات عائمة.
- **Services:** bento تحريري غير متناظر، شِب زجاجي + رقم شبحي + أيقونة عائمة.
- **MapSection:** `laban-map.png` كقسم + دبوس متوهّج + لوحة معلومات زجاجية.
- **ValueProps:** عمودان (عنوان sticky + قائمة ٠١–٠٦ بلا صناديق).
- **Trust / LocalFocus / Testimonials:** بلا صناديق — فواصل/حدود جانبية بدل البطاقات.
- **CTA / StickyWhatsApp / Nav (+ زر الوضع):** تحويل واتساب واضح.
- **الزجاج:** `bg-white/80 backdrop-blur-xl border border-white/70`.
- **الشِبس:** `rounded-full border bg-white/80`.
- **الأزرار:** `MagneticButton` (primary/ghost/whatsapp) — يُسحب نحو المؤشر.

ترتيب الأقسام: `Nav → Hero → StatsBand → MapSection → HowItWorks → ValueProps → Services → Showcase → LocalFocus → Testimonials → Trust → CTA → Footer`.

---

## 9) Do / Don't

**✅:** طبقات وتراكب · قصّ editorial للصور · شارات عائمة · زجاج · ظلال ناعمة ·
أكسنت برتقالي رفيع · عدم تناظر · فراغ سخيّ · هرمية خط قوية (serif للعناوين) ·
موبايل أولًا · صور حقيقية فقط · RTL وأرقام عربية.

**❌:** بطاقات أيقونات متساوية مكرّرة (إحساس AI) · حدود ثقيلة · برتقالي مُفرط ·
توهّج ذهبي مبالغ في المسائي (الأساس أسود) · تتبّع سالب قوي على العربية ·
أي خدمة غير السباكة/الكهرباء/التكييف · صور stock أو placeholder أو مولّدة.

---

## مصدر الحقيقة

هذا الملف مُلخّص تشغيلي. عند أي تعارض، التفصيل الكامل في
[`design/DESIGN-SYSTEM.md`](design/DESIGN-SYSTEM.md) ومقاطع الكود في
[`code-snippets/`](code-snippets/) هي المرجع. لإعادة بناء الموقع من
الصفر بأي أداة: [`RECREATE-PROMPT.md`](RECREATE-PROMPT.md).

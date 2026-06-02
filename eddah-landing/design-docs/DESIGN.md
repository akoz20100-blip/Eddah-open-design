# DESIGN — الهوية البصرية ونظام التصميم (آخر تحديث: 2 يونيو 2026)

الهوية: **"Ivory & Amber"** — فاتحة، دافئة، فاخرة، محلية سعودية.
مشتقّة من `public/brand/laban-map.png`: ورق بيج دافئ + دبوس كهرماني.

---

## 1) الألوان — Tailwind tokens (tailwind.config.ts)

### Clay (الخلفية والأسطح)
| Token | Hex | الاستخدام |
|---|---|---|
| `clay-50` | `#FCF8F1` | الكانفس الرئيسي (body bg) |
| `clay-100` | `#F5EEE0` | أسطح بديلة، أقسام |
| `clay-200` | `#ECE0CD` | حدود، فواصل خفيفة |
| `clay-300` | `#DBCBB2` | حدود أثقل |
| `clay-400` | `#C6B398` | رملي/حجري |

### Ink (النص)
| Token | Hex |
|---|---|
| `ink` / `ink-900` | `#1A1714` |
| `ink-800` | `#241F1A` |
| `ink-700` | `#3A332C` |
| `ink-600` | `#5A5046` |
| `ink-500` | `#756B5E` |
| `ink-400` | `#9A9082` |
| `ink-300` | `#B6AC9D` |

### Orange (الأكسنت — بتركيز)
| Token | Hex |
|---|---|
| `orange-50` | `#FFF5E1` |
| `orange-100` | `#FDE7C0` |
| `orange-200` | `#FACF8C` |
| `orange-300` | `#F7B450` |
| `orange-400` | `#F59A24` |
| `orange-500` | `#F2820C` ← الرئيسي |
| `orange-600` | `#DD6A06` |
| `orange-700` | `#B0520A` |
| `orange-800` | `#8A3F09` |

### Gold
`gold` = `#F6A700` · `gold-light` = `#FFC74D`

### CSS Variables (globals.css)
`--bg: #fcf8f1` · `--orange: #f2820c` · `--ink: #1a1714`

**قواعد اللون:** خلفية فاتحة وهادئة؛ برتقالي بتركيز (CTA، أيقونات، دبوس، خطوط أكسنت) لا في كل مكان؛ نص فحمي مقروء.
تدرّج العلامة: `.text-orange-gradient` (#FFC74D→#F6A700→#F2820C→#DD6A06) للكلمات المميّزة فقط.

---

## 2) الخطوط
- **IBM Plex Sans Arabic** (أوزان 300–700) عبر `next/font` · متغيّر `--font-arabic`
- عناوين: tracking ضيّق `tracking-tightest -0.04em` + `text-balance`
- نصوص: `leading` مريح + `text-pretty`
- مقياس: H1 `clamp(2.9rem,7.4vw,5.4rem)` · H2 `~clamp(2rem,3.8vw,44px)` · عنوان خدمة `~44px`
- أرقام عربية (٠١ · ٢ · ٣) عمداً للأصالة
- RTL كامل (`dir="rtl"`) + خصائص منطقية CSS

---

## 3) المسافات والإيقاع
- حاوية واحدة `min(1180px, 100%-padding)` في `Container.tsx`
- أقسام: `py-20 md:py-28` (وأحياناً `py-32` للبطل) — فراغ سخيّ = إحساس فاخر
- زوايا موحّدة: `rounded-[1.5rem | 2rem | 2.25rem | 2.75rem]` (+ `rounded-4xl` = 2rem · `rounded-5xl` = 2.75rem)
- شبكة الخدمات **غير متناظرة** (split-panels بالتناوب) لا بطاقات متساوية

---

## 4) الظلال — tailwind.config.ts

| Class | الاستخدام |
|---|---|
| `shadow-soft` | عناصر عادية خفيفة |
| `shadow-card` | بطاقات |
| `shadow-airy` | بطاقات ومناطق إطلاق ناعمة |
| `shadow-airy-lg` | رفع ناعم أكبر للعناصر المهمة |
| `shadow-lift` | رفع قوي عند hover |
| `shadow-orange-glow` | أزرار/شارات الأكسنت البرتقالية |

تمت إضافة `airy` و`airy-lg` إلى `tailwind.config.ts`.

---

## 5) المكوّنات والأنماط

### الخدمات (Services)
- Split-panel editorial: نصف صورة ↔ نصف محتوى، يتبادل الجهة بين الخدمات
- رقم شبحي ضخم (٠١ · ٠٢ · ٠٣) · شارة أيقونة عائمة · شِب زجاجي على الصورة
- خط أكسنت برتقالي عند hover · صورة بـparallax

### الزجاج (Glass panels)
`bg-white/80 backdrop-blur-xl border border-white/70`

### Map-line accents
أقواس/خطوط خريطة باهتة (`opacity ~0.06`) كموتيف هوية — تربط بـ laban-map.

### الشِبس (Chips)
`rounded-full border bg-white/80` — للوضوح والثقة

### الأزرار
`MagneticButton` (primary / ghost / whatsapp) + زر واتساب ممتلئ بـ`shadow-orange-glow`

### BrandImage
يقرأ من `brandImages.ts`، fallback أنيق لو الصورة ناقصة (الصور موجودة كلها).

### StickyWhatsApp FAB
منفّذ في `src/components/ui/StickyWhatsApp.tsx`: زر عائم يظهر بعد 600px من التمرير، يستخدم `MagneticButton` + `whatsappLink()` ويحترم `prefers-reduced-motion`.

---

## 6) الصور
- **صور حقيقية فقط** من `public/brand` — لا stock · لا placeholder · لا CSS بديل · لا أصول داكنة قديمة
- قصّ مقصود: `object-cover` + `object-position` لكل صورة (وجه الفني / اللوحة / المكيف)
- `laban-map.png` = قسم رئيسي، ليس زينة صغيرة

---

## 7) الحركة (motion.ts)
| المتغيّر | الاستخدام |
|---|---|
| `EASE_OUT = [0.16,1,0.3,1]` | كل الحركة — expoOut |
| `EASE_IN_OUT = [0.65,0,0.35,1]` | حركة ثنائية الاتجاه |
| `fadeUp` | ظهور مع blur + ارتفاع |
| `fadeUpSmall` | ظهور خفيف (بدون blur) |
| `wordReveal` | كشف الكلمات كلمة بكلمة |
| `scaleIn` | ظهور مع تكبير خفيف |
| `staggerContainer(stagger, delay)` | حاوية تُرتّب ظهور أبنائها |
| `inViewProps` | { initial, whileInView, viewport } جاهز للصق |

**قواعد الحركة:**
- بدون مكتبات إضافية (لا Lenis · لا GSAP · لا AOS)
- كل شي يحترم `@media (prefers-reduced-motion: reduce)` — موجود في globals.css
- parallax خفيف للصور عبر `useScroll + useTransform`

---

## 8) CSS Utilities (globals.css)
| Class | الوظيفة |
|---|---|
| `.eyebrow` | label صغير ملوّن فوق العناوين |
| `.text-orange-gradient` | تدرّج الكلمات المميّزة |
| `.orange-wash` | توهّج ذهبي خلفي (Hero / CTA) |
| `.noise` (pseudo) | حبيبة خفيفة على الأسطح |
| `.balance` | `text-wrap: balance` |
| `.pretty` | `text-wrap: pretty` |

---

## 9) Do / Don't

**✅ Do:**
طبقات وتراكب · قصّ editorial · شارات عائمة · زجاج دافئ · ظلال ناعمة · أكسنت برتقالي رفيع · خطوط خريطة · عدم تناظر · فراغ سخيّ · هرمية خط قوية · موبايل مصمَّم أولاً.

**❌ Don't:**
بطاقات مستطيلة متساوية مملّة · صورة+نص مسطّح · حدود ثقيلة · بطاقات أيقونات generic · داكن/سينمائي · نص صغير كثير داخل البطاقات · برتقالي مُفرط.

---

## 10) مراجع الجودة (للمستوى — لا تنسخ)
- **Orbai** — orbai-template.framer.website (فخامة، تركيب، إيقاع حركة، فراغ)
- **Plumbo** — plumbo.framer.website (تدفّق صفحة خدمات + إيقاع تحويل)

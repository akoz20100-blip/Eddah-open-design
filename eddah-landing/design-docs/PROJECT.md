# PROJECT — معلومات المشروع (آخر تحديث: 2 يونيو 2026)

## ما هو
صفحة هبوط عربية RTL فاخرة لعلامة **عدة / EDDAH**، خدمة صيانة منزلية محلية في **حي لبن، الرياض**. التحويل عبر **واتساب**.

## الريبو والبرانش
- **Repo:** `akoz20100-blip/Eddah-open-design`
- **Branch:** `claude/test-coverage-analysis-V9g4A` ← لا تنشئ برانش جديد إلا بإذن
- **Working dir:** `eddah-landing/`

## الستاك
- **Next.js 14** (App Router) · **React 18** · **TypeScript 5**
- **Tailwind CSS 3** · **framer-motion 11**
- **Package manager:** npm · **Node:** ≥ 18.18
- **أوامر:** `npm run dev` · `npm run build` · `npm run lint` · `npm start`

## نطاق الخدمات — صارم لا يتغير
**٣ خدمات فقط:** السباكة · الكهرباء · التكييف
ممنوع منعاً باتاً (أي إشارة أو تلميح): تنظيف خزانات · دهانات · نجارة · تنظيف · مكافحة حشرات · إصلاح أجهزة · «صيانة عامة».

## النصوص الرسمية للعلامة
| العنصر | النص |
|---|---|
| العنوان الرئيسي | «فنّيك في حيّك، تواصل وأبشر بالسعد» |
| جملة الدعم | «خدمة صيانة منزلية منظمة وسريعة في حي لبن لخدمات السباكة والكهرباء والتكييف، بمواعيد واضحة وضمان على الشغل.» |
| سطر الوضوح | «صيانة منزلية في حي لبن — سباكة · كهرباء · تكييف» |
| CTA رئيسي | «اطلب الفني الآن» |
| CTA ثانوي | «شاهد الخدمات» |
| CTA نهائي | «جاهز نرسل لك الفني؟» → «تواصل واتساب» |
| رسائل الثقة | خدمة داخل حي لبن · مواعيد واضحة · ضمان على الشغل · فني قريب منك · تجربة مرتّبة من أول تواصل |

## ترتيب الأقسام (الحالي في page.tsx)
`ScrollProgress → Nav → Hero → StatsBand → ValueProps → Services → Showcase → LocalFocus → HowItWorks → MapSection → Testimonials → Trust → CTASection → Footer`

## الأصول (`public/brand/`) — حقيقية جميعها
| المفتاح في brandImages.ts | الملف | الاستخدام |
|---|---|---|
| `heroTechnician` | `hero-technician.png` | بطل الصفحة |
| `servicePlumbing` | `service-plumbing.png` | قسم السباكة |
| `serviceElectrical` | `service-electrical.png` | قسم الكهرباء |
| `serviceAc` | `service-ac.png` | قسم التكييف |
| `toolsShowcase` | `tools-showcase.png` | Showcase + خلفية CTA |
| `precisionWorkshop` | `precision-workshop.png` | Showcase (دقّة الإتقان) |
| `labanMap` | `laban-map.png` | MapSection (القسم الرئيسي) + مصدر اللون |
| `logo` | `logo-eddah.png` | Footer + favicon + OG |

أصول UUID أخرى في `public/brand/` — لا تستخدمها، غير موثّقة في brandImages.ts.

## البنية (الملفات المهمة)
```
src/app/
  page.tsx          ← ترتيب الأقسام
  layout.tsx        ← metadata + خط IBM Plex Sans Arabic + favicon
  globals.css       ← CSS vars + utilities (eyebrow, text-orange-gradient, orange-wash, noise, reduced-motion)

src/lib/
  brand.ts          ← WHATSAPP_NUMBER (فاضي حالياً) + BRAND + whatsappLink() + telLink()
  brandImages.ts    ← مانيفست الصور (مصدر واحد لكل /brand/*)
  motion.ts         ← EASE_OUT + staggerContainer + fadeUp + fadeUpSmall + wordReveal + scaleIn + inViewProps
  cn.ts             ← clsx helper

src/components/sections/
  Nav · Hero · StatsBand · ValueProps · Services · Showcase
  LocalFocus · HowItWorks · MapSection · Testimonials · Trust · CTASection · Footer

src/components/ui/
  BrandImage · Container · Logo · MagneticButton · Marquee · Reveal · ScrollProgress · SectionHeading

src/components/icons/
  Icons.tsx         ← WhatsappIcon · PinIcon · ArrowIcon · StarIcon · CheckIcon · ClockIcon · RouteIcon · CalendarIcon · ShieldIcon
  ServiceIcons.tsx  ← PlumbingIcon · ElectricalIcon · CoolingIcon

src/components/map/
  RiyadhMap.tsx     ← SVG خريطة (مكمّل للـ MapSection)
```

## الحالة الحالية — ما هو موجود وما هو ناقص
| العنصر | الحالة |
|---|---|
| جميع الأقسام (13 قسم + footer) | ✅ مبنية وعاملة |
| نظام التصميم (tokens + motion + brandImages) | ✅ مكتمل |
| الصور الحقيقية في public/brand | ✅ كلها موجودة |
| `airy` / `airy-lg` في tailwind.config | ❌ غير مضاف بعد |
| `StickyWhatsApp` FAB العائم | ❌ غير منفّذ بعد |
| `WHATSAPP_NUMBER` | ❌ فاضي (أزرار تشير لـ `#`) |
| micro-polish Hero + Services | ⏳ تصميم جاهز، تنفيذ Codex |
| polish Map + Trust + Showcase pass 2 | ⏳ تصميم جاهز، تنفيذ Codex |

## تشغيل
```bash
cd eddah-landing
npm install
npm run dev      # http://localhost:3000
npm run build    # تحقّق أنه يمرّ قبل أي commit
```

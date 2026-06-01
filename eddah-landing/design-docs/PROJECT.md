# PROJECT — معلومات المشروع

## ما هو
صفحة هبوط عربية (RTL) فاخرة لعلامة **عدة / EDDAH**، خدمة صيانة منزلية محلية
في **حي لبن، الرياض**، بأسلوب local-first وتحويل عبر **واتساب**.

## المكان
- **الريبو:** `akoz20100-blip/Eddah-open-design`
- **البرانش:** `claude/test-coverage-analysis-V9g4A` (لا تنشئ برانش جديد إلا بإذن)
- **مجلد العمل:** `eddah-landing/`

## الستاك
- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS 3** · **framer-motion 11** (الحركة)
- **مدير الحزم:** npm · **Node:** ≥ 18.18
- أوامر: `npm run dev` · `npm run build` · `npm run lint`

## نطاق الخدمات — صارم
**٣ خدمات فقط:** السباكة · الكهرباء · التكييف.
ممنوع (ولا تلميح): تنظيف خزانات، دهانات، نجارة، تنظيف، مكافحة حشرات، إصلاح أجهزة،
«صيانة عامة» كتصنيف، أو أي خدمة أخرى — في أي بطاقة/أيقونة/CTA/FAQ/نص.

## نصوص العلامة (رسمية)
- **العنوان:** «فنيك في حيك، تواصل وأبشر بالسعد»
- **الدعم:** «خدمة صيانة منزلية منظمة وسريعة في حي لبن لخدمات السباكة والكهرباء والتكييف، بمواعيد واضحة وضمان على الشغل.»
- **سطر الوضوح:** «صيانة منزلية في حي لبن — سباكة · كهرباء · تكييف»
- **CTA رئيسي:** «اطلب الفني الآن» · **ثانوي:** «شاهد الخدمات»
- **CTA نهائي:** «جاهز نرسل لك الفني؟» → «تواصل واتساب»
- **رسائل الثقة:** خدمة داخل حي لبن · مواعيد واضحة · ضمان على الشغل · فني قريب منك · تجربة مرتّبة من أول تواصل

## ترتيب الأقسام (الحالي)
Nav → Hero → StatsBand → ValueProps (ليش عدة) → Services → Showcase (الأدوات/الدقة) →
LocalFocus → HowItWorks → MapSection (حي لبن) → Testimonials → Trust (نظام الخدمة) → CTA → Footer.
(+ ScrollProgress + StickyWhatsApp عائم)

## الأصول الحقيقية وأماكنها (`public/brand/`)
| الملف | الاستخدام |
| --- | --- |
| `hero-technician.png` | بطل الصفحة |
| `service-plumbing.png` | السباكة |
| `service-electrical.png` | الكهرباء |
| `service-ac.png` | التكييف |
| `tools-showcase.png` | قسم الأدوات/الدقة + خلفية CTA |
| `precision-workshop.png` | قسم الدقة/الإتقان |
| `laban-map.png` | **قسم حي لبن الرئيسي + مصدر اللون** (دبوس برتقالي، حي لبن، غرب الرياض، شعار عدة، خلفية بيج) |
| `logo-eddah.png` | الفوتر + favicon + OG |

أصول قديمة **محذوفة/ممنوعة:** brand-loop.mp4/-poster، craftsman، master، precision.jpg،
products، silent-work، toolbag، tools-float، trust-water، github-repo.

## البنية (ملفات مهمة)
- `src/app/page.tsx` — ترتيب الأقسام · `src/app/layout.tsx` — ميتا/خط/favicon · `src/app/globals.css`
- `src/lib/brandImages.ts` — مانيفست الصور (مصدر واحد لكل `/brand/*`)
- `src/lib/brand.ts` — `WHATSAPP_NUMBER` (فاضي حالياً → الأزرار تشير لـ`#`)، روابط واتساب
- `src/lib/motion.ts` — لغة الحركة الموحّدة
- `src/components/sections/*` · `src/components/ui/*` (BrandImage, Reveal, MagneticButton, Logo, StickyWhatsApp)

## تشغيل ومعاينة
```bash
cd eddah-landing
npm install
npm run dev      # http://localhost:3000
npm run build    # بناء إنتاجي (يفحص الأنواع واللينت)
```

## حدود/ملاحظات
- `WHATSAPP_NUMBER` فاضي → ضع الرقم الدولي (مثال `9665XXXXXXXX`) لتفعيل كل أزرار واتساب.
- المراجعات في `Testimonials` عيّنات موضّحة (ليست حقيقية موثّقة) — لا تُقدَّم كمؤكَّدة.

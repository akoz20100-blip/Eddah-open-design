# عدة — Landing Page

صفحة هبوط عربية RTL لعلامة **عدة / Eddah** لخدمات الصيانة المنزلية داخل **حي لبن، الرياض**.
التحويل الأساسي عبر واتساب، والخدمات محصورة في: السباكة، الكهرباء، والتكييف.

Built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## التشغيل

Requires Node 18.18+ and npm.

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run start
```

## إعدادات الإطلاق

اضبط هذه القيم في بيئة النشر، مثل Vercel:

```bash
NEXT_PUBLIC_SITE_URL=https://eddah.sa
NEXT_PUBLIC_WHATSAPP_NUMBER=966509005845
```

صيغة رقم واتساب: أرقام فقط، بدون `+` وبدون مسافات. رقم عدة الافتراضي داخل الكود هو `966509005845` ويمكن تغييره من متغير النشر.

## بنية الصفحة

الترتيب الحالي:

`ScrollProgress → StickyWhatsApp → Nav → Hero → StatsBand → MapSection → HowItWorks → ValueProps → Services → Showcase → LocalFocus → Testimonials → Trust → CTASection → Footer`

## الأصول

تستخدم الصفحة صوراً حقيقية فقط من `public/brand` عبر `src/lib/brandImages.ts`:

- `hero-technician.png`
- `service-plumbing.png`
- `service-electrical.png`
- `service-ac.png`
- `tools-showcase.png`
- `precision-workshop.png`
- `laban-map.png`
- `logo-eddah.png`
- `eddah-logo-official.png`

لا تستخدم أصول UUID الموجودة في `public/brand` ما لم تُضاف صراحة إلى `brandImages.ts`.

## قبل النشر

```bash
npm run build
grep -rE "تنظيف الخزانات|الدهانات|النجارة|مكافحة الحشرات|إصلاح الأجهزة" src
grep -rEn "brand-loop|craftsman|trust-water|tools-float|github-repo|\"products\"|\"master\"" src
grep -rn "labanMap" src
```

النتيجة المطلوبة:

- البناء يمر.
- أوامر البحث الأولى لا تطبع نتائج.
- `labanMap` يظهر في `MapSection` و`brandImages.ts`.

## ملاحظات

- الصفحة عربية بالكامل و`dir="rtl"`.
- الحركة تعتمد على Framer Motion فقط وتحترم `prefers-reduced-motion`.
- `robots.txt` و`sitemap.xml` يتم توليدهما من Next.js باستخدام `NEXT_PUBLIC_SITE_URL`.
- رقم واتساب مصدره الوحيد `src/lib/brand.ts`.
- مكوّن `Logo` يستخدم أصل الشعار الرسمي الشفاف `eddah-logo-official.png` عبر `brandImages.ts`.

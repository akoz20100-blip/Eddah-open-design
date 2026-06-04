# خطوط عدّة — خط ثمانية (Thmanyah)

خط الهوية الأساسي للموقع هو **خط ثمانية** (Thmanyah typeface).

## العائلات المستخدمة
- **Thmanyah Sans** → النصوص والواجهة والأزرار (متغيّر `--font-arabic`).
- **Thmanyah Serif Display** → العناوين الكبيرة H1/H2 (متغيّر `--font-display`) — إحساس تحريري.
- (متوفّرة أيضًا Thmanyah Serif Text لكنها غير مستخدمة في الموقع.)

## الملفات
- `thmanyah/` — صيغة **woff2** (الأوزان المستخدمة على الويب: Light 300, Regular 400, Medium 500, Bold 700, Black 900) لكل من Sans و Serif Display.
- `thmanyah-otf/` — النسخ الأصلية **otf** (للتصميم في Figma/أدوبي).
- `ترخيص خط ثمانية.pdf` — رخصة الاستخدام (راجعها قبل أي استخدام تجاري موسّع).

## التفعيل في Next.js (next/font/local)
انظر `../code-snippets/layout.tsx` — يُحمّل من `public/fonts/thmanyah/*.woff2` ويعرّف
المتغيّرين `--font-arabic` و`--font-display`، ثم في CSS:
```css
h1, h2 { font-family: var(--font-display), var(--font-arabic), Georgia, serif; }
body   { font-family: var(--font-arabic), system-ui, sans-serif; }
```

## التفعيل بـ @font-face عادي (لأي مشروع)
```css
@font-face{font-family:"Thmanyah Sans";src:url("thmanyah/thmanyahsans-Regular.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"Thmanyah Sans";src:url("thmanyah/thmanyahsans-Bold.woff2") format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:"Thmanyah Serif Display";src:url("thmanyah/thmanyahserifdisplay-Bold.woff2") format("woff2");font-weight:700;font-display:swap}
/* …بقية الأوزان بنفس النمط */
```

ملاحظة: لا تستخدم تتبّعًا (letter-spacing) سالبًا قويًا على العربية — الحروف متّصلة. استخدم `-0.01em` كحدّ أقصى.

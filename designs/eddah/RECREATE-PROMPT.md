# أمر إعادة البناء — RECREATE PROMPT

انسخ النص التالي وأعطِه لأي مساعد ذكاء اصطناعي (أو استخدمه كمرجع يدوي) لإعادة بناء موقع عدّة
بنفس الهوية. أرفِق معه مجلد `fonts/` و`assets/` و`code-snippets/` من هذا الريبو.

---

```
ابنِ صفحة هبوط عربية RTL فاخرة لعلامة «عدّة» (Eddah) — صيانة منزلية محلية في حي لبن، الرياض.
التحويل عبر واتساب على الرقم 966509005845. ثلاث خدمات فقط: السباكة، الكهرباء، التكييف
(ممنوع أي خدمة غيرها). صور حقيقية فقط (مرفقة في assets/) — لا stock ولا توليد AI.

الستاك: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS 3 + framer-motion 11.
بدون أي dependency للرسوميات.

الهوية والألوان:
- وضعان قابلان للتبديل وقت التشغيل عبر متغيّرات CSS + data-theme على <html> + زر تبديل في الـ Nav،
  مع حفظ الاختيار في localStorage وسكربت سطري يمنع وميض الإقلاع.
- النهاري «Ivory & Amber»: خلفية #FCF8F1، نص #1A1714، أكسنت برتقالي #F2820C، ذهبي #F6A700، بطاقات بيضاء.
- المسائي «Black & Amber»: خلفية #030305 (أسود)، أسطح #0C0B11، نص #F5F2FF، نفس الأكسنت البرتقالي،
  والكلمات المميّزة برتقالية، ولمسة بنفسجية #7C4DFF خافتة جدًا في الخلفية فقط (لا توهّج ذهبي).
- استخدم صيغة rgb(var(--token) / <alpha-value>) في tailwind.config (انظر code-snippets/).

الخطوط: خط ثمانية (مرفق في fonts/) عبر next/font/local — Thmanyah Sans للنصوص،
Thmanyah Serif Display للعناوين H1/H2. تتبّع العناوين -0.01em فقط (لا سالب قوي على العربية).

الخلفية: نيبولا «سديم» على Canvas محلي خلف كل المحتوى (انظر code-snippets/NebulaBackground.tsx):
كهرماني نهارًا (source-over)، بنفسجي خافت ليلًا (lighter)، blur قوي، يحترم prefers-reduced-motion،
يتوقّف عند إخفاء التبويب، ويتبدّل مع الوضع.

التخطيط والإيقاع: حاوية 1180px؛ أقسام py-20 md:py-28؛ زوايا كبيرة 1.5–2.75rem؛
شبكة خدمات غير متناظرة (bento)؛ قلّل «كروت AI» — استخدم تخطيطًا تحريريًا بقوائم وحدود شعرية
بدل صناديق أيقونات مكرّرة؛ فراغ سخيّ؛ موبايل أولًا.

الحركة: easing واحد cubic-bezier(0.16,1,0.3,1)؛ fadeUp + wordReveal للعناوين + parallax خفيف للصور؛
كل شيء يحترم prefers-reduced-motion.

ترتيب الأقسام:
Nav → Hero → StatsBand → MapSection → HowItWorks → ValueProps → Services → Showcase →
LocalFocus → Testimonials → Trust → CTA → Footer.

النصوص الرسمية والأصول وكل التفاصيل في design/BRAND.md و design/DESIGN-SYSTEM.md بهذا الريبو.
```

---

## ملفات جاهزة للنسخ المباشر (في `code-snippets/`)
`tailwind.config.ts` · `globals.css` · `layout.tsx` · `NebulaBackground.tsx` · `ThemeToggle.tsx` ·
`brand.ts` · `brandImages.ts` · `motion.ts` · `next.config.mjs` · `sadim-shader-standalone.html`.

انسخها كما هي، وضع الخطوط في `public/fonts/thmanyah/` والصور في `public/brand/`.

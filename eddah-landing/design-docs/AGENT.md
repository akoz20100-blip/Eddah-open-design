# AGENT — دليل الوكيل (آخر تحديث: 2 يونيو 2026)

موجَّه لأي وكيل/مساعد ذكاء اصطناعي يعدّل موقع عدة.
**اقرأ `PROJECT.md` و`DESIGN.md` أولاً قبل أي تعديل.**

---

## القواعد المطلقة
1. اشتغل داخل `eddah-landing/` فقط — لا تبني مشروع جديد ولا تستبدل القائم.
2. **٣ خدمات فقط:** السباكة · الكهرباء · التكييف. لا تضيف/تلمّح لغيرها أي مكان.
3. **صور حقيقية فقط** من `public/brand` عبر `brandImages.ts` — لا stock · لا placeholder · لا توليد AI · لا أصول قديمة.
4. فاتح/دافئ/فاخر — **مو داكن**. اشتقّ اللون من `laban-map.png`.
5. `laban-map.png` = القسم المحلي الرئيسي + مصدر اللون.
6. **لا تضيف dependencies جديدة** بدون إذن. استخدم framer-motion الموجود. لا Lenis. لا GSAP.
7. **لا تبدأ إعادة تصميم** بدون عرض اقتراح والموافقة عليه.
8. **لا commit ولا push** بدون موافقة صريحة. لا تنشئ برانش جديد.
9. RTL عربي نظيف دائماً. موبايل ممتاز أولاً.
10. كن صادقاً مع النتيجة — أعطِ خيارات بدل نتيجة ضعيفة.

---

## سير العمل (Workflow)
```
اقرأ docs → اقترح → وافق → نفّذ → npm run build → لقطات → مراجعة ذاتية → وافق → commit/push
```
- نفّذ على دفعات صغيرة قابلة للمراجعة.
- بعد التنفيذ اعرض: الملفات المتغيّرة · before/after · نتيجة البناء · لقطات desktop+mobile.

---

## فحص إلزامي بعد أي تعديل
```bash
cd eddah-landing
npm run build
# لازم يمرّ — يشمل TypeScript + lint

grep -rE "تنظيف الخزانات|الدهانات|النجارة|مكافحة الحشرات|إصلاح الأجهزة" src
# لازم فاضي

grep -rEn "brand-loop|craftsman|trust-water|tools-float|github-repo|\"products\"|\"master\"" src
# لازم فاضي

grep -rn "labanMap" src
# لازم موجود (MapSection يستخدمه)
```
تأكّد بصرياً: الخدمات الثلاث فقط · الصور الحقيقية تظهر · RTL سليم · موبايل مريح · CTA واضح.

---

## النشر (عند الموافقة فقط)
- **نفس البرانش:** `claude/test-coverage-analysis-V9g4A` — لا برانش جديد
- **Conventional Commits:**
  ```
  feat(hero): word-reveal + parallax polish
  fix(map): align legend RTL
  ```
- ذيّل الرسالة بـ:
  `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- لا تخلط ملفات `design-docs/` مع كود التصميم في نفس commit إلا لو طُلب.

---

## الحركة (motion.ts)
- لغة easing واحدة: `EASE_OUT = [0.16,1,0.3,1]`
- primitives: `fadeUp` · `fadeUpSmall` · `wordReveal` · `scaleIn` · `staggerContainer` · `inViewProps`
- parallax: `useScroll + useTransform` على الصور
- كل شي تحت `@media (prefers-reduced-motion: reduce)` (موجود في globals.css)

---

## قائمة المهام المعلّقة لـ Codex

### أولوية عالية
- [ ] **`StickyWhatsApp` FAB** — زر واتساب عائم يظهر بعد تجاوز Hero بـ scrollY. يستخدم `MagneticButton` variant whatsapp + `whatsappLink()`. مع `framer-motion` animate presence.
- [ ] **`shadow-airy` + `shadow-airy-lg`** — أضفهما لـ `tailwind.config.ts`:
  ```ts
  airy: "0 4px 32px -4px rgba(26,23,20,0.06), 0 1px 4px rgba(26,23,20,0.04)",
  "airy-lg": "0 8px 64px -8px rgba(26,23,20,0.09), 0 2px 8px rgba(26,23,20,0.04)",
  ```
- [ ] **`WHATSAPP_NUMBER`** في `src/lib/brand.ts` — أضف رقم الواتساب الفعلي (صيغة دولية بدون +: `9665XXXXXXXX`).

### أولوية متوسطة (polish passes)
- [ ] **Hero micro-polish** — wordReveal للعنوان · parallax للصورة أقوى · توهّج كهرماني خلف الصورة · تحسين موبايل.
- [ ] **Services micro-polish** — تحسين hover state · شارة الأيقونة العائمة · الشِب الزجاجي على الصورة أوضح.
- [ ] **MapSection pass 2** — تحسين legend alignment · ربط الدبوس بصورة laban-map بشكل أوضح.
- [ ] **Trust pass 2** — تحسين Marquee + بطاقات الضمان بـ `shadow-airy`.
- [ ] **Showcase pass 2** — تحسين split-panel + parallax أقوى للصورتين.

### أولوية منخفضة (تحسينات بصرية)
- [ ] توحيد tone الصور الثلاث بفلاتر CSS خفيفة.
- [ ] micro-interactions إضافية: cursor-follow · عدّاد أرقام StatsBand · كشف صورة بـmask.
- [ ] تحسين type scale ومسافات أوسع في بعض الأقسام.

---

## الانتقال إلى Codex — قائمة التحقّق

### 1 — تحقّق من التوثيق
- [ ] `DESIGN.md` يعكس القرارات النهائية
- [ ] `PROJECT.md` محدَّث بأي أصول/مسارات جديدة
- [ ] `README.md` يذكر أي قسم جديد

### 2 — تحقّق من الكود
```bash
cd eddah-landing
npm run build          # لازم يمرّ
git status             # لا uncommitted غير مقصود
git log --oneline -5   # آخر commits واضحة
```

### 3 — تحقّق من المحتوى
```bash
grep -rE "تنظيف الخزانات|الدهانات|النجارة|مكافحة الحشرات" src   # فاضي
grep -rn "labanMap" src                                            # موجود
```

### 4 — ارفع أي تغيير معلّق
```bash
git add eddah-landing/
git commit -m "feat(design): apply final Claude Design changes"
git push origin claude/test-coverage-analysis-V9g4A
```

### 5 — تأكّد على GitHub
`github.com/akoz20100-blip/Eddah-open-design/tree/claude/test-coverage-analysis-V9g4A/eddah-landing`
تأكّد: `design-docs/` (4 ملفات) · `src/` · `public/brand/` (8 صور + README)

### 6 — أمر بداية Codex (انسخه كاملاً)
```
Repo: akoz20100-blip/Eddah-open-design
Branch: claude/test-coverage-analysis-V9g4A
Working dir: eddah-landing/

اقرأ أولاً:
1. eddah-landing/design-docs/AGENT.md
2. eddah-landing/design-docs/DESIGN.md
3. eddah-landing/design-docs/PROJECT.md

المهمة:
[اكتب المهمة هنا]

قواعد:
- لا dependencies جديدة
- لا برانش جديد
- npm run build لازم يمرّ قبل commit
- Conventional Commits + Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

### مرجع الريبو السريع
| | |
|---|---|
| Repo | `akoz20100-blip/Eddah-open-design` |
| Branch | `claude/test-coverage-analysis-V9g4A` |
| مسار الموقع | `eddah-landing/` |
| التوثيق | `eddah-landing/design-docs/` |

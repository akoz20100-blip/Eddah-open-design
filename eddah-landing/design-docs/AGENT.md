# AGENT — دليل الوكيل (كيف يشتغل AI على هذا الموقع)

موجّه لأي وكيل/مساعد ذكاء اصطناعي يعدّل موقع عدة. اقرأ `PROJECT.md` و`DESIGN.md` أولاً.

## القواعد المطلقة
1. اشتغل داخل `eddah-landing/` فقط — لا تبني مشروع جديد ولا تستبدل القائم.
2. **٣ خدمات فقط:** السباكة · الكهرباء · التكييف. لا تضيف/تلمّح لغيرها في أي مكان.
3. **صور حقيقية فقط** من `public/brand` — لا stock، لا placeholder، لا توليد AI، لا أصول داكنة قديمة، ولا تستبدل الصور الحالية.
4. فاتح/دافئ/فاخر — **مو داكن**. اشتقّ اللون من `laban-map.png`.
5. `laban-map.png` = القسم المحلي الرئيسي + مصدر اللون (ما يُعامَل كزينة صغيرة).
6. **لا تضيف اعتماديات (dependencies)** جديدة بدون إذن. استخدم framer-motion الموجود. لا Lenis.
7. **لا تبدأ إعادة تصميم بدون عرض اقتراح والموافقة عليه.**
8. **لا commit ولا push** بدون موافقة صريحة. لا تنشئ برانش جديد.
9. RTL عربي نظيف دائماً، وموبايل ممتاز (مو بطاقات طويلة مملّة).
10. لا تدّعي إن النتيجة «فاخرة» لو لسه أساسية — كن صادقاً، وأعطِ خيارات بدل نتيجة ضعيفة.

## سير العمل (Workflow)
`فحص → اقتراح تصميم → موافقة → تنفيذ → build → لقطات → مراجعة ذاتية نقدية → موافقة → commit/push`
- نفّذ على دفعات صغيرة قابلة للمراجعة (مثال: Hero + Services أولاً، ثم بقية الأقسام).
- بعد التنفيذ اعرض: الأقسام المتغيّرة، الملفات المتغيّرة، before/after، لقطات desktop+mobile، نتيجة البناء.

## فحص إلزامي بعد أي تعديل
```bash
cd eddah-landing && npm run build          # لازم ينجح (types + lint)
grep -rE "تنظيف الخزانات|الدهانات|النجارة|مكافحة الحشرات|إصلاح الأجهزة" src   # لازم فاضي
grep -rEn "brand-loop|craftsman|trust-water|tools-float|github-repo|\"products\"|\"master\"" src  # لازم فاضي
grep -rn "labanMap" src                     # لازم مستخدم (قسم الخريطة)
```
تأكّد بصرياً: الخدمات الثلاث فقط، الصور الحقيقية تظهر، RTL سليم، الموبايل مريح، الـCTA واضح.

## اللقطات/المعاينة
- المعاينة: `npm run dev` (http://localhost:3000).
- لقطات آلية بدون اعتماد دائم: شغّل `next start` على بورت، والتقط عبر Playwright مؤقتاً
  (ثبّته كـdevDependency للقطة فقط ثم `git checkout package.json package-lock.json` — لا تترك اعتماد جديد).

## النشر (عند الموافقة فقط)
- نفس البرانش `claude/test-coverage-analysis-V9g4A` — **لا برانش جديد**.
- Conventional Commits، وذيّل الرسالة بـ:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- لا تخلط ملفات التوثيق مع كود التصميم في نفس commit إلا لو طُلب.

## الحركة (تفاصيل)
- لغة easing واحدة: `EASE_OUT = [0.16,1,0.3,1]` (`src/lib/motion.ts`).
- primitives: `fadeUp` · `staggerContainer` · `wordReveal` · `Reveal`/`Reveal.Group`.
- أنماط: دخول البطل (كشف كلمات)، كشف عند السكرول متدرّج، parallax خفيف للصور،
  رفع/عمق عند hover، شريط تقدّم، navbar لاصق، FAB واتساب.
- كل شي تحت `@media (prefers-reduced-motion: reduce)` (موجود في `globals.css`).

## نقاط تحسين معروفة (بالكود فقط، بدون أصول جديدة)
- توحيد لون الصور الثلاث عبر فلاتر CSS خفيفة لاتساق art-direction.
- ضبط type scale ومسافات أوسع، توهّج كهرماني أنعم/حبيبة خفيفة خلف البطل.
- micro-interactions إضافية (cursor-follow، عدّاد أرقام، كشف صورة بـmask).
- السقف الواقعي بالأصول الحالية ≈ 8.7–9/10؛ لتجاوزه تحتاج تصوير متّسق أو أصل 3D/جرافيك مخصّص.

---

## الانتقال إلى Codex — قائمة التحقّق

> **متى تُستخدَم:** بعد انتهاء مرحلة التصميم في Claude Design وقبل بدء تنفيذ الكود في Codex.

### 1 — تحقّق من التوثيق (Claude Design → design-docs)
- [ ] `DESIGN.md` يعكس القرارات النهائية (بالِت، خطوط، مسافات، مكوّنات جديدة).
- [ ] `PROJECT.md` محدَّث (أي أصول/مسارات أضيفت أو تغيّرت).
- [ ] `README.md` يذكر أي قسم/صفحة جديدة أُضيفت في هذا البرانش.

### 2 — تحقّق من الكود (git status نظيف)
```bash
cd eddah-landing
npm run build          # لازم يمرّ بدون أخطاء
git status             # لا يوجد uncommitted غير مقصود
git log --oneline -5   # آخر 5 commits واضحة
```

### 3 — تحقّق من المحتوى (3 خدمات فقط)
```bash
grep -rE "تنظيف الخزانات|الدهانات|النجارة|مكافحة الحشرات" src  # لازم فاضي
grep -rn "labanMap" src     # لازم موجود
```

### 4 — ارفع أي تغيير معلّق
```bash
git add eddah-landing/
git commit -m "feat(design): apply Claude Design final changes"
git push origin claude/test-coverage-analysis-V9g4A
```

### 5 — تأكّد على GitHub (بصرياً)
افتح:
`github.com/akoz20100-blip/Eddah-open-design/tree/claude/test-coverage-analysis-V9g4A/eddah-landing`

تأكّد من وجود:
- `design-docs/` — 4 ملفات (AGENT · DESIGN · PROJECT · README)
- `src/` — تاريخ آخر تعديل صحيح
- `public/brand/` — الصور الحقيقية

### 6 — ابدأ في Codex
في بداية كل جلسة Codex، أرسل:
> "اقرأ `eddah-landing/design-docs/AGENT.md` و`DESIGN.md` و`PROJECT.md` أولاً، ثم نفّذ: [المهمة]."

---

### مرجع سريع
| العنصر | القيمة |
|---|---|
| Repo | `akoz20100-blip/Eddah-open-design` |
| Branch | `claude/test-coverage-analysis-V9g4A` |
| مسار الموقع | `eddah-landing/` |
| توثيق التصميم | `eddah-landing/design-docs/` |

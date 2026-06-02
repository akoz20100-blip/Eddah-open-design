# design-docs — توثيق موقع عدة (آخر تحديث: 2 يونيو 2026)

مجلد التوثيق المستقل لموقع عدة. يُستخدَم مرجعاً عند بدء أي وكيل/مساعد جديد.

## الملفات
| الملف | المحتوى |
|---|---|
| **`README.md`** | هذا الفهرس |
| **`PROJECT.md`** | الريبو · الستاك · الأصول · البنية · الحالة الحالية |
| **`DESIGN.md`** | البالِت · الخطوط · الظلال · المكوّنات · الحركة |
| **`AGENT.md`** | قواعد العمل · سير العمل · المهام المعلّقة · أمر Codex |

## مرجع سريع

**العلامة:** عدة / EDDAH — صيانة منزلية، حي لبن، الرياض
**الخدمات:** السباكة · الكهرباء · التكييف (٣ فقط، لا غير)
**الهوية:** Ivory & Amber — فاتح · دافئ · فاخر · RTL عربي
**التحويل:** واتساب (WHATSAPP_NUMBER في src/lib/brand.ts — فاضي حالياً)

**Repo:** `akoz20100-blip/Eddah-open-design`
**Branch:** `claude/test-coverage-analysis-V9g4A`
**Working dir:** `eddah-landing/`

## الحالة الحالية
- ✅ 13 قسم + footer مبنية وعاملة
- ✅ نظام التصميم مكتمل (tokens + motion + brandImages)
- ✅ 8 صور حقيقية في public/brand
- ❌ StickyWhatsApp FAB — لم يُنفَّذ
- ❌ shadow-airy — لم يُضَف لـ tailwind.config
- ❌ WHATSAPP_NUMBER — فاضي
- ⏳ polish passes: Hero · Services · Map · Trust · Showcase

## للبدء في Codex
ابدأ بأمر البداية الكامل في `AGENT.md` (قسم "أمر بداية Codex").

# Brand images — drop them here

Put the عدة identity creatives in this folder using these **exact filenames**.
They appear on the site automatically; until a file exists, an elegant labelled
placeholder is shown in its place.

| filename          | where it shows            | creative (by @dukkan.alhawiyah)            | ideal crop      |
| ----------------- | ------------------------- | ------------------------------------------ | --------------- |
| `master.jpg`      | Hero (main visual)        | «صاحب المهمات المستحيلة» — الرجل على الكرسي | portrait 4:5    |
| `precision.jpg`   | Showcase row 1            | «دقة ما تغلط» — طاولة الفحص والمحابس         | landscape 4:3   |
| `trust-water.jpg` | Showcase row 2            | «ثقة ما تتسرّب» — اليد والماء                | portrait 4:5    |
| `products.jpg`    | Services (products band)  | شبكة المنتجات على خلفية فاتحة                | square 1:1      |
| `tools-float.jpg` | CTA background (faded)    | الأدوات الطائرة + اليد                       | any (faded)     |

## Notes
- Provide the **clean creatives** (without the phone screenshot UI / status bar / message bar).
- Dark/moody originals are auto-brightened on display to match the bright identity
  (see `src/components/ui/BrandImage.tsx`). To tune, adjust the `tone` field in
  `src/lib/brandImages.ts`.
- Recommended: ~1600px on the long edge, JPG, optimized.
- `.webp` works too — just rename the entry in `src/lib/brandImages.ts`.

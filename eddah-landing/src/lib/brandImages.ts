/**
 * Brand image manifest.
 *
 * These map to the عدة identity creatives (by @dukkan.alhawiyah). Drop the real
 * files into `public/brand/<file>` and they appear automatically; until then a
 * tasteful labelled placeholder renders in their place (see BrandImage).
 *
 * `tone: "dark"` images are displayed with a brightening treatment + light scrim
 * so the moody originals sit comfortably in the bright brand identity.
 */
export type BrandImageKey =
  | "master"
  | "toolsFloat"
  | "trustWater"
  | "precision"
  | "products";

export type BrandImageMeta = {
  file: string;
  /** Arabic label shown on the placeholder and used as alt text. */
  label: string;
  /** Source mood — "dark" originals get brightened on display. */
  tone: "dark" | "light";
};

export const BRAND_IMAGES: Record<BrandImageKey, BrandImageMeta> = {
  master: {
    file: "master.jpg",
    label: "القوة اللي ما تحتاج صوت",
    tone: "dark",
  },
  toolsFloat: {
    file: "tools-float.jpg",
    label: "اللي يفهم التفاصيل الصغيرة يسيطر على الكبيرة",
    tone: "dark",
  },
  trustWater: {
    file: "trust-water.jpg",
    label: "ثقة ما تتسرّب",
    tone: "dark",
  },
  precision: {
    file: "precision.jpg",
    label: "دقة ما تغلط",
    tone: "dark",
  },
  products: {
    file: "products.jpg",
    label: "أدوات ومنتجات عدة",
    tone: "light",
  },
};

export const brandImageSrc = (key: BrandImageKey) =>
  `/brand/${BRAND_IMAGES[key].file}`;

/**
 * Brand image manifest — the real عدة creatives (@dukkan.alhawiyah).
 * Files live in public/brand/. They are pre-lightened to suit the bright
 * identity, so tone is "light" (no extra CSS lift). A labelled placeholder
 * shows only if a file is missing.
 */
export type BrandImageKey =
  | "master"
  | "craftsman"
  | "precision"
  | "trustWater"
  | "silentWork"
  | "toolsFloat"
  | "products"
  | "toolbag";

export type BrandImageMeta = {
  file: string;
  label: string;
  tone: "dark" | "light";
};

export const BRAND_IMAGES: Record<BrandImageKey, BrandImageMeta> = {
  master: { file: "master.jpg", label: "صاحب المهمات المستحيلة", tone: "light" },
  craftsman: { file: "craftsman.jpg", label: "القوة اللي ما تحتاج صوت", tone: "light" },
  precision: { file: "precision.jpg", label: "دقة ما تغلط", tone: "light" },
  trustWater: { file: "trust-water.jpg", label: "ثقة ما تتسرّب", tone: "light" },
  silentWork: { file: "silent-work.jpg", label: "يشتغل بصمت ويصنع الفرق", tone: "light" },
  toolsFloat: { file: "tools-float.jpg", label: "اللي يفهم التفاصيل الصغيرة يسيطر على الكبيرة", tone: "light" },
  products: { file: "products.jpg", label: "أدوات ومنتجات عدة", tone: "light" },
  toolbag: { file: "toolbag.jpg", label: "حقيبة العدة", tone: "light" },
};

export const brandImageSrc = (key: BrandImageKey) =>
  `/brand/${BRAND_IMAGES[key].file}`;

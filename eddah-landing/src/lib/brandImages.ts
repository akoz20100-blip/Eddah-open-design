/**
 * Brand image manifest — the real عدة creatives uploaded to public/brand/.
 * Each key maps to a production filename. Photos are bright, on-identity
 * (warm light, copper coveralls, Riyadh skyline), so tone is "light".
 * A labelled placeholder shows only if a file is genuinely missing.
 */
export type BrandImageKey =
  | "heroTechnician"
  | "servicePlumbing"
  | "serviceElectrical"
  | "serviceAc"
  | "toolsShowcase"
  | "precisionWorkshop"
  | "labanMap"
  | "logo";

export type BrandImageMeta = {
  file: string;
  label: string;
  tone: "dark" | "light";
};

export const BRAND_IMAGES: Record<BrandImageKey, BrandImageMeta> = {
  heroTechnician: {
    file: "hero-technician.png",
    label: "فنّي عدة وحقيبة عدّته في بيت بحي لبن",
    tone: "light",
  },
  servicePlumbing: {
    file: "service-plumbing.png",
    label: "إصلاح سباكة دقيق تحت الحوض",
    tone: "light",
  },
  serviceElectrical: {
    file: "service-electrical.png",
    label: "صيانة كهربائية آمنة للوحة المنزل",
    tone: "light",
  },
  serviceAc: {
    file: "service-ac.png",
    label: "صيانة وتنظيف وحدة التكييف",
    tone: "light",
  },
  toolsShowcase: {
    file: "tools-showcase.png",
    label: "أدوات احترافية لكل مهمة",
    tone: "light",
  },
  precisionWorkshop: {
    file: "precision-workshop.png",
    label: "دقّة ما تغلط — طاولة الفحص والمحابس",
    tone: "light",
  },
  labanMap: {
    file: "laban-map.png",
    label: "نطاق خدمة عدة — حي لبن، غرب الرياض",
    tone: "light",
  },
  logo: {
    file: "logo-eddah.png",
    label: "شعار عدة",
    tone: "light",
  },
};

export const brandImageSrc = (key: BrandImageKey) =>
  `/brand/${BRAND_IMAGES[key].file}`;

/**
 * Single source of truth for brand-level constants.
 * Copy lives in Arabic; this file holds the few values reused across sections.
 */

// Set NEXT_PUBLIC_WHATSAPP_NUMBER in the deployment environment to override.
// صيغة الرقم: دولية بدون + ولا مسافات، مثال: 9665XXXXXXXX.
// رقم عدة الافتراضي: +966 50 900 5845.
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966509005845"
).replace(/[^\d]/g, "");

export const WHATSAPP_MESSAGE = "السلام عليكم، أبغى أطلب خدمة صيانة في حي لبن.";

export const hasContact = WHATSAPP_NUMBER.trim().length > 0;

export const whatsappLink = (
  text: string = WHATSAPP_MESSAGE,
  number: string = WHATSAPP_NUMBER,
) =>
  number.trim().length > 0
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : "#";

export const telLink = (number: string = WHATSAPP_NUMBER) =>
  number.trim().length > 0 ? `tel:+${number}` : "#";

export const BRAND = {
  name: "عدة",
  latin: "Eddah",
  tagline: "فنّيك في حيّك",
  area: "حي لبن",
  city: "الرياض",
} as const;

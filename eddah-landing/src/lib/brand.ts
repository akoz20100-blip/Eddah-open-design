/**
 * Single source of truth for brand-level constants.
 * Copy lives in Arabic; this file holds the few values reused across sections.
 */

// TODO: replace with the real business WhatsApp number (international format, no spaces).
export const WHATSAPP_NUMBER = "966500000000";

export const WHATSAPP_MESSAGE = "السلام عليكم، أبغى أطلب خدمة صيانة في حي لبن.";

export const whatsappLink = (
  text: string = WHATSAPP_MESSAGE,
  number: string = WHATSAPP_NUMBER,
) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const BRAND = {
  name: "عدة",
  latin: "Eddah",
  tagline: "فنّيك في حيّك",
  area: "حي لبن",
  city: "الرياض",
} as const;

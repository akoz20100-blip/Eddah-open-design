/**
 * Single source of truth for brand-level constants.
 * Copy lives in Arabic; this file holds the few values reused across sections.
 */

// Not set yet — leave empty until the project has a dedicated number.
// لم يُحدَّد بعد. ضع الرقم بصيغة دولية بدون + ولا مسافات (مثال: "9665XXXXXXXX").
// When empty, WhatsApp/call links fall back to "#" so the buttons stay visible
// in the design without pointing anywhere broken.
export const WHATSAPP_NUMBER = "";

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

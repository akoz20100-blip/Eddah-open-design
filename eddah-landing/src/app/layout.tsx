import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { NebulaBackground } from "@/components/ui/NebulaBackground";

// خط ثمانية — الهوية البصرية الأساسية للموقع.
// Thmanyah Sans للنصوص والواجهة، Thmanyah Serif Display للعناوين الكبيرة (إحساس تحريري).
const arabic = localFont({
  src: [
    { path: "../../public/fonts/thmanyah/thmanyahsans-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahsans-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
});

const display = localFont({
  src: [
    { path: "../../public/fonts/thmanyah/thmanyahserifdisplay-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahserifdisplay-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahserifdisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahserifdisplay-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/thmanyah/thmanyahserifdisplay-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://eddah.sa").replace(/\/$/, "");
// Deploy base path (empty in normal dev/Vercel; set for GitHub Pages project subpath).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "عدة — صيانة منزلية باحتراف في حي لبن",
  description:
    "عدة خدمة صيانة منزلية محلية تركّز على حي لبن في الرياض. سباكة، كهرباء، وتكييف — استجابة سريعة، مواعيد منظّمة، وتنفيذ موثوق.",
  keywords: [
    "صيانة منزلية",
    "حي لبن",
    "الرياض",
    "سباكة",
    "كهرباء",
    "تكييف",
    "عدة",
  ],
  icons: {
    icon: `${BASE_PATH}/brand/logo-eddah.png`,
    apple: `${BASE_PATH}/brand/logo-eddah.png`,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "عدة — فنّيك في حيّك",
    description:
      "صيانة منزلية منظّمة وسريعة في حي لبن بالرياض: سباكة، كهرباء، وتكييف.",
    url: "/",
    siteName: "عدة",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: `${BASE_PATH}/brand/hero-technician.png`,
        width: 1200,
        height: 1500,
        alt: "فنّي عدة لخدمات الصيانة المنزلية في حي لبن",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "عدة — صيانة منزلية في حي لبن",
    description:
      "سباكة، كهرباء، وتكييف داخل حي لبن بالرياض، بمواعيد واضحة وضمان على الشغل.",
    images: [`${BASE_PATH}/brand/hero-technician.png`],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${display.variable}`}>
      <body className="grain bg-clay-50 text-ink font-sans antialiased">
        <NebulaBackground />
        {children}
      </body>
    </html>
  );
}

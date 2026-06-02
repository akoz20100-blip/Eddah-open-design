import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://eddah.sa").replace(/\/$/, "");

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
    icon: "/brand/logo-eddah.png",
    apple: "/brand/logo-eddah.png",
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
        url: "/brand/hero-technician.png",
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
    images: ["/brand/hero-technician.png"],
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
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body className="grain bg-clay-50 text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

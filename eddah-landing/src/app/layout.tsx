import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eddah.sa"),
  title: "عدة — صيانة منزلية باحتراف في حي لبن",
  description:
    "عدة خدمة صيانة منزلية محلية تركّز على حي لبن في الرياض. سباكة، كهرباء، وتكييف وتبريد — استجابة سريعة، مواعيد منظّمة، وتنفيذ موثوق.",
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
  openGraph: {
    title: "عدة — فنّيك في حيّك",
    description:
      "صيانة منزلية منظّمة وسريعة في حي لبن بالرياض: سباكة، كهرباء، وتكييف.",
    locale: "ar_SA",
    type: "website",
    images: ["/brand/logo-eddah.png"],
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

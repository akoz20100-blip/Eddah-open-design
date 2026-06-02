import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { StatsBand } from "@/components/sections/StatsBand";
import { ValueProps } from "@/components/sections/ValueProps";
import { Services } from "@/components/sections/Services";
import { Showcase } from "@/components/sections/Showcase";
import { LocalFocus } from "@/components/sections/LocalFocus";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MapSection } from "@/components/sections/MapSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { Trust } from "@/components/sections/Trust";
import { CTASection } from "@/components/sections/CTASection";
import { Footer } from "@/components/sections/Footer";
import { StickyWhatsApp } from "@/components/ui/StickyWhatsApp";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <StickyWhatsApp />
      <Nav />
      <main>
        <Hero />
        <StatsBand />
        <ValueProps />
        <Services />
        <Showcase />
        <LocalFocus />
        <HowItWorks />
        <MapSection />
        <Testimonials />
        <Trust />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

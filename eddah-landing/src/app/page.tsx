import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { StatsBand } from "@/components/sections/StatsBand";
import { ValueProps } from "@/components/sections/ValueProps";
import { Services } from "@/components/sections/Services";
import { Showcase } from "@/components/sections/Showcase";
import { BrandBand } from "@/components/sections/BrandBand";
import { LocalFocus } from "@/components/sections/LocalFocus";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MapSection } from "@/components/sections/MapSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { Trust } from "@/components/sections/Trust";
import { CTASection } from "@/components/sections/CTASection";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <StatsBand />
        <ValueProps />
        <Services />
        <Showcase />
        <BrandBand />
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

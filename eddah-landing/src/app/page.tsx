import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { ValueProps } from "@/components/sections/ValueProps";
import { Services } from "@/components/sections/Services";
import { LocalFocus } from "@/components/sections/LocalFocus";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MapSection } from "@/components/sections/MapSection";
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
        <ValueProps />
        <Services />
        <LocalFocus />
        <HowItWorks />
        <MapSection />
        <Trust />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

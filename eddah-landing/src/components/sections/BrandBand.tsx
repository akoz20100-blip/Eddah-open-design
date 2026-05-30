"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SparkleIcon } from "@/components/icons/Icons";

/**
 * Cinematic brand-motion band. The looping film is a real video rendered with
 * Remotion (src/eddah-motion → public/brand/brand-loop.mp4) — genuine
 * "video-like richness", not a CSS loop.
 */
export function BrandBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.98]);
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <Reveal className="mb-10 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            هوية حيّة
          </span>
          <h2 className="max-w-2xl text-balance text-3xl font-bold leading-[1.12] tracking-tightest text-ink md:text-[42px]">
            علامة تتحرّك بثقة، مثل خدمتها
          </h2>
        </Reveal>

        <motion.div ref={ref} style={{ scale, y }} className="relative">
          <div className="absolute -inset-4 rounded-[2.75rem] bg-orange-100/50 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-clay-200">
            <video
              className="h-full w-full"
              autoPlay
              loop
              muted
              playsInline
              poster="/brand/brand-loop-poster.jpg"
            >
              <source src="/brand/brand-loop.mp4" type="video/mp4" />
            </video>

            {/* floating caption chip */}
            <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 py-2 shadow-card backdrop-blur">
              <SparkleIcon className="h-4 w-4 text-orange-500" />
              <span className="text-[13px] font-semibold text-ink">عدة · فنّيك في حيّك</span>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

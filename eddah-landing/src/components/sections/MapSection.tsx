"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { BrandImage } from "@/components/ui/BrandImage";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { WhatsappIcon, ClockIcon, RouteIcon } from "@/components/icons/Icons";
import { whatsappLink } from "@/lib/brand";
import { fadeUp, inViewProps } from "@/lib/motion";

const legend = [
  { color: "#F0851A", label: "نطاق الخدمة الحالي — حي لبن" },
  { color: "#DC6E0B", label: "موقع عدة داخل الحي" },
  { color: "#9A9082", label: "أحياء مجاورة (قريبًا)" },
];

export function MapSection() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <section id="map" className="relative scroll-mt-24 overflow-hidden bg-clay-100/60 py-20 md:py-28">
      <Container>
        <div className="grid items-stretch gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* the real branded حي لبن map — the main visual */}
          <motion.div
            ref={ref}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inViewProps.viewport}
            className="relative overflow-hidden rounded-[2.25rem] ring-1 ring-clay-200/70 shadow-airy-lg"
          >
            <motion.div style={{ y: yImg }} className="absolute inset-x-0 -inset-y-[9%] -z-10">
              <BrandImage
                image="labanMap"
                rounded={false}
                priority
                className="h-full w-full"
                imgClassName="object-cover"
              />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-white/10 via-transparent to-orange-50/20" />
            {/* keep a tall, immersive frame even when the panel is short */}
            <div className="min-h-[24rem] lg:min-h-[34rem]" />

            <div
              aria-hidden
              className="absolute right-[37%] top-[44%] h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full border border-orange-300/55 bg-orange-200/10"
            >
              <span className="absolute inset-4 rounded-full border border-orange-400/45" />
              <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 shadow-orange-glow ring-8 ring-orange-200/55" />
              <span className="absolute left-1/2 top-1/2 h-24 w-px origin-top -translate-x-1/2 bg-gradient-to-b from-orange-500/50 to-transparent" />
            </div>

            {/* floating glass badges over the map */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/75 bg-white/90 px-4 py-2 shadow-airy backdrop-blur-xl"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
              </span>
              <span className="text-[13px] font-bold text-ink">نطاق الخدمة · حي لبن</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-white/75 bg-white/90 p-3.5 shadow-airy backdrop-blur-xl"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink">وصول أسرع</p>
                <p className="text-[12px] text-ink-500">فنّي قريب داخل الحي</p>
              </div>
            </motion.div>
          </motion.div>

          {/* frosted info panel */}
          <Reveal className="flex flex-col justify-center rounded-[2.25rem] border border-white/70 bg-white/85 p-7 shadow-airy backdrop-blur-xl md:p-10">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              نطاق الخدمة
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tightest text-ink md:text-[40px]">
              خدمتنا اليوم مركّزة على
              <span className="text-orange-gradient"> حي لبن</span>
            </h2>
            <p className="pretty mt-5 text-[16px] leading-relaxed text-ink-600">
              نخدم حي لبن في غرب الرياض حصرًا في هذه المرحلة. هذا التركيز يضمن
              وصولًا أسرع، ومعرفة أدق بالمنطقة، وجودة لا تتشتّت على مساحات واسعة.
            </p>

            <ul className="mt-7 space-y-3">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-3 rounded-2xl bg-clay-50/70 px-4 py-3 text-[14.5px] text-ink-700 ring-1 ring-clay-200/70">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 0 5px ${l.color}1f` }} />
                  {l.label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-clay-100 p-4">
              <RouteIcon className="h-6 w-6 shrink-0 text-orange-500" />
              <p className="text-[14px] leading-relaxed text-ink-600">
                خارج حي لبن؟ راسلنا — نسجّل طلبك ضمن قائمة التوسّع القادمة.
              </p>
            </div>

            <div className="mt-7">
              <MagneticButton href={whatsappLink()} target="_blank" rel="noopener noreferrer" variant="primary" icon={<WhatsappIcon className="h-5 w-5" />}>
                اطلب داخل حي لبن
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

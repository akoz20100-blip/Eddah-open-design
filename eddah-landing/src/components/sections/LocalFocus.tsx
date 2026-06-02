"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { fadeUp, inViewProps, staggerContainer } from "@/lib/motion";
import { PinIcon, RouteIcon, ShieldIcon, ClockIcon } from "@/components/icons/Icons";

const points = [
  { icon: RouteIcon, title: "نعرف الحي", body: "شوارع لبن وممراتها مألوفة لنا، فنصل دون تيه ولا تأخير." },
  { icon: ClockIcon, title: "وصول أسرع", body: "قُربنا منك يختصر زمن الاستجابة مقارنة بالخدمات البعيدة." },
  { icon: ShieldIcon, title: "ثقة الجيرة", body: "خدمة قريبة تتعامل معك كجار، لا كرقم في طابور طويل." },
];

export function LocalFocus() {
  return (
    <section id="laban" className="relative scroll-mt-24 overflow-hidden bg-clay-100/60 py-20 md:py-28">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="order-2 lg:order-1">
            <ZoneGraphic />
          </Reveal>

          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={inViewProps.viewport}
            className="order-1 lg:order-2"
          >
            <motion.span variants={fadeUp} className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              تركيز محلي
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tightest text-ink md:text-[42px]">
              نحن متخصصون في
              <span className="text-orange-gradient"> حي لبن</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="pretty mt-5 max-w-xl text-[17px] leading-relaxed text-ink-600">
              عدة لم تنطلق لتغطّي كل الرياض دفعة واحدة. اخترنا أن نبدأ من حي لبن
              ونتقن خدمته أولًا — لأن التركيز على منطقة واحدة يصنع سرعة حقيقية
              وجودة لا تتشتّت.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-3">
              {points.map((p) => (
                <div key={p.title} className="group border-t border-clay-200/80 pt-5">
                  <p.icon className="h-6 w-6 text-orange-500 transition-transform duration-500 group-hover:-translate-y-0.5" />
                  <h3 className="mt-3.5 text-[16px] font-bold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{p.body}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function ZoneGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="orange-wash absolute inset-0 rounded-full" />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute rounded-full border border-orange-200"
          style={{ inset: `${i * 14}%` }}
        />
      ))}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[14%] rounded-full"
        style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(240,133,26,0.16) 40deg, transparent 80deg)" }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-orange-300/40" />
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-clay-200 bg-white/90 px-5 py-4 shadow-card backdrop-blur">
            <PinIcon className="h-7 w-7 text-orange-500" />
            <span className="text-[15px] font-bold text-ink">حي لبن</span>
            <span className="text-[11px] text-ink-400">الرياض</span>
          </div>
        </div>
      </div>
    </div>
  );
}

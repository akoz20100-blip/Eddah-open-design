"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { BrandImage } from "@/components/ui/BrandImage";
import {
  WhatsappIcon,
  PinIcon,
  ArrowIcon,
  StarIcon,
  CheckIcon,
} from "@/components/icons/Icons";
import { whatsappLink } from "@/lib/brand";
import { EASE_OUT, staggerContainer, wordReveal, fadeUp } from "@/lib/motion";

const headlineTop = ["صيانة", "منزلية", "باحتراف"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yImg = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const yCardA = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const yCardB = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section id="top" ref={ref} className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="orange-wash pointer-events-none absolute inset-0" />
      {/* ambient drifting blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[8%] top-[22%] h-48 w-48 rounded-full bg-orange-200/40 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 28, 0], x: [0, -16, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[14%] bottom-[10%] h-56 w-56 rounded-full bg-orange-100/50 blur-3xl"
        />
      </div>
      <Container className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <motion.div
            variants={staggerContainer(0.12, 0.1)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start"
          >
            <motion.div variants={fadeUp}>
              <span className="chip">
                <PinIcon className="h-4 w-4 text-orange-500" />
                نخدم حي لبن حصراً — الرياض
              </span>
            </motion.div>

            <h1 className="mt-6 text-balance text-[clamp(2.6rem,7vw,4.7rem)] font-bold leading-[1.04] tracking-tightest text-ink">
              <span className="flex flex-wrap gap-x-4">
                {headlineTop.map((w, i) => (
                  <span key={i} className="overflow-hidden">
                    <motion.span variants={wordReveal} className="inline-block">
                      {w}
                    </motion.span>
                  </span>
                ))}
              </span>
              <span className="mt-1 block overflow-hidden">
                <motion.span variants={wordReveal} className="inline-block text-orange-gradient">
                  في قلب حي لبن
                </motion.span>
              </span>
            </h1>

            <motion.p variants={fadeUp} className="pretty mt-6 max-w-xl text-[18px] leading-relaxed text-ink-600">
              سباكة، كهرباء، وتكييف وتبريد — بفريق محلي يعرف الحي،
              يصل بسرعة، وينفّذ بدقّة لا تغلط وثقة لا تتسرّب.
              فنّيك في حيّك، على بُعد رسالة واتساب.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                icon={<WhatsappIcon className="h-5 w-5" />}
              >
                اطلب خدمتك الآن
              </MagneticButton>
              <MagneticButton href="#services" variant="ghost" icon={<ArrowIcon className="h-[18px] w-[18px]" />}>
                تصفّح الخدمات
              </MagneticButton>
            </motion.div>

            {/* social proof */}
            <motion.div variants={fadeUp} className="mt-9 flex items-center gap-4">
              <div className="flex -space-x-3 [direction:ltr]">
                {["#F0851A", "#3A332C", "#DC6E0B", "#9A9082"].map((c, i) => (
                  <span
                    key={i}
                    className="grid h-10 w-10 place-items-center rounded-full border-2 border-clay-50 text-[13px] font-bold text-white"
                    style={{ backgroundColor: c }}
                  >
                    {["م", "ع", "س", "ف"][i]}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-orange-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>
                <p className="mt-0.5 text-[13.5px] text-ink-500">خدمة محلية يثق بها أهل حي لبن</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.3 }}
            className="relative mx-auto w-full max-w-md"
          >
            {/* soft orange plate */}
            <div className="absolute -inset-3 rounded-[2.5rem] bg-orange-100/60 blur-2xl" />
            <motion.div style={{ y: yImg }} className="relative">
              <BrandImage
                image="master"
                priority
                className="aspect-[4/5] w-full rounded-[2rem] shadow-lift ring-1 ring-black/5"
              />
            </motion.div>

            {/* floating: live zone */}
            <motion.div
              style={{ y: yCardA }}
              className="absolute -right-3 top-6 flex items-center gap-2 rounded-2xl border border-clay-200 bg-white/95 px-4 py-2.5 shadow-card backdrop-blur"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
              </span>
              <span className="text-[13px] font-semibold text-ink">مباشر · حي لبن</span>
            </motion.div>

            {/* floating: confirmation */}
            <motion.div
              style={{ y: yCardB }}
              className="absolute -left-4 bottom-8 flex items-center gap-3 rounded-2xl border border-clay-200 bg-white/95 p-3.5 shadow-card backdrop-blur"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
                <CheckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink">تم تأكيد الموعد</p>
                <p className="text-[12px] text-ink-500">الفنّي في الطريق إليك</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

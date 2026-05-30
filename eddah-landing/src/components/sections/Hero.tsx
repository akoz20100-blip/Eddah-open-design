"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { HeroVisual } from "@/components/sections/HeroVisual";
import { WhatsappIcon, PinIcon, ArrowIcon, BoltSpeedIcon, CalendarIcon, ShieldIcon } from "@/components/icons/Icons";
import { whatsappLink } from "@/lib/brand";
import { EASE_OUT, staggerContainer, wordReveal, fadeUp } from "@/lib/motion";

const headlineTop = ["صيانة", "منزلية", "باحتراف"];

const chips = [
  { icon: BoltSpeedIcon, label: "استجابة سريعة" },
  { icon: CalendarIcon, label: "مواعيد منظّمة" },
  { icon: ShieldIcon, label: "تنفيذ موثوق" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const yContent = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40"
    >
      {/* Depth layers */}
      <motion.div
        style={{ y: yGlow }}
        className="copper-radial pointer-events-none absolute inset-x-0 -top-20 h-[680px]"
      />
      <BlueprintGrid />
      <FloatingOrbs />

      <Container className="relative z-10">
        <motion.div
          style={{ y: yContent, opacity }}
          className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Copy column */}
          <motion.div
            variants={staggerContainer(0.12, 0.15)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/[0.08] px-4 py-2 text-[13px] font-medium text-copper-light">
                <PinIcon className="h-4 w-4" />
                نخدم حي لبن حصراً — الرياض
              </span>
            </motion.div>

            <h1 className="mt-7 text-balance text-[clamp(2.6rem,7vw,4.6rem)] font-bold leading-[1.05] tracking-tightest text-sand">
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
                <motion.span
                  variants={wordReveal}
                  className="inline-block text-copper-gradient"
                >
                  في قلب حي لبن
                </motion.span>
              </span>
            </h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-xl text-pretty text-[18px] leading-relaxed text-sand-300"
            >
              سباكة، كهرباء، وتكييف وتبريد — بفريق محلي يعرف الحي،
              يصل بسرعة، وينفّذ بإتقان. فنّيك في حيّك، على بُعد رسالة واتساب.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
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

            <motion.ul
              variants={fadeUp}
              className="mt-10 flex flex-wrap gap-x-7 gap-y-3"
            >
              {chips.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5 text-[15px] text-sand-300">
                  <c.icon className="h-5 w-5 text-copper" />
                  {c.label}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Visual column */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.35 }}
            className="relative"
          >
            <HeroVisual />
          </motion.div>
        </motion.div>
      </Container>

      <div className="hairline mt-20" />
    </section>
  );
}

function BlueprintGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5]"
      style={{
        maskImage: "radial-gradient(70% 55% at 50% 25%, black, transparent)",
        WebkitMaskImage: "radial-gradient(70% 55% at 50% 25%, black, transparent)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,119,61,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(200,119,61,0.07) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />
    </div>
  );
}

function FloatingOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ y: [0, -22, 0], x: [0, 10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[8%] top-[18%] h-40 w-40 rounded-full bg-copper/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 26, 0], x: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[12%] bottom-[12%] h-52 w-52 rounded-full bg-copper/[0.07] blur-3xl"
      />
    </div>
  );
}

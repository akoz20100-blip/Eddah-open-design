"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { PlumbingIcon, ElectricalIcon, CoolingIcon } from "@/components/icons/ServiceIcons";
import { CheckIcon, PinIcon } from "@/components/icons/Icons";
import { Logo } from "@/components/ui/Logo";

const tiles = [
  { Icon: PlumbingIcon, label: "السباكة" },
  { Icon: ElectricalIcon, label: "الكهرباء" },
  { Icon: CoolingIcon, label: "التبريد" },
];

/**
 * A floating glass "service dispatch" card with cursor-driven 3D tilt.
 * It reads as a real product surface, not decoration — services + locality
 * in one believable object.
 */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), {
    stiffness: 150,
    damping: 18,
  });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="relative mx-auto max-w-md [perspective:1400px]"
    >
      {/* Glow plate behind */}
      <div className="absolute inset-6 rounded-[2.4rem] bg-copper/20 blur-3xl" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="surface relative rounded-[2rem] p-6 shadow-lift"
      >
        {/* Header: brand + live zone */}
        <div className="flex items-center justify-between" style={{ transform: "translateZ(40px)" }}>
          <Logo />
          <span className="flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3 py-1.5 text-[12px] font-medium text-copper-light">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-copper" />
            </span>
            مباشر · حي لبن
          </span>
        </div>

        {/* Service tiles */}
        <div className="mt-6 grid grid-cols-3 gap-3" style={{ transform: "translateZ(60px)" }}>
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.12, duration: 0.6 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] py-4"
            >
              <t.Icon className="h-8 w-8 text-copper-light" />
              <span className="text-[13px] text-sand-300">{t.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Status / confirmation row */}
        <div
          className="mt-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4"
          style={{ transform: "translateZ(45px)" }}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-copper text-ink">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-sand">تم تأكيد الموعد</p>
            <p className="text-[12px] text-sand-500">الفنّي في الطريق إلى حي لبن</p>
          </div>
          <PinIcon className="h-5 w-5 text-copper-light" />
        </div>

        {/* Mini progress bar */}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8" style={{ transform: "translateZ(30px)" }}>
          <motion.div
            initial={{ width: "8%" }}
            animate={{ width: "72%" }}
            transition={{ delay: 1.1, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-l from-copper-light to-copper"
          />
        </div>
      </motion.div>

      {/* Floating accent badge */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-5 -left-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-700/90 px-4 py-3 shadow-card backdrop-blur"
        style={{ transform: "translateZ(80px)" }}
      >
        <span className="text-2xl font-bold text-copper-gradient">٣</span>
        <span className="text-[12px] leading-tight text-sand-300">
          تخصصات
          <br />
          أساسية
        </span>
      </motion.div>
    </div>
  );
}

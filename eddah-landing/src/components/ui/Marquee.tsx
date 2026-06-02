"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Seamless RTL marquee. Duplicates its items once and translates by -50%
 * so the loop is invisible.
 */
export function Marquee({
  items,
  duration = 26,
}: {
  items: string[];
  duration?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const row = [...items, ...items];
  return (
    <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <motion.div
        className="flex shrink-0 items-center gap-10 pr-10"
        animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={prefersReducedMotion ? undefined : { duration, repeat: Infinity, ease: "linear" }}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="rounded-full bg-white/55 px-5 py-2 text-[18px] font-semibold text-ink-500 shadow-airy ring-1 ring-white/70 backdrop-blur">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

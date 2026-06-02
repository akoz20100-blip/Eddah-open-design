"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin copper progress bar pinned to the top edge. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[55] h-[2px] origin-right bg-gradient-to-l from-orange-400 to-orange-600"
    />
  );
}
